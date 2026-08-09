// src/components/canvas/service-palette.tsx

"use client";

import { useCallback } from "react";
import { Monitor, Server, Database, Layers, Cog, HardDrive } from "lucide-react";
import { ServicePaletteItem } from "./service-palette-item";
import { useProjectStore } from "../../store/project-store";
import type { ServiceType } from "../../types";

// ---------------------------------------------------------
// Configuration: Service Palette Definitions
// ---------------------------------------------------------
// We maintain consistent visual themes with the FlowOpsServiceNode
// while adding descriptive text for the palette UI.

const SERVICE_CATALOG = [
  {
    type: "frontend" as ServiceType,
    name: "Frontend",
    description: "Public web application (e.g., React, Next.js, Static)",
    icon: Monitor,
    themeColorClass: "text-blue-600",
    themeBgClass: "bg-blue-50",
  },
  {
    type: "backend" as ServiceType,
    name: "Backend",
    description: "API server or application backend",
    icon: Server,
    themeColorClass: "text-emerald-600",
    themeBgClass: "bg-emerald-50",
  },
  {
    type: "postgres" as ServiceType,
    name: "PostgreSQL",
    description: "Managed relational database instance",
    icon: Database,
    themeColorClass: "text-indigo-600",
    themeBgClass: "bg-indigo-50",
  },
  {
    type: "redis" as ServiceType,
    name: "Redis",
    description: "In-memory cache and message broker",
    icon: Layers,
    themeColorClass: "text-red-600",
    themeBgClass: "bg-red-50",
  },
  {
    type: "worker" as ServiceType,
    name: "Worker",
    description: "Background processing and async queues",
    icon: Cog,
    themeColorClass: "text-amber-600",
    themeBgClass: "bg-amber-50",
  },
  {
    type: "storage" as ServiceType,
    name: "Storage",
    description: "Object storage bucket for persistent assets",
    icon: HardDrive,
    themeColorClass: "text-slate-600",
    themeBgClass: "bg-slate-50",
  },
];

// ---------------------------------------------------------
// Component: Service Palette
// ---------------------------------------------------------

export function ServicePalette() {
  // Subscribe only to the length of the nodes array to calculate placement offsets.
  // We do not subscribe to the entire project object to prevent deep re-renders on node dragging.
  const nodeCount = useProjectStore((state) => state.project.nodes.length);
  const addService = useProjectStore((state) => state.addService);

  const handleSelectService = useCallback(
    (type: string) => {
      // Deterministic placement algorithm to prevent nodes spawning exactly on top of each other.
      // Places them in a rough grid layout, shifting down every 4 nodes.
      const xOffset = 50 + (nodeCount % 4) * 240;
      const yOffset = 50 + Math.floor(nodeCount / 4) * 160;

      // Dispatch to canonical store. The store owns the ID generation and default config.
      addService(type as ServiceType, { x: xOffset, y: yOffset });
    },
    [addService, nodeCount]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50/80 p-4 backdrop-blur-md border-r border-slate-200">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Add Service
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Select a component to add it to your architecture canvas.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SERVICE_CATALOG.map((service) => (
          <ServicePaletteItem
            key={service.type}
            type={service.type}
            name={service.name}
            description={service.description}
            icon={service.icon}
            themeColorClass={service.themeColorClass}
            themeBgClass={service.themeBgClass}
            onSelect={handleSelectService}
          />
        ))}
      </div>
    </div>
  );
}