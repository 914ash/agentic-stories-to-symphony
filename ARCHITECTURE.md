# Architecture Map

**Status:** Draft  
**Last Updated:** 2026-03-09

This workspace implements a spec-first requirements intake system that projects approved planning artifacts into Linear and hands execution to Symphony.

## Layering

Preferred dependency direction:

1. `src/types`
2. `src/domain`
3. `src/adapters`
4. `src/services`
5. `src/interfaces`

Rules:

- lower layers never import higher layers
- external systems stay inside adapters
- orchestration lives in services
- interfaces translate external requests into service calls

## Core Components

### Types

Owns DTOs, schema contracts, and normalized representations such as Spec IR and intake state payloads.

### Domain

Owns pure logic:

- intake completeness rules
- revision transition rules
- field ownership rules
- deterministic mapping decisions

### Adapters

Owns side-effecting integrations:

- filesystem-backed spec storage
- filesystem-backed mapping storage
- Linear GraphQL access
- capability detection for target workspaces

### Services

Owns orchestration:

- intake session progression
- spec compilation
- approval workflow
- Linear projection
- drift detection and reconciliation

### Interfaces

Owns entry points:

- agent-first intake
- Linear-first intake
- future CLI or HTTP surfaces

## Source Of Truth Rule

The repo-local spec document and its derived Spec IR are canonical.

Planning direction is one-way:

`conversation -> spec -> Linear projection -> Symphony execution`

Linear is never an equal source of product intent.

## Boundary Contracts

- validate all external input at the interface or adapter boundary
- normalize all planning data into Spec IR before orchestration logic
- keep projection ownership explicit between spec-owned and human-editable fields
- fail loudly when Linear capabilities cannot represent an approved revision

## Operational Expectations

- all approval and projection events should carry correlation IDs
- all projection steps should be idempotent
- drift detection should be explicit and auditable
- Symphony handoff should remain issue-centric

## Near-Term Build Order

1. repo scaffolding and test harness
2. intake types and completeness rules
3. intake session orchestration
4. spec compiler and store
5. approval workflow
6. minimal Linear Project-and-Issue projection
7. Symphony handoff verification

## Open Architectural Questions

- what is the final approval authorization source of truth
- where canonical specs live in a multi-repo deployment
- how fallback projection behaves when workspace planning features are partially disabled
