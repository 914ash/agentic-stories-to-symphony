# Native TypeScript Symphony Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the current intake-to-Linear slice into one TypeScript product that captures app vision, binds to a new or existing project workspace, projects stories into Linear in `Todo`, and executes those stories in parallel through project-scoped worktrees with a live terminal orchestration console.

**Architecture:** Keep the current terminal entrypoint, but refactor it around a new orchestration core. `WORKFLOW.md` becomes the execution contract, intake compiles a richer planning hierarchy plus project binding metadata, projection keeps Linear as the operational board, and story execution runs in parallel through worktrees attached to one project workspace.

**Tech Stack:** TypeScript, Node.js, Vitest, git worktrees, Linear GraphQL adapter, Codex app-server sessions, repo-local markdown/json artifacts.

---

## Delivery Rules

- Stay test-first for every slice.
- Keep interfaces stable where current behavior already exists.
- Do not start orchestration UI work before the orchestration snapshot model exists.
- Do not start parallel execution before project binding and worktree safety checks are green.
- Commit after each completed task slice.

## Task 1: Define The Native Symphony Runtime Contracts

**Files:**
- Create: `src/types/workflow.ts`
- Create: `src/types/project.ts`
- Create: `tests/unit/services/runtime/workflow-config.test.ts`
- Modify: `docs/contracts/symphony-handoff.md`
- Modify: `docs/contracts/spec-ir.md`

**Step 1: Write the failing workflow contract test**

Run: `npx vitest run tests/unit/services/runtime/workflow-config.test.ts`
Expected: FAIL because the workflow config types and loader contract do not exist yet.

**Step 2: Add typed workflow and project-binding contracts**

Define the shapes for:

- workflow config resolved from `WORKFLOW.md`
- project binding metadata for new versus existing workspaces
- runtime state policy for Linear state transitions

**Step 3: Extend the contracts docs**

Update the spec and Symphony handoff contracts so they describe:

- project workspace binding
- story `Todo` projection
- claim-to-`In Progress` transitions
- project-level delivery aggregation

**Step 4: Run the targeted test again**

Run: `npx vitest run tests/unit/services/runtime/workflow-config.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/types/workflow.ts src/types/project.ts tests/unit/services/runtime/workflow-config.test.ts docs/contracts/symphony-handoff.md docs/contracts/spec-ir.md
git commit -m "feat: define native symphony runtime contracts"
```

## Task 2: Load WORKFLOW.md As The Primary Runtime Contract

**Files:**
- Create: `src/services/runtime/workflow-loader.ts`
- Create: `src/services/runtime/workflow-config.ts`
- Create: `tests/unit/services/runtime/workflow-loader.test.ts`
- Modify: `src/services/runtime/config.ts`
- Modify: `tests/unit/services/runtime/config.test.ts`

**Step 1: Write the failing loader tests**

Cover:

- valid `WORKFLOW.md` parsing
- `$VAR` resolution
- fallback bridge from `harness.config.json`
- invalid workflow reload keeps last known good config

Run: `npx vitest run tests/unit/services/runtime/workflow-loader.test.ts tests/unit/services/runtime/config.test.ts`
Expected: FAIL with missing loader behavior.

**Step 2: Implement the minimal workflow loader**

Add:

- front matter parsing
- prompt body extraction
- env-backed config resolution
- typed compatibility mapping from existing harness config

**Step 3: Refactor the existing config entrypoint**

