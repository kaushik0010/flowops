// src/components/canvas/flowops-canvas.tsx

"use client";

import { useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { 
  Monitor, 
  Server, 
  Database, 
  Layers, 
  Cog, 
  HardDrive, 
  type LucideIcon 
} from "lucide-react";

import { useProjectStore } from "../../store/project-store";

// ---------------------------------------------------------
// Props Interface
// ---------------------------------------------------------
export interface FlowOpsCanvasProps {
  onServiceSelect?: (serviceId: string | null) => void;
}

// ---------------------------------------------------------
// Helpers: Formatting & Theming
// ---------------------------------------------------------

function formatRuntime(runtime?: string): string {
  if (!runtime) return "";
  switch (runtime) {
    case "node": return "Node.js";
    case "python": return "Python";
    case "go": return "Go";
    case "docker": return "Docker";
    case "static": return "Static";
    default: return runtime;
  }
}

function formatPorts(ports?: number[]): string | null {
  if (!ports || ports.length === 0) return null;
  if (ports.length === 1) return `${ports[0]}`;
  return `${ports[0]} +${ports.length - 1}`;
}

interface ServiceTheme {
  icon: LucideIcon;
  color: string;
  bg: string;
}

function getServiceTheme(type: string): ServiceTheme {
  switch (type) {
    case "frontend":
      return { icon: Monitor, color: "text-blue-600", bg: "bg-blue-50" };
    case "backend":
      return { icon: Server, color: "text-emerald-600", bg: "bg-emerald-50" };
    case "postgres":
      return { icon: Database, color: "text-indigo-600", bg: "bg-indigo-50" };
    case "redis":
      return { icon: Layers, color: "text-red-600", bg: "bg-red-50" };
    case "worker":
      return { icon: Cog, color: "text-amber-600", bg: "bg-amber-50" };
    case "storage":
      return { icon: HardDrive, color: "text-slate-600", bg: "bg-slate-50" };
    default:
      return { icon: Server, color: "text-gray-600", bg: "bg-gray-50" };
  }
}

// ---------------------------------------------------------
// UI Layer: Custom Service Node
// ---------------------------------------------------------

interface ServiceNodeData extends Record<string, unknown> {
  name: string;
  serviceType: string;
  runtime?: string;
  ports?: number[];
}

function FlowOpsServiceNode({ data, selected }: { data: ServiceNodeData; selected?: boolean }) {
  const theme = getServiceTheme(data.serviceType);
  const Icon = theme.icon;
  const hasRuntime = !!data.runtime;
  const hasPorts = data.ports && data.ports.length > 0;

  return (
    <div
      className={`min-w-[180px] rounded-xl border bg-white shadow-sm transition-all ${
        selected
          ? "border-transparent ring-2 ring-blue-500 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="h-3 w-3 border-2 border-white bg-slate-400" 
      />

      <div className={`flex items-center gap-2 rounded-t-xl border-b border-slate-100 px-3 py-2 ${theme.bg}`}>
        <Icon className={`h-4 w-4 ${theme.color}`} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.color}`}>
          {data.serviceType}
        </span>
      </div>

      <div className="p-3">
        <div className="truncate text-sm font-semibold text-slate-800">
          {data.name}
        </div>

        {(hasRuntime || hasPorts) && (
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            {hasRuntime && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5">
                {formatRuntime(data.runtime)}
              </span>
            )}
            {hasPorts && (
              <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                {formatPorts(data.ports)}
              </span>
            )}
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="h-3 w-3 border-2 border-white bg-slate-400" 
      />
    </div>
  );
}

const nodeTypes = {
  flowopsService: FlowOpsServiceNode,
};

// ---------------------------------------------------------
// Canvas Component
// ---------------------------------------------------------

export function FlowOpsCanvas({ onServiceSelect }: FlowOpsCanvasProps) {
  const project = useProjectStore((state) => state.project);
  const updateService = useProjectStore((state) => state.updateService);
  const addConnection = useProjectStore((state) => state.addConnection);
  const removeService = useProjectStore((state) => state.removeService);
  const removeConnection = useProjectStore((state) => state.removeConnection);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode<ServiceNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);

  // Sync Domain State -> React Flow Transient State
  useEffect(() => {
    setNodes((currentNodes) => {
      return project.nodes.map((domainNode) => {
        const existingNode = currentNodes.find((n) => n.id === domainNode.id);
        const isDragging = existingNode?.dragging;

        return {
          id: domainNode.id,
          type: "flowopsService",
          position:
            isDragging && existingNode
              ? existingNode.position
              : { x: domainNode.presentation.x, y: domainNode.presentation.y },
          data: {
            name: domainNode.name,
            serviceType: domainNode.type,
            runtime: domainNode.config.runtime,
            ports: domainNode.config.ports,
          },
          width: existingNode?.width,
          height: existingNode?.height,
          measured: existingNode?.measured,
          selected: existingNode?.selected,
          dragging: existingNode?.dragging,
        };
      });
    });
  }, [project.nodes, setNodes]);

  useEffect(() => {
    setEdges((currentEdges) => {
      return project.connections.map((domainConn) => {
        const existingEdge = currentEdges.find((e) => e.id === domainConn.id);

        return {
          id: domainConn.id,
          source: domainConn.sourceId,
          target: domainConn.targetId,
          label: domainConn.intent,
          animated: domainConn.intent === "network",
          selected: existingEdge?.selected,
        };
      });
    });
  }, [project.connections, setEdges]);

  // Sync React Flow Interactions -> Domain State
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent | MouseEvent | TouchEvent, node: RFNode) => {
      updateService(node.id, {
        presentation: {
          x: node.position.x,
          y: node.position.y,
        },
      });
    },
    [updateService]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return;
      if (source === target) return;

      const isDuplicate = project.connections.some(
        (conn) => conn.sourceId === source && conn.targetId === target
      );
      if (isDuplicate) return;

      addConnection(source, target, "network");
    },
    [project.connections, addConnection]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: RFNode[]) => {
      for (const node of deletedNodes) {
        removeService(node.id);
      }
    },
    [removeService]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: RFEdge[]) => {
      for (const edge of deletedEdges) {
        removeConnection(edge.id);
      }
    },
    [removeConnection]
  );

  // Sync Selection State -> Application Shell
  const handleSelectionChange = useCallback(
    ({ nodes }: { nodes: RFNode[] }) => {
      if (!onServiceSelect) return;
      // Find the first selected node (React Flow supports multi-select, 
      // but for sidebar MVP we focus on one selected service)
      const selectedNode = nodes.find((n) => n.selected);
      onServiceSelect(selectedNode ? selectedNode.id : null);
    },
    [onServiceSelect]
  );

  return (
    <div className="h-full w-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}