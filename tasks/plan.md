# Mission Plan: Skill Rewiring & Script Realignment [046]

> **Status**: `[PLANNING]`
> **Mission**: Synchronize all `.agent/skills` with the actual project infrastructure and scripts. Merge sub-references into primary skill files, update templates, and implement missing audit logic to prevent "hallucination debt".

## Proposed Changes

### [Infrastructure & Tooling]

- [ ] **package.json**: Add `audit:theme`, `audit:perf`, `audit:logic`, and `audit:api` aliases.
- [ ] **warden.js**: Implement `--theme` filter to audit Rule 04 (Aesthetics) compliance.

### [Skills & Documentation]

- [ ] **Designer**: Merge `references/` into `SKILL.md` and elevate to "Director" role.
- [ ] **Designer**: Update `design.template.md` (fix `translateY` and tokens).
- [ ] **Motion/Audio/JS**: Align all audit commands with the new script registry.
- [ ] **Warden**: Sync all skill audit patterns with `audit:warden`.

## Verification

- [ ] `npm run audit:theme` correctly identifies Rule 04 violations.
- [ ] All `SKILL.md` files are self-contained (no broken external references).
- [ ] `npm run verify` passes globally.
