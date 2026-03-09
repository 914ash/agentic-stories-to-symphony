import { describe, expect, test } from "vitest";
import { detectLinearCapabilities } from "../../src/adapters/linear/capabilities.js";
import { compileSpecRevision } from "../../src/services/spec/compiler.js";
import { approveSpecRevision } from "../../src/services/spec/approval.js";
import { buildProjectionPlan } from "../../src/adapters/linear/projector.js";
import { toSymphonyIssue } from "../../src/interfaces/symphony-handoff.js";

describe("requirements to linear to symphony", () => {
  test("turns an approved revision into a Symphony-compatible issue shape", () => {
    const approvedRevision = approveSpecRevision({
      revision: compileSpecRevision({
        specId: "requirements-intake",
        revision: 1,
        title: "Requirements Intake Workflow",
        sessionId: "sess-9",
        entryPoint: "linear",
        createdBy: "fixture-author",
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

    const projection = buildProjectionPlan({
      revision: approvedRevision,
      capabilities: detectLinearCapabilities({
        initiatives: false,
        projects: true,
        estimates: true,
        labelScope: "workspace",
        teamKey: "ENG",
        states: ["Todo", "In Progress", "Done"]
      })
    });

    const symphonyIssue = toSymphonyIssue(projection.issues[0]);

    expect(symphonyIssue.identifier).toBe("requirements-intake-story-1");
    expect(symphonyIssue.title).toBe("Spec generation");
    expect(symphonyIssue.state).toBe("Todo");
    expect(symphonyIssue.description).toContain("## Summary");
    expect(symphonyIssue.labels).toContain("generated:spec");
    expect(symphonyIssue.blockedBy).toEqual([]);
  });
});
