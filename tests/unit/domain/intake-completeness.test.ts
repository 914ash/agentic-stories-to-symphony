import { describe, expect, test } from "vitest";
import { evaluateIntakeCompleteness } from "../../../src/domain/intake-completeness.js";
import type { IntakeDraft } from "../../../src/types/intake.js";

describe("evaluateIntakeCompleteness", () => {
  test("reports missing fields for an incomplete intake draft", () => {
    const draft: IntakeDraft = {
      productOutcome: "",
      intendedUsers: [],
      coreWorkflow: "",
      mustHaveFeatures: [],
      outOfScope: [],
      constraints: []
    };

    const result = evaluateIntakeCompleteness(draft);

    expect(result.isReadyForSummary).toBe(false);
    expect(result.missingFields).toEqual([
      "productOutcome",
      "intendedUsers",
      "coreWorkflow",
      "mustHaveFeatures",
      "outOfScope",
      "constraints"
    ]);
  });

  test("marks the draft ready when the minimum intake fields are present", () => {
    const draft: IntakeDraft = {
      productOutcome: "Turn an app request into a spec and Linear work graph.",
      intendedUsers: ["Product owner"],
      coreWorkflow: "Describe the app, review the generated spec, and approve projection.",
      mustHaveFeatures: ["Spec generation", "Linear writeback"],
      outOfScope: ["Bidirectional sync"],
      constraints: ["Spec is source of truth"]
    };

    const result = evaluateIntakeCompleteness(draft);

    expect(result.isReadyForSummary).toBe(true);
    expect(result.missingFields).toEqual([]);
  });
});
