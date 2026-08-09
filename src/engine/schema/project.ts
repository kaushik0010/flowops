import { z } from "zod";
import { ServiceNodeSchema } from "./service";
import { ServiceConnectionSchema } from "./connection";

export const FlowOpsProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.literal(1), // Future-proofs for schema migrations
  nodes: z.array(ServiceNodeSchema).default([]),
  connections: z.array(ServiceConnectionSchema).default([]),
});

export const ValidationSeveritySchema = z.enum(["error", "warning", "info"]);

export const ValidationIssueSchema = z.object({
  id: z.string(),
  severity: ValidationSeveritySchema,
  message: z.string(),
  nodeId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
});

// --- Inferred Types ---
export type FlowOpsProject = z.infer<typeof FlowOpsProjectSchema>;
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;