# Requirements Intake To Linear Projection Design

**Date:** 2026-03-09
**Status:** Draft for review
**Owner:** Codex
**Scope:** Product and system design only. No implementation in this change.

## Summary

Build a requirements intake workflow that lets a user describe an app either in the agent experience or from Linear, turns that conversation into a canonical repo-local specification, automatically projects the approved spec into Linear artifacts, and then lets Symphony execute those stories with its existing verification-aware workflow.

The central architectural rule is:

`conversation -> spec -> Linear projection -> Symphony execution`

Linear is not a peer source of product truth. It is a projected planning and execution surface derived from an approved spec revision.

## Why This Exists

Today the project can run Codex autonomously from Linear stories, but the stories must already exist. That creates a manual planning bottleneck and weakens traceability between user intent, approved requirements, and execution.

This feature closes that gap by adding an intake layer that:

- gathers requirements interactively
- structures them into a reusable spec
- converts the spec into a coherent Linear work graph
- preserves a deterministic handoff into Symphony

## Research Inputs

This design is informed by four source patterns:

1. OpenAI Harness Engineering guidance
   - repo-local artifacts should carry durable intent and operating context
   - agent workflows should be explicit, inspectable, and resumable
   - planning should be separated from execution

2. OpenAI Codex/App Server guidance
   - long-lived agent workflows should expose evented state and durable session behavior
   - orchestration should prefer observable control loops over opaque one-shot prompting

3. Obra Superpowers brainstorming workflow
   - gather intent before implementation
   - validate design before planning
   - move from brainstorming to approved design to explicit plan

4. Gemini Conductor requirements flow
   - project context should be persistent
   - requirement gathering should be guided and context-aware
   - spec approval should precede planning
   - plan generation should derive from the approved spec

This design intentionally does **not** copy Conductor's extra registry artifacts, track ledgers, or git-aware revert machinery unless later evidence shows they are needed.

## Goals

- Allow requirements intake from both entry points:
  - agent-first
  - Linear-first
- Produce a canonical repo-local spec document as the source of truth.
- Allow any authorized collaborator to approve a spec revision.
- Trigger automatic Linear writeback immediately on spec approval.
- Generate a usable Linear work graph automatically:
  - initiative or parent planning artifact
  - epics
  - stories
  - acceptance criteria
  - estimates
  - labels
  - workflow state placement
  - dependency links
- Ensure Symphony can consume generated stories without any special manual setup.
- Detect divergence between spec-owned Linear fields and manual Linear edits.
- Verify behavior end to end before rollout.

## Non-Goals

- Bidirectional sync where Linear edits silently rewrite the spec.
- Freeform manual planning in Linear as an equal source of product intent.
- Full Conductor-style track management, metadata ledgers, or revert workflows in v1.
- Automatic product design generation without collaborator approval.
- Replacing Symphony's execution loop.

## Key Product Decisions

### 1. Source Of Truth

The repo-local spec document is canonical. Linear artifacts are generated projections of an approved spec revision.

### 2. Entry Points

The system must support both:

- `agent-first intake`: user starts with the agent and later writes to Linear
- `Linear-first intake`: user starts from Linear and the agent gathers requirements there or through a linked workflow

Both paths converge on the same internal pipeline and the same spec artifact.

### 3. Approval Model

Any authorized collaborator may approve a spec revision. Approval triggers automatic Linear projection without a separate publish step.

### 4. Circular Logic Prevention

The system is intentionally one-way at the requirements layer:

- upstream intent flows into the spec
- the approved spec projects into Linear
- Symphony uses Linear execution state
- manual Linear scope edits become divergence signals, not new truth

### 5. Drift Policy

Linear never auto-promotes scope changes back into the spec. When generated fields drift, the system opens a reconciliation flow:

- detect divergence
- present diff
- require explicit promote-to-spec or overwrite-from-spec decision

## Proposed Architecture

