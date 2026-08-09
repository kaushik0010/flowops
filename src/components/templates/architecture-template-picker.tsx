"use client";

import { X, ArrowRight, LayoutTemplate } from "lucide-react";
import { getAllTemplates } from "../../engine/templates/architectures";
import type { ArchitectureTemplate } from "../../engine/templates/architectures";

interface ArchitectureTemplatePickerProps {
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

export function ArchitectureTemplatePicker({ onSelect, onClose }: ArchitectureTemplatePickerProps) {
  const templates = getAllTemplates();

  const getDifficultyColor = (difficulty: ArchitectureTemplate["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "intermediate":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "advanced":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div 
        className="flex w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <div>
              <h2 id="template-picker-title" className="text-sm font-bold text-slate-800">
                Start from a template
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Choose a starting architecture. You can edit it freely.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close template picker"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template List */}
        <div className="flex flex-col gap-3 p-6 bg-slate-50">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className="group flex flex-col items-start rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                  <span>Use Template</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}