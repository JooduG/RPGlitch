---
name: 10-bug-fix
description: Automated bug resolution protocol.
---

# 10-bug-fix (Automated Resolution)

> **Goal:** Detect, diagnose, and resolve bugs with high precision and matching test coverage.

## 1. Triggers

- **GitHub Issue**: Labeled `kind/bug`.
- **System Alarm**: Verification failure in CI/CD.

## 2. Brain (Context Injection)

- **Rules**: `.agent/rules/03-technetium.md` (Svelte/Chalk) and `.agent/rules/04-shield.md` (Security).
- **Execution Script**: `.agent/skills/quality-assurance/scripts/naming-analyzer.js`.

## 3. Procedures

### Phase 1: Context & Physics

1. Read `.agent/state/global.md` to understand current WIP.
2. Read `.agent/rules/03-technetium.md` and `.agent/rules/04-shield.md`. ALL fixes must strictly adhere to these physics.

### Phase 2: Diagnosis & Resolution

1. **Trace**: Analyze the provided issue body and trace the logic through the codebase.
2. **Fix**: Implement a minimal, targeted fix using Svelte 5 Runes and Chalk tokens.
3. **Test**: Write/update a unit test that proves the bug is squashed.
4. **Document**: Explain the root cause in the PR body.

## 4. Anti-Patterns

- **Reflex Patch**: Applying a fix without understanding the architectural impact.
- **Untested Fix**: Committing code without verification.
