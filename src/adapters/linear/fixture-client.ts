import type { LinearClient, LinearClientRequest } from "./client.js";

export function createFixtureLinearClient(fixtures: unknown[]): LinearClient {
  const queue = [...fixtures];

  return {
    async execute(_request: LinearClientRequest): Promise<unknown> {
      if (!queue.length) {
        throw new Error("No more HARNESS_TEST_LINEAR_FIXTURES responses are available");
      }

      return queue.shift();
    }
  };
}
