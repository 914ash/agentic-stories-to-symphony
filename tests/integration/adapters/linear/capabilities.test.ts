import { describe, expect, test } from "vitest";
import { detectLinearCapabilities } from "../../../../src/adapters/linear/capabilities.js";

describe("detectLinearCapabilities", () => {
  test("normalizes the target Linear workspace capabilities needed for projection", () => {
    const capabilities = detectLinearCapabilities({
      initiatives: true,
      projects: true,
      estimates: true,
      labelScope: "workspace",
      teamKey: "ENG",
      states: ["Todo", "In Progress", "Done"]
    });

    expect(capabilities.initiatives).toBe(true);
    expect(capabilities.projects).toBe(true);
    expect(capabilities.estimates).toBe(true);
    expect(capabilities.defaultState).toBe("Todo");
    expect(capabilities.teamKey).toBe("ENG");
  });
});
