// src/components/sidebar/connection-config-sidebar.tsx

"use client";

import { ChangeEvent } from "react";
import { Cable, ArrowRight, AlertCircle } from "lucide-react";
import { ServiceConfigSection } from "./service-config-section";
import { useProjectStore } from "../../store/project-store";
import type { ConnectionIntent } from "../../types";

export interface ConnectionConfigSidebarProps {
  selectedConnectionId: string | null;
}

// ---------------------------------------------------------
// Helpers: Intent Metadata
// ---------------------------------------------------------

const INTENT_OPTIONS: { value: ConnectionIntent; label: string; description: string }[] = [
  {
    value: "network",
    label: "Network",
    description: "Allows the source service to communicate with the target over the private network.",
  },
  {
    value: "env_binding",
    label: "Environment Binding",
    description: "Represents a dependency where the target's connection information is exposed to the source through environment configuration.",
  },
  {
    value: "depends_on",
    label: "Depends On",
    description: "Indicates that the source service depends on the target being available before it can operate.",
  },
];

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------

export function ConnectionConfigSidebar({ selectedConnectionId }: ConnectionConfigSidebarProps) {
  const project = useProjectStore((state) => state.project);
  const updateConnection = useProjectStore((state) => state.updateConnection);

  if (!selectedConnectionId) {
    return null; // The parent shell will handle the empty/unselected state
  }

  const connection = project.connections.find((c) => c.id === selectedConnectionId);

  if (!connection) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center border-l border-slate-200 bg-rose-50 p-6 text-center">
        <div className="mb-3 rounded-full bg-rose-100 p-4 text-rose-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-rose-700">Connection not found</h2>
        <p className="mt-1 text-xs text-rose-500 max-w-[200px]">
          The selected connection no longer exists in this project.
        </p>
      </div>
    );
  }

  // Safely resolve source and target services to display their canonical names
  const sourceService = project.nodes.find((n) => n.id === connection.sourceId);
  const targetService = project.nodes.find((n) => n.id === connection.targetId);

  if (!sourceService || !targetService) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center border-l border-slate-200 bg-amber-50 p-6 text-center">
        <div className="mb-3 rounded-full bg-amber-100 p-4 text-amber-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-amber-700">Dangling Connection</h2>
        <p className="mt-1 text-xs text-amber-600 max-w-[200px]">
          The source or target service for this connection could not be resolved.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------

  const handleIntentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newIntent = e.target.value as ConnectionIntent;
    updateConnection(connection.id, { intent: newIntent });
  };

  const activeIntentMeta = INTENT_OPTIONS.find((opt) => opt.value === connection.intent);

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  
  return (
    <div className="flex h-full w-full flex-col border-l border-slate-200 bg-white">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-200">
          <Cable className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-bold text-slate-800">Connection</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <span className="truncate max-w-[100px]" title={sourceService.name}>
              {sourceService.name}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate max-w-[100px]" title={targetService.name}>
              {targetService.name}
            </span>
          </span>
        </div>
      </div>

      {/* Scrollable Configuration Area */}
      <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
        <ServiceConfigSection title="Intent">
          <div className="flex flex-col gap-3">
            <select
              value={connection.intent}
              onChange={handleIntentChange}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {INTENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {activeIntentMeta && (
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {activeIntentMeta.description}
                </p>
              </div>
            )}
          </div>
        </ServiceConfigSection>
      </div>
    </div>
  );
}