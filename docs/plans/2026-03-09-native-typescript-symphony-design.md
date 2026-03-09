# Native TypeScript Symphony Integration Design

**Date:** 2026-03-09
**Status:** Approved for planning
**Owner:** Codex
**Scope:** Product and system design only. No implementation in this change.

## Summary

Extend the current spec-first intake application into a single TypeScript solution that owns the full path from guided intake through Linear projection, story orchestration, and final delivery tracking. The resulting product should feel like one terminal-native workflow: gather the user's app vision, project structured user stories into Linear, execute those stories in parallel against one project workspace, and show live progress until the app is delivered.

The architectural direction is:

`conversation -> spec -> Linear project and stories -> project workspace orchestration -> delivery`

Linear remains the operating board for story execution, but the canonical source of product intent stays in the repo-local spec and runtime metadata.

## Goals

- Keep the current guided intake flow, but deepen it so it captures product vision and decomposes that vision into structured user stories and sprint-ready tasks.
- Support both workspace modes during intake:
  - create a new project workspace for a new app
  - bind to an existing project workspace for an existing app
- Project approved work into Linear with deterministic ownership and writeback rules.
- Replace the current lightweight Symphony handoff with a native TypeScript orchestration runtime inside this repo.
- Execute multiple stories in parallel while still treating the work as one coordinated app build.
- Present an engaging terminal UI that transitions from intake into live execution status.
- Preserve test-first delivery and explicit failure handling at every boundary.

## Non-Goals

- Embedding or depending on the upstream Elixir Symphony runtime.
- Treating Linear as a peer source of product truth.
- Allowing concurrent agents to mutate the same checkout directly.
- Replacing the spec-centric intake model with tracker-first planning.

## Core Product Decisions

### 1. Native TypeScript Symphony Runtime

This repo will implement Symphony behavior natively in TypeScript. The upstream Symphony repository is treated as a specification and reference, not as a required runtime dependency.

### 2. One Project Workspace Per App

Each intake session binds to one project workspace. New app requests create a new project workspace. Existing app requests bind to an existing workspace that already represents the app.

### 3. Parallel Story Execution Uses Worktrees

Parallel execution happens through per-story git worktrees attached to the same project workspace. This preserves a single app-level codebase while isolating story-level edits and retries.

### 4. WORKFLOW.md Is The Runtime Contract

`WORKFLOW.md` becomes the primary execution contract for orchestration, prompt policy, hooks, concurrency, and environment-variable indirection. `harness.config.json` remains only as a compatibility source during migration.

### 5. Linear State Ownership Is Explicit

- Newly projected stories land in `Todo`.
- A story moves to `In Progress` only when an agent runner claims it.
- Subsequent transitions such as `Human Review`, `Rework`, `Done`, or retry release states are driven by workflow policy, not by manual guesswork.

## Architecture

### System Layers

1. `Intake`
   - guides the user through the wizard
   - captures product vision, users, workflow, scope, constraints, and workspace binding
   - validates that intake is complete enough to compile

2. `Spec and Planning`
   - compiles intake into a canonical spec revision plus normalized execution metadata
   - decomposes app vision into release goals, user stories, and executable tasks
   - persists project binding and workspace metadata as part of the canonical record

3. `Projection`
   - creates or updates the owning Linear project context
   - writes the user stories into Linear in `Todo`
   - preserves provenance and idempotent mappings for updates and resume flows

4. `Execution Orchestration`
   - creates or reuses the bound project workspace
   - manages per-story worktrees, story runners, retries, and Linear reconciliation
   - runs Codex app-server sessions using `WORKFLOW.md`

5. `Observability`
   - exposes snapshot-driven terminal status for the overall project and each story runner
   - surfaces Linear writebacks, runner state, token metrics, retries, and final delivery state

### Canonical Flow

1. User starts intake in the terminal UI.
2. Intake resolves whether this is a new project or an existing project.
3. Intake captures app vision and release scope.
4. The compiler turns that input into a structured spec with user stories and tasks.
5. An authorized collaborator approves the revision.
6. Linear projection creates or updates the project and stories in `Todo`.
7. The terminal transitions into orchestration mode.
8. Eligible stories are claimed, moved to `In Progress`, and executed in parallel through worktrees.
9. The console reports story and project-level progress until the configured delivery condition is met.

## Intake And Workspace Resolution

Workspace resolution is an early intake step, not a late runtime guess.

For a new project, intake must gather:

- project name
- workspace root or bootstrap location
- source repo or initialization strategy
- base branch and execution defaults

For an existing project, intake must resolve:

- the previously registered project workspace
- its Linear project binding
- the execution context that should be reused

The canonical metadata must include at least:

- `projectId`
- `executionContextId`
- `workspaceMode`
- `workspaceRoot`
- `sourceRepo`
- `defaultBaseBranch`
- `linearProjectId`

This metadata is required for resume, projection updates, worktree creation, and final delivery tracking.

## Vision-To-Story Compilation

