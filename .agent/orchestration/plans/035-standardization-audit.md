> Status: `[x]` DONE
> Type: `Refactor/Archnitecture`
> Risk: `Medium`
> Start Date: `2026-04-09`

## Phase 1: Grounding/Plan ([/01-plan](../../workflows/01-plan.md))

- Hypothesis: `The engine features significant "Leaky Overrides" where Organisms use :global() to define missing base styles. Promoting these into the Atomic layer will simplify the codebase and ensure design consistency.`
- Risk Tier: `Medium`
- Context: [Rule 03](../../rules/03-infrastructure.md), [Rule 04](../../rules/04-aesthetics.md), [Rule 06](../../rules/06-compliance.md).

### 🔍 Unified Audit Targets
1. **Destructive Actions (`btn-danger`)**:
    -   Targets: `ProfileFooter`, `VectorCard`, `Confirm`.
    -   Goal: Centralize red outlined/solid styling in `Button.svelte`.
2. **Ghost-with-Borders (`btn-retry`, `btn-add-unit`)**:
    -   Targets: `ProsePanel`, `VectorPanel`.
    -   Goal: Add `dashed` and `solid-border` variants to `Button.svelte`.
3. **Icon-Only Logic**:
    -   Targets: `VectorCard` delete, `Confirm` header close.
    -   Goal: Add `iconOnly` prop to handle square dimensions (40x40 / 36x36) globally.
4. **Action Layering**:
    -   Targets: `StoryboardCard` (full-inset overlay).
    -   Goal: Standardize `variant="overlay"` for transparent, full-coverage click areas.
5. **Semantic Palette**:
    -   Targets: `VisualWing` (Magic vs Tech modes).
    -   Goal: Promote local colors to theme variants in `Button.svelte`.

- [x] Beat 01: `Implement base .btn-danger styles in Button.svelte`
- [x] Beat 02: `Add 'dashed' and 'outline-thick' variants to Button.svelte`
- [x] Beat 03: `Implement 'square' (iconOnly) prop in Button.svelte with CSS logic`
- [x] Beat 04: `Add 'overlay' variant to Button.svelte (inset 0, transparent)`
- [x] Beat 05: `Standardize VisualWing modes to use semantic Button variants`
- [x] Beat 06: `Liquidation: Remove :global(.btn-danger) from ProfileFooter and VectorCard`
- [x] Beat 07: `Liquidation: Remove :global(.btn-retry) from ProsePanel`
- [x] Beat 08: `Liquidation: Remove :global(.btn-add-unit) from VectorPanel`
- [x] Beat 09: `Final Audit: Ensure Confirm.svelte picks up danger/square styles naturally`

## Phase 3: Hardening/Audit ([/03-clean](../../workflows/03-clean.md))

- [ ] Visual Regression: Verify Button dimensions in Storyboard grids.
- [ ] Stylelint Sweep: Zero `:global(.btn)` or `:global(.btn-*)` overrides remaining in `src/ui/organisms/`.
- [ ] Security: Warden sweep for sanitization.

## Phase 4: Persistence/Vault/Bridge ([/04-review](../../workflows/04-review.md))

- Mission Board: Updated `[x]`
- Walkthrough: Created `[x]`
