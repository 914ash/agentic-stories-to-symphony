import type { PromptChoice, PromptIO } from "../types/prompt.js";

export interface PromptTranscriptEntry {
  kind: "input" | "multiline" | "select" | "confirm" | "status";
  message: string;
  response?: string | boolean;
  choices?: string[];
}

export function createRecordingPromptIO(input: {
  responses: unknown[];
  transcript: PromptTranscriptEntry[];
}): PromptIO {
  const queue = [...input.responses];

  function nextValue(): unknown {
    if (!queue.length) {
      throw new Error("No more scripted responses are available");
    }

    return queue.shift();
  }

  return {
    async input(message) {
      const response = String(nextValue() ?? "");
      input.transcript.push({
        kind: "input",
        message,
        response
      });
      return response;
    },
    async multiline(message) {
      const response = String(nextValue() ?? "");
      input.transcript.push({
        kind: "multiline",
        message,
        response
      });
      return response;
    },
    async select<T extends string>(message: string, choices: PromptChoice<T>[]) {
      const response = String(nextValue() ?? "") as T;
      input.transcript.push({
        kind: "select",
        message,
        response,
        choices: choices.map((choice) => choice.label)
      });
      return response;
    },
    async confirm(message) {
      const response = Boolean(nextValue());
      input.transcript.push({
        kind: "confirm",
        message,
        response
      });
      return response;
    },
    renderStatus(message) {
      input.transcript.push({
        kind: "status",
        message
      });
    }
  };
}
