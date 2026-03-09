import { describe, expect, test } from "vitest";
import { approveSpecRevision } from "../../../../src/services/spec/approval.js";
import { compileSpecRevision } from "../../../../src/services/spec/compiler.js";

describe("approveSpecRevision", () => {
  test("approves a revision for an authorized collaborator and emits a projection request", () => {
    const revision = compileSpecRevision({
      specId: "requirements-intake",
      revision: 1,
      title: "Requirements Intake Workflow",
      sessionId: "sess-6",
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
    });

    const result = approveSpecRevision({
      revision,
      approver: "reviewer-1",
      authorizedApprovers: ["reviewer-1", "reviewer-2"]
    });

    expect(result.revision.metadata.status).toBe("approved");
    expect(result.revision.metadata.approvedBy).toEqual(["reviewer-1"]);
    expect(result.projectionRequest.specId).toBe("requirements-intake");
    expect(result.projectionRequest.revision).toBe(1);
  });

  test("rejects approval from an unauthorized collaborator", () => {
    const revision = compileSpecRevision({
      specId: "requirements-intake",
      revision: 2,
      title: "Requirements Intake Workflow",
      sessionId: "sess-7",
      entryPoint: "linear",
      createdBy: "eshli",
      draft: {
        productOutcome: "Turn app ideas into specs and Linear work.",
        intendedUsers: ["Authorized collaborator"],
        coreWorkflow: "Gather requirements, approve them, and project them into Linear.",
        mustHaveFeatures: ["Spec generation"],
        outOfScope: ["Silent reverse sync"],
        constraints: ["Spec remains canonical"]
      }
    });

    expect(() =>
      approveSpecRevision({
        revision,
        approver: "outsider",
        authorizedApprovers: ["reviewer-1", "reviewer-2"]
      })
    ).toThrow("Approver outsider is not authorized to approve spec requirements-intake");
  });
});
