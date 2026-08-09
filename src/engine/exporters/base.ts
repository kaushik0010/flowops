// src/engine/exporters/base.ts

import type { FlowOpsProject } from "../../types";

/**
 * Represents a warning, info, or error generated specifically during the export process.
 * This is distinct from core architectural validation (e.g., a core validation might catch
 * a missing port, while an export diagnostic might say "Zerops ignores exposed ports for workers").
 */
export interface ExportDiagnostic {
  severity: "info" | "warning" | "error";
  message: string;
  nodeId?: string;
  connectionId?: string;
}

/**
 * The unified result of an export operation.
 */
export interface ExportResult {
  /**
   * The generated configuration payload.
   * For Kubernetes, this could be multiple manifests separated by `---`.
   */
  content: string;

  /**
   * The language of the generated content.
   * Consumed by the UI layer (Monaco Editor) to provide correct syntax highlighting.
   */
  language: "yaml" | "json" | "hcl" | "plaintext";

  /**
   * Any target-specific warnings or notes generated during the process.
   */
  diagnostics: ExportDiagnostic[];
}

/**
 * The standard contract that every deployment target must implement.
 * By programming against this interface, the UI and state layers never need to know
 * the details of Docker Compose, Zerops, or Kubernetes.
 */
export interface InfrastructureExporter {
  /**
   * Unique machine-readable identifier (e.g., 'docker-compose', 'zerops').
   */
  id: string;

  /**
   * Human-readable display name (e.g., 'Docker Compose', 'Zerops').
   */
  name: string;

  /**
   * A short description of the export target for UI tooltips/menus.
   */
  description: string;

  /**
   * Synchronously generates the deployment configuration from the canonical domain model.
   * 
   * @param project The canonical domain model representing the visual topology.
   * @returns The generated code, language formatting, and any generation-specific diagnostics.
   */
  generate(project: FlowOpsProject): ExportResult;
}