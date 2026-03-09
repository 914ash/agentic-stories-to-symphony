import { describe, expect, test } from "vitest";
import {
  createRecordingPromptIO,
  type PromptTranscriptEntry
} from "../../../src/interfaces/recording-prompt-io.js";

describe("createRecordingPromptIO", () => {
  test("records prompts, choices, responses, and status events in order", async () => {
    const transcript: PromptTranscriptEntry[] = [];
    const prompt = createRecordingPromptIO({
      responses: ["Outcome", "continue", true],
      transcript
    });

    await prompt.multiline("Describe the product outcome");
    await prompt.select("Review the compiled intake draft", [
      { value: "continue", label: "Continue to approval" },
      { value: "edit", label: "Edit answers" }
    ]);
    await prompt.confirm("Approve this spec revision and write it to Linear?");
    prompt.renderStatus("Projected ENG-201 (issue-1)");

    expect(transcript).toEqual([
      {
        kind: "multiline",
        message: "Describe the product outcome",
        response: "Outcome"
      },
      {
        kind: "select",
        message: "Review the compiled intake draft",
        response: "continue",
        choices: ["Continue to approval", "Edit answers"]
      },
      {
        kind: "confirm",
        message: "Approve this spec revision and write it to Linear?",
        response: true
      },
      {
        kind: "status",
        message: "Projected ENG-201 (issue-1)"
      }
    ]);
  });
});
