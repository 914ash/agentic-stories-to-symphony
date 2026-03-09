import type { PromptIO } from "../../types/prompt.js";

export type ExecutionEvent =
  | { type: "projection_succeeded"; issueIdentifier: string }
  | { type: "picked_up"; issueIdentifier: string }
  | { type: "state_changed"; issueIdentifier: string; state: string }
  | { type: "completed"; issueIdentifier: string; state: string }
  | { type: "timeout"; issueIdentifier: string };

function toStatusMessage(event: ExecutionEvent): string {
  switch (event.type) {
    case "projection_succeeded":
      return `Projected ${event.issueIdentifier} into Linear.`;
    case "picked_up":
      return `Symphony picked up ${event.issueIdentifier}.`;
    case "state_changed":
      return `${event.issueIdentifier} moved to ${event.state}.`;
    case "completed":
      return `${event.issueIdentifier} completed in ${event.state}.`;
    case "timeout":
      return `Stopped watching ${event.issueIdentifier} before completion.`;
  }
}

export async function streamExecutionEvents(input: {
  prompt: PromptIO;
  events: Iterable<ExecutionEvent> | AsyncIterable<ExecutionEvent>;
}): Promise<void> {
  for await (const event of input.events) {
    input.prompt.renderStatus(toStatusMessage(event));
  }
}
