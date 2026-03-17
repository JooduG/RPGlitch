---
name: 04-refinery
description: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
---

# 04-refinery (The Clinic)

> **Goal:** Maintain code health and ensure the engine remains "resonant" and secure.

## 1. Triggers
- **Bug Report**: GitHub Issue `kind/bug`.
- **Security Alert**: Verification failure or scheduled scan.
- **Slash Command**: `/04-refinery`

## 2. Brain (Context Injection)
- **Security**: `.agent/rules/04-shield.md`.
- **Hygiene**: `eslint.config.js`.
- **State**: `.agent/state/tracks.md`.

## 3. Procedures

### Phase 1: Diagnosis
1. **Trace**: If fixing a bug, trace the logic until the root cause is isolated.
2. **Audit**: If scanning security, check for secrets, `innerHTML` abuse, or input injection.

### Phase 2: Surgical Fix
1. **Scope**: Create a minimal, targeted fix. No "accidental refactors" of unrelated code.
2. **Standard**: Use Svelte 5 Runes and Chalk tokens.

### Phase 3: Verification
1. **Test**: A fix without a test is just a delay. Prove the resolution with a unit/E2E test.
2. **Clean**: Remove `console.log`, `FIXME`, or dead comments.

## 4. Anti-Patterns
- **The Band-Aid**: Fixing the symptom instead of the cause.
- **Style Bleed**: Using non-standard CSS to "patch" a UI bug.
- **Untested Fixes**: Marking a bug resolved without a passing test.