Make `loadHarnessConfig` consume the new workflow-aware config path without breaking current callers.

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/unit/services/runtime/workflow-loader.test.ts tests/unit/services/runtime/config.test.ts`
Expected: PASS

**Step 5: Run the surrounding runtime suite**

Run: `npx vitest run tests/unit/services/runtime`
Expected: PASS

**Step 6: Commit**

```bash
git add src/services/runtime/workflow-loader.ts src/services/runtime/workflow-config.ts src/services/runtime/config.ts tests/unit/services/runtime/workflow-loader.test.ts tests/unit/services/runtime/config.test.ts
git commit -m "feat: load workflow config for native orchestration"
```

## Task 3: Extend Intake For Project Binding And Product Vision

**Files:**
- Modify: `src/types/intake.ts`
- Modify: `src/services/intake/session.ts`
- Modify: `src/services/intake/runner.ts`
- Modify: `src/services/intake/wizard.ts`
- Create: `src/services/intake/project-binding.ts`
- Create: `tests/unit/services/intake/project-binding.test.ts`
- Modify: `tests/unit/services/intake/session.test.ts`
- Modify: `tests/e2e/terminal-intake-cli.test.ts`

**Step 1: Write the failing intake tests**

Cover:

- choosing new versus existing project
- capturing project binding metadata
- collecting product vision fields in addition to scope fields

Run: `npx vitest run tests/unit/services/intake/project-binding.test.ts tests/unit/services/intake/session.test.ts tests/e2e/terminal-intake-cli.test.ts`
Expected: FAIL because the current intake model has no project-binding step.

**Step 2: Add the new intake types**

Extend the draft/session shapes with:

- project binding mode
- project identity
- workspace metadata
- product vision and success criteria

**Step 3: Implement the wizard flow changes**

Insert a project-binding step before the current requirements prompts and update the review summary to include project context and vision.

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/unit/services/intake/project-binding.test.ts tests/unit/services/intake/session.test.ts tests/e2e/terminal-intake-cli.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/intake.ts src/services/intake/session.ts src/services/intake/runner.ts src/services/intake/wizard.ts src/services/intake/project-binding.ts tests/unit/services/intake/project-binding.test.ts tests/unit/services/intake/session.test.ts tests/e2e/terminal-intake-cli.test.ts
git commit -m "feat: capture project binding during intake"
```

## Task 4: Compile Vision Into Structured Stories And Tasks

**Files:**
- Modify: `src/types/spec.ts`
- Modify: `src/services/spec/compiler.ts`
- Modify: `tests/unit/services/spec/compiler.test.ts`
- Create: `tests/unit/services/spec/story-decomposition.test.ts`
- Modify: `docs/contracts/spec-ir.md`

**Step 1: Write the failing compiler tests**

Cover:

- product vision in the compiled context
- release-goal decomposition
- story generation
- task generation beneath stories

Run: `npx vitest run tests/unit/services/spec/compiler.test.ts tests/unit/services/spec/story-decomposition.test.ts`
Expected: FAIL because the compiler currently generates flat stories only.

**Step 2: Extend the spec types**

Add normalized entities for:

- project binding metadata
- vision
- release goals or sprint buckets
- stories
- executable tasks

**Step 3: Implement the minimal decomposition rules**

Keep the first pass deterministic and boring:

- derive goals from grouped must-have features or workflow phases
- derive one or more stories per goal
- derive executable tasks from story acceptance needs and constraints

**Step 4: Update markdown generation**

Make the spec document render the planning hierarchy in a reviewable way.

**Step 5: Run the targeted tests**

Run: `npx vitest run tests/unit/services/spec/compiler.test.ts tests/unit/services/spec/story-decomposition.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/types/spec.ts src/services/spec/compiler.ts tests/unit/services/spec/compiler.test.ts tests/unit/services/spec/story-decomposition.test.ts docs/contracts/spec-ir.md
git commit -m "feat: compile app vision into stories and tasks"
```

## Task 5: Persist Project Bindings And Workspace Metadata

**Files:**
- Create: `src/adapters/fs/project-registry.ts`
- Create: `tests/integration/adapters/fs/project-registry.test.ts`
- Modify: `src/adapters/fs/spec-store.ts`
- Modify: `tests/integration/adapters/fs/spec-store.test.ts`
- Modify: `docs/exec-plans/tech-debt-tracker.md`

**Step 1: Write the failing persistence tests**

Cover:

- storing a new project binding
- resolving an existing project binding
- persisting workspace metadata alongside the spec revision

Run: `npx vitest run tests/integration/adapters/fs/project-registry.test.ts tests/integration/adapters/fs/spec-store.test.ts`
Expected: FAIL because there is no project registry.

**Step 2: Implement the registry adapter**

Store stable records for:

- project identity
- execution context
- workspace root
- repo source
- Linear project binding

**Step 3: Extend spec persistence**

