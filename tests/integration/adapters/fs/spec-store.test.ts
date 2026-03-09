import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { saveSpecRevision } from "../../../../src/adapters/fs/spec-store.js";
import { compileSpecRevision } from "../../../../src/services/spec/compiler.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (tempRoot) => {
      await fs.rm(tempRoot, { recursive: true, force: true });
    })
  );
});

describe("saveSpecRevision", () => {
  test("persists markdown and json into a deterministic spec directory", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "harness-engineering-"));
    tempRoots.push(rootDir);

    const revision = compileSpecRevision({
      specId: "requirements-intake",
      revision: 1,
      title: "Requirements Intake Workflow",
      sessionId: "sess-5",
      entryPoint: "linear",
      createdBy: "eshli",
      draft: {
        productOutcome: "Turn app ideas into specs and Linear work.",
        intendedUsers: ["Authorized collaborator"],
        coreWorkflow: "Collect requirements and publish them into Linear.",
        mustHaveFeatures: ["Spec generation"],
        outOfScope: ["Bidirectional sync"],
        constraints: ["Spec remains canonical"]
      }
    });

    const saved = await saveSpecRevision(rootDir, revision);

    expect(saved.markdownPath).toBe(path.join(rootDir, "specs", "requirements-intake", "revisions", "1.md"));
    expect(saved.jsonPath).toBe(path.join(rootDir, "specs", "requirements-intake", "revisions", "1.json"));

    const markdown = await fs.readFile(saved.markdownPath, "utf8");
    const json = JSON.parse(await fs.readFile(saved.jsonPath, "utf8")) as { metadata: { specId: string } };

    expect(markdown).toContain("# Requirements Intake Workflow");
    expect(json.metadata.specId).toBe("requirements-intake");
  });
});
