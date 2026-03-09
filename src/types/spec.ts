import type { IntakeDraft, IntakeEntryPoint } from "./intake.js";

export interface StoryRequirement {
  id: string;
  title: string;
  summary: string;
}

export interface SpecRevision {
  metadata: {
    specId: string;
    revision: number;
    title: string;
    status: "draft" | "approved";
    sourceSessionId: string;
    sourceEntryPoint: IntakeEntryPoint;
    createdBy: string;
    approvedBy: string[];
  };
  context: {
    productOutcome: string;
    intendedUsers: string[];
    coreWorkflow: string;
    constraints: string[];
    outOfScope: string[];
  };
  requirements: {
    stories: StoryRequirement[];
  };
  markdown: string;
}

export interface CompileSpecRevisionInput {
  specId: string;
  revision: number;
  title: string;
  sessionId: string;
  entryPoint: IntakeEntryPoint;
  createdBy: string;
  draft: IntakeDraft;
}
