---
name: 11-security-scan
description: Nightly security audit and vulnerability scan.
---

# 11-security-scan (Nightly Audit)

> **Goal:** Proactively identify and neutralize security risks before they reach production.

## 1. Triggers

- **Scheduled**: Nightly Cron Job.
- **On Request**: "Run a security audit".
- **Slash Command**: `/11-scan`

## 2. Brain (Context Injection)

- **Rules**: `.agent/rules/04-shield.md` (Security).
- **Tool**: `npm run check`.

## 3. Procedures

### Phase 1: The Audit

Scan the codebase for the following vulnerabilities:

1. **Critical**: Hardcoded secrets, API keys, SQL/Command injection, missing auth.
2. **High**: XSS (Ensure `safeHtml` action is used, never raw `innerHTML`), CSRF, missing input validation.
3. **Physics Check**: Ensure all code adheres to `.agent/rules/04-shield.md`.

### Phase 2: Resolution

1. Fix the highest severity issues first.
2. Keep the PR footprint under 100 lines.
3. Run `npm run check` before generating the PR.
