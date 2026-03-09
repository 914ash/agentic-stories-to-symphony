export type IntakeEntryPoint = "agent" | "linear";

export type IntakeSessionState = "collecting_context" | "summarizing_understanding";

export interface IntakeDraft {
  productOutcome: string;
  intendedUsers: string[];
  coreWorkflow: string;
  mustHaveFeatures: string[];
  outOfScope: string[];
  constraints: string[];
}

export interface IntakeSession {
  sessionId: string;
  entryPoint: IntakeEntryPoint;
  createdBy: string;
  state: IntakeSessionState;
  draft: IntakeDraft;
  missingFields: string[];
}

export type IntakeWizardStep =
  | "product_outcome"
  | "intended_users"
  | "workflow"
  | "must_have_features"
  | "out_of_scope"
  | "constraints"
  | "review"
  | "approval"
  | "projecting"
  | "watching";

export interface StoredIntakeSession extends IntakeSession {
  currentStep: IntakeWizardStep;
  reviewSummary: string | null;
  createdAt: string;
  updatedAt: string;
  status: "in_progress" | "completed";
}

export interface IntakeCompletenessResult {
  isReadyForSummary: boolean;
  missingFields: string[];
}

export interface IntakeSessionSeed {
  sessionId: string;
  entryPoint: IntakeEntryPoint;
  createdBy: string;
}

export interface IntakeDraftUpdate {
  productOutcome?: string;
  intendedUsers?: string[];
  coreWorkflow?: string;
  mustHaveFeatures?: string[];
  outOfScope?: string[];
  constraints?: string[];
}
