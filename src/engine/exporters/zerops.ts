// src/engine/exporters/zerops.ts

import { stringify } from "yaml";
import type { FlowOpsProject } from "../../types";
import type {
  InfrastructureExporter,
  ExportResult,
  ExportDiagnostic,
} from "./base";

// ---------------------------------------------------------
// Internal Typing for Zerops YAML Structure
// ---------------------------------------------------------

interface ZeropsPortConfig {
  port: number;
  httpSupport?: boolean;
}

interface ZeropsBuildSection {
  base: string;
  buildCommands?: string[];
  deployFiles: string;
}

interface ZeropsRunSection {
  base: string;
  start?: string;
  ports?: ZeropsPortConfig[];
  envVariables?: Record<string, string>;
}

interface ZeropsSetupConfig {
  setup: string;
  build?: ZeropsBuildSection;
  run: ZeropsRunSection;
}

interface ZeropsYamlSchema {
  zerops: ZeropsSetupConfig[];
}

// ---------------------------------------------------------
// Exporter Implementation
// ---------------------------------------------------------

export const zeropsExporter: InfrastructureExporter = {
  id: "zerops",
  name: "Zerops",
  description: "Exports a zerops.yaml pipeline configuration for compute services.",
  generate: (project: FlowOpsProject): ExportResult => {
    const diagnostics: ExportDiagnostic[] = [];
    const zeropsConfigArray: ZeropsSetupConfig[] = [];

    // Sort nodes lexicographically by ID to guarantee deterministic YAML output
    const sortedNodes = [...project.nodes].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    for (const node of sortedNodes) {
      // 1. Differentiate Managed Infrastructure vs. Compute Runtimes
      if (
        node.type === "postgres" ||
        node.type === "redis" ||
        node.type === "storage"
      ) {
        diagnostics.push({
          severity: "info",
          message: `Service '${node.name}' (${node.type}) is a managed infrastructure service. It must be created via Zerops Import YAML or the GUI and cannot be configured in zerops.yaml.`,
          nodeId: node.id,
        });
        continue;
      }

      const setupConfig: ZeropsSetupConfig = {
        setup: node.name,
        run: { base: "ubuntu" }, // Defaults, overwritten below
      };

      // 2. Map FlowOps Runtimes to Zerops Base Images
      let runBase = "ubuntu";
      let buildBase = "ubuntu";

      switch (node.config.runtime) {
        case "node":
          runBase = "nodejs@20";
          buildBase = "nodejs@20";
          break;
        case "python":
          runBase = "python@3.12";
          buildBase = "python@3.12";
          break;
        case "go":
          runBase = "go@1.22";
          buildBase = "go@1.22";
          break;
        case "static":
          runBase = "nginx@1.24";
          buildBase = "nodejs@20"; // Standard for building static frontends
          break;
        case "docker":
          diagnostics.push({
            severity: "warning",
            message: `Service '${node.name}' uses a 'docker' runtime. Zerops uses its own container engine. Defaulting to 'ubuntu'. Consider using a native runtime base.`,
            nodeId: node.id,
          });
          break;
        default:
          if (node.config.runtime) {
            diagnostics.push({
              severity: "warning",
              message: `Service '${node.name}' uses an unknown runtime '${node.config.runtime}'. Defaulting to 'ubuntu'.`,
              nodeId: node.id,
            });
          } else {
            diagnostics.push({
              severity: "error",
              message: `Service '${node.name}' is missing a runtime. Defaulting to 'ubuntu', but export is fundamentally incomplete.`,
              nodeId: node.id,
            });
          }
          break;
      }

      // 3. Construct Build Section
      const buildSection: ZeropsBuildSection = {
        base: buildBase,
        deployFiles: "./", // Wildcard to deploy everything in the build directory
      };
      if (node.config.buildCommand) {
        buildSection.buildCommands = [node.config.buildCommand];
      }
      setupConfig.build = buildSection;

      // 4. Construct Run Section
      const runSection: ZeropsRunSection = {
        base: runBase,
      };
      if (node.config.startCommand) {
        runSection.start = node.config.startCommand;
      }

      // 5. Port Configuration (HTTP Support Mapping)
      if (node.config.ports.length > 0) {
        runSection.ports = node.config.ports.map((port) => {
          const portConfig: ZeropsPortConfig = { port };
          // Only frontends and backends should typically expose HTTP access
          if (node.type === "frontend" || node.type === "backend") {
            portConfig.httpSupport = true;
          }
          return portConfig;
        });
      }

      // 6. Environment Variables (Secret Handling)
      if (node.config.environmentVariables.length > 0) {
        const envVars: Record<string, string> = {};
        // Sort keys to maintain deterministic output
        const sortedEnvs = [...node.config.environmentVariables].sort((a, b) =>
          a.key.localeCompare(b.key)
        );

        for (const env of sortedEnvs) {
          if (env.isSecret) {
            envVars[env.key] = "SECRET_VALUE_PLEASE_CONFIGURE_IN_GUI";
            diagnostics.push({
              severity: "warning",
              message: `Environment variable '${env.key}' in '${node.name}' is marked as secret. Zerops handles secrets securely via GUI or Import YAML. A placeholder was generated.`,
              nodeId: node.id,
            });
          } else {
            envVars[env.key] = env.value;
          }
        }
        runSection.envVariables = envVars;
      }

      setupConfig.run = runSection;
      zeropsConfigArray.push(setupConfig);
    }

    // 7. Process Connections for Informational Diagnostics
    // We sort edges so diagnostic logs are also deterministic
    const sortedConnections = [...project.connections].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    for (const conn of sortedConnections) {
      if (conn.intent === "env_binding") {
        diagnostics.push({
          severity: "info",
          message: `Connection uses 'env_binding'. In Zerops, you can reference target credentials using built-in variables (e.g., \${hostname_port}) in the GUI or Import YAML.`,
          connectionId: conn.id,
        });
      } else if (conn.intent === "network") {
        diagnostics.push({
          severity: "info",
          message: `Network connection mapped. Zerops services communicate securely on the internal network using their hostnames.`,
          connectionId: conn.id,
        });
      } else if (conn.intent === "depends_on") {
        diagnostics.push({
          severity: "warning",
          message: `Zerops does not support explicit 'depends_on' ordering in zerops.yaml. Ensure your application code is resilient to dependency startup times.`,
          connectionId: conn.id,
        });
      }
    }

    // 8. Generate Final Output
    const outputObject: ZeropsYamlSchema = {
      zerops: zeropsConfigArray,
    };

    // Use yaml stringify for safe, standard-compliant formatting
    const yamlContent = stringify(outputObject, { indent: 2 });

    return {
      content: yamlContent,
      language: "yaml",
      diagnostics: diagnostics,
    };
  },
};