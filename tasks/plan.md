# Mission Plan: Session Driver Restoration

> **Status**: `[ACTIVE]`
> **Mission**: Restore the integrity of the agentic Session Driver by correcting broken references in `GEMINI.md` to point to the newly consolidated skills, and initializing a fresh `tasks/plan.md` to comply with Rule 01 and Rule 05.

## Proposed Changes

### [Core: Infrastructure Sync]

#### [MODIFY] `GEMINI.md`
- **Line 11**: Replace `([spec-driven-development](./.agent/skills/spec-driven-development/SKILL.md)` with `([specification](./.agent/skills/specification/SKILL.md)`.
- **Line 27**: Replace `[idea-refine](./.agent/skills/idea-refine/SKILL.md)` with `[specification](./.agent/skills/specification/SKILL.md)` for conceptual ambiguity resolution.
- **Line 103**: Replace `[Spec-driven Development](./.agent/skills/spec-driven-development/SKILL.md)` with `[Specification](./.agent/skills/specification/SKILL.md)`.
- **Line 167 & 169**: Verify and ensure references to `[Mission Plan](./tasks/plan.md)` are functioning correctly.

#### [CREATE] `tasks/plan.md`
- This document (`tasks/plan.md`) serves as the active blueprint for future tasks, fulfilling the strict requirement of Rule 01 (The Handoff Law).

## Verification Plan

### Automated Checks
- Run Markdown linters (`npm run lint:md`) to ensure all broken links in `GEMINI.md` are resolved.
- Verify `tasks/plan.md` exists and follows the expected structure.

### Manual Verification
- Visual check of `GEMINI.md` to ensure the terminology aligns with the consolidated skills (`specification`, `planning`).
