// src/components/sidebar/service-config-sidebar.tsx

"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Monitor, Server, Database, Layers, Cog, HardDrive, Plus, X, Lock, Unlock } from "lucide-react";
import { ServiceConfigSection } from "./service-config-section";
import { useProjectStore } from "../../store/project-store";
import type { RuntimeType, ServiceType, EnvironmentVariable } from "../../types";

export interface ServiceConfigSidebarProps {
  selectedServiceId: string | null;
}

// ---------------------------------------------------------
// Helpers: Theming & Mappings
// ---------------------------------------------------------

function getServiceIdentity(type: ServiceType) {
  switch (type) {
    case "frontend":
      return { icon: Monitor, color: "text-blue-600", bg: "bg-blue-50", label: "Frontend" };
    case "backend":
      return { icon: Server, color: "text-emerald-600", bg: "bg-emerald-50", label: "Backend" };
    case "postgres":
      return { icon: Database, color: "text-indigo-600", bg: "bg-indigo-50", label: "PostgreSQL" };
    case "redis":
      return { icon: Layers, color: "text-red-600", bg: "bg-red-50", label: "Redis" };
    case "worker":
      return { icon: Cog, color: "text-amber-600", bg: "bg-amber-50", label: "Worker" };
    case "storage":
      return { icon: HardDrive, color: "text-slate-600", bg: "bg-slate-50", label: "Storage" };
    default:
      return { icon: Server, color: "text-slate-600", bg: "bg-slate-50", label: type };
  }
}

const RUNTIME_OPTIONS: { value: RuntimeType; label: string }[] = [
  { value: "node", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "docker", label: "Docker" },
  { value: "static", label: "Static" },
];

const COMPUTE_SERVICES = new Set<ServiceType>(["frontend", "backend", "worker"]);

// ---------------------------------------------------------
// UI Layer: Individual Port Row
// ---------------------------------------------------------
// Manages local input state to prevent typing lag and allows editing existing ports inline.

