---
description: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
---

# [/03-clean](./03-clean.md) - The Clinic

> **Goal:** Sanitize the codebase, resolve root causes, and enforce technical hygiene (Rule 06).

## 1. Triggers

- **Bug Fix**: Labeled issues or manual reports.
- **Security Check**: Audit requests or scheduled scans.
- **Slash Command**: [/03-clean](./03-clean.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/log.md](../project-management/log.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Step 3: Research)

1. **Sync**: Run `/00-boot` to ensure environment resonance.
2. **Audit**: Execute `warden` and `npm audit`. Identify vulnerabilities or logic flaws. [[Invoke: warden]](../skills/warden/SKILL.md)
3. **Trace**: Map the logic path to the bug. Use `scientificMethod` if the cause is non-obvious. [[Invoke: warden]](../skills/warden/SKILL.md)

### Phase 2: Sanitization (Step 5: Execution)

1. **Purge**: Delete unused assets or legacy code. [[Invoke: project-manager]](../skills/project-manager/SKILL.md)
2. **Root Fix**: Avoid "patching" symptoms. Standardize the fix using **Svelte 5 Runes** and **Chalk Regime** tokens. [[Invoke: svelte]](../skills/svelte/SKILL.md)
3. **Debt Handling**: Wrap out-of-scope messes in professional `TODO-AI:` tags. Register them in `next.md`. [[Invoke: intake]](../skills/intake/SKILL.md)

### Phase 3: The Quality Gate (Step 6: Completeness)

1. **Verify**: Every fix REQUIRES a regression test. Prove success with terminal evidence. Execute `npm run verify`. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Scrub**: Remove debug artifacts (`console.log`, temp files). Execute the "Boy Scout Rule". [[Invoke: project-manager]](../skills/project-manager/SKILL.md)

## 4. Anti-Patterns

- **The Patch**: Fixing symptoms instead of the system.
- **Silent Security**: Ignoring audit warnings.
- **Dangling Debt**: Leaving messes without `TODO-AI` tags.

### 🕹️ Operational Heartbeat

- **🤖 AGENTS.md**: Step 2.2 (Risk Routing - Clinic active)
- **📜 Rules**: Rule 01 (Foundation), Rule 06 (Compliance)
- **🧠 Capabilities**: warden (Security Audit), project-manager (Hygiene)
- **💾 State**: .agent/project-management/log.md
