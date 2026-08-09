// src/app/page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Workflow, 
  RotateCcw, 
  Download, 
  Upload, 
  Plus, 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  ChevronUp, 
  ChevronDown, 
  Terminal, 
  CheckCircle2, 
  Layers,
  Sliders,
  Pencil,
  Check,
  LayoutTemplate
} from "lucide-react";
import { ReactFlowProvider, useOnSelectionChange, useReactFlow } from "@xyflow/react";
import { FlowOpsCanvas } from "@/components/canvas/flowops-canvas";
import { ServicePalette } from "@/components/canvas/service-palette";
import { ServiceConfigSidebar } from "@/components/sidebar/service-config-sidebar";
import { ConnectionConfigSidebar } from "@/components/sidebar/connection-config-sidebar";
import { ValidationPanel } from "@/components/validation/validation-panel";
import { ExporterWorkspace } from "@/components/exporter/exporter-workspace";
import { ArchitectureTemplatePicker } from "@/components/templates/architecture-template-picker";
import { useProjectStore } from "@/store/project-store";
import { getAllExporters, getExporter } from "@/engine/exporters/registry";
import { bootstrapExporters } from "@/engine/exporters/init";
import { validateProject } from "@/engine/validation/validate-project";
import { getTemplateById } from "@/engine/templates/architectures";
import { 
  downloadProjectJson, 
  parseAndValidateImportJson 
} from "@/lib/project-persistence";
import type { ServiceType } from "@/types";

bootstrapExporters();

function SelectionBridge({
  onSelectService,
  onSelectConnection,
}: {
  onSelectService: (id: string | null) => void;
  onSelectConnection: (id: string | null) => void;
}) {
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      if (nodes.length === 1 && edges.length === 0) {
        const selectedNode = nodes[0];
        if (selectedNode) onSelectService(selectedNode.id);
        onSelectConnection(null);
        return;
      }
      
      if (edges.length === 1 && nodes.length === 0) {
        const selectedEdge = edges[0];
        if (selectedEdge) onSelectConnection(selectedEdge.id);
        onSelectService(null);
        return;
      }

      onSelectService(null);
      onSelectConnection(null);
    },
  });
  return null;
}

/**
 * Inner workspace component wrapped safely inside ReactFlowProvider so both Palette and Canvas can access viewport methods.
 */