## High-Level Components

1. Intake Orchestrator
   - manages intake sessions from either entry point
   - persists conversation-to-spec state
   - decides whether enough information exists to draft or revise the spec

2. Spec Compiler
   - turns gathered requirements into a structured spec document
   - tracks `spec_id`, `revision`, approval state, and projection state
   - emits a normalized intermediate representation for downstream projection

3. Approval Service
   - validates collaborator authorization
   - records approval metadata
   - locks the approved revision for deterministic projection

4. Linear Projector
   - converts the approved spec revision into Linear artifacts
   - creates and updates planning hierarchy, fields, and links
   - stores stable mappings between spec nodes and Linear object IDs

5. Drift Detector
   - compares current Linear generated fields with the owning spec revision
   - identifies user edits to spec-owned sections
   - routes drift into an explicit reconciliation workflow

6. Symphony Handoff Layer
   - exposes generated stories in the shape Symphony already expects
   - guarantees that generated work items have enough metadata for assignment, filtering, and writeback

## Linear Object Model Alignment

As of 2026-03-09, the design should align to Linear's documented planning model instead of inventing a custom hierarchy:

- Initiatives group Projects at the workspace level.
- Projects hold overview text, resources, milestones, and issues.
- Issues are the executable work items Symphony can consume.
- Issues support parent and sub-issue relationships.
- Issues support blocking, blocked-by, related, and duplicate relations.
- Estimates are configured at the team level and may differ by team.
- Labels may be workspace-scoped or team-scoped.
- Workflow state is required on issue creation and is team-specific.

This means the recommended projection is not "epics" as a first-class Linear concept. The projector should translate the logical epic layer from the spec into whichever Linear primitive is appropriate.

## Recommended Linear Mapping

The default mapping for this system should be:

- spec -> repo-local canonical document plus structured IR
- major workstream -> Initiative when the work spans multiple projects or teams
- epic / feature area -> Project
- story -> Issue
- implementation sub-task -> sub-issue only when decomposition below story level is necessary

This mapping is preferable because it matches Linear's planning surfaces:

- Initiatives already roll up Projects.
- Projects already carry overview documents and milestone structure.
- Issues are the object Symphony already knows how to execute against.

## Mapping Rules

Use these projection rules by default:

1. Create an Initiative when the approved spec has multiple feature areas, cross-team work, or a multi-phase rollout.
2. Create one Project per approved feature area or epic.
3. Create one Issue per story under the owning Project.
4. Use sub-issues only for implementation splits, not as the primary epic mechanism.
5. Use issue relations for story-level dependencies.
6. Use project dependencies only when one feature-area project blocks another feature-area project.

## Fallback Mapping

Some workspaces may not have all planning features enabled or may not want to use them. The fallback order should be:

1. Initiative -> Project -> Issue
2. Project -> parent issue -> sub-issues
3. parent issue -> sub-issues only

The projector must detect which capability set is available and use the highest-fidelity mapping without changing the spec's logical structure.

## System Boundaries

- Spec system owns requirements truth and planning structure.
- Linear owns collaborative task tracking and execution visibility.
- Symphony owns autonomous execution, verification evidence, and completion writeback.

## Canonical Artifact Model

## Repo-Local Spec

The spec is the canonical artifact and must be stored in the repo. It should contain:

- document metadata
  - `spec_id`
  - `title`
  - `revision`
  - `status`
  - `created_by`
  - `approved_by`
  - timestamps
- product summary
- target users and jobs to be done
- problem statement
- goals
- non-goals
- constraints and assumptions
- functional requirements
- non-functional requirements
- acceptance criteria
- edge cases and failure handling
- story decomposition model
- release and rollout notes
- verification requirements
- projection summary
  - generated initiative/epic/story counts
  - last projection revision
  - drift status

## Structured Spec IR

In addition to the human-readable document, the system should derive a normalized spec representation with stable IDs for every decomposable requirement node. Example logical entities:

- `spec`
- `feature_area`
- `epic`
- `story`
- `acceptance_criterion`
- `dependency`
- `label`
- `estimate`
- `workflow_target`

This representation is what the projector uses. The markdown doc stays the human-facing source of truth.

## Linear Projection Model

## Artifact Hierarchy

The approved spec revision should project to Linear as:

- one Initiative when the spec warrants a multi-project or cross-team program
- one Project per feature area or epic
- one or more Issues under each Project
- optional sub-issues when a story needs implementation decomposition

If the workspace's available Linear features differ, the projector should adapt the projection shape while preserving the same logical relationships and provenance.

## Story Fields

Each generated story must include:

- title
- description
- acceptance criteria
- estimate
- labels
- target workflow state
- dependency links
- provenance metadata

Each Project should include:

- title
- summary
- overview text or linked canonical spec reference
- owner when known
- target date when present in the spec
- project labels when part of the workspace convention

Each Initiative should include:

- title
- summary
- description linking back to the canonical spec
- status derived from intake and approval workflow
- project list

## Capability Constraints

The projector must respect documented Linear constraints:

- issue creation always requires a team and status
- estimates only apply when enabled for the target team
- label identity differs between workspace-level and team-level labels
- issue state choices are team-specific, not global
- issue and project relationships use distinct dependency models

The system should fail loudly when the approved spec asks for a projection shape the target workspace cannot represent.

## Provenance Metadata

Every generated Linear artifact must carry machine-readable provenance:

- `spec_id`
- `spec_revision`
- `spec_node_id`
- `projection_timestamp`
- `projection_hash`
- `generated_by`

This metadata is required for deterministic updates, drift detection, and Symphony filtering.

## Field Ownership

Generated Linear content must be split into two zones:

1. Spec-owned zone
   - title template
   - generated description block
   - acceptance criteria block
   - estimate
   - system-managed labels
   - workflow target
   - dependency links

2. Human-editable zone
   - additional implementation notes
   - operator comments
   - local execution details not intended to redefine scope

The projector may overwrite only the spec-owned zone for a given revision.

## Intake Workflow

## Path A: Agent-First

1. User tells the agent about the app they want.
2. Intake orchestrator gathers requirements interactively.
3. System drafts or revises the repo-local spec.
4. Authorized collaborator approves a spec revision.
5. Linear projector writes initiative, epics, and stories automatically.
6. Symphony starts working from generated Linear stories.

## Path B: Linear-First

1. User starts from Linear, likely from a request issue or intake action.
2. Agent opens a requirements-gathering session anchored to that Linear context.
3. System gathers requirements and drafts the repo-local spec.
4. Authorized collaborator approves the spec revision.
5. Linear projector writes or updates the full work graph automatically.
6. Symphony executes against those projected stories.

## Shared Intake Behavior

The intake flow should borrow the strongest parts of Superpowers and Conductor:

- ask context-aware questions instead of generic forms
- prefer small batches of related questions over giant questionnaires
- adapt questioning based on what the user already supplied
- summarize understanding before drafting
- present explicit approval checkpoints
- preserve enough context to resume sessions safely

## Intake State Machine

The intake workflow should be explicit and resumable. Recommended states:

- `collecting_context`
- `summarizing_understanding`
- `drafting_spec`
- `awaiting_revision_feedback`
- `ready_for_approval`
- `approved`
- `projection_in_progress`
- `projected`
- `drifted`

The agent should always know which state a session is in and why it can or cannot advance.

## Recommended Questioning Model

The agent should gather:

- product outcome
- intended users
- core workflow
- constraints
- must-have features
- explicitly out-of-scope features
- integration requirements
- security or compliance expectations
- quality bar and definition of done

The system should stop gathering and move to draft when:

- the main workflow is unambiguous
- success criteria are clear
- major constraints are known
- major exclusions are known
- the remaining uncertainty can be represented as explicit assumptions

