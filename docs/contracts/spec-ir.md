# Spec IR Contract

**Status:** Draft  
**Last Updated:** 2026-03-09  
**Purpose:** Define the canonical structured representation derived from the repo-local spec document.

## Why This Exists

The markdown spec is the human-facing source of truth. The system also needs a deterministic machine-readable representation for:

- approval gating
- Linear projection
- drift detection
- Symphony handoff
- idempotent updates across spec revisions

The Spec IR exists to provide that representation without making Linear itself the source of truth.

## Contract Goals

- preserve a stable identity for every decomposable planning node
- separate human-readable authoring from machine-readable projection
- make revision-to-revision diffs deterministic
- allow projection without reparsing ambiguous prose every time

## Top-Level Shape

The canonical IR should serialize to a single object with this logical structure:

```ts
interface SpecIR {
  metadata: SpecMetadata;
  context: SpecContext;
  requirements: SpecRequirements;
  planning: SpecPlanning;
  verification: SpecVerification;
  projection: SpecProjectionState;
}
```

## Metadata

```ts
interface SpecMetadata {
  specId: string;
  revision: number;
  title: string;
  status:
    | "draft"
    | "needs_review"
    | "approved"
    | "projecting"
    | "projected"
    | "drifted"
    | "superseded";
  createdBy: ActorRef;
  approvedBy: ActorRef[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  sourceEntryPoint: "agent" | "linear";
  sourceSessionId: string;
  parentRevision?: number;
}
```

## Context

```ts
interface SpecContext {
  problemStatement: string;
  productOutcome: string;
  intendedUsers: UserPersona[];
  goals: string[];
  nonGoals: string[];
  constraints: string[];
  assumptions: string[];
  integrations: IntegrationRequirement[];
  qualityBar: string[];
}
```

## Requirements

```ts
interface SpecRequirements {
  featureAreas: FeatureArea[];
  edgeCases: EdgeCase[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
}
```

### Feature Areas

Feature areas are the main decomposition root for planning.

```ts
interface FeatureArea {
  id: string;
  name: string;
  summary: string;
  stories: StoryNode[];
  dependencies: DependencyRef[];
}
```

### Stories

Stories are the primary executable planning units and map to Linear Issues by default.

```ts
interface StoryNode {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  acceptanceCriteria: AcceptanceCriterion[];
  labels: string[];
  estimate?: EstimateRef;
  workflowTarget?: WorkflowTarget;
  dependencies: DependencyRef[];
  implementationNotes?: string[];
  outOfScope?: string[];
}
```

### Acceptance Criteria

```ts
interface AcceptanceCriterion {
  id: string;
  text: string;
  priority: "must" | "should" | "could";
}
```

## Planning

```ts
interface SpecPlanning {
  initiative?: InitiativePlan;
  projectPlans: ProjectPlan[];
}

interface InitiativePlan {
  id: string;
  title: string;
  summary: string;
  criteria: string[];
}

interface ProjectPlan {
  id: string;
  featureAreaId: string;
  title: string;
  summary: string;
  ownerHint?: string;
  targetDate?: string;
}
```

## Verification

```ts
interface SpecVerification {
  releaseReadiness: string[];
  storyLevelChecks: VerificationRequirement[];
}

interface VerificationRequirement {
  id: string;
  scope: "spec" | "project" | "story";
  appliesToId: string;
  kind: string;
  requirement: string;
}
```

## Projection State

Projection state tracks what has happened to this revision. It is metadata about the spec, not the source of truth for planning intent.

```ts
interface SpecProjectionState {
  lastProjectedRevision?: number;
  lastProjectionAt?: string;
  lastProjectionHash?: string;
  linearMappings: SpecLinearMapping[];
  driftStatus: "clean" | "drifted" | "unknown";
}
```

## Shared Types

```ts
interface ActorRef {
  id: string;
  displayName: string;
  source: "agent" | "linear" | "system";
}

interface UserPersona {
  id: string;
  name: string;
  description: string;
}

interface IntegrationRequirement {
  id: string;
  system: string;
  requirement: string;
}

interface EdgeCase {
  id: string;
  description: string;
  expectedHandling: string;
}

interface NonFunctionalRequirement {
  id: string;
  category: string;
  requirement: string;
}

interface EstimateRef {
  value: number | string;
  source: "explicit" | "derived";
}

interface WorkflowTarget {
  teamKey: string;
  stateName: string;
}

interface DependencyRef {
  id: string;
  type: "blocks" | "blocked_by" | "related";
  targetNodeId: string;
}

interface SpecLinearMapping {
  specNodeId: string;
  linearObjectType: "initiative" | "project" | "issue";
  linearObjectId: string;
  linearObjectIdentifier?: string;
}
```

## Stable ID Rules

Stable IDs are critical. They must survive non-structural edits so projections update existing Linear objects instead of duplicating them.

Rules:

1. IDs are created when a node is first introduced.
2. Text-only edits must not change IDs.
3. Reordering nodes must not change IDs.
4. Splitting one story into two stories creates two new IDs and supersedes the original node ID.
5. Merging stories creates a new ID unless one story clearly survives and the other is retired.

## Revision Rules

- Every approved projection references one immutable `revision`.
- IR for old revisions must remain reconstructible.
- New revisions may inherit unchanged node IDs when structure is preserved.
- Superseded revisions remain readable for audit and drift analysis.

## Minimum Completeness Gate

A revision cannot advance to `ready_for_approval` unless the IR contains:

- `metadata.title`
- `context.problemStatement`
- at least one `intendedUsers` entry
- at least one `featureAreas` entry
- at least one `stories` entry
- at least one acceptance criterion for each story
- `goals`
- `nonGoals`
- `constraints` or explicit `assumptions`

## Compiler Output Guarantees

The spec compiler must guarantee:

- canonical field ordering
- deterministic markdown-to-IR normalization
- stable IDs when structure is unchanged
- empty arrays instead of null for repeated collections
- explicit omission instead of ambiguous placeholder text

## Test Requirements

This contract is not complete until tests prove:

- incomplete sessions do not produce approvable IR
- stable IDs survive title and prose edits
- structural changes produce expected ID churn
- deterministic serialization produces identical output for identical input
- story-to-project-to-initiative relationships are preserved in IR
