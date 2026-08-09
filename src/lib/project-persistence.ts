// src/lib/project-persistence.ts

import type { FlowOpsProject } from "../types";
import { FlowOpsProjectSchema } from "../engine/schema/project";

const LOCAL_STORAGE_KEY = "flowops_current_project_v1";
const CURRENT_SCHEMA_VERSION = 1;

export interface ImportResult {
  success: boolean;
  project?: FlowOpsProject;
  error?: string;
}

/**
 * Safely saves the canonical FlowOpsProject to localStorage.
 */
export function saveProjectToStorage(project: FlowOpsProject): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(project);
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  } catch (err) {
    console.error("[FlowOps Persistence] Failed to save project to localStorage:", err);
  }
}

/**
 * Loads and validates the project from localStorage.
 * If data is missing, malformed, or fails validation, returns null.
 */
export function loadProjectFromStorage(): FlowOpsProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Basic version check before Zod parse
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      if (parsed.version !== CURRENT_SCHEMA_VERSION) {
        console.warn(`[FlowOps Persistence] Unsupported project version: ${parsed.version}`);
        return null;
      }
    }

    const result = FlowOpsProjectSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[FlowOps Persistence] Stored project failed schema validation:", result.error);
      return null;
    }

    return result.data;
  } catch (err) {
    console.error("[FlowOps Persistence] Failed to load project from localStorage:", err);
    return null;
  }
}

/**
 * Clears the saved project from localStorage.
 */
export function clearProjectStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error("[FlowOps Persistence] Failed to clear localStorage:", err);
  }
}

/**
 * Validates and parses an imported JSON string into a FlowOpsProject.
 */
export function parseAndValidateImportJson(jsonString: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      error: "Unable to import project. The selected file is not valid JSON.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      success: false,
      error: "Unable to import project. The file is not a valid FlowOps project object.",
    };
  }

  const record = parsed as Record<string, unknown>;
  if ("version" in record && record.version !== CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      error: `This FlowOps project uses an unsupported version (${record.version}).`,
    };
  }

  const result = FlowOpsProjectSchema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      error: "Unable to import project. The file is not a valid FlowOps project.",
    };
  }

  return {
    success: true,
    project: result.data,
  };
}

/**
 * Triggers a browser file download for the exported project JSON.
 */
export function downloadProjectJson(project: FlowOpsProject): void {
  if (typeof window === "undefined") return;
  try {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "flowops-project";
    link.download = `${sanitizedName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[FlowOps Persistence] Failed to export project file:", err);
  }
}