import type { SpecRevision } from "../../types/spec.js";
import type { LinearCapabilities } from "./capabilities.js";

interface ProjectionIssue {
  identifier: string;
  title: string;
  teamKey: string;
  stateName: string;
  description: string;
  labels: string[];
  blockedBy: Array<{ id: string; identifier: string; state: string }>;
  provenance: {
    specId: string;
    specRevision: number;
    specNodeId: string;
  };
}

interface ProjectionProject {
  title: string;
  summary: string;
}

export interface ProjectionPlan {
  project: ProjectionProject;
  issues: ProjectionIssue[];
}

function buildIssueDescription(revision: SpecRevision, story: SpecRevision["requirements"]["stories"][number]): string {
  return [
    "## Summary",
    story.summary,
    "",
    "## Acceptance Criteria",
    `- Deliver ${story.title} in the approved workflow`,
    "",
    "## Spec Provenance",
    `- Spec ID: ${revision.metadata.specId}`,
    `- Revision: ${revision.metadata.revision}`,
    `- Node ID: ${story.id}`,
    "",
    "## Human Notes",
    "[Editable]"
  ].join("\n");
}

export function buildProjectionPlan(input: {
  revision: SpecRevision;
  capabilities: LinearCapabilities;
}): ProjectionPlan {
  if (input.revision.metadata.status !== "approved") {
    throw new Error(`Revision ${input.revision.metadata.specId}@${input.revision.metadata.revision} is not approved`);
  }
  if (!input.capabilities.projects) {
    throw new Error("Target Linear workspace does not support projects");
  }

  return {
    project: {
      title: input.revision.metadata.title,
      summary: input.revision.context.productOutcome
    },
    issues: input.revision.requirements.stories.map((story) => ({
      identifier: story.id,
      title: story.title,
      teamKey: input.capabilities.teamKey,
      stateName: input.capabilities.defaultState,
      description: buildIssueDescription(input.revision, story),
      labels: ["generated:spec"],
      blockedBy: [],
      provenance: {
        specId: input.revision.metadata.specId,
        specRevision: input.revision.metadata.revision,
        specNodeId: story.id
      }
    }))
  };
}
