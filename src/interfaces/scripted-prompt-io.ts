import type { PromptIO } from "../types/prompt.js";

export function createScriptedPromptIO(responses: unknown[]): PromptIO {
  const queue = [...responses];

  function nextValue(): unknown {
    if (!queue.length) {
      throw new Error("No more HARNESS_TEST_PROMPTS values are available");
    }

    return queue.shift();
  }

  return {
    async input() {
      return String(nextValue() ?? "");
    },
    async multiline() {
      return String(nextValue() ?? "");
    },
    async select<T extends string>() {
      return String(nextValue() ?? "") as T;
    },
    async confirm() {
      return Boolean(nextValue());
    },
    renderStatus(message) {
      console.log(message);
    }
  };
}
