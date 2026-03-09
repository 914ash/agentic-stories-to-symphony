# Requirements Intake Workflow Implementation Plan

**Implementation Status:** In progress, first terminal vertical slice shipped on 2026-03-09

## Current Slice Status

- Completed: repo-local config loading, resumable intake sessions, prompt abstraction, terminal CLI entrypoint, approval gating, immutable spec persistence, live Linear capability discovery, Linear project/issue writeback, idempotent mapping persistence, and watch-mode event streaming.
- Completed verification: unit, integration, and spawned CLI tests for new intake, save/resume, unauthorized approval, projection idempotency, and watch rendering.
- Completed live validation: real Linear smoke against team `N14` created projected issue `N14-14` from the terminal intake flow.
- Remaining phases from this plan are still open for hierarchy projection, drift detection, observability, and stronger Symphony-native watchback.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a spec-first requirements intake system that converts approved app requirements into Linear work artifacts and feeds those artifacts into Symphony safely.

**Architecture:** Introduce a requirements intake and projection layer ahead of Symphony. The new layer owns intake sessions, repo-local spec revisions, approvals, Linear projection, and drift detection, while Symphony remains responsible for story execution and verification-aware completion.

**Tech Stack:** TypeScript service components, repo-local markdown specs, Linear GraphQL and agent surfaces, Symphony orchestration runtime, automated tests for compiler, projector, and end-to-end flows.

---

## Proposed Repository Scaffolding

The first implementation should use an explicit layered layout that matches the workspace architecture guidance:

- `src/types/`
  - shared DTOs, schema types, validation contracts
- `src/domain/`
  - pure rules for intake completeness, revision transitions, projection ownership
- `src/adapters/linear/`
  - GraphQL client, queries, capability detection, projector adapter
- `src/adapters/fs/`
  - repo-local spec persistence and mapping persistence
- `src/services/intake/`
  - intake session orchestration and question strategy
- `src/services/spec/`
  - spec compiler, approval service, projection trigger
- `src/services/drift/`
  - drift detection and reconciliation flows
- `src/interfaces/`
  - agent entry, Linear entry, CLI or HTTP entry points as needed
- `tests/unit/`
  - pure logic and compiler tests
- `tests/integration/`
  - Linear adapter, persistence, and service interaction tests
- `tests/e2e/`
  - agent-first, Linear-first, and Symphony handoff scenarios

## Phase 1 Concrete Module Slice

Before broad feature work, build these concrete modules in order:

1. `src/types/spec.ts`
2. `src/types/intake.ts`
3. `src/domain/intake-completeness.ts`
4. `src/services/intake/session.ts`
5. `src/services/spec/compiler.ts`
6. `src/adapters/fs/spec-store.ts`
7. `src/services/spec/approval.ts`
8. `src/adapters/linear/client.ts`
9. `src/adapters/linear/projector.ts`
10. `tests/e2e/requirements-to-linear-to-symphony.test.ts`

Every module above should arrive with its own targeted tests before the next module begins.

## Implementation Principles

- Preserve the one-way truth model: conversation -> spec -> Linear -> Symphony.
- Keep Linear integration isolated behind typed adapters.
- Add observability before broad automation.
- Prefer deterministic projection over heuristic mutation.
- Ship the smallest end-to-end slice first.
- Use strict TDD for every feature slice.
- Do not start the next feature until the current feature's targeted tests are green.

## Delivery Rule: Build As We Test

Every task sequence in this plan follows the same hard gate:

1. Write the smallest failing test for the next behavior.
2. Run that test and confirm the failure is real.
3. Implement the minimum code required for that one behavior.
4. Re-run the targeted tests until they pass.
5. Run the relevant surrounding suite to catch regressions.
6. Only then move to the next feature slice.

If a slice spans multiple boundaries, the gate expands in order:

1. unit test
2. contract or adapter test
3. integration test
4. end-to-end scenario

