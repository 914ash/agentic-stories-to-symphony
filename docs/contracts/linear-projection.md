# Linear Projection Contract

**Status:** Draft  
**Last Updated:** 2026-03-09  
**Purpose:** Define how an approved spec revision projects into Linear.

## Why This Exists

Linear is a projection surface, not the source of truth. This contract defines:

- what gets created
- how spec nodes map to Linear objects
- which fields are system-owned
- how idempotent updates work
- how drift is detected

## Projection Direction

The only automatic projection direction is:

`approved spec revision -> Linear`

There is no automatic reverse sync from Linear into the spec.

## Default Mapping

The default mapping is:

- spec program scope -> Initiative when warranted
- feature area or epic -> Project
- story -> Issue
- implementation split -> sub-issue only when needed

## Capability Detection

Projection must begin by detecting available Linear capabilities in the target workspace:

- initiatives enabled or disabled
- projects enabled or disabled
- issue estimate support for the target team
- label scope behavior for the workspace and team
- available teams and workflow states

If a required capability is unavailable, the projector must either:

1. choose a documented fallback mapping, or
2. fail with an explicit actionable error

## Projection Preconditions

Projection may begin only when:

- the spec revision is `approved`
- the revision is immutable
- collaborator authorization has already been validated
- target Linear team and workspace settings are known
- required mapping storage is available

## Object Creation Rules

## Initiative

Create an Initiative only when the spec spans:

- multiple Projects
- multiple teams
- or an explicitly phased multi-project rollout

Initiative fields:

- title
- summary
- canonical spec link
- provenance block

## Project

Create one Project per feature area by default.

Project fields:

- title
- summary
- overview text
- canonical spec link
- optional owner hint
- optional target date
- provenance block

## Issue

Create one Issue per story by default.

Issue fields:

- team
- title
- description
- state
- estimate when supported
- labels
- issue relations
- optional parent issue reference
- provenance block

## Spec-Owned Versus Human-Editable Fields

## Spec-Owned Fields

The projector owns:

- generated title pattern
- generated description block
- acceptance criteria block
- estimate
- system-managed labels
- target workflow state
- generated issue and project dependency links
- provenance metadata block

Changes to these fields from Linear are drift unless they are made by the projector itself.

## Human-Editable Fields

Humans may edit:

- implementation notes section
- operator comments
- team-local execution notes
- checklists or context explicitly marked as editable

Projection must not overwrite the human-editable zone.

## Description Layout

Generated descriptions should follow a stable format so drift detection stays deterministic:

```md
## Summary
...

## Acceptance Criteria
- ...

## Dependencies
- ...

## Spec Provenance
- Spec ID: ...
- Revision: ...
- Node ID: ...
- Projection Hash: ...

## Human Notes
[Editable]
```

Only the `Human Notes` section is human-editable by default.

## Provenance Metadata

Every generated Linear object must carry enough metadata to support idempotency and drift detection:

- `spec_id`
- `spec_revision`
- `spec_node_id`
- `projection_hash`
- `projection_timestamp`
- `generated_by`

This metadata may live in:

- a dedicated metadata block in the description
- labels when appropriate
- an internal mapping store

The internal mapping store is required even if some metadata is visible in object descriptions.

## Idempotency Rules

Projection must be idempotent.

That means:

1. rerunning projection for the same revision does not create duplicates
2. the same spec node maps to the same Linear object unless the object was intentionally replaced
3. unchanged fields do not produce unnecessary churn
4. superseded revisions update existing objects where possible

## Update Semantics

When projecting a newer approved revision:

- update existing mapped objects when the logical node still exists
- create new objects for new nodes
- mark removed nodes as superseded or archived according to workspace policy
- never silently delete active work without an explicit rule

## Team And Workflow State Rules

Issue projection must respect:

- target team must exist
- target state must belong to that team
- state selection must be deterministic

Recommended default:

- generate new executable stories into `Todo` unless the spec or workspace policy says otherwise

If the state is missing, fail loudly.

## Estimate Rules

Estimates are valid only when enabled for the target team.

Rules:

- if estimates are supported, apply the value from the spec
- if the spec provides an estimate but the team does not support estimates, record a projection warning
- never invent an estimate scale at projection time

## Label Rules

Labels may be workspace-scoped or team-scoped.

Rules:

- resolve exact label identity before writeback
- create missing system-managed labels only if workspace policy allows it
- separate system-managed provenance labels from user-facing product labels

## Dependency Rules

Use issue relations for story-level dependency links.

Use project dependencies only when:

- one Project is blocked by another Project, and
- that relationship exists in the spec planning model

Do not model every issue dependency as a project dependency.

## Drift Detection Contract

Drift exists when:

- spec-owned fields differ from the last projected revision
- mapped objects are deleted or replaced
- relation sets no longer match the approved revision

Drift does not exist when:

- only human-editable fields changed
- Linear comments changed
- Symphony added execution comments or completion evidence

## Reconciliation Actions

Allowed actions:

1. overwrite Linear from approved spec
2. create spec change request from observed Linear edits
3. defer reconciliation

There is no silent automatic promotion of Linear edits into the spec.

## Failure Behavior

Projection must fail loudly with actionable reasons such as:

- missing team
- unknown state
- missing Project capability and no fallback
- label resolution failure
- mapping store inconsistency
- permission error

Partial projection must record which objects succeeded and which failed.

## Test Requirements

This contract is not complete until tests prove:

- approved revisions project deterministically
- rerunning the same revision is idempotent
- estimates, labels, states, and dependencies project correctly
- human-editable notes are preserved through reprojection
- spec-owned edits in Linear trigger drift
- Symphony comments do not trigger false drift
