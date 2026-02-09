# 📝 Plan: StoryMode Restoration

## Phase 1: Layout Engine Update

- [x] **Modify `src/ui/organisms/Layout.svelte`**
    - [x] Update `universal-stage` grid for mobile.
    - [x] Add `grid-template-areas` or specific column logic for `layout-cinematic`.
    - [x] Ensure side columns (`.stage-column--side`) are `display: flex` on mobile when in cinematic mode.

## Phase 2: Panel Visuals

- [x] **Modify `src/ui/organisms/storymode/StorymodePanel.svelte`**
    - [x] Update `.cinematic-overlay` to use `var(--entity-color)` for the gradient.
    - [x] Ensure `background-blend-mode` or `opacity` allows the image to show through correctly.
    - [x] Verify `mode="full"` styles are isolated.

## Phase 3: Integration

- [x] **Review `src/ui/organisms/storymode/Storymode.svelte`**
    - [x] Verify props passed to `StorymodePanel`.
    - [x] Check if `input-container` behavior on mobile needs adjustment (sticky bottom).

## Phase 4: Verification (Desktop)

- [x] **Manual Test**: Switch to StoryMode.
- [x] **Desktop**: Cinematic wings (left/right) frame the content.
- [x] **Validation**: Panels glow with character's signature color.

## Phase 5: Verification (Mobile)

- [x] **Layout**: Panels stack side-by-side (50% width) in top row.
- [x] **Height**: Panels constrained to `25vh`.
- [x] **Order**: Header -> AI/User Panels -> Story Feed -> Input Bar.
- [x] **Aesthetics**: Full-bleed visuals with hard-light overlay.

## 📝 Handoff Notes (Merged 2026-02-09)

- **Cinematic Stacking**: Mobile side panels use `display: flex` and `25vh` fixed height.
- **StorymodePanel**: Uses `mix-blend-mode: hard-light` for dynamic signature color gradient.
- **Constraint**: `25vh` height on mobile is intentional; content overflows hidden.

## Phase 6: UI Polish & Actions (Refinements)

- [ ] **Global Styling**
    - [ ] Force all message text color to `#fff` (white).
    - [ ] Update `fractal-bubble` background to requested gradient/style.
- [ ] **Message Actions**
    - [ ] Implement Hover Overlay on `Message.svelte`.
    - [ ] Add Actions: `Reroll/Regenerate`, `Edit`, `Continue`, `Read Aloud`, `Delete`.
    - [ ] **Interaction**: Timestamp goes solid (`opacity: 1`) on hover.
- [ ] **Logic Integration**
    - [ ] Wire up `delete` and `regenerate` dispatch events in `Storymode.svelte`.
    - [ ] Implement `continue` (extend) logic.
