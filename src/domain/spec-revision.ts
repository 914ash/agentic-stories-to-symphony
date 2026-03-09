export type SpecRevisionStatus = "draft" | "approved";

const allowedTransitions: Record<SpecRevisionStatus, SpecRevisionStatus[]> = {
  draft: ["approved"],
  approved: []
};

export function transitionRevisionStatus(
  currentStatus: SpecRevisionStatus,
  nextStatus: SpecRevisionStatus
): SpecRevisionStatus {
  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new Error(`Cannot transition spec revision from ${currentStatus} to ${nextStatus}`);
  }

  return nextStatus;
}
