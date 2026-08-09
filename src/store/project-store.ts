// src/store/project-store.ts

import { create } from "zustand";
import { FlowOpsProjectSchema } from "../engine/schema/project";
import { 
  loadProjectFromStorage, 
  saveProjectToStorage 
} from "../lib/project-persistence";
import type {
  FlowOpsProject,
  ServiceNode,
  ServiceConnection,
  ServiceType,
  ConnectionIntent,
} from "../types";

function generateId(): string {
  return crypto.randomUUID();
}

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
 * Bounded spawn offset pattern around a given center point to prevent infinite off-screen drift.
 */
function getBoundedSpawnPosition(existingNodes: ServiceNode[], requestedCenter?: { x: number; y: number }): { x: number; y: number } {
  const center = requestedCenter || { x: 250, y: 200 };
  
  const offsets = [
    { x: 0, y: 0 },
    { x: 80, y: 60 },
    { x: -80, y: 60 },
    { x: 80, y: -60 },
    { x: -80, y: -60 },
    { x: 160, y: 0 },
    { x: -160, y: 0 },
    { x: 0, y: 120 },
    { x: 0, y: -120 },
  ];

  for (const offset of offsets) {
    const candidate = { x: center.x + offset.x, y: center.y + offset.y };
    const overlapping = existingNodes.some(
      (node) => Math.abs(node.presentation.x - candidate.x) < 40 && Math.abs(node.presentation.y - candidate.y) < 40
    );
    if (!overlapping) {
      return candidate;
    }
  }

  const fallbackIndex = existingNodes.length % offsets.length;
  const slot = offsets[fallbackIndex] || { x: 0, y: 0 };
  return { x: center.x + slot.x, y: center.y + slot.y };
}

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
          ports: [],
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

export interface ProjectStoreState {
  project: FlowOpsProject;

  renameProject: (name: string) => void;
  resetProject: () => void;
  replaceProject: (data: unknown) => { success: true } | { success: false; error: string };
  loadProject: (project: FlowOpsProject) => void;

  addService: (type: ServiceType, presentation?: { x: number; y: number }) => string;
  removeService: (id: string) => void;
  updateService: (id: string, updates: Partial<Omit<ServiceNode, "id" | "type">>) => void;

  addConnection: (sourceId: string, targetId: string, intent: ConnectionIntent) => string;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, updates: Partial<Pick<ServiceConnection, "intent">>) => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => {
  const initialProject = loadProjectFromStorage() || createEmptyProject();

  return {
    project: initialProject,

    renameProject: (name: string) =>
      set((state) => {
        const nextProject = { ...state.project, name };
        saveProjectToStorage(nextProject);
        return { project: nextProject };
      }),

    resetProject: () => {
      const nextProject = createEmptyProject();
      saveProjectToStorage(nextProject);
      set({ project: nextProject });
    },

    replaceProject: (data: unknown) => {
      const parseResult = FlowOpsProjectSchema.safeParse(data);
      if (!parseResult.success) {
        return { success: false, error: parseResult.error.message };
      }
      const nextProject = parseResult.data;
      saveProjectToStorage(nextProject);
      set({ project: nextProject });
      return { success: true };
    },

    loadProject: (project: FlowOpsProject) => {
      saveProjectToStorage(project);
      set({ project });
    },

    addService: (type, presentation) => {
      let createdId = "";
      set((state) => {
        const pos = getBoundedSpawnPosition(state.project.nodes, presentation);
        const newNode = createDefaultService(type, pos);
        const nextProject = {
          ...state.project,
          nodes: [...state.project.nodes, newNode],
        };
        saveProjectToStorage(nextProject);
        createdId = newNode.id;
        return { project: nextProject };
      });
      return createdId;
    },

    removeService: (id: string) =>
      set((state) => {
        const updatedNodes = state.project.nodes.filter((node) => node.id !== id);
        const updatedConnections = state.project.connections.filter(
          (conn) => conn.sourceId !== id && conn.targetId !== id
        );

        const nextProject = {
          ...state.project,
          nodes: updatedNodes,
          connections: updatedConnections,
        };
        saveProjectToStorage(nextProject);
        return { project: nextProject };
      }),

    updateService: (id, updates) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          nodes: state.project.nodes.map((node) =>
            node.id === id
              ? { ...node, ...updates, config: { ...node.config, ...(updates.config || {}) } }
              : node
          ),
        };
        saveProjectToStorage(nextProject);
        return { project: nextProject };
      }),

    addConnection: (sourceId, targetId, intent) => {
      const newConnection: ServiceConnection = {
        id: generateId(),
        sourceId,
        targetId,
        intent,
      };
      let createdId = "";
      set((state) => {
        const nextProject = {
          ...state.project,
          connections: [...state.project.connections, newConnection],
        };
        saveProjectToStorage(nextProject);
        createdId = newConnection.id;
        return { project: nextProject };
      });
      return createdId;
    },

    removeConnection: (id: string) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          connections: state.project.connections.filter((conn) => conn.id !== id),
        };
        saveProjectToStorage(nextProject);
        return { project: nextProject };
      }),

    updateConnection: (id, updates) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          connections: state.project.connections.map((conn) =>
            conn.id === id ? { ...conn, ...updates } : conn
          ),
        };
        saveProjectToStorage(nextProject);
        return { project: nextProject };
      }),
  };
});