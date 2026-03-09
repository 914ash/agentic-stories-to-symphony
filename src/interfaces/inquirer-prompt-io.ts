import { confirm, input, select } from "@inquirer/prompts";
import type { PromptChoice, PromptIO } from "../types/prompt.js";

export function createInquirerPromptIO(): PromptIO {
  return {
    input(message, initialValue) {
      return input({
        message,
        default: initialValue
      });
    },
    multiline(message, initialValue) {
      return input({
        message: `${message} (separate items with new lines)`,
        default: initialValue
      });
    },
    async select<T extends string>(message: string, choices: PromptChoice<T>[]): Promise<T> {
      return (await select({
        message,
        choices: choices.map((choice) => ({
          value: choice.value,
          name: choice.label,
          description: choice.hint
        }))
      })) as T;
    },
    confirm(message, initialValue) {
      return confirm({
        message,
        default: initialValue
      });
    },
    renderStatus(message) {
      console.log(message);
    }
  };
}
