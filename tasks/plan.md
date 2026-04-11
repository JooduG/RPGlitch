# MISSION PLAN: Nordic Glass Refactor [023]

**Goal**: Align the `LibraryCard` and the "Create New" template card in `LibraryDrawer` with the "Nordic Collection" aesthetics (frosted glass, specular highlights, and calibrated shadows) established in `StoryboardCard.svelte`.

## User Review Required

> [!IMPORTANT]
> This refactor will update the visual materials of the Library drawer components. The structure will remain largely the same, but the "look and feel" will shift from basic transparency to the "Chalk Regime" / "Nordic Collection" standard.

## Proposed Changes

### UI: Organisms (`src/ui/organisms/`)

#### [MODIFY] [LibraryCard.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/library/LibraryCard.svelte)
- **Material Update**: Apply `glass-base` properties:
  - `background: var(--glass-s)`
  - `backdrop-filter: var(--glass-blur-m)`
  - `border: var(--glass-edge-l)`
  - `border-top: var(--glass-edge-xl)` (Specular highlight)
- **Typography Check**: Ensure `entity-name` matches the signature color and visibility of the Nordic standard.
- **Interactives**: Ensure hover states align with the `surface-tilt` and `material-interactive` patterns.

#### [MODIFY] [LibraryDrawer.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/library/LibraryDrawer.svelte)
- **Template Card**: Refactor `.drawer-card--new` to utilize Nordic glass primitives.
- **Grid Layout**: Ensure the grid spacing (`gap: var(--spacing-l)`) remains balanced with the new card aesthetics.

---

## Verification Plan

### Automated Tests
- `npm run verify`: General verification of the build and reactive state.
- Component Audit: I will use the `browser-subagent` to visually verify the changes in a simulated environment if possible (or rely on code inspection against the `tokens.css` source of truth).

### Manual Verification
- Verify that `LibraryCard` and `StoryboardCard` feel like part of the same "set" when viewed in succession.
- Confirm the `Create New` card stands out appropriately while maintaining material consistency.
