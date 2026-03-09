import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

interface RawRuntimeConfig {
  approverAllowlist?: string[];
  linear?: {
    teamKey?: string;
    apiKeyEnvVar?: string;
  };
  watch?: {
    pollIntervalSeconds?: number;
  };
}

export interface LoadedWorkflowConfig {
  config: RawRuntimeConfig;
  configPath: string;
}

function extractFrontMatter(markdown: string): string | null {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return match?.[1] ?? null;
}

export async function loadWorkflowConfig(rootDir: string): Promise<LoadedWorkflowConfig | null> {
  const workflowPath = path.join(rootDir, "WORKFLOW.md");
  let workflowMarkdown: string;

  try {
    workflowMarkdown = await fs.readFile(workflowPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const frontMatter = extractFrontMatter(workflowMarkdown);
  if (!frontMatter) {
    throw new Error(`WORKFLOW.md at ${workflowPath} must start with YAML front matter`);
  }

  const parsed = YAML.parse(frontMatter) as RawRuntimeConfig | null;
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`WORKFLOW.md at ${workflowPath} must define a runtime config object`);
  }

  return {
    config: parsed,
    configPath: workflowPath
  };
}