No later feature should begin while an earlier slice is still red or only partially verified.

## Phase 0: Baseline And Contracts

### Task 1: Define canonical data contracts

**Files:**
- Create: `docs/contracts/spec-ir.md`
- Create: `docs/contracts/linear-projection.md`
- Modify: `docs/plans/2026-03-09-requirements-intake-design.md`

**Steps:**
1. Write the normalized spec entity model with stable IDs.
2. Define required provenance fields for every generated Linear artifact.
3. Document which fields are spec-owned versus human-editable.
4. Update the design doc if any contract-level decision changes during writing.

### Task 2: Define approval and authorization contract

**Files:**
- Create: `docs/contracts/spec-approval.md`
- Modify: `docs/plans/2026-03-09-requirements-intake-design.md`

**Steps:**
1. Document revision states and allowed transitions.
2. Define who can approve and how approval is recorded.
3. Define automatic projection trigger semantics.
4. Define failure and retry semantics for projection after approval.

### Task 3: Define Symphony handoff contract

**Files:**
- Create: `docs/contracts/symphony-handoff.md`
- Review: `C:\Users\eshli\Documents\featured-projects\symphony\src\tracker.ts`
- Review: `C:\Users\eshli\Documents\featured-projects\symphony\src\workflow.ts`

**Steps:**
1. Map generated Linear stories to Symphony's current candidate-issue expectations.
2. Define the minimum story body and metadata needed for execution.
3. Record any Symphony changes that are required versus optional.

## Phase 1: Smallest Vertical Slice

### Task 4: Implement agent-first intake session skeleton

**Files:**
- Create: `src/types/intake.ts`
- Create: `src/domain/intake-completeness.ts`
- Create: `src/domain/intake-completeness.test.ts`
- Create: `src/services/intake/session.ts`
- Create: `tests/unit/services/intake/session.test.ts`

**Steps:**
1. Write failing tests for session creation and state progression.
2. Run the new tests to confirm the failure mode matches the intended behavior gap.
3. Implement pure completeness rules before session orchestration logic.
4. Implement minimal session state for gathering answers and summaries.
5. Re-run the targeted tests until they pass.
6. Run the surrounding intake test suite before moving to Task 5.

### Task 5: Implement spec drafting and persistence

**Files:**
- Create: `src/types/spec.ts`
- Create: `src/services/spec/compiler.ts`
- Create: `tests/unit/services/spec/compiler.test.ts`
- Create: `src/adapters/fs/spec-store.ts`
- Create: `tests/integration/adapters/fs/spec-store.test.ts`
- Create: `specs/README.md`

**Steps:**
1. Write failing tests for compiling intake answers into a spec revision.
2. Run the new tests to confirm the compiler and store are still missing the intended behavior.
3. Implement markdown generation plus normalized IR generation.
4. Persist revisions in a deterministic repo-local structure.
5. Re-run the targeted compiler and store tests until they pass.
6. Run the surrounding spec test suite before moving to Task 6.

### Task 6: Implement approval trigger

**Files:**
- Create: `src/domain/spec-revision.ts`
- Create: `src/domain/spec-revision.test.ts`
- Create: `src/services/spec/approval.ts`
- Create: `tests/unit/services/spec/approval.test.ts`

**Steps:**
1. Write failing tests for authorized collaborator approval.
2. Run the approval tests and confirm the failing authorization or transition behavior.
3. Implement pure revision transition rules first.
4. Implement immutable revision approval behavior.
5. Emit projection request on approval.
6. Re-run the targeted approval tests until they pass.
7. Run the surrounding approval and spec workflow suite before moving to Task 7.

### Task 7: Implement minimal Linear project-and-issue projection

**Files:**
- Create: `src/adapters/linear/client.ts`
- Create: `src/adapters/linear/queries.ts`
- Create: `src/adapters/linear/capabilities.ts`
- Create: `tests/integration/adapters/linear/capabilities.test.ts`
- Create: `src/adapters/linear/projector.ts`
- Create: `tests/integration/adapters/linear/projector.test.ts`

