# Tech Debt Tracker

**Status:** Active  
**Last Updated:** 2026-03-09

## Open Debt Items

### TD-001: Linear label scope handling is still heuristic

- **Owner:** Linear projector
- **Impact:** Mixed workspace-scoped and team-scoped labels may resolve inconsistently when new managed labels are introduced.
- **Exit Criteria:** Capability discovery resolves label scope explicitly and projection tests cover workspace/global plus team-local label lookup.

### TD-002: Direct Symphony pickup is not yet observed

- **Owner:** Terminal intake watch path
- **Impact:** Watch mode infers pickup from Linear state transitions instead of reading a first-class Symphony execution signal.
- **Exit Criteria:** Watch mode consumes a Symphony-native pickup/writeback signal or tracker adapter and tests prove it.

### TD-003: Target repo placement for canonical specs is still open

- **Owner:** Intake and projection design
- **Impact:** Multi-repo rollout could create ambiguity about where the source-of-truth spec lives.
- **Exit Criteria:** Architecture decision recorded for single-repo and multi-repo deployments.

### TD-004: Live smoke artifact cleanup policy is not defined

- **Owner:** Requirements intake workflow
- **Impact:** Real-workspace verification creates durable Linear artifacts without a standard archive/delete path.
- **Exit Criteria:** Add a documented cleanup convention or automated smoke-workspace retention rule.

### TD-005: Project workspace registry and config migration are not yet defined

- **Owner:** Intake and orchestration runtime
- **Impact:** New-versus-existing project binding and the move from `harness.config.json` to `WORKFLOW.md` can drift unless one authoritative project registry and migration path are defined.
- **Exit Criteria:** Record the project-binding storage contract, make `WORKFLOW.md` authoritative for execution settings, and limit `harness.config.json` reads to an explicit compatibility bridge with tests.

### TD-006: Public release still depends on a legacy runtime-config fallback

- **Owner:** Runtime configuration
- **Impact:** Public docs now point to `WORKFLOW.md`, but the code still accepts `harness.config.json`, which keeps two runtime surfaces alive.
- **Exit Criteria:** Remove the legacy JSON fallback after migration, keep `WORKFLOW.md` as the only documented and supported runtime contract, and retain tests only for the final public path.
