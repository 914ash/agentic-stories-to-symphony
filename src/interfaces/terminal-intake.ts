import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFixtureLinearClient } from "../adapters/linear/fixture-client.js";
import { createLinearHttpClient } from "../adapters/linear/http-client.js";
import { createInquirerPromptIO } from "./inquirer-prompt-io.js";
import { createScriptedPromptIO } from "./scripted-prompt-io.js";
import { runTerminalIntake, type ExecutionTracker } from "../services/intake/runner.js";
import { loadHarnessConfig } from "../services/runtime/config.js";
import { watchLinearExecution } from "../services/watch/linear-execution-tracker.js";

function parseArgs(argv: string[]): {
  sessionId?: string;
  approveAs?: string;
  watch: boolean;
} {
  const parsed = {
    watch: true
  } as {
    sessionId?: string;
    approveAs?: string;
    watch: boolean;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--session") {
      parsed.sessionId = argv[index + 1];
      index += 1;
    } else if (current === "--approve-as") {
      parsed.approveAs = argv[index + 1];
      index += 1;
    } else if (current === "--no-watch") {
      parsed.watch = false;
    }
  }

  return parsed;
}

function createPromptIO() {
  const scriptedPrompts = process.env.HARNESS_TEST_PROMPTS;
  if (scriptedPrompts) {
    return createScriptedPromptIO(JSON.parse(scriptedPrompts) as unknown[]);
  }

  return createInquirerPromptIO();
}

function createLinearClient(apiKey: string) {
  const fixtureResponses = process.env.HARNESS_TEST_LINEAR_FIXTURES;
  if (fixtureResponses) {
    return createFixtureLinearClient(JSON.parse(fixtureResponses) as unknown[]);
  }

  return createLinearHttpClient({ apiKey });
}

function createTracker(): ExecutionTracker {
  const fixtureEvents = process.env.HARNESS_TEST_TRACKER_EVENTS;
  if (fixtureEvents) {
    const events = JSON.parse(fixtureEvents) as unknown[];
    return {
      async *track() {
        for (const event of events) {
          yield event as never;
        }
      }
    };
  }

  return {
    track(input) {
      return watchLinearExecution(input);
    }
  };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const rootDir = process.cwd();
  const prompt = createPromptIO();
  const config = await loadHarnessConfig(rootDir);
  const client = createLinearClient(config.linear.apiKey);
  const tracker = createTracker();

  await runTerminalIntake({
    rootDir,
    prompt,
    client,
    config,
    tracker,
    sessionId: args.sessionId,
    approveAs: args.approveAs,
    watch: args.watch
  });
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = path.resolve(fileURLToPath(import.meta.url));

if (executedPath === modulePath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
