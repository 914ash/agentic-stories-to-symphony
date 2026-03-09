import type { CompileSpecRevisionInput, SpecRevision, StoryRequirement } from "../../types/spec.js";

function toStoryId(specId: string, index: number): string {
  return `${specId}-story-${index + 1}`;
}

function compileStories(input: CompileSpecRevisionInput): StoryRequirement[] {
  return input.draft.mustHaveFeatures.map((feature, index) => ({
    id: toStoryId(input.specId, index),
    title: feature,
    summary: `${feature} supports the workflow: ${input.draft.coreWorkflow}`
  }));
}

function buildMarkdown(input: CompileSpecRevisionInput, stories: StoryRequirement[]): string {
  const lines = [
    `# ${input.title}`,
    "",
    "## Product Outcome",
    input.draft.productOutcome,
    "",
    "## Intended Users",
    ...input.draft.intendedUsers.map((user) => `- ${user}`),
    "",
    "## Core Workflow",
    input.draft.coreWorkflow,
    "",
    "## Must-Have Features",
    ...stories.map((story) => `- ${story.title}`),
    "",
    "## Out Of Scope",
    ...input.draft.outOfScope.map((item) => `- ${item}`),
    "",
    "## Constraints",
    ...input.draft.constraints.map((item) => `- ${item}`)
  ];

  return lines.join("\n");
}

export function compileSpecRevision(input: CompileSpecRevisionInput): SpecRevision {
  const stories = compileStories(input);

  return {
    metadata: {
      specId: input.specId,
      revision: input.revision,
      title: input.title,
      status: "draft",
      sourceSessionId: input.sessionId,
      sourceEntryPoint: input.entryPoint,
      createdBy: input.createdBy,
      approvedBy: []
    },
    context: {
      productOutcome: input.draft.productOutcome,
      intendedUsers: input.draft.intendedUsers,
      coreWorkflow: input.draft.coreWorkflow,
      constraints: input.draft.constraints,
      outOfScope: input.draft.outOfScope
    },
    requirements: {
      stories
    },
    markdown: buildMarkdown(input, stories)
  };
}
