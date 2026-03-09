# Symphony Handoff Contract

**Status:** Draft  
**Last Updated:** 2026-03-09  
**Purpose:** Define the minimum Linear artifact shape required for Symphony to consume projected work safely.

## Why This Exists

The new intake system stops at planning and projection. Symphony remains the autonomous execution engine. This contract defines the boundary so projected work arrives in a form Symphony already understands or can support with a minimal adapter change.

## Current Symphony Behavior

Based on the current Symphony tracker and issue-type implementation, Symphony currently expects candidate work items to be Linear issues with:

- `id`
- `identifier`
- `title`
- `description`
- `state`
- `priority`
- `labels`
- `blockedBy`
- `createdAt`
- `updatedAt`

Symphony also relies on:

- project slug filtering through the tracker config
- active and terminal state configuration
- issue comments for completion writeback
- issue state updates for done-state transitions

## Handoff Direction

The handoff is:

`approved spec revision -> projected Linear issue -> Symphony candidate issue`

Symphony does not need the full spec IR to execute a story. It needs a correctly projected Linear issue that contains enough operational context.

## Minimum Issue Contract

Each projected issue intended for Symphony must include:

- a team and valid state
- a title that is concise and executable
- a description containing:
  - summary
  - acceptance criteria
  - dependency references
  - spec provenance metadata
  - human-editable notes block
- labels for routing when required by workspace policy
- issue relations for blockers

## Recommended Description Structure

```md
## Summary
...

## Why This Matters
...

## Acceptance Criteria
- ...

## Dependencies
- ...

## Spec Provenance
- Spec ID: ...
- Revision: ...
- Node ID: ...

## Human Notes
[Editable]
```

This gives Symphony enough context for worker prompting without making it parse the entire canonical spec.

## Workflow State Requirements

For Symphony to pick up projected issues:

- generated issues must land in a state Symphony considers active, or
- generated issues must move into such a state before Symphony polling begins

The recommended default for v1 is:

- create executable stories in `Todo` for the configured team when `Todo` is already an active Symphony state

If the target workspace uses a separate intake or triage state, that transition policy must be explicit.

## Blocking And Dependencies

Symphony already consumes `blockedBy` issue relations from Linear. Therefore:

- story-level blockers must be projected as Linear issue relations
- blocked issues should not be dispatched until blocker state no longer prevents execution

No new dependency model should be introduced for Symphony itself.

## Labels And Routing

Projected labels should support:

- routing to the correct project or workflow slice
- identifying provenance or managed artifacts
- future filtering for dashboards or policies

But Symphony should not require a new label to function unless the team chooses that as a policy.

## Project And Initiative Metadata

Symphony execution is issue-centric. Project and Initiative data should remain visible for:

- dashboards
- observability
- reporting
- future execution routing

But v1 should not require Symphony workers to read Projects or Initiatives directly.

## Writeback Compatibility

Projected issues must remain compatible with Symphony's existing writeback behavior:

- create completion summary comment
- optionally transition the issue to a done state

The new projector must not generate description layouts or labels that break this writeback flow.

## Required Symphony Changes

Current assessment:

- no mandatory architectural rewrite in Symphony should be required for the first vertical slice
- minor adapter changes may be needed if generated issues use new labels or state conventions
- provenance-aware filtering may become useful later but is not required for v1 pickup

## Optional Symphony Enhancements

Potential later enhancements:

- filter to only spec-generated issues
- expose spec provenance in dashboard state
- show project and initiative lineage in operator views
- surface drift state in execution dashboards

These are optional and should not block the first release slice.

## Failure Conditions

The handoff is invalid when:

- the projected issue lands in a non-active state Symphony never polls
- the issue description omits acceptance criteria
- blockers are missing or malformed
- the issue cannot be mapped back to a spec node

## Test Requirements

This contract is not complete until tests prove:

- projected issues normalize into Symphony's expected issue shape
- blockers are visible through existing tracker queries
- state placement makes projected issues eligible for dispatch when intended
- Symphony writeback still succeeds on generated issues
- provenance metadata does not interfere with worker prompting or completion comments
