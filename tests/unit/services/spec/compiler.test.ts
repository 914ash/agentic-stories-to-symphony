import { describe, expect, test } from "vitest";
import { compileSpecRevision } from "../../../../src/services/spec/compiler.js";

describe("compileSpecRevision", () => {
  test("builds a draft spec revision from an intake session", () => {
    const revision = compileSpecRevision({
      specId: "requirements-intake",
      revision: 1,
      title: "Requirements Intake Workflow",
      sessionId: "sess-4",
      entryPoint: "agent",
      createdBy: "eshli",
      draft: {
        productOutcome: "Turn app ideas into specs and Linear work.",
        intendedUsers: ["Product owner", "Authorized collaborator"],
        coreWorkflow: "Gather requirements, approve the revision, and project artifacts into Linear.",
        mustHaveFeatures: ["Spec generation", "Automatic writeback"],
        outOfScope: ["Reverse sync from Linear"],
        constraints: ["Spec is source of truth"]
      }
    });

    expect(revision.metadata.specId).toBe("requirements-intake");
    expect(revision.metadata.revision).toBe(1);
    expect(revision.metadata.status).toBe("draft");
    expect(revision.requirements.stories).toHaveLength(2);
    expect(revision.markdown).toContain("# Requirements Intake Workflow");
    expect(revision.markdown).toContain("## Must-Have Features");
    expect(revision.markdown).toContain("Spec generation");
  });
});
