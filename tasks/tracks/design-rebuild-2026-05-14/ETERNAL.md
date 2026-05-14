# 🏛️ Eternal (The Spec) - design-rebuild-2026-05-14

## 1. Objective
Deconstruct and rebuild the Sovereign Source (`DESIGN.md`) to ensure absolute structural integrity of the Chalk Regime. Remediate technical debt in the Weaver bridge (`sync-tokens.js`) and audit the codebase for architectural drifts (Heresy).

## 2. Success Criteria
- [ ] `DESIGN.md` follows a strict 4-tier structural deconstruction (Foundations, Semantics, Organisms, Realization).
- [ ] `sync-tokens.js` is refactored for modularity and handles the new structure without error.
- [ ] `npm run audit:css` returns 0 violations.
- [ ] All UI components reflect the updated token registry.

## 3. Boundaries & Constraints
- **Always**: Ground every change in Svelte 5 Runes if applicable.
- **Always**: Use relative paths for internal resolution.
- **Never**: Use hardcoded `px`, `rem`, or `#` values (Heresy).
- **Never**: Modify `design.css` or `tokens.js` manually; use the Weaver bridge.

## 4. Tech Stack & Structure
- **Source**: `DESIGN.md`
- **Bridge**: `.agents/skills/css/scripts/sync-tokens.js`
- **Output**: `src/theme/design.css`, `src/theme/tokens.js`
- **Auditor**: `.agents/skills/governance/scripts/warden.js`

## 5. Logic Path
1. **Deconstruction**: Organize `DESIGN.md` into the 4-tier architecture.
2. **Bridge Refactor**: Update `sync-tokens.js` to parse and generate from the new tiers.
3. **Synchronization**: Run `npm run sync:design` to manifest the new registry.
4. **Remediation**: Use Warden to find and fix any hardcoded drifts in the codebase.
