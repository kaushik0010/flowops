// src/components/exporter/exporter-selector.tsx

"use client";

import { ChevronDown } from "lucide-react";
import { getAllExporters } from "../../engine/exporters/registry";

export interface ExporterSelectorProps {
  selectedExporterId: string | null;
  onSelect: (id: string) => void;
}

export function ExporterSelector({ selectedExporterId, onSelect }: ExporterSelectorProps) {
  // Use the directly exported function to access the in-memory registry map
  const exporters = getAllExporters();

  if (exporters.length === 0) {
    return (
      <div className="flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
        No exporters available
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <select
        value={selectedExporterId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Select infrastructure target"
      >
        <option value="" disabled>
          Select target...
        </option>
        {exporters.map((exporter) => (
          <option key={exporter.id} value={exporter.id}>
            {exporter.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}