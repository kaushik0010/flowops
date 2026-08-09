// src/components/exporter/exporter-workspace.tsx

"use client";

import { useMemo, useState, useEffect } from "react";
import { Code, Terminal, AlertTriangle, CheckCircle2, XCircle, Copy, Check, Download } from "lucide-react";
import Editor from "@monaco-editor/react";
import { ExporterSelector } from "./exporter-selector";
import { getExporter } from "../../engine/exporters/registry";
import { useProjectStore } from "../../store/project-store";

export interface ExporterWorkspaceProps {
  selectedExporterId: string | null;
  onExporterChange: (id: string) => void;
}

export function ExporterWorkspace({ selectedExporterId, onExporterChange }: ExporterWorkspaceProps) {
  const project = useProjectStore((state) => state.project);

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Reset copy error state when exporter or project changes
  useEffect(() => {
    setCopyError(false);
  }, [selectedExporterId, project]);

  const selectedExporter = selectedExporterId 
    ? getExporter(selectedExporterId) 
    : null;

  const exportResult = useMemo(() => {
    if (!selectedExporter) return null;
    try {
      return selectedExporter.generate(project);
    } catch (err) {
      console.error("[FlowOps Exporter Error]", err);
      return null;
    }
  }, [selectedExporter, project]);

  const diagnostics = exportResult?.diagnostics || [];
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter((d) => d.severity === "warning").length;

  const handleCopy = async () => {
    if (!exportResult?.content) return;
    try {
      await navigator.clipboard.writeText(exportResult.content);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[FlowOps Clipboard Error]", err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!exportResult?.content) return;
    try {
      const sanitizedProjectName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "flowops-project";
      const extension = selectedExporterId === "zerops" ? "zerops.yaml" : "compose.yaml";
      const filename = `${sanitizedProjectName}.${extension}`;

      const blob = new Blob([exportResult.content], { type: "text/yaml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[FlowOps Download Error]", err);
    }
  };

  return (
    <section className="flex h-72 w-full shrink-0 flex-col border-t border-slate-300 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
      {/* Workspace Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Generated Configuration
            </h3>
          </div>

          {/* Compact Diagnostics Summary */}
          {exportResult && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-rose-600">
                  <XCircle className="h-3.5 w-3.5" /> {errorCount} errors
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {warningCount} warnings
                </span>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Clean export
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Action Buttons: Copy & Download */}
          <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3">
            <button
              onClick={handleCopy}
              disabled={!exportResult?.content}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              title="Copy configuration to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : copyError ? (
                <span className="text-rose-600 font-semibold">Failed</span>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={!exportResult?.content}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              title="Download configuration file"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Download</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Target:</span>
            <ExporterSelector
              selectedExporterId={selectedExporterId}
              onSelect={onExporterChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area: Monaco Preview or State Fallbacks */}
      <div className="flex flex-1 overflow-hidden bg-slate-900">
        {!selectedExporterId ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <Code className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No Exporter Selected</p>
            <p className="mt-1 text-xs text-slate-500">
              Select an infrastructure target from the dropdown above.
            </p>
          </div>
        ) : !selectedExporter ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <Code className="mb-2 h-8 w-8 text-rose-300" />
            <p className="text-sm font-semibold text-rose-600">Exporter Unavailable</p>
            <p className="mt-1 text-xs text-rose-500">
              The selected infrastructure target could not be loaded.
            </p>
          </div>
        ) : !exportResult ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <XCircle className="mb-2 h-8 w-8 text-rose-400" />
            <p className="text-sm font-semibold text-slate-700">Generation Failed</p>
            <p className="mt-1 text-xs text-slate-500">
              Unable to generate configuration for this architecture.
            </p>
          </div>
        ) : (
          <div className="h-full w-full pt-2">
            <Editor
              height="100%"
              language={exportResult.language || "yaml"}
              theme="vs-dark"
              value={exportResult.content}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                lineNumbersMinChars: 3,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}