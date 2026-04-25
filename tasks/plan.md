# Mission Plan: Unified Dialog System [047]

> **Status**: `[DONE]`
> **Mission**: Standardize and simplify the modal system by unifying `Alert` and `Confirm` into a single `Dialog.svelte` component and aligning the aesthetic with the high-end `glass-xxl` "Floating Monolith" pattern.

## Proposed Changes

### [UI & Aesthetics]

- [x] **Modal.svelte**: Added a `mini` variant for smaller dialogs (max-width: 400px).
- [x] **Dialog.svelte**: Created a unified molecule handling both `'alert'` and `'confirm'` types.
- [x] **Layout**: Implemented the Header -> Body -> Footer pattern from the Profile panels.

### [Hygiene]

- [x] **Profile.svelte**: Migrated to `<Dialog type="confirm">`.
- [x] **ControlPanel.svelte**: Migrated to `<Dialog type="confirm">`.
- [x] **StorymodeFeed.svelte**: Migrated to `<Dialog type="confirm">`.
- [x] **Deletion**: Removed deprecated `Alert.svelte` and `Confirm.svelte` files.

## Verification

- [x] `Dialog` appears correctly for "Reset Data" in the Control Panel.
- [x] `Dialog` appears correctly for entity deletion in the Profile.
- [x] Component is visually consistent with the Nordic Collection laws.
- [x] `npm run verify` passes globally.
