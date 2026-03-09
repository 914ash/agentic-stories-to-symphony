import { describe, expect, test, vi } from "vitest";
import { discoverLinearCapabilities } from "../../../../src/adapters/linear/capabilities.js";
import type { LinearClient } from "../../../../src/adapters/linear/client.js";

describe("discoverLinearCapabilities", () => {
  test("loads team ids, labels, estimate support, and default state from Linear", async () => {
    const client: LinearClient = {
      execute: vi.fn(async () => ({
        team: {
          id: "team-1",
          key: "ENG",
          issueEstimationType: "fibonacci",
          states: {
            nodes: [
              { id: "state-1", name: "Backlog", type: "backlog" },
              { id: "state-2", name: "Todo", type: "unstarted" },
              { id: "state-3", name: "Done", type: "completed" }
            ]
          },
          labels: {
            nodes: [{ id: "label-1", name: "generated:spec" }]
          }
        }
      }))
    };

    const capabilities = await discoverLinearCapabilities({
      client,
      teamKey: "ENG"
    });

    expect(capabilities.teamId).toBe("team-1");
    expect(capabilities.teamKey).toBe("ENG");
    expect(capabilities.estimates).toBe(true);
    expect(capabilities.defaultState).toBe("Todo");
    expect(capabilities.defaultStateId).toBe("state-2");
    expect(capabilities.labels).toEqual([{ id: "label-1", name: "generated:spec" }]);
    expect(capabilities.projects).toBe(true);
  });
});
