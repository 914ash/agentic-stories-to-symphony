import { describe, expect, test } from "vitest";
import { streamExecutionEvents } from "../../../../src/services/watch/execution-watch.js";
import type { PromptIO } from "../../../../src/types/prompt.js";

function createPromptRecorder() {
  const messages: string[] = [];
  const prompt: PromptIO = {
    input: async () => "",
    multiline: async () => "",
    select: async <T extends string>() => "start_new" as T,
    confirm: async () => true,
    renderStatus: (message) => {
      messages.push(message);
    }
  };

  return { prompt, messages };
}

describe("streamExecutionEvents", () => {
  test("renders projection, pickup, state changes, and completion events", async () => {
    const { prompt, messages } = createPromptRecorder();

    await streamExecutionEvents({
      prompt,
      events: [
        { type: "projection_succeeded", issueIdentifier: "ENG-101" },
        { type: "picked_up", issueIdentifier: "ENG-101" },
        { type: "state_changed", issueIdentifier: "ENG-101", state: "In Progress" },
        { type: "completed", issueIdentifier: "ENG-101", state: "Done" }
      ]
    });

    expect(messages).toEqual([
      "Projected ENG-101 into Linear.",
      "Symphony picked up ENG-101.",
      "ENG-101 moved to In Progress.",
      "ENG-101 completed in Done."
    ]);
  });
});
