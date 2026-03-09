import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { approveSpecRevision } from "../../../../src/services/spec/approval.js";
import { compileSpecRevision } from "../../../../src/services/spec/compiler.js";
import { buildProjectionPlan } from "../../../../src/adapters/linear/projector.js";
import { executeProjectionPlan } from "../../../../src/services/projection/executor.js";
import type { LinearClient } from "../../../../src/adapters/linear/client.js";
import type { LinearCapabilities } from "../../../../src/adapters/linear/capabilities.js";

const tempRoots: string[] = [];

async function createRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "harness-projection-"));
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

function createApprovedRevision() {
  return approveSpecRevision({
    revision: compileSpecRevision({
      specId: "requirements-intake",
      revision: 1,
      title: "Requirements Intake Workflow",
      sessionId: "sess-10",
      entryPoint: "agent",
      createdBy: "eshli",
      draft: {
        productOutcome: "Turn app ideas into specs and Linear work.",
        intendedUsers: ["Authorized collaborator"],
        coreWorkflow: "Gather requirements, approve them, and project them into Linear.",
        mustHaveFeatures: ["Spec generation"],
        outOfScope: ["Silent reverse sync"],
        constraints: ["Spec remains canonical"]
      }
    }),
    approver: "reviewer-1",
    authorizedApprovers: ["reviewer-1"]
  }).revision;
}

function createCapabilities(): LinearCapabilities {
  return {
    initiatives: false,
    projects: true,
    estimates: true,
    labelScope: "team",
    teamKey: "ENG",
    teamId: "team-1",
    states: ["Todo", "In Progress", "Done"],
    stateIdsByName: {
      Todo: "state-1",
      "In Progress": "state-2",
      Done: "state-3"
    },
    labels: [{ id: "label-generated", name: "generated:spec" }],
    defaultState: "Todo",
    defaultStateId: "state-1"
  };
}

describe("executeProjectionPlan", () => {
  test("creates Linear artifacts and persists a mapping for reruns", async () => {
    const root = await createRoot();
    const revision = createApprovedRevision();
    const plan = buildProjectionPlan({
      revision,
      capabilities: createCapabilities()
    });
    const execute = vi
      .fn<LinearClient["execute"]>()
      .mockResolvedValueOnce({
        projectCreate: {
          success: true,
          project: { id: "project-1" }
        }
      })
      .mockResolvedValueOnce({
        issueCreate: {
          success: true,
          issue: {
            id: "issue-1",
            identifier: "ENG-101",
            description: plan.issues[0].description
          }
        }
      });

    const result = await executeProjectionPlan({
      rootDir: root,
      client: { execute },
      revision,
      plan,
      capabilities: createCapabilities()
    });

    expect(result.project.id).toBe("project-1");
    expect(result.issues[0].identifier).toBe("ENG-101");
    expect(result.mappingPath).toBe(path.join(root, "specs", revision.metadata.specId, "projection.json"));
    expect(await fs.readFile(result.mappingPath, "utf8")).toContain("\"issue-1\"");
  });

  test("updates mapped issues on rerun and preserves human notes", async () => {
    const root = await createRoot();
    const revision = createApprovedRevision();
    const capabilities = createCapabilities();
    const plan = buildProjectionPlan({
      revision,
      capabilities
    });
    const execute = vi
      .fn<LinearClient["execute"]>()
      .mockResolvedValueOnce({
        projectUpdate: {
          success: true,
          project: { id: "project-1" }
        }
      })
      .mockResolvedValueOnce({
        issue: {
          id: "issue-1",
          identifier: "ENG-101",
          description: `${plan.issues[0].description}\nOperator note retained`
        }
      })
      .mockResolvedValueOnce({
        issueUpdate: {
          success: true,
          issue: {
            id: "issue-1",
            identifier: "ENG-101",
            description: `${plan.issues[0].description}\nOperator note retained`
          }
        }
      });

    await fs.mkdir(path.join(root, "specs", revision.metadata.specId), { recursive: true });
    await fs.writeFile(
      path.join(root, "specs", revision.metadata.specId, "projection.json"),
      JSON.stringify({
        specId: revision.metadata.specId,
        revision: revision.metadata.revision,
        project: {
          specNodeId: "project",
          linearId: "project-1"
        },
        issues: {
          [plan.issues[0].provenance.specNodeId]: {
            linearId: "issue-1",
            identifier: "ENG-101"
          }
        }
      }),
      "utf8"
    );

    const result = await executeProjectionPlan({
      rootDir: root,
      client: { execute },
      revision,
      plan,
      capabilities
    });

    expect(result.issues[0].identifier).toBe("ENG-101");
    expect(execute).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(execute.mock.calls[2][0])).toContain("Operator note retained");
  });
});
