// src/app/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Workflow, RotateCcw } from "lucide-react";
import { FlowOpsCanvas } from "@/components/canvas/flowops-canvas";
import { ServicePalette } from "@/components/canvas/service-palette";
import { ServiceConfigSidebar } from "@/components/sidebar/service-config-sidebar";
import { useProjectStore } from "@/store/project-store";

export default function FlowOpsApplicationShell() {
  const project = useProjectStore((state) => state.project);
  const resetProject = useProjectStore((state) => state.resetProject);

  // Application Shell State: Coordinates selection between Canvas and Sidebar
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Safely clear selection if the selected node is deleted (e.g. by pressing Delete key)
  useEffect(() => {
    if (selectedServiceId) {
      const exists = project.nodes.some((node) => node.id === selectedServiceId);
      if (!exists) {
        setSelectedServiceId(null);
      }
    }
  }, [project.nodes, selectedServiceId]);

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-white text-slate-900">
      {/* 1. Global Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
            <Workflow className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-slate-900">
              FlowOps
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Visual Infrastructure Designer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">
              {project.name}
            </span>
          </div>
          
          <button
            onClick={() => {
              resetProject();
              setSelectedServiceId(null);
            }}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
            aria-label="Reset Project"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* 2. Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Service Palette */}
        <aside className="w-72 shrink-0 z-10 border-r border-slate-200 bg-white shadow-sm">
          <ServicePalette />
        </aside>

        {/* Center Panel: Interactive Canvas */}
        <section className="relative flex-1 bg-slate-50">
          {/* Subtle Empty State Overlay */}
          {project.nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/60 p-6 text-center shadow-sm backdrop-blur-md border border-white">
                <Workflow className="h-8 w-8 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-600">Build your architecture</h3>
                <p className="text-xs font-medium text-slate-500">
                  Select a service from the left panel to get started.
                </p>
              </div>
            </div>
          )}

          <FlowOpsCanvas onServiceSelect={setSelectedServiceId} />
        </section>

        {/* Right Panel: Configuration Sidebar */}
        <aside className="w-80 shrink-0 z-10 shadow-sm">
          <ServiceConfigSidebar selectedServiceId={selectedServiceId} />
        </aside>

      </div>
    </main>
  );
}