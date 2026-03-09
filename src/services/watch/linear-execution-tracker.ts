import type { LinearClient } from "../../adapters/linear/client.js";
import { LINEAR_ISSUE_STATUS_QUERY } from "../../adapters/linear/queries.js";
import type { ExecutionEvent } from "./execution-watch.js";

interface TrackedIssue {
  id: string;
  identifier: string;
  initialState: string;
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

export async function* watchLinearExecution(input: {
  client: LinearClient;
  issues: TrackedIssue[];
  pollIntervalSeconds: number;
  maxPolls?: number;
}): AsyncGenerator<ExecutionEvent> {
  const issueState = new Map(
    input.issues.map((issue) => [
      issue.id,
      {
        identifier: issue.identifier,
        lastState: issue.initialState,
        pickedUp: false,
        completed: false
      }
    ])
  );

  for (const issue of input.issues) {
    yield {
      type: "projection_succeeded",
      issueIdentifier: issue.identifier
    };
  }

  const maxPolls = input.maxPolls ?? 20;
  for (let poll = 0; poll < maxPolls; poll += 1) {
    let allCompleted = true;

    for (const issue of input.issues) {
      const current = issueState.get(issue.id);
      if (!current || current.completed) {
        continue;
      }

      allCompleted = false;

      const response = (await input.client.execute({
        query: LINEAR_ISSUE_STATUS_QUERY,
        variables: {
          id: issue.id
        }
      })) as {
        issue: {
          state: {
            name: string;
            type: string;
          } | null;
        } | null;
      };

      const currentState = response.issue?.state?.name;
      const currentType = response.issue?.state?.type;
      if (!currentState) {
        continue;
      }

      if (!current.pickedUp && currentState !== issue.initialState) {
        current.pickedUp = true;
        yield {
          type: "picked_up",
          issueIdentifier: current.identifier
        };
      }

      if (current.lastState !== currentState) {
        current.lastState = currentState;
        yield {
          type: "state_changed",
          issueIdentifier: current.identifier,
          state: currentState
        };
      }

      if (currentType === "completed" || currentState === "Done") {
        current.completed = true;
        yield {
          type: "completed",
          issueIdentifier: current.identifier,
          state: currentState
        };
      }
    }

    if (allCompleted) {
      return;
    }

    if (poll < maxPolls - 1) {
      await sleep(input.pollIntervalSeconds * 1000);
    }
  }

  for (const issue of input.issues) {
    const current = issueState.get(issue.id);
    if (current && !current.completed) {
      yield {
        type: "timeout",
        issueIdentifier: current.identifier
      };
    }
  }
}
