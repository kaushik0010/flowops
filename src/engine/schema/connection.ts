import { z } from "zod";

export const ConnectionIntentSchema = z.enum([
  "network",        // Allows internal routing (e.g., Backend -> Redis)
  "env_binding",    // Injects target's connection string into source's ENV
  "depends_on",     // strict deployment ordering
]);

export const ServiceConnectionSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  intent: ConnectionIntentSchema.default("network"),
});

// --- Inferred Types ---
export type ConnectionIntent = z.infer<typeof ConnectionIntentSchema>;
export type ServiceConnection = z.infer<typeof ServiceConnectionSchema>;