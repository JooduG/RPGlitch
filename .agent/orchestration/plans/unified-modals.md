# Unified Dialog and Modal Standardization Plan (v2)

## Objective

Standardize and simplify the modal system by unifying the redundant `Alert` and `Confirm` components into a single, reusable `Dialog.svelte` component. This new component will leverage the existing `Modal.svelte` wrapper to inherit the high-end `glass-xxl` "Floating Monolith" aesthetic.

## Key Files & Context

- `src/ui/molecules/Alert.svelte` (To be deprecated)
- `src/ui/molecules/Confirm.svelte` (To be deprecated)
- `src/ui/molecules/Dialog.svelte` (New unified component)
- `src/ui/molecules/Modal.svelte` (To be updated with a 'mini' variant)
- `src/ui/organisms/ControlPanel.svelte` (Update Confirm usage ONLY)
- `src/ui/organisms/profile/Profile.svelte` (Update Confirm usage)

## Implementation Steps

1. **Enhance `Modal.svelte`**:
   - Add a new `mini` variant to `.modal-content` to restrict `max-width` (e.g., `400px`) and adjust padding for smaller dialogs.

2. **Create `Dialog.svelte`**:
   - Combine the logic of `Alert` and `Confirm`.
   - Wrap the structure inside the updated `Modal.svelte` (`variant="mini"`).
   - Implement the internal structural pattern:
     - **Header**: Title and an optional "info" icon or close button.
     - **Body**: The main message content.
     - **Footer**: Action buttons (Cancel, Confirm, or just OK based on the `type` prop: `'alert' | 'confirm'`).
   - Use strict `glass-xxl` aesthetics without the boxed-in `glass-xs` backgrounds, maintaining a clean, fluid look.

3. **Refactor Existing Usages**:
   - Replace `<Confirm>` references in `Profile.svelte` and `ControlPanel.svelte` with the new `<Dialog type="confirm">`.
   - Delete `Alert.svelte` and `Confirm.svelte` once references are updated.

## Verification & Testing

- Trigger a "Reset Data" in the Control Panel to verify the new Confirm dialog appears correctly and scales elastically.
- Trigger an entity deletion in the Profile to verify the Confirm dialog functionality.
- Verify that `Dialog` maintains its visual integrity across different screen sizes.