Save enough metadata for resume, projection updates, and orchestration startup.

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/integration/adapters/fs/project-registry.test.ts tests/integration/adapters/fs/spec-store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/fs/project-registry.ts src/adapters/fs/spec-store.ts tests/integration/adapters/fs/project-registry.test.ts tests/integration/adapters/fs/spec-store.test.ts docs/exec-plans/tech-debt-tracker.md
git commit -m "feat: persist project workspace bindings"
```

## Task 6: Project App-Level Work To Linear In Todo

**Files:**
- Modify: `src/adapters/linear/projector.ts`
- Modify: `src/services/projection/executor.ts`
- Modify: `src/interfaces/symphony-handoff.ts`
- Modify: `tests/integration/adapters/linear/projector.test.ts`
- Modify: `tests/integration/services/projection/executor.test.ts`
- Modify: `docs/contracts/linear-projection.md`

**Step 1: Write the failing projection tests**

Cover:

- creating or updating the app-level project context
- projecting stories in `Todo`
- preserving provenance on updates

Run: `npx vitest run tests/integration/adapters/linear/projector.test.ts tests/integration/services/projection/executor.test.ts`
Expected: FAIL because the current projection rules do not enforce the new state and binding semantics.

**Step 2: Update the projection plan model**

Include:

- project binding inputs
- app-level project reuse behavior
- story default state placement in `Todo`

**Step 3: Update the executor and handoff layer**

Keep the story output compatible with downstream execution while preserving new metadata.

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/integration/adapters/linear/projector.test.ts tests/integration/services/projection/executor.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/linear/projector.ts src/services/projection/executor.ts src/interfaces/symphony-handoff.ts tests/integration/adapters/linear/projector.test.ts tests/integration/services/projection/executor.test.ts docs/contracts/linear-projection.md
git commit -m "feat: project native symphony stories in todo"
```

## Task 7: Build Project Workspace And Worktree Management

**Files:**
- Create: `src/services/runtime/project-workspace.ts`
- Create: `src/services/runtime/story-worktree.ts`
- Create: `tests/integration/services/runtime/project-workspace.test.ts`
- Create: `tests/integration/services/runtime/story-worktree.test.ts`
- Modify: `docs/contracts/symphony-handoff.md`

**Step 1: Write the failing workspace tests**

Cover:

- creating a new project workspace
- reusing an existing workspace
- creating per-story worktrees under the project workspace
- rejecting out-of-root paths

Run: `npx vitest run tests/integration/services/runtime/project-workspace.test.ts tests/integration/services/runtime/story-worktree.test.ts`
Expected: FAIL because the workspace layer does not exist.

**Step 2: Implement the project workspace manager**

Handle:

- new project bootstrap path
- existing workspace validation
- deterministic workspace metadata

**Step 3: Implement the story worktree manager**

Handle:

- deterministic branch naming
- worktree creation and reuse
- cleanup policy for terminal stories

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/integration/services/runtime/project-workspace.test.ts tests/integration/services/runtime/story-worktree.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/runtime/project-workspace.ts src/services/runtime/story-worktree.ts tests/integration/services/runtime/project-workspace.test.ts tests/integration/services/runtime/story-worktree.test.ts docs/contracts/symphony-handoff.md
git commit -m "feat: add project workspace and story worktree management"
```

## Task 8: Add The Native Orchestration State Machine

**Files:**
- Create: `src/services/orchestration/state.ts`
- Create: `src/services/orchestration/orchestrator.ts`
- Create: `src/services/orchestration/retry-policy.ts`
- Create: `tests/unit/services/orchestration/state.test.ts`
- Create: `tests/integration/services/orchestration/orchestrator.test.ts`

**Step 1: Write the failing orchestration tests**

Cover:

- claiming eligible `Todo` stories
- moving claimed stories to `In Progress`
- respecting concurrency limits
- releasing or retrying stories deterministically

Run: `npx vitest run tests/unit/services/orchestration/state.test.ts tests/integration/services/orchestration/orchestrator.test.ts`
Expected: FAIL because no orchestration core exists.

**Step 2: Implement the runtime state model**

Track:

- running stories
- claimed stories
- retry queue
- project-level aggregates
- latest event summaries

**Step 3: Implement the orchestrator loop**

Start with fixture-friendly logic:

- claim eligible stories
- transition Linear state to `In Progress`
- queue retries with explicit reasons
- aggregate project delivery state

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/unit/services/orchestration/state.test.ts tests/integration/services/orchestration/orchestrator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/orchestration/state.ts src/services/orchestration/orchestrator.ts src/services/orchestration/retry-policy.ts tests/unit/services/orchestration/state.test.ts tests/integration/services/orchestration/orchestrator.test.ts
git commit -m "feat: add native symphony orchestration state machine"
```

## Task 9: Run Story Agents Through Codex Sessions

