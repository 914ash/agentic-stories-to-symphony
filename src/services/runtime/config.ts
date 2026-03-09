import fs from "node:fs/promises";
import path from "node:path";
import type { HarnessConfig } from "../../types/runtime.js";
import { loadWorkflowConfig } from "./workflow-loader.js";

interface RawHarnessConfig {
  approverAllowlist?: string[];
  linear?: {
    teamKey?: string;
    apiKeyEnvVar?: string;
  };
  watch?: {
    pollIntervalSeconds?: number;
  };
}

function hasIntakeRuntimeFields(config: RawHarnessConfig): boolean {
  return Boolean(config.approverAllowlist?.length && config.linear?.teamKey);
}

async function loadLegacyConfig(rootDir: string): Promise<{ config: RawHarnessConfig; configPath: string } | null> {
  const legacyConfigPath = path.join(rootDir, "harness.config.json");

  try {
    return {
      config: JSON.parse(await fs.readFile(legacyConfigPath, "utf8")) as RawHarnessConfig,
      configPath: legacyConfigPath
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function loadHarnessConfig(
  rootDir: string,
  env: Record<string, string | undefined> = process.env
): Promise<HarnessConfig> {
  const workflowConfig = await loadWorkflowConfig(rootDir);
  const legacyConfig = await loadLegacyConfig(rootDir);
  let rawConfig: RawHarnessConfig;
  let configPath: string;

  if (workflowConfig && hasIntakeRuntimeFields(workflowConfig.config)) {
    rawConfig = workflowConfig.config;
    configPath = workflowConfig.configPath;
  } else if (legacyConfig) {
    rawConfig = legacyConfig.config;
    configPath = legacyConfig.configPath;
  } else if (workflowConfig) {
    rawConfig = workflowConfig.config;
    configPath = workflowConfig.configPath;
  } else {
    throw new Error(
      `Missing runtime config at ${path.join(rootDir, "WORKFLOW.md")} or ${path.join(rootDir, "harness.config.json")}`
    );
  }

  const apiKeyEnvVar = rawConfig.linear?.apiKeyEnvVar ?? "LINEAR_API_KEY";
  const apiKey = env[apiKeyEnvVar];
  if (!apiKey) {
    throw new Error(`${apiKeyEnvVar} must be set before running terminal intake`);
  }

  if (!rawConfig.linear?.teamKey) {
    throw new Error(`${path.basename(configPath)} must define linear.teamKey`);
  }

  if (!rawConfig.approverAllowlist?.length) {
    throw new Error(`${path.basename(configPath)} must define at least one approverAllowlist entry`);
  }

  return {
    approverAllowlist: rawConfig.approverAllowlist,
    linear: {
      teamKey: rawConfig.linear.teamKey,
      apiKey
    },
    watch: {
      pollIntervalSeconds: rawConfig.watch?.pollIntervalSeconds ?? 15
    }
  };
}
