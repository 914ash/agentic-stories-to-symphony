# Spec Approval Contract

**Status:** Draft  
**Last Updated:** 2026-03-09  
**Purpose:** Define who may approve a spec revision and what approval means operationally.

## Why This Exists

Approval is the control point that turns drafted requirements into external side effects. Once a revision is approved, the system automatically writes planning artifacts into Linear.

That makes approval both a product decision and a system safety boundary.

## Approval Principles

- approval applies to one immutable revision
- approval is explicit and auditable
- any authorized collaborator may approve
- approval triggers automatic projection immediately
- approval does not make Linear the source of truth

## Actors

```ts
type ApprovalActor = {
  actorId: string;
  displayName: string;
  source: "agent" | "linear" | "system";
};
```

## Authorization Model

The approval service must validate that the actor is an authorized collaborator for the target project or workspace.

This contract intentionally does not hardcode the authorization source yet. Valid sources may include:

- Linear project membership
- workspace collaborator registry
- repository maintainer allowlist
- application-specific access control

The implementation must make the authorization source explicit before code rollout.

## Revision Lifecycle

Valid revision states:

- `draft`
- `needs_review`
- `approved`
- `projecting`
- `projected`
- `drifted`
- `superseded`

## State Transition Rules

Allowed transitions:

- `draft -> needs_review`
- `needs_review -> draft`
- `needs_review -> approved`
- `approved -> projecting`
- `projecting -> projected`
- `projected -> drifted`
- `projected -> superseded`
- `drifted -> projected`
- `drifted -> superseded`

Disallowed transitions:

- `draft -> approved`
- `approved -> draft`
- `superseded -> any active state`

## Approval Preconditions

A revision may be approved only if:

- completeness checks pass
- required sections exist in the Spec IR
- no unresolved parser or compiler errors exist
- the approving actor is authorized
- the revision has not already been superseded

## Approval Record

Every approval event must record:

- `spec_id`
- `revision`
- `approved_by`
- `approved_at`
- `authorization_source`
- `approval_reason` when provided
- `projection_triggered_at`

## Approval Effects

Approving a revision must:

1. lock the revision against further mutation
2. emit an approval event
3. enqueue projection immediately
4. transition the revision toward `projecting`
5. record a correlation ID for auditability

## Automatic Projection Rule

There is no second "publish to Linear" step.

Once approved:

- projection is automatic
- retries are automatic when safe
- failure is surfaced as operational state, not silent suppression

## Projection Failure Semantics

If projection fails:

- the revision remains approved
- failure details are attached to operational state
- retries must be idempotent
- the user must be able to see whether the revision is only partially projected

## Multi-Approver Behavior

The system should allow multiple approvals to be recorded for audit, but operational approval only needs one authorized collaborator.

Additional approvals:

- do not retrigger duplicate projection
- may be logged as secondary approval events

## Superseding Behavior

When a new revision is approved:

- prior projected revisions become historical context
- only the latest approved revision is authoritative for future projection
- prior mappings remain auditable

## Reapproval Rules

If a projected revision becomes `drifted`, there are two possible recovery paths:

1. reconcile drift without changing the spec
2. create a new revision and approve that revision

The system must not mutate an already approved revision in place.

## Audit And Evidence

Approval must be auditable through:

- revision status history
- actor record
- timestamps
- correlation IDs
- projection event linkage

## Test Requirements

This contract is not complete until tests prove:

- unauthorized actors cannot approve
- incomplete revisions cannot approve
- approved revisions become immutable
- approval triggers projection exactly once
- retries do not duplicate side effects
- new revisions supersede older approved revisions cleanly
