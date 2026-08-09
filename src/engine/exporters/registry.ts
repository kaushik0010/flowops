// src/engine/exporters/registry.ts

import type { InfrastructureExporter } from "./base";

/**
 * Internal map storing all registered infrastructure exporters.
 */
const exporters = new Map<string, InfrastructureExporter>();

/**
 * Registers a new infrastructure exporter.
 * If an exporter with the same ID already exists, it will be overwritten.
 * This ensures smooth Hot Module Replacement (HMR) in Next.js during development.
 * 
 * @param exporter The exporter implementation to register.
 */
export function registerExporter(exporter: InfrastructureExporter): void {
  exporters.set(exporter.id, exporter);
}

/**
 * Retrieves an exporter by its ID.
 * 
 * @param id The unique identifier of the exporter (e.g., 'zerops').
 * @returns The exporter instance, or undefined if not found.
 */
export function getExporter(id: string): InfrastructureExporter | undefined {
  return exporters.get(id);
}

/**
 * Retrieves an exporter by its ID strictly.
 * Throws an error if the exporter does not exist, guaranteeing a valid return type.
 * Useful when the application state expects a guaranteed valid exporter selection.
 * 
 * @param id The unique identifier of the exporter.
 * @returns The exporter instance.
 */
export function getRequiredExporter(id: string): InfrastructureExporter {
  const exporter = exporters.get(id);
  if (!exporter) {
    throw new Error(`[FlowOps Registry] Exporter with ID '${id}' is not registered.`);
  }
  return exporter;
}

/**
 * Retrieves a list of all currently registered exporters.
 * 
 * @returns An array of all available exporter instances.
 */
export function getAllExporters(): InfrastructureExporter[] {
  return Array.from(exporters.values());
}