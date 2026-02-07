# 📝 Plan: StoryMode Restoration

## Phase 1: Layout Engine Update

- [ ] **Modify `src/ui/organisms/Layout.svelte`**
    - [ ] Update `universal-stage` grid for mobile.
    - [ ] Add `grid-template-areas` or specific column logic for `layout-cinematic`.
    - [ ] Ensure side columns (`.stage-column--side`) are `display: flex` on mobile when in cinematic mode.

## Phase 2: Panel Visuals

- [ ] **Modify `src/ui/organisms/storymode/StorymodePanel.svelte`**
    - [ ] Update `.cinematic-overlay` to use `var(--entity-color)` for the gradient.
    - [ ] Ensure `background-blend-mode` or `opacity` allows the image to show through correctly.
    - [ ] Verify `mode="full"` styles are isolated.

## Phase 3: Integration

- [ ] **Review `src/ui/organisms/storymode/Storymode.svelte`**
    - [ ] Verify props passed to `StorymodePanel`.
    - [ ] Check if `input-container` behavior on mobile needs adjustment (sticky bottom).

## Phase 4: Verification

- [ ] **Manual Test**: Switch to StoryMode.
- [ ] **Manual Test**: Resize to mobile width.
- [ ] **Validation**: Check contrast and overlay readability.