**Steps:**
1. Write failing contract tests for projecting one approved spec into one Linear Project with one or more Issues.
2. Run the projection tests and confirm the missing create-or-update behavior.
3. Implement capability detection for available planning surfaces.
4. Implement create-or-update logic with provenance metadata.
5. Ensure idempotent reruns do not duplicate work items.
6. Re-run the targeted projection tests until they pass.
7. Run the surrounding Linear adapter suite before moving to Task 8.

### Task 8: Prove Symphony can consume projected stories

**Files:**
- Create: `tests/e2e/requirements-to-linear-to-symphony.test.ts`
- Review: `C:\Users\eshli\Documents\featured-projects\symphony\src\tracker.ts`
- Review: `C:\Users\eshli\Documents\featured-projects\symphony\src\types.ts`

**Steps:**
1. Write an end-to-end test or fixture that produces a projected Project-and-Issue shape.
2. Run the new handoff test and confirm the failure is at the expected contract boundary.
3. Verify Symphony can recognize and work the generated issue without manual edits.
4. Record any required adapter changes.
5. Re-run the handoff scenario until it passes.
6. Run the surrounding integration suite before moving to hierarchy work.

## Phase 2: Full Planning Projection

### Task 9: Add initiative and epic hierarchy projection

**Files:**
- Modify: `src/adapters/linear/projector.ts`
- Modify: `tests/integration/adapters/linear/projector.test.ts`
- Create: `src/adapters/fs/mapping-store.ts`
- Create: `tests/integration/adapters/fs/mapping-store.test.ts`

**Steps:**
1. Write failing tests for Initiative-plus-Project hierarchical projection.
2. Run the hierarchy tests and confirm the missing mapping behavior.
3. Add stable mapping between spec nodes and Linear IDs.
4. Verify updates remain idempotent.
5. Re-run the targeted hierarchy tests until they pass.
6. Run the surrounding projector suite before moving to Task 10.

### Task 10: Add estimates, labels, state placement, and dependencies

**Files:**
- Modify: `src/adapters/linear/projector.ts`
- Modify: `src/adapters/linear/queries.ts`
- Modify: `tests/integration/adapters/linear/projector.test.ts`

**Steps:**
1. Write failing tests for each generated field and link type.
2. Run the targeted tests and confirm the missing field behavior one capability at a time.
3. Implement deterministic projection rules for team-specific states, estimate capability, label scope, and dependency type.
4. Re-run the targeted tests until they pass.
5. Verify the full projected payload matches the approved spec revision.
6. Run the surrounding projector and projection-contract suites before moving to the next phase.

## Phase 3: Dual Entry Points

### Task 11: Add Linear-first intake entry

**Files:**
- Create: `src/interfaces/linear-entry.ts`
- Create: `tests/integration/interfaces/linear-entry.test.ts`
- Modify: `src/services/intake/session.ts`

**Steps:**
1. Write failing tests for creating an intake session from Linear context.
2. Run the Linear-entry tests and confirm the missing bootstrap behavior.
3. Implement the Linear-first session bootstrap.
4. Re-run the targeted tests until they pass.
5. Verify it converges on the same spec pipeline as agent-first intake.
6. Run the surrounding intake integration suite before moving to Task 12.

### Task 12: Add shared intake question strategy

**Files:**
- Create: `src/services/intake/question-strategy.ts`
- Create: `tests/unit/services/intake/question-strategy.test.ts`

**Steps:**
1. Write failing tests for adaptive question generation.
2. Run the question-strategy tests and confirm the expected behavior gap.
3. Implement context-aware question batching and summarization rules.
4. Re-run the targeted tests until they pass.
5. Verify incomplete requirements stay blocked from approval.
6. Run the surrounding intake suite before moving to drift work.

## Phase 4: Drift Detection And Reconciliation

