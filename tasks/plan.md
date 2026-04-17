# Implementation Plan: The Tectonic Label [Add Action]

This plan replaces the standard "dashed" Add buttons in `VectorArray.svelte` with a kinetic, multi-column interaction triggered by section headers.

## User Review Required

> [!IMPORTANT]
> **Aesthetic Change**: The explicit "Add" button is purged. The section label (e.g. "PAST") becomes the primary action hub.
>
> **The Flow**:
>
> 1. **Hover Label**: A `+` appears on the header; a signature-colored 1px line appears at the top of the corresponding vector list.
> 2. **Click Label**: The 1px line in the list vertically splits/expands and "becomes" the new empty TextField.

## Proposed Changes

### [UI Components]

#### [MODIFY] [VectorArray.svelte](file:///src/ui/organisms/profile/panels/VectorArray.svelte)

- Purge the variant="dashed" `Button`.
- Add a **"Horizon Line"** at the top of the `.vector-list`.
  - It is `0` height by default and expands to `1px` (Signature Color) when the parent label is hovered.
- Implement an **Entry Transition**:
  - The first item in the `items` array should have a specialized transition on "spawn" that makes it expansion-slide from `1px` height to its full `TextField` height.
- Expose a `trigger_add()` function for the parent to call.

#### [MODIFY] [EntityFragments.svelte](file:///src/ui/organisms/profile/panels/EntityFragments.svelte)

- Upgrade the Section Label logic:
  - Add hover state tracking for the `.label` column.
  - When hovered, reveal a `+` next to the label (e.g., `PAST [+]`) using a glass sigil.
  - Pass the hover state to the child `VectorArray` to show the "Horizon Line."
- clicking the label calls `trigger_add()` on the child `VectorArray`.

## Verification Plan

### Automated Tests

- N/A (Visual/Kinetic).

### Fix Busy State Alignment in Profile Modal and Wings

The user reported that the busy state text in the profile modal and wings is center-aligned, and requested it be left-aligned. Research revealed several areas where centered alignment might be the culprit, particularly in the `VisualWing` spinner overlay and the `EntityFragments` layout.

## User Review Required

> [!IMPORTANT]
> This change will affect the visual alignment of the "Busy..." and "Saving..." indicators in the profile modal and wings. By default, these were centered for aesthetic balance, but left-alignment will be applied as requested.

## Proposed Changes

### UI Atoms

#### [MODIFY] [Button.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/atoms/Button.svelte)
- Add `align` prop to support `"center"` (default) or `"left"`.
- Update styles to reflect the alignment.

### UI Organisms (Profile)

#### [MODIFY] [EntityFragments.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/profile/panels/EntityFragments.svelte)
- Update `.field-group` to be left-aligned (`align-items: flex-start`).
- Change `.field-label` to `text-align: left`.

#### [MODIFY] [VisualWing.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/profile/wings/VisualWing.svelte)
- Update `.spinner-overlay` to `justify-content: flex-start` or add left-aligned "Busy..." text if appropriate.
- Ensure the "Busy..." button labels are left-aligned if possible.

#### [MODIFY] [DevWing.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/profile/wings/DevWing.svelte)
- Update `.dynamic-box` and `.value-container` to be left-aligned.

## Open Questions

- Should the spinner itself move to the left, or just any accompanying text? Current plan assumes the entire "busy" container should align left.

## Verification Plan

### Manual Verification
- Open the profile modal.
- Enter edit mode.
- Trigger a "save" or "generate" action to see the busy state.
- Verify that the "Busy..." or "Saving..." indicators and their containers are left-aligned.


- Enter **Edit Mode**.
- Hover the **"PAST"** or **"FUTURE"** header.
- Confirm a `+` appears on the header and a 1px colored line appears at the very top of the list to the right.
- Click the **"PAST"** header.
- Confirm the 1px line "opens up" and becomes a fresh TextField.
