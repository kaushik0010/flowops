// src/store/project-store.ts

import { create } from "zustand";
import { FlowOpsProjectSchema } from "../engine/schema/project";
import type {
  FlowOpsProject,
  ServiceNode,
  ServiceConnection,
  ServiceType,
  ConnectionIntent,
} from "../types";

// ---------------------------------------------------------
// Helper: Default Configurations
// ---------------------------------------------------------

/**
 * Generates a clean, valid UUID. Supported in modern browsers and Node (Next.js SSR).
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a valid, empty FlowOps project.
 */
function createEmptyProject(): FlowOpsProject {
  return {
    id: generateId(),
    name: "Untitled Project",
    version: 1,
    nodes: [],
    connections: [],
  };
}

/**
 * Provides sensible default configurations based on the service type.
 */
function createDefaultService(
  type: ServiceType,
  presentation: { x: number; y: number }
): ServiceNode {
  const baseNode = {
    id: generateId(),
    type,
    presentation,
  };

  switch (type) {
    case "frontend":
      return {
        ...baseNode,
        name: "frontend",
        config: {
          runtime: "node",
          ports: [3000],
          environmentVariables: [],
          buildCommand: "npm run build",
          startCommand: "npm start",
        },
      };
    case "backend":
      return {
        ...baseNode,
        name: "api",
        config: {
          runtime: "node",
          ports: [8080],
          environmentVariables: [],
          startCommand: "npm start",
        },
      };
    case "postgres":
      return {
        ...baseNode,
        name: "postgres-db",
        config: {
          ports: [5432],
          environmentVariables: [
            { key: "POSTGRES_USER", value: "admin", isSecret: false },
            { key: "POSTGRES_PASSWORD", value: "secret", isSecret: true },
            { key: "POSTGRES_DB", value: "flowops", isSecret: false },
          ],
        },
      };
    case "redis":
      return {
        ...baseNode,
        name: "redis-cache",
        config: {
          ports: [6379],
          environmentVariables: [],
        },
      };
    case "worker":
      return {
        ...baseNode,
        name: "background-worker",
        config: {
          runtime: "node",
          ports: [], // Workers typically don't expose ports
          environmentVariables: [],
          startCommand: "npm start",
        },
      };
    case "storage":
      return {
        ...baseNode,
        name: "object-storage",
        config: {
          ports: [9000],
          environmentVariables: [],
        },
      };
    default:
      // Fallback that satisfies the schema
      return {
        ...baseNode,
        name: `service-${type}`,
        config: {
          ports: [],
          environmentVariables: [],
        },
      };
  }
}

// ---------------------------------------------------------
// Store Definition
// ---------------------------------------------------------

export interface ProjectStoreState {
  project: FlowOpsProject;

  // Project Actions
  renameProject: (name: string) => void;
  resetProject: () => void;
  
  /**
   * Replaces the entire project with incoming data (e.g., from JSON import).
   * Parses the input against the Zod schema. Returns a result object rather than throwing
   * to allow the UI to easily handle the error state without Error Boundaries.
   */
  replaceProject: (data: unknown) => { success: true } | { success: false; error: string };

  // Service Actions
  addService: (type: ServiceType, presentation: { x: number; y: number }) => string;
  removeService: (id: string) => void;
  updateService: (id: string, updates: Partial<Omit<ServiceNode, "id" | "type">>) => void;

  // Connection Actions
  addConnection: (sourceId: string, targetId: string, intent: ConnectionIntent) => string;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, updates: Partial<Pick<ServiceConnection, "intent">>) => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  project: createEmptyProject(),

  renameProject: (name: string) =>
    set((state) => ({
      project: { ...state.project, name },
    })),

  resetProject: () =>
    set({
      project: createEmptyProject(),
    }),

  replaceProject: (data: unknown) => {
    const parseResult = FlowOpsProjectSchema.safeParse(data);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error.message };
    }
    set({ project: parseResult.data });
    return { success: true };
  },

  addService: (type, presentation) => {
    const newNode = createDefaultService(type, presentation);
    set((state) => ({
      project: {
        ...state.project,
        nodes: [...state.project.nodes, newNode],
      },
    }));
    return newNode.id;
  },

  removeService: (id: string) =>
    set((state) => {
      // 1. Remove the node itself
      const updatedNodes = state.project.nodes.filter((node) => node.id !== id);
      
      // 2. Cascade delete: Remove any connections where this node is source or target
      const updatedConnections = state.project.connections.filter(
        (conn) => conn.sourceId !== id && conn.targetId !== id
      );

      return {
        project: {
          ...state.project,
          nodes: updatedNodes,
          connections: updatedConnections,
        },
      };
    }),

  updateService: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        nodes: state.project.nodes.map((node) =>
          node.id === id
            ? { ...node, ...updates, config: { ...node.config, ...(updates.config || {}) } }
            : node
        ),
      },
    })),

  addConnection: (sourceId, targetId, intent) => {
    const newConnection: ServiceConnection = {
      id: generateId(),
      sourceId,
      targetId,
      intent,
    };
    set((state) => ({
      project: {
        ...state.project,
        connections: [...state.project.connections, newConnection],
      },
    }));
    return newConnection.id;
  },

  removeConnection: (id: string) =>
    set((state) => ({
      project: {
        ...state.project,
        connections: state.project.connections.filter((conn) => conn.id !== id),
      },
    })),

  updateConnection: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        connections: state.project.connections.map((conn) =>
          conn.id === id ? { ...conn, ...updates } : conn
        ),
      },
    })),
}));