function WorkspaceContent() {
  const project = useProjectStore((state) => state.project);
  const addService = useProjectStore((state) => state.addService);

  const { screenToFlowPosition } = useReactFlow();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  const [selectedExporterId, setSelectedExporterId] = useState<string | null>(() => {
    const exporters = getAllExporters();
    if (exporters.length === 0) return null;
    const defaultExporter = exporters.find((e) => e.id === "zerops") || exporters[0];
    return defaultExporter ? defaultExporter.id : null;
  });

  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(true);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selectedServiceId || selectedConnectionId) {
      setIsConfigOpen(true);
    }
  }, [selectedServiceId, selectedConnectionId]);

  // Automatically clean up selection if the selected entity is deleted or the project is replaced (Import/Template)
  useEffect(() => {
    if (selectedServiceId) {
      const exists = project.nodes.some((node) => node.id === selectedServiceId);
      if (!exists) setSelectedServiceId(null);
    }
    if (selectedConnectionId) {
      const exists = project.connections.some((conn) => conn.id === selectedConnectionId);
      if (!exists) setSelectedConnectionId(null);
    }
  }, [project.nodes, project.connections, selectedServiceId, selectedConnectionId]);

  // Viewport-aware service addition based on actual canvas DOM container bounds
  const handleAddServiceFromPalette = useCallback((type: ServiceType) => {
    let center: { x: number; y: number } | undefined = undefined;
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const screenCenterX = rect.left + rect.width / 2;
      const screenCenterY = rect.top + rect.height / 2;
      try {
        center = screenToFlowPosition({ x: screenCenterX, y: screenCenterY });
      } catch {
        center = { x: 250, y: 200 };
      }
    }
    addService(type, center);
  }, [addService, screenToFlowPosition]);

  const currentIssues = validateProject(project);
  const errs = currentIssues.filter((i) => i.severity === "error").length;
  const warns = currentIssues.filter((i) => i.severity === "warning").length;

  const selectedExporter = selectedExporterId ? getExporter(selectedExporterId) : null;
  const exportResultSummary = selectedExporter ? selectedExporter.generate(project) : null;
  const exportErrors = exportResultSummary?.diagnostics?.filter((d) => d.severity === "error").length || 0;
  const exportWarnings = exportResultSummary?.diagnostics?.filter((d) => d.severity === "warning").length || 0;

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full overflow-hidden relative">
      {/* Left Palette Tool Panel */}
      {isPaletteOpen ? (
        <aside className="w-68 shrink-0 z-20 border-r border-slate-200 bg-white shadow-sm flex flex-col transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Components</span>
            </div>
            <button
              onClick={() => setIsPaletteOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              title="Collapse Palette"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ServicePalette onAddService={handleAddServiceFromPalette} />
          </div>
        </aside>
      ) : (
        <div className="w-10 shrink-0 z-20 border-r border-slate-200 bg-white flex flex-col items-center py-3">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Open Service Palette"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Center Canvas Workspace */}
      <section ref={canvasContainerRef} className="relative flex flex-1 flex-col bg-slate-50 min-w-0 overflow-hidden">
        <div className="relative flex-1">
          {project.nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/80 p-6 text-center shadow-sm backdrop-blur-md border border-slate-200">
                <Workflow className="h-8 w-8 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-700">Build your architecture</h3>
                <p className="text-xs font-medium text-slate-500 max-w-xs">
                  Select a service from the left palette to add it to the canvas.
                </p>
              </div>
            </div>
          )}
          
          <SelectionBridge 
            onSelectService={setSelectedServiceId} 
            onSelectConnection={setSelectedConnectionId} 
          />
          <FlowOpsCanvas />
        </div>

        {/* Collapsible Diagnostics Panel */}
        <div className="shrink-0 border-t border-slate-200 bg-white z-10">
          {isDiagnosticsOpen ? (
            <div className="flex flex-col h-44">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Architecture Diagnostics
                </span>
                <button
                  onClick={() => setIsDiagnosticsOpen(false)}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                >
                  <span>Collapse</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ValidationPanel />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="flex w-full items-center justify-between bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-slate-700">Diagnostics</span>
                <span className="text-slate-300">·</span>
                {currentIssues.length === 0 ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-3 w-3" /> Passing
                  </span>
                ) : (
                  <span className="flex items-center gap-2 font-semibold">
                    {errs > 0 && <span className="text-rose-600">{errs} errors</span>}
                    {warns > 0 && <span className="text-amber-600">{warns} warnings</span>}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span>Expand</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </div>
            </button>
          )}
        </div>

        {/* Collapsible Exporter Workspace */}
        <div className="shrink-0 border-t border-slate-200 bg-white z-10">
          {isExporterOpen ? (
            <div className="flex flex-col h-64">
              <div className="flex items-center justify-between bg-slate-100 px-2 py-1 border-b border-slate-200">
                <div className="flex items-center gap-2 pl-2">
                  <Terminal className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Generated Configuration
                  </span>
                </div>
                <button
                  onClick={() => setIsExporterOpen(false)}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <span>Collapse</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ExporterWorkspace 
                  selectedExporterId={selectedExporterId} 
                  onExporterChange={setSelectedExporterId} 
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsExporterOpen(true)}
              className="flex w-full items-center justify-between bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors border-t border-slate-200"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-slate-600" />
                <span className="font-bold uppercase tracking-wider text-slate-700">Generated Configuration</span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-800 uppercase">{selectedExporter?.name || "None"}</span>
                <span className="text-slate-300">·</span>
                {exportErrors === 0 && exportWarnings === 0 ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Clean export
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">
                    {exportErrors > 0 ? `${exportErrors} errors` : `${exportWarnings} warnings`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span>Expand Editor</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Right Configuration Tool Panel */}
      {isConfigOpen ? (
        <aside className="w-80 shrink-0 z-20 border-l border-slate-200 bg-white shadow-sm flex flex-col transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Configuration</span>
            </div>
            <button
              onClick={() => {
                setIsConfigOpen(false);
                setSelectedServiceId(null);
                setSelectedConnectionId(null);
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedServiceId ? (
              <ServiceConfigSidebar selectedServiceId={selectedServiceId} />
            ) : selectedConnectionId ? (
              <ConnectionConfigSidebar selectedConnectionId={selectedConnectionId} />
            ) : (
              <ServiceConfigSidebar selectedServiceId={null} />
            )}
          </div>
        </aside>
      ) : (
        <div className="w-10 shrink-0 z-20 border-l border-slate-200 bg-white flex flex-col items-center py-3">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Open Configuration Sidebar"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function FlowOpsApplicationShell() {
  const project = useProjectStore((state) => state.project);
  const resetProject = useProjectStore((state) => state.resetProject);
  const loadProject = useProjectStore((state) => state.loadProject);
  const replaceProject = useProjectStore((state) => state.replaceProject);
  const renameProject = useProjectStore((state) => state.renameProject);

  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState(project.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjectNameInput(project.name);
  }, [project.name]);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  const handleSaveProjectName = () => {
    const trimmed = projectNameInput.trim();
    if (trimmed) {
      renameProject(trimmed);
    } else {
      setProjectNameInput(project.name);
    }
    setIsEditingName(false);
  };

  const handleExport = () => downloadProjectJson(project);
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = parseAndValidateImportJson(content);
      if (!result.success || !result.project) {
        alert(result.error || "Failed to import project file.");
      } else {
        const replaceRes = replaceProject(result.project);
        if (!replaceRes.success) {
          alert(`Unable to import project. ${replaceRes.error}`);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleTemplateSelect = (templateId: string) => {
    if (project.nodes.length > 0) {
      const confirmReplace = window.confirm("Loading this template will replace your current architecture. Continue?");
      if (!confirmReplace) return;
    }
    
    const template = getTemplateById(templateId);
    if (template) {
      loadProject(template.createProject());
    }
    setIsTemplatePickerOpen(false);
  };

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 text-slate-900 relative">
      
      {isTemplatePickerOpen && (
        <ArchitectureTemplatePicker 
          onSelect={handleTemplateSelect} 
          onClose={() => setIsTemplatePickerOpen(false)} 
        />
      )}

      {/* Hidden File Input for Importing Projects */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      {/* 1. Compact Global Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm z-30 relative">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
            <Workflow className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-900">
              FlowOps
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Visual Infrastructure Designer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>

            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  onBlur={handleSaveProjectName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveProjectName();
                    if (e.key === "Escape") {
                      setProjectNameInput(project.name);
                      setIsEditingName(false);
                    }
                  }}
                  className="w-36 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-800 rounded border border-blue-400 focus:outline-none"
                />
                <button
                  onClick={handleSaveProjectName}
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Save Name"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors group"
                title="Click to rename project"
              >
                <span className="max-w-[160px] truncate">{project.name}</span>
                <Pencil className="h-3 w-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              onClick={() => {
                if (confirm("Create a new project? Any unsaved changes in your current view will be reset.")) {
                  resetProject();
                }
              }}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              title="New Project"
            >
              <Plus className="h-3 w-3 text-slate-500" />
              <span>New</span>
            </button>
            <button
              onClick={() => setIsTemplatePickerOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 hover:border-blue-200"
              title="Start from a template"
            >
              <LayoutTemplate className="h-3.5 w-3.5 text-blue-600" />
              <span>Templates</span>
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              title="Import Project JSON"
            >
              <Upload className="h-3 w-3 text-slate-500" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              title="Export Project JSON"
            >
              <Download className="h-3 w-3 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              resetProject();
            }}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-rose-600"
            aria-label="Reset Project"
            title="Reset Project"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Wrapped inside ReactFlowProvider */}
      <ReactFlowProvider>
        <WorkspaceContent />
      </ReactFlowProvider>
    </main>
  );
}