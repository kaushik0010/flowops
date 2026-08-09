// Re-export all inferred types
export * from "../engine/schema/project";
export * from "../engine/schema/service";
export * from "../engine/schema/connection";

import type { FlowOpsProject, ValidationIssue } from "../engine/schema/project";

export interface ExporterResult {
  content: string; // The generated YAML (or JSON, HCL, etc.)
  warnings: ValidationIssue[];
}

export interface InfrastructureExporter {
  id: string;
  name: string;
  fileExtension: string;
  export(project: FlowOpsProject): ExporterResult;
}