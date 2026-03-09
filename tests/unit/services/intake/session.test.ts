import { describe, expect, test } from "vitest";
import {
  advanceSession,
  createIntakeSession,
  updateIntakeDraft
} from "../../../../src/services/intake/session.js";

describe("intake session", () => {
  test("starts in collecting_context", () => {
    const session = createIntakeSession({
      sessionId: "sess-1",
      entryPoint: "agent",
      createdBy: "eshli"
    });

    expect(session.state).toBe("collecting_context");
    expect(session.draft.mustHaveFeatures).toEqual([]);
  });

  test("advances to summarizing_understanding when the draft is complete", () => {
    let session = createIntakeSession({
      sessionId: "sess-2",
      entryPoint: "linear",
      createdBy: "eshli"
    });

    session = updateIntakeDraft(session, {
      productOutcome: "Generate a canonical spec and write Linear artifacts automatically.",
      intendedUsers: ["Authorized collaborator"],
      coreWorkflow: "Gather requirements, approve revision, project into Linear.",
      mustHaveFeatures: ["Spec approval", "Automatic writeback"],
      outOfScope: ["Silent reverse sync from Linear"],
      constraints: ["Spec remains canonical"]
    });

    const advanced = advanceSession(session);

    expect(advanced.state).toBe("summarizing_understanding");
    expect(advanced.missingFields).toEqual([]);
  });

  test("stays in collecting_context when required intake fields are still missing", () => {
    const session = updateIntakeDraft(
      createIntakeSession({
        sessionId: "sess-3",
        entryPoint: "agent",
        createdBy: "eshli"
      }),
      {
        productOutcome: "Generate a spec",
        intendedUsers: ["Collaborator"]
      }
    );

    const advanced = advanceSession(session);

    expect(advanced.state).toBe("collecting_context");
    expect(advanced.missingFields).toContain("coreWorkflow");
    expect(advanced.missingFields).toContain("mustHaveFeatures");
  });
});
