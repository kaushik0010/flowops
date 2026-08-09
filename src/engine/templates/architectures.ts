// src/engine/templates/architectures.ts

import type { FlowOpsProject, ServiceNode, ServiceConnection, ConnectionIntent } from "../../types";

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  createProject: () => FlowOpsProject;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: "web-app",
    name: "Web App",
    description: "Frontend, API, and PostgreSQL database",
    difficulty: "beginner",
    createProject: (): FlowOpsProject => {
      const feId = generateId();
      const beId = generateId();
      const dbId = generateId();

      const nodes: ServiceNode[] = [
        {
          id: feId,
          name: "frontend",
          type: "frontend",
          presentation: { x: 100, y: 150 },
          config: {
            runtime: "node",
            ports: [3000],
            environmentVariables: [],
            buildCommand: "npm run build",
            startCommand: "npm start",
          },
        },
        {
          id: beId,
          name: "api",
          type: "backend",
          presentation: { x: 380, y: 150 },
          config: {
            runtime: "node",
            ports: [8080],
            environmentVariables: [],
            startCommand: "npm start",
          },
        },
        {
          id: dbId,
          name: "postgres-db",
          type: "postgres",
          presentation: { x: 660, y: 150 },
          config: {
            ports: [5432],
            environmentVariables: [
              { key: "POSTGRES_USER", value: "admin", isSecret: false },
              { key: "POSTGRES_PASSWORD", value: "secret", isSecret: true },
              { key: "POSTGRES_DB", value: "flowops", isSecret: false },
            ],
          },
        },
      ];

      const connections: ServiceConnection[] = [
        {
          id: generateId(),
          sourceId: feId,
          targetId: beId,
          intent: "network",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: dbId,
          intent: "env_binding",
        },
      ];

      return {
        id: generateId(),
        name: "Web App",
        version: 1,
        nodes,
        connections,
      };
    },
  },
  {
    id: "production-api",
    name: "Production API",
    description: "API with cache, worker, and database",
    difficulty: "intermediate",
    createProject: (): FlowOpsProject => {
      const feId = generateId();
      const beId = generateId();
      const dbId = generateId();
      const redisId = generateId();
      const workerId = generateId();

      const nodes: ServiceNode[] = [
        {
          id: feId,
          name: "frontend",
          type: "frontend",
          presentation: { x: 100, y: 200 },
          config: {
            runtime: "node",
            ports: [3000],
            environmentVariables: [],
            buildCommand: "npm run build",
            startCommand: "npm start",
          },
        },
        {
          id: beId,
          name: "api",
          type: "backend",
          presentation: { x: 360, y: 200 },
          config: {
            runtime: "node",
            ports: [8080],
            environmentVariables: [],
            startCommand: "npm start",
          },
        },
        {
          id: dbId,
          name: "postgres-db",
          type: "postgres",
          presentation: { x: 640, y: 80 },
          config: {
            ports: [5432],
            environmentVariables: [
              { key: "POSTGRES_USER", value: "admin", isSecret: false },
              { key: "POSTGRES_PASSWORD", value: "secret", isSecret: true },
              { key: "POSTGRES_DB", value: "flowops", isSecret: false },
            ],
          },
        },
        {
          id: redisId,
          name: "redis-cache",
          type: "redis",
          presentation: { x: 640, y: 200 },
          config: {
            ports: [6379],
            environmentVariables: [],
          },
        },
        {
          id: workerId,
          name: "background-worker",
          type: "worker",
          presentation: { x: 640, y: 320 },
          config: {
            runtime: "node",
            ports: [],
            environmentVariables: [],
            startCommand: "npm start",
          },
        },
      ];

      const connections: ServiceConnection[] = [
        {
          id: generateId(),
          sourceId: feId,
          targetId: beId,
          intent: "network",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: dbId,
          intent: "env_binding",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: redisId,
          intent: "env_binding",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: workerId,
          intent: "depends_on",
        },
      ];

      return {
        id: generateId(),
        name: "Production API",
        version: 1,
        nodes,
        connections,
      };
    },
  },
  {
    id: "full-stack",
    name: "Full Stack",
    description: "Complete application stack with storage",
    difficulty: "advanced",
    createProject: (): FlowOpsProject => {
      const feId = generateId();
      const beId = generateId();
      const dbId = generateId();
      const redisId = generateId();
      const workerId = generateId();
      const storageId = generateId();

      const nodes: ServiceNode[] = [
        {
          id: feId,
          name: "frontend",
          type: "frontend",
          presentation: { x: 80, y: 220 },
          config: {
            runtime: "node",
            ports: [3000],
            environmentVariables: [],
            buildCommand: "npm run build",
            startCommand: "npm start",
          },
        },
        {
          id: beId,
          name: "api",
          type: "backend",
          presentation: { x: 340, y: 220 },
          config: {
            runtime: "node",
            ports: [8080],
            environmentVariables: [],
            startCommand: "npm start",
          },
        },
        {
          id: dbId,
          name: "postgres-db",
          type: "postgres",
          presentation: { x: 620, y: 80 },
          config: {
            ports: [5432],
            environmentVariables: [
              { key: "POSTGRES_USER", value: "admin", isSecret: false },
              { key: "POSTGRES_PASSWORD", value: "secret", isSecret: true },
              { key: "POSTGRES_DB", value: "flowops", isSecret: false },
            ],
          },
        },
        {
          id: redisId,
          name: "redis-cache",
          type: "redis",
          presentation: { x: 620, y: 190 },
          config: {
            ports: [6379],
            environmentVariables: [],
          },
        },
        {
          id: workerId,
          name: "background-worker",
          type: "worker",
          presentation: { x: 620, y: 300 },
          config: {
            runtime: "node",
            ports: [],
            environmentVariables: [],
            startCommand: "npm start",
          },
        },
        {
          id: storageId,
          name: "object-storage",
          type: "storage",
          presentation: { x: 900, y: 300 },
          config: {
            ports: [9000],
            environmentVariables: [],
          },
        },
      ];

      const connections: ServiceConnection[] = [
        {
          id: generateId(),
          sourceId: feId,
          targetId: beId,
          intent: "network",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: dbId,
          intent: "env_binding",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: redisId,
          intent: "env_binding",
        },
        {
          id: generateId(),
          sourceId: beId,
          targetId: workerId,
          intent: "depends_on",
        },
        {
          id: generateId(),
          sourceId: workerId,
          targetId: storageId,
          intent: "env_binding",
        },
      ];

      return {
        id: generateId(),
        name: "Full Stack",
        version: 1,
        nodes,
        connections,
      };
    },
  },
];

export function getAllTemplates(): ArchitectureTemplate[] {
  return ARCHITECTURE_TEMPLATES;
}

export function getTemplateById(id: string): ArchitectureTemplate | undefined {
  return ARCHITECTURE_TEMPLATES.find((t) => t.id === id);
}