function PortRow({
  port,
  index,
  onUpdate,
  onRemove,
}: {
  port: number;
  index: number;
  onUpdate: (index: number, p: number) => void;
  onRemove: (index: number) => void;
}) {
  const [localVal, setLocalVal] = useState(port.toString());

  useEffect(() => {
    setLocalVal(port.toString());
  }, [port]);

  const commitChanges = () => {
    const p = parseInt(localVal, 10);
    // Basic UI sanitization: ensure it's a valid integer in range
    if (!isNaN(p) && p > 0 && p <= 65535) {
      if (p !== port) onUpdate(index, p);
    } else {
      setLocalVal(port.toString()); // Revert if obviously invalid
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
      <input
        type="number"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commitChanges}
        onKeyDown={(e) => e.key === "Enter" && commitChanges()}
        className="w-full min-w-0 bg-transparent text-sm font-mono text-slate-700 focus:outline-none"
      />
      <button
        onClick={() => onRemove(index)}
        className="flex shrink-0 items-center justify-center rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
        title="Remove port"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------
// UI Layer: Individual Environment Variable Row
// ---------------------------------------------------------

function EnvVarRow({
  env,
  index,
  onUpdate,
  onRemove,
}: {
  env: EnvironmentVariable;
  index: number;
  onUpdate: (index: number, newEnv: EnvironmentVariable) => void;
  onRemove: (index: number) => void;
}) {
  const [localKey, setLocalKey] = useState(env.key);
  const [localValue, setLocalValue] = useState(env.value);

  useEffect(() => {
    setLocalKey(env.key);
    setLocalValue(env.value);
  }, [env.key, env.value]);

  const commitChanges = () => {
    const newKey = localKey.trim();
    if (!newKey) {
      setLocalKey(env.key); // Prevent obviously invalid empty keys
      return;
    }
    
    // Note: We deliberately allow duplicate keys to persist here so the architectural 
    // Validation Engine acts as the single source of truth for catching them later.
    
    if (newKey === env.key && localValue === env.value) {
      return; // No changes to commit
    }
    onUpdate(index, { ...env, key: newKey, value: localValue });
  };

  const toggleSecret = () => {
    onUpdate(index, { ...env, isSecret: !env.isSecret });
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
      <input
        type="text"
        value={localKey}
        onChange={(e) => setLocalKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
        onBlur={commitChanges}
        onKeyDown={(e) => e.key === "Enter" && commitChanges()}
        className="w-1/3 min-w-0 bg-transparent text-xs font-mono font-semibold text-slate-700 focus:outline-none"
        placeholder="KEY"
      />
      <div className="h-4 w-px bg-slate-300" />
      <input
        type={env.isSecret ? "password" : "text"}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commitChanges}
        onKeyDown={(e) => e.key === "Enter" && commitChanges()}
        className="flex-1 min-w-0 bg-transparent text-xs font-mono text-slate-600 focus:outline-none"
        placeholder="value"
      />
      <button
        onClick={toggleSecret}
        className={`flex shrink-0 items-center justify-center rounded p-1 transition-colors ${
          env.isSecret
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
        }`}
        title={env.isSecret ? "Secret (Click to make public)" : "Public (Click to make secret)"}
      >
        {env.isSecret ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => onRemove(index)}
        className="flex shrink-0 items-center justify-center rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
        title="Remove variable"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------

export function ServiceConfigSidebar({ selectedServiceId }: ServiceConfigSidebarProps) {
  const project = useProjectStore((state) => state.project);
  const updateService = useProjectStore((state) => state.updateService);

  const [newPortInputValue, setNewPortInputValue] = useState("");
  
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvIsSecret, setNewEnvIsSecret] = useState(false);

  const service = project.nodes.find((n) => n.id === selectedServiceId);

  // Clear transient inputs when switching selections
  useEffect(() => {
    setNewPortInputValue("");
    setNewEnvKey("");
    setNewEnvValue("");
    setNewEnvIsSecret(false);
  }, [selectedServiceId]);

  if (!selectedServiceId) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center border-l border-slate-200 bg-slate-50 p-6 text-center">
        <div className="mb-3 rounded-full bg-slate-100 p-4 shadow-inner">
          <Monitor className="h-6 w-6 text-slate-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Select a service</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
          Choose a service on the canvas to configure it.
        </p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center border-l border-slate-200 bg-rose-50 p-6 text-center">
        <div className="mb-3 rounded-full bg-rose-100 p-4 text-rose-500">
          <X className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-rose-700">Service not found</h2>
        <p className="mt-1 text-xs text-rose-500 max-w-[200px]">
          The selected service no longer exists in this project.
        </p>
      </div>
    );
  }

  const identity = getServiceIdentity(service.type);
  const Icon = identity.icon;
  const isCompute = COMPUTE_SERVICES.has(service.type);
  
  const currentEnvs = service.config.environmentVariables || [];

  // ---------------------------------------------------------
  // Handlers: Canonical Zustand Mutations
  // ---------------------------------------------------------

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val && val !== service.name) {
      updateService(service.id, { name: val });
    }
  };

  const handleRuntimeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateService(service.id, {
      config: { ...service.config, runtime: e.target.value as RuntimeType },
    });
  };

  const handleBuildCommandBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    updateService(service.id, {
      config: { ...service.config, buildCommand: val === "" ? undefined : val },
    });
  };

  const handleStartCommandBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    updateService(service.id, {
      config: { ...service.config, startCommand: val === "" ? undefined : val },
    });
  };

  const handleAddPort = () => {
    const portNum = parseInt(newPortInputValue, 10);
    if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
      const currentPorts = service.config.ports || [];
      // Even though we allow env var duplicates, duplicate ports make no semantic 
      // sense on a single container, so preventing UI duplication here is safe.
      if (!currentPorts.includes(portNum)) {
        updateService(service.id, {
          config: { ...service.config, ports: [...currentPorts, portNum] },
        });
      }
    }
    setNewPortInputValue(""); 
  };

  const handleUpdatePort = (index: number, newPort: number) => {
    const updatedPorts = [...(service.config.ports || [])];
    updatedPorts[index] = newPort;
    updateService(service.id, {
      config: { ...service.config, ports: updatedPorts },
    });
  };

  const handleRemovePort = (index: number) => {
    const updatedPorts = (service.config.ports || []).filter((_, i) => i !== index);
    updateService(service.id, {
      config: { ...service.config, ports: updatedPorts },
    });
  };

  const handleAddEnv = () => {
    const key = newEnvKey.trim();
    if (!key) return; // Prevent empty key

    // Duplicate keys intentionally allowed here. Validation Engine catches them.
    updateService(service.id, {
      config: {
        ...service.config,
        environmentVariables: [...currentEnvs, { key, value: newEnvValue, isSecret: newEnvIsSecret }],
      },
    });

    setNewEnvKey("");
    setNewEnvValue("");
    setNewEnvIsSecret(false);
  };

  const handleUpdateEnv = (index: number, updatedEnv: EnvironmentVariable) => {
    const updatedEnvs = [...currentEnvs];
    updatedEnvs[index] = updatedEnv;
    updateService(service.id, {
      config: { ...service.config, environmentVariables: updatedEnvs },
    });
  };

  const handleRemoveEnv = (index: number) => {
    const updatedEnvs = currentEnvs.filter((_, i) => i !== index);
    updateService(service.id, {
      config: { ...service.config, environmentVariables: updatedEnvs },
    });
  };

  // ---------------------------------------------------------
  // Render: Configuration Form
  // ---------------------------------------------------------
  return (
    <div className="flex h-full w-full flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${identity.bg}`}>
          <Icon className={`h-5 w-5 ${identity.color}`} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-bold text-slate-800">{service.name}</span>
          <span className={`text-xs font-semibold uppercase tracking-wider ${identity.color}`}>
            {identity.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
        
        <ServiceConfigSection title="Identity">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="serviceName" className="text-xs font-medium text-slate-600">
              Service Name
            </label>
            <input
              key={`name-${service.id}`}
              id="serviceName"
              type="text"
              defaultValue={service.name}
              onBlur={handleNameBlur}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., api-server"
            />
          </div>
        </ServiceConfigSection>

        {isCompute && (
          <ServiceConfigSection title="Compute">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="runtime" className="text-xs font-medium text-slate-600">
                Runtime Environment
              </label>
              <select
                id="runtime"
                value={service.config.runtime || ""}
                onChange={handleRuntimeChange}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>Select runtime...</option>
                {RUNTIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="buildCommand" className="text-xs font-medium text-slate-600">
                Build Command <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                key={`build-${service.id}`}
                id="buildCommand"
                type="text"
                defaultValue={service.config.buildCommand || ""}
                onBlur={handleBuildCommandBlur}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="e.g., pnpm build"
              />
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="startCommand" className="text-xs font-medium text-slate-600">
                Start Command <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                key={`start-${service.id}`}
                id="startCommand"
                type="text"
                defaultValue={service.config.startCommand || ""}
                onBlur={handleStartCommandBlur}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="e.g., pnpm start"
              />
            </div>
          </ServiceConfigSection>
        )}

        {service.type !== "storage" && (
          <ServiceConfigSection title="Ports">
            <div className="flex flex-col gap-2">
              {service.config.ports.map((port, index) => (
                <PortRow
                  key={`port-${index}-${service.id}`}
                  index={index}
                  port={port}
                  onUpdate={handleUpdatePort}
                  onRemove={handleRemovePort}
                />
              ))}
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={newPortInputValue}
                  onChange={(e) => setNewPortInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPort()}
                  placeholder="e.g. 8080"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  onClick={handleAddPort}
                  disabled={!newPortInputValue}
                  className="flex shrink-0 items-center justify-center rounded-md bg-slate-800 p-1.5 text-white shadow-sm hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  aria-label="Add port"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </ServiceConfigSection>
        )}

        <ServiceConfigSection title="Environment Variables">
          <div className="flex flex-col gap-2">
            {currentEnvs.map((env, index) => (
              <EnvVarRow
                key={`env-${index}-${service.id}`}
                index={index}
                env={env}
                onUpdate={handleUpdateEnv}
                onRemove={handleRemoveEnv}
              />
            ))}
            
            <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                onKeyDown={(e) => e.key === "Enter" && handleAddEnv()}
                placeholder="NEW_KEY"
                className="w-1/3 min-w-0 bg-transparent px-1 text-xs font-mono font-semibold text-slate-700 focus:outline-none"
              />
              <div className="h-4 w-px bg-slate-300" />
              <input
                type={newEnvIsSecret ? "password" : "text"}
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEnv()}
                placeholder="value"
                className="flex-1 min-w-0 bg-transparent px-1 text-xs font-mono text-slate-600 focus:outline-none"
              />
              <button
                onClick={() => setNewEnvIsSecret(!newEnvIsSecret)}
                className={`flex shrink-0 items-center justify-center rounded p-1 transition-colors ${
                  newEnvIsSecret
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
                title="Toggle secret status"
              >
                {newEnvIsSecret ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleAddEnv}
                disabled={!newEnvKey.trim()}
                className="flex shrink-0 items-center justify-center rounded bg-slate-800 p-1 text-white shadow-sm hover:bg-slate-700 disabled:opacity-50 transition-colors"
                aria-label="Add environment variable"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </ServiceConfigSection>

      </div>
    </div>
  );
}