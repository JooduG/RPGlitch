# Update Legacy .agent/ References

This plan outlines the steps to identify and update all remaining occurrences of the legacy `.agent/` directory reference to the new `.agents/` structure. This follows a recent rename to stabilize the environment and ensure all automated workflows function correctly.

## User Review Required

> [!NOTE]
> The search identified legacy references in `.agents/archive/` and `.agents/snapshots/`. Per previous instructions, these will be **ignored** as they are historical records. Only active configuration, documentation, and templates will be updated.

## Proposed Changes

### Documentation & Configuration

#### [MODIFY] [DESIGN.md](file:///c:/Users/johng/source/repos/RPGlitch/DESIGN.md)

- Update the link to Aesthetics rules from `.agent/rules/` to `.agents/rules/`.

#### [MODIFY] [vitest.config.js](file:///c:/Users/johng/source/repos/RPGlitch/vitest.config.js)

- Update comments on lines 35 and 39 that incorrectly refer to `.agent`. Note that the actual code already correctly uses `.agents`.

### Swarm Skill Templates

#### [MODIFY] [manifest.json](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/swarm/templates/manifest.json)

- Update `meta.workflow` and `meta.skill` paths to use `.agents/` instead of `.agent/`.

---

## Verification Plan

### Automated Tests

- Run `npm run audit` to ensure all audited paths and nomenclature are correct.
- Run `npm run test:unit` to verify that the Vitest configuration change (even if just comments) hasn't introduced any issues.
- Run `npm run deploy:prepare` to perform a full system check (lint, audit, test, build).

### Manual Verification

- Verify that the link in `DESIGN.md` correctly points to the existing file in the `.agents/rules/` directory.
