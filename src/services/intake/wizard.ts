import type { StoredIntakeSession } from "../../types/intake.js";
import type { PromptIO } from "../../types/prompt.js";

export type LaunchMode = "start_new" | "resume_latest";

export async function chooseLaunchMode(input: {
  prompt: PromptIO;
  latestIncompleteSession: StoredIntakeSession | null;
}): Promise<LaunchMode> {
  if (!input.latestIncompleteSession) {
    return "start_new";
  }

  return input.prompt.select("Resume the latest incomplete intake session?", [
    {
      value: "resume_latest",
      label: `Resume ${input.latestIncompleteSession.sessionId}`,
      hint: `Continue from ${input.latestIncompleteSession.currentStep}`
    },
    {
      value: "start_new",
      label: "Start a new session"
    }
  ]);
}
