// src/components/canvas/service-palette-item.tsx

"use client";

import { type LucideIcon } from "lucide-react";

export interface ServicePaletteItemProps {
  type: string;
  name: string;
  description: string;
  icon: LucideIcon;
  themeColorClass: string;
  themeBgClass: string;
  onSelect: (type: string) => void;
}

export function ServicePaletteItem({
  type,
  name,
  description,
  icon: Icon,
  themeColorClass,
  themeBgClass,
  onSelect,
}: ServicePaletteItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`group flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
      aria-label={`Add ${name} service`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${themeBgClass}`}
      >
        <Icon className={`h-5 w-5 ${themeColorClass}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
          {name}
        </span>
        <span className="text-xs font-medium text-slate-500 line-clamp-2">
          {description}
        </span>
      </div>
    </button>
  );
}