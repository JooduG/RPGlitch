---
description: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
---

# [/03-clean](./03-clean.md) - The Clinic

> **Goal:** Sanitize the codebase and resolve identified bugs.

## 1. Triggers

- **Bug Fix**: Labeled issues or manual reports.
- **Security Check**: Audit requests or scheduled scans.
- **Slash Command**: [/03-clean](./03-clean.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **Audit**: [Audit Engine](../skills/warden/scripts/audit-engine.js) script. 

## 3. Procedures

### Phase 1: The Clarity Gate

1. **Sync**: Run `/00-boot` to ensure environment resonance. [[Invoke: DevOps]](../skills/devops/SKILL.md)
2. **Audit**: Execute the `warden` skill and `npm audit`. [[Invoke: Warden]](../skills/warden/SKILL.md)
3. **Trace**: Map the logic path to the bug. [[Invoke: Simulation]](../skills/simulation/SKILL.md)

### Phase 2: Sanitization & Debt Management

1. **Purge**: Delete unused assets and legacy artifacts. [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)
2. **Standard**: Apply fixes using **Runes** and **Chalk Tokens** exclusively. [[Invoke: Svelte]](../skills/svelte/SKILL.md)
3. **Technical Debt Handling**: Wrap all out-of-scope messy code, non-critical bugs, or unresolved edge cases in professional `#TODO-AI:` tags. Do not spiral into dependency hell trying to fix everything at once.

### Phase 3: The Quality Gate

1. **Verify**: Every fix REQUIRES a regression test. Prove success with terminal evidence. Execute `run npm verify`, if the test fails begin Phase 1, if/else proceed. [[Invoke: Warden]](../skills/warden/SKILL.md)
2. **Scrub**: Remove `console.log` and temporary debugging artifacts. [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)

## 4. Anti-Patterns

- **The Patch**: Fixing symptoms instead of root systems.
- **Dangling Debt**: Committing fixes without cleaning up surrounding technical debt or logging it properly with `#TODO-AI:`.
- **Silent Security**: Ignoring `npm audit` warnings.
