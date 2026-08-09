// src/components/canvas/service-palette.tsx

"use client";

import { Monitor, Server, Database, Layers, Cog, HardDrive, Plus, type LucideIcon } from "lucide-react";
import type { ServiceType } from "../../types";

interface PaletteItemDefinition {
  type: ServiceType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badgeColor: string;
  badgeBg: string;
}

const PALETTE_ITEMS: PaletteItemDefinition[] = [
  {
    type: "frontend",
    title: "Frontend Service",
    subtitle: "Web UI / Client Application",
    icon: Monitor,
    badgeColor: "text-blue-600",
    badgeBg: "bg-blue-50 border-blue-100",
  },
  {
    type: "backend",
    title: "Backend API",
    subtitle: "REST / GraphQL Server",
    icon: Server,
    badgeColor: "text-emerald-600",
    badgeBg: "bg-emerald-50 border-emerald-100",
  },
  {
    type: "postgres",
    title: "PostgreSQL",
    subtitle: "Relational Database",
    icon: Database,
    badgeColor: "text-indigo-600",
    badgeBg: "bg-indigo-50 border-indigo-100",
  },
  {
    type: "redis",
    title: "Redis Cache",
    subtitle: "In-Memory Data Store",
    icon: Layers,
    badgeColor: "text-red-600",
    badgeBg: "bg-red-50 border-red-100",
  },
  {
    type: "worker",
    title: "Background Worker",
    subtitle: "Async Task Processor",
    icon: Cog,
    badgeColor: "text-amber-600",
    badgeBg: "bg-amber-50 border-amber-100",
  },
  {
    type: "storage",
    title: "Object Storage",
    subtitle: "File & Asset Bucket",
    icon: HardDrive,
    badgeColor: "text-slate-600",
    badgeBg: "bg-slate-50 border-slate-200",
  },
];

export interface ServicePaletteProps {
  onAddService: (type: ServiceType) => void;
}

export function ServicePalette({ onAddService }: ServicePaletteProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Services
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Click any component to add it to your architecture.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddService(item.type)}
              className="group relative flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${item.badgeBg}`}>
                  <Icon className={`h-4 w-4 ${item.badgeColor}`} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="truncate text-[11px] font-medium text-slate-500">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <Plus className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}