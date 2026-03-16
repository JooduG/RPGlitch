# Workflow: 11-security-scan (Nightly Audit)

> **Triggered by**: Nightly Cron Job.

## Phase 1: The Audit

Scan the codebase for the following vulnerabilities:

- **Critical**: Hardcoded secrets, API keys, SQL/Command injection, missing auth.
- **High**: XSS (Ensure `safeHtml` action is used, never raw `innerHTML`), CSRF, missing input validation.
- **Physics Check**: Ensure all code adheres to `.agent/rules/04-shield.md`.

## Phase 2: Resolution

1. Fix the highest severity issues first.
2. Keep the PR footprint under 100 lines.
3. Run `npm run check` before generating the PR.
