# Track Plan: Profile Layout Rebalance

## Objective

Stabilize and rebalance the `Profile.svelte` interface to align with the "Nordic Collection" aesthetic. This involves refining the 12x12 grid distribution, ensuring spatial harmony, and hardening the "Bolted Architecture" of the card and wings.

## Key Files & Context

- `src/ui/profile/Profile.svelte`: The primary orchestrator.
- `src/ui/profile/VisualWing.svelte`: The visual identity module.
- `src/ui/profile/AudioWing.svelte`: The sonic identity module.
- `DESIGN.md`: The Sovereign Source for Nordic aesthetics and Token Registry.

## Proposed Solution

1. **Grid Proportions (The 12x12 Rebalance)**:
   - Current viewing: Card centered (3-6-3).
   - Current editing: Card shifted (1-6-3).
   - **Target**: Ensure consistent "bolting" to the grid. Evaluate if a 2-8-2 or 1-10-1 distribution provides better immersion.
2. **Visual Continuity**:
   - Refactor wing backgrounds to use semantic tokens consistently.
   - Synchronize transition timings with `DESIGN.md` kinetic tokens.
3. **Responsive Hardening**:
   - Refine the flex-to-grid transition at breakpoints.
   - Ensure the "avatar-column" maintains golden-ratio proportions across viewports.
4. **Verification**:
   - Browser testing for layout stability.
   - Warden audit for Heresy (raw units).

## Implementation Steps

### Phase 1: Audit & Diagnostics

1. [ ] Perform a clinical audit of `Profile.svelte` grid values.
2. [ ] Map current wing dimensions to `DESIGN.md` organisms.

### Phase 2: Structural Refactor

1. [ ] Re-calculate the 12x12 grid positions for the `card` and `wings`.
2. [ ] Implement the "Bolted" border architecture for the wings.
3. [ ] Refactor transition logic to use `$state` and `$derived` for kinetic harmony.

### Phase 3: Aesthetic Polish & Verification

1. [ ] Apply Chalk Regime tokens to any remaining hardcoded colors/units.
2. [ ] Verify responsiveness on Mobile/Mini breakpoints.
3. [ ] Run `npm run verify` and `npm run audit:css`.

## Verification & Testing

- Vitest coverage for Profile state.
- Playwright E2E for Profile visibility and editing.
- Warden compliance check.
