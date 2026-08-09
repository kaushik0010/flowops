import { z } from "zod";

export const ServiceTypeSchema = z.enum([
  "frontend",
  "backend",
  "postgres",
  "redis",
  "worker",
  "storage",
]);

export const RuntimeTypeSchema = z.enum([
  "node",
  "python",
  "go",
  "docker",
  "static",
]);

export const EnvironmentVariableSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
  isSecret: z.boolean().default(false),
});

export const ServiceConfigSchema = z.object({
  runtime: RuntimeTypeSchema.optional(),
  ports: z.array(z.number().int().positive()).default([]),
  environmentVariables: z.array(EnvironmentVariableSchema).default([]),
  buildCommand: z.string().optional(),
  startCommand: z.string().optional(),
});

export const ServiceNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  type: ServiceTypeSchema,
  config: ServiceConfigSchema,
  // Presentation metadata isolates canvas state from infrastructure state
  presentation: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

// --- Inferred Types ---
export type ServiceType = z.infer<typeof ServiceTypeSchema>;
export type RuntimeType = z.infer<typeof RuntimeTypeSchema>;
export type EnvironmentVariable = z.infer<typeof EnvironmentVariableSchema>;
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;
export type ServiceNode = z.infer<typeof ServiceNodeSchema>;