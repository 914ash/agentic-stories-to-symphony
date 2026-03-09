import { evaluateIntakeCompleteness } from "../../domain/intake-completeness.js";
import type {
  IntakeDraft,
  IntakeDraftUpdate,
  IntakeSession,
  IntakeSessionSeed
} from "../../types/intake.js";

function createEmptyDraft(): IntakeDraft {
  return {
    productOutcome: "",
    intendedUsers: [],
    coreWorkflow: "",
    mustHaveFeatures: [],
    outOfScope: [],
    constraints: []
  };
}

export function createIntakeSession(seed: IntakeSessionSeed): IntakeSession {
  return {
    sessionId: seed.sessionId,
    entryPoint: seed.entryPoint,
    createdBy: seed.createdBy,
    state: "collecting_context",
    draft: createEmptyDraft(),
    missingFields: []
  };
}

export function updateIntakeDraft(session: IntakeSession, update: IntakeDraftUpdate): IntakeSession {
  return {
    ...session,
    draft: {
      ...session.draft,
      ...update
    }
  };
}

export function advanceSession(session: IntakeSession): IntakeSession {
  const completeness = evaluateIntakeCompleteness(session.draft);
  return {
    ...session,
    state: completeness.isReadyForSummary ? "summarizing_understanding" : "collecting_context",
    missingFields: completeness.missingFields
  };
}