**Files:**
- Create: `src/services/orchestration/story-runner.ts`
- Modify: `src/services/watch/execution-watch.ts`
- Modify: `src/services/watch/linear-execution-tracker.ts`
- Create: `tests/integration/services/orchestration/story-runner.test.ts`
- Modify: `tests/e2e/requirements-to-linear-to-symphony.test.ts`

**Step 1: Write the failing runner tests**

Cover:

- session startup from a story worktree
- agent event streaming into orchestration state
- retry or release on failure

Run: `npx vitest run tests/integration/services/orchestration/story-runner.test.ts tests/e2e/requirements-to-linear-to-symphony.test.ts`
Expected: FAIL because the native runner path does not exist.

**Step 2: Implement the story runner**

Make it responsible for:

- preparing the worktree
- launching the Codex session
- streaming status into the orchestrator
- applying terminal success or failure outcomes

**Step 3: Replace the watch-only assumptions**

Refactor the current watch utilities so they can consume orchestration events instead of only Linear polling output.

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/integration/services/orchestration/story-runner.test.ts tests/e2e/requirements-to-linear-to-symphony.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/orchestration/story-runner.ts src/services/watch/execution-watch.ts src/services/watch/linear-execution-tracker.ts tests/integration/services/orchestration/story-runner.test.ts tests/e2e/requirements-to-linear-to-symphony.test.ts
git commit -m "feat: execute stories with native codex runners"
```

## Task 10: Replace Passive Watch Mode With A Live Terminal Console

**Files:**
- Create: `src/interfaces/terminal-dashboard.ts`
- Modify: `src/interfaces/terminal-intake.ts`
- Modify: `src/services/intake/runner.ts`
- Create: `tests/unit/interfaces/terminal-dashboard.test.ts`
- Modify: `tests/e2e/terminal-intake-cli.test.ts`

**Step 1: Write the failing terminal UI tests**

Cover:

- transition from intake review to orchestration console
- snapshot rendering for project-level and story-level rows
- final delivery state rendering

Run: `npx vitest run tests/unit/interfaces/terminal-dashboard.test.ts tests/e2e/terminal-intake-cli.test.ts`
Expected: FAIL because the terminal still renders line-oriented status only.

**Step 2: Implement the dashboard renderer**

Render from orchestration snapshots instead of ad hoc prompt writes.

**Step 3: Wire the terminal entrypoint to the orchestration core**

Keep one command path:

- intake
- approval
- projection
- orchestration console

**Step 4: Run the targeted tests**

Run: `npx vitest run tests/unit/interfaces/terminal-dashboard.test.ts tests/e2e/terminal-intake-cli.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/interfaces/terminal-dashboard.ts src/interfaces/terminal-intake.ts src/services/intake/runner.ts tests/unit/interfaces/terminal-dashboard.test.ts tests/e2e/terminal-intake-cli.test.ts
git commit -m "feat: add live terminal orchestration console"
```

## Task 11: Prove End-To-End New And Existing Project Flows

**Files:**
- Create: `tests/fixtures/new-project-intake.json`
- Create: `tests/fixtures/existing-project-intake.json`
- Modify: `tests/e2e/requirements-to-linear-to-symphony.test.ts`
- Modify: `docs/QUALITY_SCORE.md`
- Modify: `docs/PLANS.md`

**Step 1: Write the failing end-to-end scenarios**

Cover:

- new project intake creates a workspace and projects stories to `Todo`
- existing project intake reuses the same workspace and project binding
- orchestration claims stories, writes `In Progress`, and reaches a final delivery state

Run: `npx vitest run tests/e2e/requirements-to-linear-to-symphony.test.ts`
Expected: FAIL until the full path is wired together.

**Step 2: Add the smallest missing glue**

Close the gaps exposed by the end-to-end failures without broad rewrites.

**Step 3: Run the targeted test**

Run: `npx vitest run tests/e2e/requirements-to-linear-to-symphony.test.ts`
Expected: PASS

**Step 4: Run the full suite**

Run: `npm test`
Expected: PASS

**Step 5: Update the planning and quality docs**

Mark the execution plan status accurately and re-score quality based on the new runtime behavior.

**Step 6: Commit**

```bash
git add tests/fixtures/new-project-intake.json tests/fixtures/existing-project-intake.json tests/e2e/requirements-to-linear-to-symphony.test.ts docs/QUALITY_SCORE.md docs/PLANS.md
git commit -m "test: prove native symphony end-to-end flows"
```
