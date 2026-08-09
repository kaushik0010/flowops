// src/engine/exporters/init.ts

import { registerExporter } from "./registry";
import { zeropsExporter } from "./zerops";
import { dockerComposeExporter } from "./docker-compose";

let initialized = false;

/**
 * Bootstraps the exporter registry by importing and registering all known
 * infrastructure exporters. This ensures the module graph executes them
 * before the UI attempts to read from the registry.
 */
export function bootstrapExporters() {
  if (initialized) return;
  
  registerExporter(zeropsExporter);
  registerExporter(dockerComposeExporter);
  
  initialized = true;
}