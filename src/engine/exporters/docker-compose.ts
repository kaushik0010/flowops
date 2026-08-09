// src/engine/exporters/docker-compose.ts

import { stringify } from "yaml";
import type { FlowOpsProject } from "../../types";
import type {
  InfrastructureExporter,
  ExportResult,
  ExportDiagnostic,
} from "./base";

// ---------------------------------------------------------
// Internal Typing for Docker Compose YAML Structure
// ---------------------------------------------------------

interface ComposeService {
  image?: string;
  build?: string | { context: string; dockerfile?: string };
  command?: string | string[];
  ports?: string[];
  expose?: string[];
  environment?: Record<string, string>;
  depends_on?: string[];
  volumes?: string[];
}

interface ComposeFile {
  services: Record<string, ComposeService>;
  volumes?: Record<string, null>;
}

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

/**
 * Docker Compose service names must be valid DNS names.
 * This ensures the user-provided name is safe for Compose keys.
 */
function sanitizeServiceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

// ---------------------------------------------------------
// Exporter Implementation
// ---------------------------------------------------------

export const dockerComposeExporter: InfrastructureExporter = {
  id: "docker-compose",
  name: "Docker Compose",
  description: "Exports a compose.yaml file for local development and standard Docker environments.",
  generate: (project: FlowOpsProject): ExportResult => {
    const diagnostics: ExportDiagnostic[] = [];
    
    // Sort nodes to guarantee deterministic service generation order
    const sortedNodes = [...project.nodes].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    const services: Record<string, ComposeService> = {};
    const volumes: Record<string, null> = {};

    // Helper map to quickly lookup sanitized names for connections
    const serviceNameMap = new Map<string, string>();

    // 1. Process Nodes into Compose Services
    for (const node of sortedNodes) {
      const composeName = sanitizeServiceName(node.name);
      serviceNameMap.set(node.id, composeName);

      if (node.type === "storage") {
        diagnostics.push({
          severity: "warning",
          message: `Service '${node.name}' (storage) omitted. The current MVP domain model lacks enough detail to faithfully emulate object storage (like MinIO) in Docker Compose.`,
          nodeId: node.id,
        });
        continue;
      }

      const serviceDef: ComposeService = {};

      // Handle Runtimes and Images
      if (node.type === "postgres") {
        serviceDef.image = "postgres:15-alpine";
        const volName = `pgdata_${composeName}`;
        volumes[volName] = null;
        serviceDef.volumes = [`${volName}:/var/lib/postgresql/data`];
      } else if (node.type === "redis") {
        serviceDef.image = "redis:7-alpine";
      } else {
        // Compute Services (frontend, backend, worker)
        serviceDef.build = `./${composeName}`;

        // Validate runtime presence for compute services
        if (!node.config.runtime) {
          diagnostics.push({
            severity: "error",
            message: `Service '${node.name}' is missing a runtime. Docker Compose configuration for this service may be incomplete.`,
            nodeId: node.id,
          });
        }

        if (node.config.buildCommand) {
          diagnostics.push({
            severity: "warning",
            message: `Service '${node.name}' has buildCommand '${node.config.buildCommand}'. Compose does not run shell commands during build directly from compose.yaml. Ensure this command is in your Dockerfile.`,
            nodeId: node.id,
          });
        }
      }

      // Handle Start Command
      if (node.config.startCommand) {
        serviceDef.command = node.config.startCommand;
      }

      // Handle Ports
      if (node.config.ports.length > 0) {
        const hostPorts: string[] = [];
        const internalPorts: string[] = [];

        // Sort ports numerically to maintain complete determinism
        const sortedPorts = [...node.config.ports].sort((a, b) => a - b);

        for (const port of sortedPorts) {
          if (node.type === "frontend" || node.type === "backend") {
            hostPorts.push(`${port}:${port}`);
          } else {
            internalPorts.push(`${port}`);
          }
        }

        if (hostPorts.length > 0) serviceDef.ports = hostPorts;
        if (internalPorts.length > 0) serviceDef.expose = internalPorts;
      }

      // Handle Environment Variables
      if (node.config.environmentVariables.length > 0) {
        serviceDef.environment = {};
        
        const sortedEnvs = [...node.config.environmentVariables].sort((a, b) =>
          a.key.localeCompare(b.key)
        );

        for (const env of sortedEnvs) {
          if (env.isSecret) {
            serviceDef.environment[env.key] = `\${${env.key}}`;
            diagnostics.push({
              severity: "warning",
              message: `Environment variable '${env.key}' in '${node.name}' is a secret. An interpolation placeholder was generated. Provide the actual value in a local '.env' file.`,
              nodeId: node.id,
            });
          } else {
            serviceDef.environment[env.key] = env.value;
          }
        }
      }

      services[composeName] = serviceDef;
    }

    // 2. Process Connections with robust dangling checks
    const sortedConnections = [...project.connections].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    for (const conn of sortedConnections) {
      const sourceNode = project.nodes.find((n) => n.id === conn.sourceId);
      const targetNode = project.nodes.find((n) => n.id === conn.targetId);

      if (!sourceNode || !targetNode) {
        diagnostics.push({
          severity: "error",
          message: `Connection references a missing source or target service.`,
          connectionId: conn.id,
        });
        continue;
      }

      const sourceName = serviceNameMap.get(conn.sourceId);
      const targetName = serviceNameMap.get(conn.targetId);

      // Skip if omitted (e.g. storage)
      if (!sourceName || !targetName) continue;
      
      const sourceService = services[sourceName];
      if (!sourceService) continue;

      if (conn.intent === "depends_on") {
        if (!sourceService.depends_on) {
          sourceService.depends_on = [];
        }
        if (!sourceService.depends_on.includes(targetName)) {
          sourceService.depends_on.push(targetName);
          // Ensure depends_on array remains deterministically sorted
          sourceService.depends_on.sort();
        }
      } else if (conn.intent === "network") {
        diagnostics.push({
          severity: "info",
          message: `Network connection from '${sourceName}' to '${targetName}'. In Compose, services automatically resolve each other via their service names.`,
          connectionId: conn.id,
        });
      } else if (conn.intent === "env_binding") {
        diagnostics.push({
          severity: "warning",
          message: `Connection uses 'env_binding'. Compose does not automatically inject target credentials. You must manually map the URL in '${sourceName}'s environment variables (e.g., using 'http://${targetName}').`,
          connectionId: conn.id,
        });
      }
    }

    // 3. Assemble and Serialize
    const composeFile: ComposeFile = {
      services,
    };

    if (Object.keys(volumes).length > 0) {
      composeFile.volumes = volumes;
    }

    const yamlContent = stringify(composeFile, { indent: 2 });

    return {
      content: yamlContent,
      language: "yaml",
      diagnostics,
    };
  },
};