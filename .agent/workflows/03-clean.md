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

- **Shield**: [.agent/rules/04-shield.md](../rules/04-shield.md).
- **Naming**: `naming-analyzer.js` script.

## 3. Procedures
1. **Sync**: Run `/00-boot` to ensure the environment is pristine. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Audit**: Execute `naming-analyzer.js` and `npm audit`. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
3. **Purge**: Delete unused assets and legacy artifacts.
4. **Trace**: Map the logic path to the bug. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
5. **Standard**: Apply fixes using **Runes** and **Chalk Tokens** exclusively.
6. **Verify**: Every fix REQUIRES a test. Prove it with terminal evidence.
7. **Scrub**: Remove `console.log` and draft comments. [[Invoke: scribe]](../skills/scribe/SKILL.md)

## 4. Anti-Patterns
- **The Patch**: Fixing symptoms instead of systems.
- **Dangling Debt**: Committing fixes without cleanup.
