# Track Plan: Profile Refactor & Simplification

## Objective

Complete the migration of `Profile.svelte` logic into the reactive `profile.svelte.js` controller. Standardize field access, simplify event handling, and ensure the UI remains a pure expression of the underlying state while adhering to the "Chalk Regime" axioms.

## Key Files & Context

- `src/ui/profile/Profile.svelte`: The component to be simplified.
- `src/ui/profile/profile.svelte.js`: The state controller to be hardened.
- `src/ui/profile/ProfileArray.svelte`: Component reacting to state changes.
- `src/ui/utils/field-path.js`: Dot-path utilities for field access.

## Proposed Solution

1. **Controller Hardening**:
   - Move `get_safe_value` and `set_field_value` logic into `ProfileState`.
   - Implement `add_vector_item` factory inside the controller to decouple from `ProfileArray` component instances.
   - Standardize `enhance` logic with robust error handling and busy-state tracking.
2. **Component Simplification**:
   - Transition all local state (e.g., `vector_refs`, `handle_add_click`) into the `ProfileState` controller.
   - Clean up the `<header>` block to ensure 0% logic bloat.
   - Use native `onclick` and event handlers that map directly to controller methods.
3. **Chalk Regime Audit**:
   - Scan for raw units (`px`, `rem`, `#`) and replace with CSS tokens.
   - Ensure transitions and kinetic effects are derived from `$state`.

## Implementation Steps

### Phase 1: Controller Hardening

1. [x] Update `ProfileState` with `get_safe_value` and `set_field_value` methods.
2. [x] Implement `add_vector_item` in `ProfileState` using central `generateUUID`.
3. [x] Refactor `enhance` method to handle empty values and busy-state better.

### Phase 2: Component Refactor

1. [x] Simplify `src/ui/profile/Profile.svelte` script by removing local handlers.
2. [x] Replace `vector_refs` logic with direct state-driven array mutations.
3. [x] Clean up `ProfileHeader` merged logic for maximum readability.

### Phase 3: Verification

1. [ ] Run `npm run verify` to ensure no regressions.
2. [ ] Perform a clinical audit for Chalk Regime compliance.
3. [ ] Test AI enhancement in a simulated environment.

## Verification & Testing

- **Reproduction**: Verify that clicking "+ ADD" correctly inserts a new item at the top of the list.
- **AI Sync**: Ensure the "ENHANCING" status correctly reflects the busy-state of the specific field.
- **Persistence**: Confirm that "Commit Changes" correctly persists the entire entity to Dexie.
