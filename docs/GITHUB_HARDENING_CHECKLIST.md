# GitHub Hardening Checklist

Use this checklist after pushing to GitHub.

## Repository Security

- Enable dependency graph
- Enable Dependabot alerts
- Enable secret scanning
- Enable push protection

## Publication Safety

- Confirm no `.env` or private workflow files are tracked
- Confirm no live tracker IDs or private workspace paths appear in docs
- Confirm public-release artifacts are sanitized fixture outputs only

## Ongoing Maintenance

- keep `README.md` and `docs/landing.md` in sync
- update fork framing when upstream deltas change
- re-run artifact generation after UI flow changes
