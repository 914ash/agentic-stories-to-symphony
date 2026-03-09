import { describe, expect, test } from "vitest";
import { chooseLaunchMode } from "../../../../src/services/intake/wizard.js";
import type { PromptIO } from "../../../../src/types/prompt.js";
import type { StoredIntakeSession } from "../../../../src/types/intake.js";

function createPromptStub(selection: "resume_latest" | "start_new"): PromptIO {
  return {
    input: async () => "",
    multiline: async () => "",
    confirm: async () => true,
    renderStatus: () => undefined,
    select: async <T extends string>() => selection as T
  };
}

function createStoredSession(): StoredIntakeSession {
  return {
    sessionId: "sess-1",
    entryPoint: "agent",
    createdBy: "eshli",
    state: "collecting_context",
    draft: {
      productOutcome: "Build the app.",
      intendedUsers: ["Authorized collaborator"],
      coreWorkflow: "",
      mustHaveFeatures: [],
      outOfScope: [],
      constraints: []
    },
    missingFields: ["coreWorkflow", "mustHaveFeatures"],
    currentStep: "workflow",
    reviewSummary: null,
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
    status: "in_progress"
  };
}

describe("chooseLaunchMode", () => {
  test("returns start_new when there is no incomplete session to resume", async () => {
    const mode = await chooseLaunchMode({
      prompt: createPromptStub("resume_latest"),
      latestIncompleteSession: null
    });

    expect(mode).toBe("start_new");
  });

  test("offers a resumable session and returns the operator selection", async () => {
    const mode = await chooseLaunchMode({
      prompt: createPromptStub("resume_latest"),
      latestIncompleteSession: createStoredSession()
    });

    expect(mode).toBe("resume_latest");
  });
});