The current intake fields already capture parts of the product vision, but they are not yet compiled deeply enough. The next design should compile three explicit layers:

1. `Product vision`
   - what app is being built
   - who it is for
   - what success looks like

2. `Release scope`
   - the core workflow
   - must-have capabilities
   - constraints
   - out-of-scope boundaries

3. `Execution breakdown`
   - sprint buckets or workstreams
   - user stories
   - implementation tasks

The compiler should no longer map each must-have feature directly to a flat story. Instead it should build a stable planning hierarchy such as:

`vision -> release goals -> user stories -> executable tasks`

The operator reviews that breakdown before approval.

## Linear Projection Rules

Projection should treat the app as one project-level container with multiple executable user stories underneath it.

- The app-level request creates or updates the owning Linear project or initiative context.
- User stories are projected as Linear issues under that project context.
- Newly created or newly activated stories land in `Todo`.
- Story provenance must remain stable across revisions so updates are idempotent.
- Writeback rules must distinguish between spec-owned fields and human-editable execution notes.

The projector should continue to fail loudly when the target workspace cannot represent the requested projection shape.

## Execution Model

The project workspace is the app-level root. Story runners do not create separate projects; they create isolated worktrees attached to that root.

Each story runner owns:

- one Linear story
- one worktree and branch
- one Codex session or thread
- one retry and release lifecycle

Stories become eligible to run based on:

- Linear state
- dependency readiness
- project-level concurrency limits
- workflow policy from `WORKFLOW.md`

When a runner claims a story, the story moves to `In Progress`. When the runner exits or hands off, the orchestrator applies deterministic state policy for success, retry, rework, or release.

## Terminal UI

The terminal experience should not stop at passive watch output. It should transition into a live orchestration console after projection.

The console should be driven by runtime snapshots and show:

- project identity and workspace path
- active, queued, retrying, and completed story counts
- runtime, token, and throughput counters
- next refresh and orchestration health
- a story table with story ID, Linear stage, runner stage, worktree or branch, age, tokens, and latest event
- final project delivery state once all required stories satisfy the configured workflow outcome

The UI should feel like a coordinated app build, even though execution remains isolated per story.

## Error Handling

The system should fail loudly and visibly for:

- unresolved project binding
- invalid `WORKFLOW.md`
- missing required environment-backed runtime values
- project workspace creation or reuse failures
- worktree lifecycle failures
- Linear projection mismatches
- agent session startup or stall failures
- ambiguous project delivery state

Retries are acceptable, but every retry must have an explicit reason and a deterministic release rule.

## Testing Strategy

Testing should stay incremental and test-first.

### Intake and compilation

- project binding tests for new versus existing workspace resolution
- compiler tests for vision-to-story and story-to-task decomposition
- validation tests for incomplete intake and review gating

### Projection

- projection tests that newly projected stories land in `Todo`
- mapping tests for project reuse versus project creation
- idempotency tests for repeated revisions

### Orchestration

- project workspace creation and reuse tests
- per-story worktree isolation tests
- claim-to-`In Progress` writeback tests
- parallel runner limit tests
- retry, release, and dependency gating tests

### Observability

- snapshot tests for terminal runtime state
- tests that project delivery status reflects story outcomes deterministically

### End to end

- one seeded new-project scenario from intake through projected stories and fixture execution
- one existing-project scenario that reuses the bound workspace and updates the same project context

## Migration Plan

1. Keep the current terminal entrypoint.
2. Add a typed `WORKFLOW.md` loader and compatibility bridge for `harness.config.json`.
3. Extend intake and spec compilation for project binding plus structured decomposition.
4. Preserve the current projector interface while deepening the canonical planning model.
5. Replace the watch-only path with a native orchestration runtime and snapshot-driven console.
6. Add final delivery aggregation once story execution and writeback are stable.

## Risks

### 1. Shared project workspace complexity

Parallel story execution against one app increases merge, dependency, and environment coordination risk.

Mitigation:

- isolate edits with worktrees
- keep branch naming deterministic
- gate parallelism with workflow policy

### 2. Vision-to-task over-generation

Naive decomposition can create noisy or low-value work.

Mitigation:

- keep the planning hierarchy explicit
- require operator review before approval
- validate story quality in tests

### 3. Dual-config migration drift

Temporary coexistence of `WORKFLOW.md` and `harness.config.json` can create ambiguity.

Mitigation:

- make `WORKFLOW.md` authoritative immediately
- keep compatibility reads narrow and explicit
- remove duplicated fields as soon as the migration path is proven

## Recommendation

Proceed with a unified native TypeScript implementation that keeps intake, projection, orchestration, and delivery in one product while preserving explicit boundaries:

- repo-local spec and project metadata remain canonical
- Linear is the execution board for user stories
- one project workspace represents the app
- parallel story execution uses worktrees
- `WORKFLOW.md` owns runtime policy
- the terminal UI is a first-class orchestration surface, not only an intake form
