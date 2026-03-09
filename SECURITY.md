# Security Policy

## Reporting

If you discover a security issue in this repository, open a private security advisory in GitHub or contact the maintainer directly before public disclosure.

## Scope

- workflow runtime behavior
- tracker integration paths
- credential handling and environment configuration
- artifact generation and public-release packaging

## Public Repo Safety Rules

- keep all live credentials in local env files only
- never commit `WORKFLOW.md` with private workspace identifiers
- keep `artifacts/public-release` sanitized and fixture-based
