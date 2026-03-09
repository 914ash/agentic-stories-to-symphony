import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { loadHarnessConfig } from "../../../../src/services/runtime/config.js";

const tempRoots: string[] = [];

async function createRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "harness-config-"));
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("loadHarnessConfig", () => {
  test("loads workflow config before falling back to harness.config.json", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "WORKFLOW.md"),
      `---
approverAllowlist:
  - reviewer-1
linear:
  teamKey: DEMO
  apiKeyEnvVar: PUBLIC_LINEAR_KEY
watch:
  pollIntervalSeconds: 45
---
You are the story execution workflow.`,
      "utf8"
    );

    const config = await loadHarnessConfig(root, {
      PUBLIC_LINEAR_KEY: "workflow-secret",
      LINEAR_API_KEY: "legacy-secret"
    });

    expect(config.approverAllowlist).toEqual(["reviewer-1"]);
    expect(config.linear.teamKey).toBe("DEMO");
    expect(config.linear.apiKey).toBe("workflow-secret");
    expect(config.watch.pollIntervalSeconds).toBe(45);
  });

  test("falls back to harness.config.json when workflow config is absent", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "harness.config.json"),
      JSON.stringify({
        approverAllowlist: ["reviewer-1"],
        linear: {
          teamKey: "ENG"
        },
        watch: {
          pollIntervalSeconds: 30
        }
      }),
      "utf8"
    );

    const config = await loadHarnessConfig(root, {
      LINEAR_API_KEY: "linear-secret"
    });

    expect(config.approverAllowlist).toEqual(["reviewer-1"]);
    expect(config.linear.teamKey).toBe("ENG");
    expect(config.linear.apiKey).toBe("linear-secret");
    expect(config.watch.pollIntervalSeconds).toBe(30);
  });

  test("prefers workflow config when both config files exist", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "WORKFLOW.md"),
      `---
approverAllowlist:
  - workflow-reviewer
linear:
  teamKey: FLOW
---
Workflow body`,
      "utf8"
    );
    await fs.writeFile(
      path.join(root, "harness.config.json"),
      JSON.stringify({
        approverAllowlist: ["legacy-reviewer"],
        linear: {
          teamKey: "LEGACY"
        }
      }),
      "utf8"
    );

    const config = await loadHarnessConfig(root, {
      LINEAR_API_KEY: "linear-secret"
    });

    expect(config.approverAllowlist).toEqual(["workflow-reviewer"]);
    expect(config.linear.teamKey).toBe("FLOW");
  });

  test("falls back to legacy config when workflow front matter does not define intake runtime fields", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "WORKFLOW.md"),
      `---
tracker:
  kind: linear
  project_slug: demo-project
---
You are the upstream Symphony workflow.`,
      "utf8"
    );
    await fs.writeFile(
      path.join(root, "harness.config.json"),
      JSON.stringify({
        approverAllowlist: ["legacy-reviewer"],
        linear: {
          teamKey: "LEGACY"
        },
        watch: {
          pollIntervalSeconds: 22
        }
      }),
      "utf8"
    );

    const config = await loadHarnessConfig(root, {
      LINEAR_API_KEY: "linear-secret"
    });

    expect(config.approverAllowlist).toEqual(["legacy-reviewer"]);
    expect(config.linear.teamKey).toBe("LEGACY");
    expect(config.watch.pollIntervalSeconds).toBe(22);
  });

  test("loads repo config and environment-backed Linear credentials", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "harness.config.json"),
      JSON.stringify({
        approverAllowlist: ["reviewer-1"],
        linear: {
          teamKey: "ENG"
        },
        watch: {
          pollIntervalSeconds: 30
        }
      }),
      "utf8"
    );

    const config = await loadHarnessConfig(root, {
      LINEAR_API_KEY: "linear-secret"
    });

    expect(config.approverAllowlist).toEqual(["reviewer-1"]);
    expect(config.linear.teamKey).toBe("ENG");
    expect(config.linear.apiKey).toBe("linear-secret");
    expect(config.watch.pollIntervalSeconds).toBe(30);
  });

  test("uses the default poll interval when the repo config omits watch settings", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "harness.config.json"),
      JSON.stringify({
        approverAllowlist: ["reviewer-1"],
        linear: {
          teamKey: "ENG"
        }
      }),
      "utf8"
    );

    const config = await loadHarnessConfig(root, {
      LINEAR_API_KEY: "linear-secret"
    });

    expect(config.watch.pollIntervalSeconds).toBe(15);
  });

  test("fails loudly when the repo config is missing", async () => {
    const root = await createRoot();

    await expect(loadHarnessConfig(root, { LINEAR_API_KEY: "linear-secret" })).rejects.toThrow(
      `Missing runtime config at ${path.join(root, "WORKFLOW.md")} or ${path.join(root, "harness.config.json")}`
    );
  });

  test("fails loudly when the Linear API key is missing", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "harness.config.json"),
      JSON.stringify({
        approverAllowlist: ["reviewer-1"],
        linear: {
          teamKey: "ENG"
        }
      }),
      "utf8"
    );

    await expect(loadHarnessConfig(root, {})).rejects.toThrow(
      "LINEAR_API_KEY must be set before running terminal intake"
    );
  });

  test("fails loudly when workflow config references a missing api key env var", async () => {
    const root = await createRoot();
    await fs.writeFile(
      path.join(root, "WORKFLOW.md"),
      `---
approverAllowlist:
  - reviewer-1
linear:
  teamKey: DEMO
  apiKeyEnvVar: PUBLIC_LINEAR_KEY
---
Workflow body`,
      "utf8"
    );

    await expect(loadHarnessConfig(root, { LINEAR_API_KEY: "legacy-secret" })).rejects.toThrow(
      "PUBLIC_LINEAR_KEY must be set before running terminal intake"
    );
  });
});