## Approval Workflow

## Revision States

Suggested spec revision lifecycle:

- `draft`
- `needs_review`
- `approved`
- `projecting`
- `projected`
- `drifted`
- `superseded`

## Approval Semantics

- Approval is granted by any authorized collaborator.
- Approval applies to one immutable revision.
- Approval triggers projection immediately.
- If projection fails, the revision remains approved but not fully projected.
- Projection retries must be idempotent.

## Symphony Integration

The current Symphony codebase already supports:

- Linear polling for candidate issues
- workflow-file-driven worker prompts
- verification-aware completion gating
- Linear writeback after successful execution

This feature should not replace that machinery. Instead it should ensure that generated stories fit Symphony's existing consumption model. The minimum integration contract is:

- generated issues land in active states Symphony already watches or in a dedicated intake-ready state that can later transition into those watched states
- story descriptions include enough execution context for worker prompting
- provenance metadata enables future observability and filtering
- project and initiative references remain available for future dashboards and routing, but Symphony execution is still issue-centric

## Drift And Reconciliation

## Drift Sources

- collaborator edits spec-owned fields in Linear
- spec revision changes after projection
- deleted or moved Linear artifacts
- label, estimate, or dependency changes made outside the projector

## Drift Handling Rules

- detect drift at read or sync time
- never auto-promote drift into the spec
- never silently discard collaborator edits without surfacing them
- offer explicit actions:
  - overwrite Linear from approved spec
  - propose Linear change for spec promotion
  - defer and mark drift unresolved

## Verification Strategy

This feature needs verification at multiple layers.

## Incremental Test-First Delivery Rule

The implementation should follow strict incremental verification:

- write the smallest failing test for the next feature slice
- implement only enough behavior to make that test pass
- run the relevant test set immediately
- do not begin the next feature slice until the current slice is green
- expand from unit to integration to end-to-end coverage as the slice crosses boundaries

This is not only a coding preference. It is part of the product safety model for the workflow itself. Because the system writes planning artifacts into Linear automatically, every new behavior must prove itself before the next behavior is added.

## 1. Spec Compiler Tests

Verify that requirement sessions compile into stable spec structures:

- incomplete inputs block approval
- explicit assumptions are preserved
- spec node IDs remain stable across non-structural edits

## 2. Projection Contract Tests

Verify that a given approved spec revision produces the expected Linear payloads:

- initiative, epic, and story creation
- deterministic story body generation
- estimates
- labels
- state placement
- dependency links
- provenance metadata

## 3. Idempotency And Update Tests

Verify that repeated projection does not duplicate artifacts and that revision updates are deterministic.

## 4. Drift Tests

Verify that manual edits to spec-owned fields are detected and reconciled explicitly.

## 5. Entry-Point Integration Tests

Verify both paths:

- agent-first intake -> approved spec -> Linear projection -> Symphony eligibility
- Linear-first intake -> approved spec -> Linear projection -> Symphony eligibility

## 6. End-To-End Demo Scenario

The release gate should include a seeded scenario where:

- a user describes an app
- the system gathers requirements
- the spec is approved
- Linear receives initiative, epics, and stories automatically
- Symphony recognizes the projected work
- at least one story reaches execution with verification-backed completion

## Feature Gate Policy

Each feature area must have a release gate before the next feature begins:

- intake session behavior must pass before spec persistence work starts
- spec drafting and approval must pass before Linear projection expands
- story projection must pass before hierarchy, estimates, labels, and dependencies expand
- both entry points must pass before drift handling work begins
- drift handling must pass before release-readiness hardening begins

## Observability Requirements

The system should emit structured events for:

- intake session started
- intake question asked
- intake summary confirmed
- spec drafted
- revision approved
- projection started
- projection completed
- projection partially failed
- drift detected
- drift resolved
- Symphony consumption started

