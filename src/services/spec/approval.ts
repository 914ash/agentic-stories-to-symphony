import { transitionRevisionStatus } from "../../domain/spec-revision.js";
import type { SpecRevision } from "../../types/spec.js";

interface ApproveSpecRevisionInput {
  revision: SpecRevision;
  approver: string;
  authorizedApprovers: string[];
}

interface ProjectionRequest {
  specId: string;
  revision: number;
}

export function approveSpecRevision(input: ApproveSpecRevisionInput): {
  revision: SpecRevision;
  projectionRequest: ProjectionRequest;
} {
  if (!input.authorizedApprovers.includes(input.approver)) {
    throw new Error(
      `Approver ${input.approver} is not authorized to approve spec ${input.revision.metadata.specId}`
    );
  }

  return {
    revision: {
      ...input.revision,
      metadata: {
        ...input.revision.metadata,
        status: transitionRevisionStatus(input.revision.metadata.status, "approved"),
        approvedBy: [...input.revision.metadata.approvedBy, input.approver]
      }
    },
    projectionRequest: {
      specId: input.revision.metadata.specId,
      revision: input.revision.metadata.revision
    }
  };
}