### Task 13: Implement drift detection

**Files:**
- Create: `src/services/drift/detector.ts`
- Create: `tests/integration/services/drift/detector.test.ts`
- Modify: `src/adapters/linear/projector.ts`

**Steps:**
1. Write failing tests for manual edits to spec-owned fields.
2. Run the drift tests and confirm the missing comparison behavior.
3. Implement drift comparison using projection hashes and provenance metadata.
4. Re-run the targeted tests until they pass.
5. Verify drift states are surfaced deterministically.
6. Run the surrounding Linear reconciliation suite before moving to Task 14.

### Task 14: Implement reconciliation workflow

**Files:**
- Create: `src/services/drift/reconciliation.ts`
- Create: `tests/integration/services/drift/reconciliation.test.ts`
- Modify: `docs/contracts/linear-projection.md`

**Steps:**
1. Write failing tests for overwrite-from-spec and propose-to-spec paths.
2. Run the reconciliation tests and confirm the intended failure modes.
3. Implement explicit reconcile actions.
4. Re-run the targeted tests until they pass.
5. Verify no path silently rewrites source-of-truth intent.
6. Run the surrounding drift and reconciliation suites before moving to observability.

## Phase 5: Observability And Release Readiness

### Task 15: Add structured logging and metrics

**Files:**
- Create: `src/interfaces/observability/events.ts`
- Create: `tests/unit/interfaces/observability/events.test.ts`
- Modify: relevant intake, spec, and projector modules

**Steps:**
1. Write failing tests for key events and counters.
2. Run the observability tests and confirm missing event emission.
3. Emit logs and metrics for intake, approval, projection, drift, and handoff.
4. Re-run the targeted tests until they pass.
5. Verify log payloads include correlation IDs and revision metadata.
6. Run the surrounding observability suite before moving to end-to-end release checks.

### Task 16: Build seeded end-to-end verification scenario

**Files:**
- Create: `tests/e2e/requirements-to-symphony.test.ts`
- Create: `tests/fixtures/sample-app-request.json`
- Create: `tests/fixtures/sample-approved-spec.md`

**Steps:**
1. Write the full happy-path scenario from user request to Symphony-ready stories.
2. Run the new end-to-end scenario and confirm the first failing boundary.
3. Add assertions for hierarchy, labels, estimates, states, dependencies, and provenance.
4. Re-run the scenario until it passes reliably.
5. Run the broader end-to-end suite before moving to failure paths.

### Task 17: Add failure-path end-to-end verification

**Files:**
- Modify: `tests/e2e/requirements-to-symphony.test.ts`

**Steps:**
1. Add scenarios for incomplete requirements, projection failure, and drift.
2. Run the failure scenarios and confirm each one fails at the intended gate before implementation.
3. Verify the system fails loudly with actionable outputs.
4. Re-run the failure suite until it passes.
5. Confirm no circular sync path exists.

## Definition Of Done For This Feature

- Both entry points can create or continue an intake session.
- Approved spec revisions are stored repo-locally and are clearly canonical.
- Approval by an authorized collaborator triggers automatic Linear projection.
- Linear projection includes hierarchy, acceptance criteria, estimates, labels, workflow state placement, and dependencies.
- Generated Linear artifacts carry provenance metadata.
- Symphony can consume projected stories without manual rewriting.
- Drift is detected and requires explicit reconciliation.
- End-to-end tests prove the workflow on both happy and failure paths.

## Verification Checklist

- Contract tests for spec IR and Linear payloads
- Unit tests for approval, projection, and drift detection
- Integration tests for both entry points
- End-to-end test proving Symphony handoff
- Manual demo run with a seeded app request
- Evidence that each feature slice was green before the next slice began

## Delivery Notes

- Do not start with broad UI work.
- Do not start with bidirectional sync.
- Do not allow manual Linear edits to redefine scope implicitly.
- Treat the spec artifact and projector mappings as the critical path.
