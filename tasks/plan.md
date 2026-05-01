# Mission Plan: [043] Release Candidate Stability Audit

Final verification and hardening of the RPGlitch Engine before the Foundry (v0.5) release. This audit ensures that the codebase is not only functional (passing tests) but also adheres to the strict aesthetic, architectural, and quality standards defined in the Sovereign Axiomatic Laws.

## Proposed Changes

### [Track 1: Code Hygiene & Logic]

#### [FIX] [intelligence-kernel.test.js](../src/core/intelligence/intelligence-kernel.test.js)
- Resolve the ESLint warning: `'runtime' is defined but never used`.

#### [AUDIT] AI-Trope Sweep
- Scan for and remove flowery language or "AI-isms" in code comments and logs (Rule 06 Compliance).
- Ensure all technical debt is tagged with `TODO-AI` or resolved.

### [Track 2: Aesthetic Consistency]

#### [AUDIT] The Chalk Regime
- Verify that all new UI components from [054] use named design tokens from `tokens.css` instead of raw values.
- Check for glassmorphic consistency (Glass Elevation scale).

#### [AUDIT] Kinetic Physics
- Verify that hover effects and transitions focus on brightness/color rather than layout shifts (Rule 04).

### [Track 3: Documentation & Meta]

#### [SYNC] [SPEC.md](../SPEC.md)
- Update version in SPEC from 0.6.0 (The Forge) to 0.5.0 (The Foundry) to match the current roadmap.
- Ensure all recently implemented patterns (Telemetry UI, Import Aliases) are reflected in the specification.

#### [AUDIT] Skill Alignment
- Verify that all `SKILL.md` files correctly point to existing scripts and follow the new directory structure.

## Verification Plan

### Automated Tests
- Run `npm run verify` one final time after all hygiene fixes.

### Manual Verification
- Perform a simulated round cycle and verify state persistence in Dexie.
- Visual audit of the UI to ensure the "Frozen Terminal" palette is consistent across all features.
