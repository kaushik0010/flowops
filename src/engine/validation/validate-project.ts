// src/engine/validation/validate-project.ts

import type { FlowOpsProject, ValidationIssue, ServiceType } from "../../types";

/**
 * Defines which service types inherently require a runtime to be configured.
 * Managed databases or caches (postgres, redis, storage) have implicit runtimes.
 */
const COMPUTE_SERVICES: ReadonlySet<ServiceType> = new Set(["frontend", "backend", "worker"]);

/**
 * Evaluates a FlowOpsProject architecture and returns a deterministic array of validation issues.
 * This function is pure, synchronous, and framework-independent.
 * 
 * @param project The canonical domain model of the architecture.
 * @returns An array of structural and semantic validation issues.
 */
export function validateProject(project: FlowOpsProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(project.nodes.map((n) => n.id));
  const connectedNodeIds = new Set<string>();

  // 1. Validate Connections
  for (const conn of project.connections) {
    const hasSource = nodeIds.has(conn.sourceId);
    const hasTarget = nodeIds.has(conn.targetId);

    if (hasSource) connectedNodeIds.add(conn.sourceId);
    if (hasTarget) connectedNodeIds.add(conn.targetId);

    // Rule: Dangling connections (orphaned edges)
    if (!hasSource || !hasTarget) {
      issues.push({
        id: `conn-${conn.id}-dangling`,
        severity: "error",
        message: `Connection references a missing ${!hasSource ? "source" : "target"} service.`,
        connectionId: conn.id,
      });
      continue; // Skip further semantic checks if the connection is structurally invalid
    }

    // Rule: Self-referencing connections
    if (conn.sourceId === conn.targetId) {
      issues.push({
        id: `conn-${conn.id}-self-ref`,
        severity: "error",
        message: "A service cannot connect to itself.",
        connectionId: conn.id,
        nodeId: conn.sourceId,
      });
    }
  }

  // 2. Validate Nodes
  for (const node of project.nodes) {
    // Rule: Missing runtime for compute nodes
    if (COMPUTE_SERVICES.has(node.type) && !node.config.runtime) {
      issues.push({
        id: `node-${node.id}-missing-runtime`,
        severity: "error",
        message: `Service '${node.name}' requires a runtime configuration.`,
        nodeId: node.id,
      });
    }

    // Rule: Duplicate environment variable keys
    const envKeys = new Set<string>();
    for (const env of node.config.environmentVariables) {
      // Keys are validated by Zod for min(1) length, so we just check duplicates here
      if (envKeys.has(env.key)) {
        issues.push({
          id: `node-${node.id}-dup-env-${env.key}`,
          severity: "error",
          message: `Duplicate environment variable key '${env.key}' in service '${node.name}'.`,
          nodeId: node.id,
        });
      }
      envKeys.add(env.key);
    }

    // Rule: Isolated nodes (Info)
    // If there are multiple nodes in the project, an isolated node is worth noting,
    // though not strictly invalid (e.g., a standalone static frontend next to an API).
    if (project.nodes.length > 1 && !connectedNodeIds.has(node.id)) {
      issues.push({
        id: `node-${node.id}-isolated`,
        severity: "info",
        message: `Service '${node.name}' is isolated and has no connections.`,
        nodeId: node.id,
      });
    }
  }

  // 3. Sort for Deterministic Output
  // Ensures the UI doesn't jump around randomly if validation runs frequently.
  const severityWeight: Record<ValidationIssue["severity"], number> = {
    error: 0,
    warning: 1,
    info: 2,
  };

  issues.sort((a, b) => {
    if (severityWeight[a.severity] !== severityWeight[b.severity]) {
      return severityWeight[a.severity] - severityWeight[b.severity]; // Errors first
    }
    return a.id.localeCompare(b.id); // Lexicographical fallback
  });

  return issues;
}