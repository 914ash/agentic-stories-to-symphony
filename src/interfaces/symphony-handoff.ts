import type { ProjectionPlan } from "../adapters/linear/projector.js";

type ProjectionIssue = ProjectionPlan["issues"][number];

export function toSymphonyIssue(issue: ProjectionIssue): {
  id: string;
  identifier: string;
  title: string;
  description: string;
  state: string;
  priority: number | null;
  labels: string[];
  blockedBy: Array<{ id: string; identifier: string; state: string }>;
  createdAt: string | null;
  updatedAt: string | null;
} {
  return {
    id: `${issue.provenance.specId}:${issue.provenance.specNodeId}`,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    state: issue.stateName,
    priority: null,
    labels: issue.labels,
    blockedBy: issue.blockedBy,
    createdAt: null,
    updatedAt: null
  };
}
