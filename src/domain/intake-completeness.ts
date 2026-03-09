import type { IntakeCompletenessResult, IntakeDraft } from "../types/intake.js";

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function hasEntries(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

export function evaluateIntakeCompleteness(draft: IntakeDraft): IntakeCompletenessResult {
  const missingFields: string[] = [];

  if (!hasText(draft.productOutcome)) {
    missingFields.push("productOutcome");
  }
  if (!hasEntries(draft.intendedUsers)) {
    missingFields.push("intendedUsers");
  }
  if (!hasText(draft.coreWorkflow)) {
    missingFields.push("coreWorkflow");
  }
  if (!hasEntries(draft.mustHaveFeatures)) {
    missingFields.push("mustHaveFeatures");
  }
  if (!hasEntries(draft.outOfScope)) {
    missingFields.push("outOfScope");
  }
  if (!hasEntries(draft.constraints)) {
    missingFields.push("constraints");
  }

  return {
    isReadyForSummary: missingFields.length === 0,
    missingFields
  };
}
