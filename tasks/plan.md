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

### Manual Verification

- Enter **Edit Mode**.
- Hover the **"PAST"** or **"FUTURE"** header.
- Confirm a `+` appears on the header and a 1px colored line appears at the very top of the list to the right.
- Click the **"PAST"** header.
- Confirm the 1px line "opens up" and becomes a fresh TextField.