Metrics should include:

- time from intake start to approved spec
- time from approval to full Linear projection
- projection failure rate
- drift incidence rate
- percentage of projected stories successfully consumed by Symphony

## Risks

## 1. Over-Generation

The system may create too many low-quality stories if decomposition is naive.

Mitigation:

- constrain decomposition heuristics
- require acceptance criteria quality checks
- support collaborator review before downstream execution begins

## 2. Spec Ambiguity

Weak intake quality will produce weak plans automatically.

Mitigation:

- require structured summaries before approval
- block approval when required fields are missing
- surface explicit assumptions

## 3. Linear Model Drift

Linear's hierarchy or agent APIs may evolve.

Mitigation:

- isolate Linear adapter logic
- keep projector contracts typed and test-backed
- prefer official API primitives and documented agent patterns

## 4. Circular Ownership Regression

Teams may start editing Linear as though it were product truth.

Mitigation:

- make ownership visible in the UI and artifact bodies
- preserve spec provenance everywhere
- enforce reconcile-up rather than auto-sync-up

## Phased Rollout

### Phase 1

- spec compiler
- approval workflow
- basic Linear projection
- Symphony-compatible story generation

### Phase 2

- drift detection
- reconciliation UX
- stronger observability

### Phase 3

- richer decomposition controls
- smarter requirement completeness scoring
- reusable templates by app type

## Recommended First Build Slice

Build the thinnest vertical slice that proves the architecture:

1. agent-first intake
2. repo-local spec draft and approval
3. automatic projection to one Linear Project with one or more Issues and provenance
4. Symphony picks up one projected issue successfully

Then extend to:

5. Linear-first intake
6. Initiative and dependency generation
7. drift detection and reconciliation

## Open Questions

- Which exact Linear artifact types best map to initiative and epic in the target workspace?
- Should generated stories enter `Todo`, a dedicated intake-ready state, or another pre-execution state?
- Where should the spec live relative to downstream application repositories if the intake service spans multiple target repos?
- What is the collaborator authorization source of truth for approval?

## Recommendation

Proceed with a spec-centric, one-way requirements architecture:

- repo-local spec is canonical
- approved revisions project automatically into Linear
- Linear remains a planning and execution surface
- Symphony remains the execution engine
- drift is reconciled explicitly, never silently

This gives the system a clear control plane for product intent while preserving the existing strengths of Symphony's execution model.

## References

- OpenAI, "Harness Engineering" (2026-02-11): https://openai.com/index/harness-engineering/
- OpenAI, "Unlocking the Codex Harness with App Server" (2026-02-04): https://openai.com/index/unlocking-the-codex-harness/
- Obra Superpowers repository: https://github.com/obra/superpowers
- Conductor repository: https://github.com/gemini-cli-extensions/conductor
- Linear Docs, "Initiatives": https://linear.app/docs/initiatives
- Linear Docs, "Sub-initiatives": https://linear.app/docs/sub-initiatives
- Linear Docs, "Project overview": https://linear.app/docs/project-overview
- Linear Docs, "Project dependencies": https://linear.app/docs/project-dependencies
- Linear Docs, "Parent and sub-issues": https://linear.app/docs/parent-and-sub-issues
- Linear Docs, "Issue relations": https://linear.app/docs/issue-relations
- Linear Docs, "Estimates": https://linear.app/docs/estimates
- Linear Docs, "Labels": https://linear.app/docs/labels
- Linear Developer Docs, "Agents": https://linear.app/developers/agents
- Linear Developer Docs, "Agent Interaction": https://linear.app/developers/agent-interaction
- Linear Developer Docs, "Agent Best Practices": https://linear.app/developers/agent-best-practices
- Linear Developer Docs, "Webhooks": https://linear.app/developers/webhooks
- Linear Developer Docs, "Create Issues Using linear.new": https://linear.app/developers/create-issues-using-linear-new
