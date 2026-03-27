# Agentic Stories To Symphony

Agentic Stories To Symphony is a planning-to-execution fork that adds spec-first intake, approval, and deterministic Linear projection ahead of Symphony-style runtime execution. The repo is built around a simple claim: product intent should become an approved planning artifact before it becomes a queue of execution tasks.

![Intake prompts](artifacts/public-release/01-intake-prompts.svg)
![Linear projection](artifacts/public-release/05-linear-projection.svg)

- **Status:** Active fork / planning prototype
- **Stack:** TypeScript, terminal workflow, Linear projection, public release artifacts
- **Problem:** Product intent often gets converted into tickets too early, without a durable in-repo source of truth or an auditable planning boundary.

## Why This Repo Exists

- To capture intent before ticket creation
- To make approval explicit before tracker write-back
- To keep planning provenance attached to projected execution stories
- To hand off better-defined work into Symphony-compatible execution

## What It Adds To The Base Symphony Model

- Guided terminal intake for product requirements
- Canonical in-repo spec revisions
- Approval gate before tracker projection
- Deterministic Linear story projection with rerun-safe provenance
- Execution watch flow for the handoff into agentic development

## Workflow

1. Run intake.
2. Review the compiled planning summary.
3. Approve the revision.
4. Project stories into Linear.
5. Hand those stories to Symphony-compatible execution.

## Run Locally

Requirements:

- Node.js 20+
- Linear API key
- Local `WORKFLOW.md` copied from `WORKFLOW.example.md`

```bash
npm ci
cp WORKFLOW.example.md WORKFLOW.md
export LINEAR_API_KEY="replace-with-your-linear-api-key"
npm run intake -- --approve-as demo-reviewer
```

PowerShell:

```powershell
Copy-Item WORKFLOW.example.md WORKFLOW.md
$env:LINEAR_API_KEY="replace-with-your-linear-api-key"
npm run intake -- --approve-as demo-reviewer
```

## Verification

- `npm test`
- `npm run build`
- `npm run artifacts:public`

## Current Limits

- The current public slice proves planning, approval, and projection; it does not replace Symphony with a native end-to-end runtime in this repo.
- Public screenshots are fixture-driven and sanitized for release.

## What To Read Next

- `docs/USER_GUIDE.md`
- `ARCHITECTURE.md`
- `docs/PLANS.md`
