---
name: 03-clean
description: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
---

# 03-clean (The Clinic)

> **Goal:** Sanitize the codebase and resolve identified bugs.

## 1. Triggers

- **Bug Fix**: Labeled issues or manual reports.
- **Security Check**: Audit requests or scheduled scans.
- **Slash Command**: [/03-clean](./03-clean.md)

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/04-shield.md](../rules/04-shield.md).
- **Audit**: `naming-analyzer.js` script.

## 3. Procedures

### Phase 1: The Clarity Gate (Diagnosis)

1. **Sync**: Run `/00-boot` to ensure environment resonance. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Audit**: Execute the `naming-analyzer` skill and `npm audit`. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
3. **Trace**: Map the logic path to the bug. [[Invoke: simulation]](../skills/simulation/SKILL.md)

### Phase 2: Sanitization & Debt Management

1. **Purge**: Delete unused assets and legacy artifacts. [[Invoke: scribe]](../skills/scribe/SKILL.md)
2. **Standard**: Apply fixes using **Runes** and **Chalk Tokens** exclusively. [[Invoke: svelte]](../skills/svelte/SKILL.md)
3. **Technical Debt Handling**: Wrap all out-of-scope messy code, non-critical bugs, or unresolved edge cases in professional `#TODO-AI:` tags. Do not spiral into dependency hell trying to fix everything at once.

### Phase 3: The Quality Gate (Validation)

1. **Verify**: Every fix REQUIRES a regression test. Prove success with terminal evidence. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Scrub**: Remove `console.log` and temporary debugging artifacts. [[Invoke: scribe]](../skills/scribe/SKILL.md)

## 4. Anti-Patterns

- **The Patch**: Fixing symptoms instead of root systems.
- **Dangling Debt**: Committing fixes without cleaning up surrounding technical debt or logging it properly with `#TODO-AI:`.
- **Silent Security**: Ignoring `npm audit` warnings.
