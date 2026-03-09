import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { afterEach, describe, expect, test } from "vitest";

const tempRoots: string[] = [];
const repoRoot = process.cwd();
const tsxCliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const cliEntryPath = path.join(repoRoot, "src", "interfaces", "terminal-intake.ts");

async function createWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-"));
  tempRoots.push(root);
  await fs.writeFile(
    path.join(root, "harness.config.json"),
    JSON.stringify({
      approverAllowlist: ["reviewer-1"],
      linear: {
        teamKey: "ENG"
      },
      watch: {
        pollIntervalSeconds: 1
      }
    }),
    "utf8"
  );
  return root;
}

async function createWorkflowWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-workflow-"));
  tempRoots.push(root);
  await fs.writeFile(
    path.join(root, "WORKFLOW.md"),
    `---
approverAllowlist:
  - reviewer-1
linear:
  teamKey: ASTS
  apiKeyEnvVar: PUBLIC_LINEAR_KEY
watch:
  pollIntervalSeconds: 1
---
You are the workflow that turns approved requirements into agentic delivery.`,
    "utf8"
  );
  return root;
}

function runCli(input: {
  cwd: string;
  args?: string[];
  prompts: unknown[];
  linearFixtures?: unknown[];
  trackerEvents?: unknown[];
  env?: Record<string, string>;
}) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, [tsxCliPath, cliEntryPath, ...(input.args ?? [])], {
      cwd: input.cwd,
      env: {
        ...process.env,
        ...input.env,
        HARNESS_TEST_PROMPTS: JSON.stringify(input.prompts),
        HARNESS_TEST_LINEAR_FIXTURES: JSON.stringify(input.linearFixtures ?? []),
        HARNESS_TEST_TRACKER_EVENTS: JSON.stringify(input.trackerEvents ?? [])
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("terminal intake cli", () => {
  test("walks a new session through approval, projection, and watch mode", async () => {
    const workspace = await createWorkspace();

    const result = await runCli({
      cwd: workspace,
      args: ["--approve-as", "reviewer-1"],
      prompts: [
        "Turn app ideas into Linear execution.",
        "Authorized collaborator",
        "Capture requirements, compile a spec, project it, and let Symphony execute it.",
        "Spec generation\nAutomatic writeback",
        "Reverse sync from Linear",
        "Spec remains canonical",
        "continue",
        true
      ],
      linearFixtures: [
        {
          team: {
            id: "team-1",
            key: "ENG",
            issueEstimationType: "fibonacci",
            states: {
              nodes: [
                { id: "state-1", name: "Todo", type: "unstarted" },
                { id: "state-2", name: "In Progress", type: "started" },
                { id: "state-3", name: "Done", type: "completed" }
              ]
            },
            labels: {
              nodes: [{ id: "label-1", name: "generated:spec" }]
            }
          }
        },
        {
          projectCreate: {
            success: true,
            project: { id: "project-1" }
          }
        },
        {
          issueCreate: {
            success: true,
            issue: { id: "issue-1", identifier: "ENG-101", description: "desc" }
          }
        },
        {
          issueCreate: {
            success: true,
            issue: { id: "issue-2", identifier: "ENG-102", description: "desc" }
          }
        }
      ],
      trackerEvents: [
        { type: "projection_succeeded", issueIdentifier: "ENG-101" },
        { type: "picked_up", issueIdentifier: "ENG-101" },
        { type: "completed", issueIdentifier: "ENG-101", state: "Done" }
      ]
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("ENG-101");
    expect(result.stdout).toContain("Symphony picked up ENG-101.");
    expect(await fs.readFile(path.join(workspace, "specs", "spec-generation", "revisions", "1.json"), "utf8")).toContain(
      "\"status\": \"approved\""
    );
  });

  test("saves and resumes an incomplete session", async () => {
    const workspace = await createWorkspace();

    const firstRun = await runCli({
      cwd: workspace,
      prompts: [
        "Turn app ideas into Linear execution.",
        "Authorized collaborator",
        "Capture requirements, compile a spec, project it, and let Symphony execute it.",
        "Spec generation",
        "Reverse sync from Linear",
        "Spec remains canonical",
        "save_and_exit"
      ]
    });

    expect(firstRun.code).toBe(0);
    expect(await fs.readFile(path.join(workspace, "specs", "sessions", "sess-1.json"), "utf8")).toContain(
      "\"status\": \"in_progress\""
    );

    const secondRun = await runCli({
      cwd: workspace,
      args: ["--approve-as", "reviewer-1", "--no-watch"],
      prompts: ["resume_latest", "continue", true],
      linearFixtures: [
        {
          team: {
            id: "team-1",
            key: "ENG",
            issueEstimationType: "fibonacci",
            states: {
              nodes: [
                { id: "state-1", name: "Todo", type: "unstarted" },
                { id: "state-2", name: "Done", type: "completed" }
              ]
            },
            labels: {
              nodes: [{ id: "label-1", name: "generated:spec" }]
            }
          }
        },
        {
          projectCreate: {
            success: true,
            project: { id: "project-1" }
          }
        },
        {
          issueCreate: {
            success: true,
            issue: { id: "issue-1", identifier: "ENG-101", description: "desc" }
          }
        }
      ]
    });

    expect(secondRun.code).toBe(0);
    expect(secondRun.stdout).toContain("Resumed session sess-1");
    expect(await fs.readFile(path.join(workspace, "specs", "sessions", "sess-1.json"), "utf8")).toContain(
      "\"status\": \"completed\""
    );
  });

  test("fails before projection when the approver is not authorized", async () => {
    const workspace = await createWorkspace();

    const result = await runCli({
      cwd: workspace,
      args: ["--approve-as", "intruder"],
      prompts: [
        "Turn app ideas into Linear execution.",
        "Authorized collaborator",
        "Capture requirements, compile a spec, project it, and let Symphony execute it.",
        "Spec generation",
        "Reverse sync from Linear",
        "Spec remains canonical",
        "continue",
        true
      ]
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Approver intruder is not authorized");
  });

  test("runs from WORKFLOW.md without a legacy harness config file", async () => {
    const workspace = await createWorkflowWorkspace();

    const result = await runCli({
      cwd: workspace,
      args: ["--approve-as", "reviewer-1", "--no-watch"],
      prompts: [
        "Turn approved ideas into public-safe Linear stories.",
        "Delivery lead",
        "Collect requirements, approve them, project them into Linear, and hand them to Symphony for agentic execution.",
        "Spec-first intake\nAgentic story development",
        "Bi-directional sync",
        "Explicit approval",
        "continue",
        true
      ],
      linearFixtures: [
        {
          team: {
            id: "team-1",
            key: "ASTS",
            issueEstimationType: "fibonacci",
            states: {
              nodes: [
                { id: "state-1", name: "Todo", type: "unstarted" },
                { id: "state-2", name: "In Progress", type: "started" },
                { id: "state-3", name: "Done", type: "completed" }
              ]
            },
            labels: {
              nodes: [{ id: "label-1", name: "generated:spec" }]
            }
          }
        },
        {
          projectCreate: {
            success: true,
            project: { id: "project-1" }
          }
        },
        {
          issueCreate: {
            success: true,
            issue: { id: "issue-1", identifier: "ASTS-101", description: "desc" }
          }
        },
        {
          issueCreate: {
            success: true,
            issue: { id: "issue-2", identifier: "ASTS-102", description: "desc" }
          }
        }
      ],
      trackerEvents: [],
      env: {
        PUBLIC_LINEAR_KEY: "workflow-secret"
      }
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("ASTS-101");
    expect(result.stderr).toBe("");
  });
});
