// src/components/validation/validation-panel.tsx

"use client";

import { useMemo } from "react";
import { XCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useProjectStore } from "../../store/project-store";
import { validateProject } from "../../engine/validation/validate-project";
import type { ValidationIssue } from "../../types";

// ---------------------------------------------------------
// Issue Item Component
// ---------------------------------------------------------
function ValidationIssueItem({ issue }: { issue: ValidationIssue }) {
  const { setNodes, setEdges } = useReactFlow();

  const isActionable = !!(issue.nodeId || issue.connectionId);

  // Navigate to the affected resource by updating React Flow's transient selection.
  // The Application Shell's SelectionBridge will automatically detect this and open the sidebar.
  const handleFocus = () => {
    if (issue.nodeId) {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === issue.nodeId })));
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    } else if (issue.connectionId) {
      setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === issue.connectionId })));
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    }
  };

  const getStyle = () => {
    switch (issue.severity) {
      case "error":
        return { icon: XCircle, colors: "text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100" };
      case "warning":
        return { icon: AlertTriangle, colors: "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100" };
      case "info":
        return { icon: Info, colors: "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100" };
    }
  };

  const { icon: Icon, colors } = getStyle();

  const content = (
    <>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-xs font-medium leading-relaxed">{issue.message}</span>
    </>
  );

  const baseClasses = `flex items-start gap-2.5 rounded-md border p-2.5 transition-colors ${colors}`;

  if (isActionable) {
    return (
      <button
        type="button"
        onClick={handleFocus}
        className={`${baseClasses} w-full text-left focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-1`}
        aria-label={`Focus issue: ${issue.message}`}
      >
        {content}
      </button>
    );
  }

  // Fallback for issues that don't target a specific node/connection (purely diagnostic)
  return <div className={`${baseClasses} w-full`}>{content}</div>;
}

// ---------------------------------------------------------
// Main Panel Component
// ---------------------------------------------------------
export function ValidationPanel() {
  // Subscribe to the canonical project state
  const project = useProjectStore((state) => state.project);
  
  // Deterministically derive validation issues on every render/mutation
  const issues = useMemo(() => validateProject(project), [project]);

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Panel Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Diagnostics
        </h3>
        <div className="flex items-center gap-3 text-xs font-semibold">
          {errors > 0 && <span className="flex items-center gap-1 text-rose-600"><XCircle className="h-3.5 w-3.5"/> {errors} Errors</span>}
          {warnings > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3.5 w-3.5"/> {warnings} Warnings</span>}
          {infos > 0 && <span className="flex items-center gap-1 text-blue-600"><Info className="h-3.5 w-3.5"/> {infos} Info</span>}
          
          {issues.length === 0 && (
             <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5"/> Passing</span>
          )}
        </div>
      </div>

      {/* Issues List / Healthy Empty State */}
      <div className="flex-1 overflow-y-auto p-3">
        {issues.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-center shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-emerald-900">
                  Architecture is healthy — there are no validation issues.
                </span>
                <span className="text-[11px] font-medium text-emerald-700/80">
                  No validation issues detected. Ready for export.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {issues.map((issue) => (
              <ValidationIssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}