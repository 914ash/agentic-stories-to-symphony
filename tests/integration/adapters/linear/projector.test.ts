import { describe, expect, test } from "vitest";
import { detectLinearCapabilities } from "../../../../src/adapters/linear/capabilities.js";
import { compileSpecRevision } from "../../../../src/services/spec/compiler.js";
import { approveSpecRevision } from "../../../../src/services/spec/approval.js";
import { buildProjectionPlan } from "../../../../src/adapters/linear/projector.js";

describe("buildProjectionPlan", () => {
  test("builds one project and one issue per story for an approved revision", () => {
    const revision = approveSpecRevision({
      revision: compileSpecRevision({
        specId: "requirements-intake",
        revision: 1,
        title: "Requirements Intake Workflow",
        sessionId: "sess-8",
        entryPoint: "agent",
        createdBy: "eshli",
        draft: {
          productOutcome: "Turn app ideas into specs and Linear work.",
          intendedUsers: ["Authorized collaborator"],
          coreWorkflow: "Gather requirements, approve them, and project them into Linear.",
          mustHaveFeatures: ["Spec generation", "Automatic writeback"],
          outOfScope: ["Silent reverse sync"],
          constraints: ["Spec remains canonical"]
        }
      }),
      approver: "reviewer-1",
      authorizedApprovers: ["reviewer-1"]
    }).revision;

    const plan = buildProjectionPlan({
      revision,
      capabilities: detectLinearCapabilities({
        initiatives: false,
        projects: true,
        estimates: true,
        labelScope: "workspace",
        teamKey: "ENG",
        states: ["Todo", "In Progress", "Done"]
      })
    });

    expect(plan.project.title).toBe("Requirements Intake Workflow");
    expect(plan.issues).toHaveLength(2);
    expect(plan.issues[0].teamKey).toBe("ENG");
    expect(plan.issues[0].stateName).toBe("Todo");
    expect(plan.issues[0].description).toContain("## Acceptance Criteria");
    expect(plan.issues[0].description).toContain("Spec ID: requirements-intake");
    expect(plan.issues[0].provenance.specRevision).toBe(1);
  });
});
