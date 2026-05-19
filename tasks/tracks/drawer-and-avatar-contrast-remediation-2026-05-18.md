---
id:drawer-and-avatar-contrast-remediation-2026-05-18
type: bug
status: done
created_at: 2026-05-18T21:03:00Z
updated_at: 2026-05-18T21:03:00Z
description: Remediate visual contrast, desaturation, and legibility issues in the persona drawer and profile initials placeholder.
---

# Drawer and Avatar Contrast Remediation

## ETERNAL

### 🎯 Objective

Remediate contrast, desaturation, and visibility issues across the entity selection drawer (`Drawer.svelte`, `LibraryCard.svelte`) and the initials placeholder (`ProfilePicture.svelte`):

1. **"Create New" Contrast Collision**: In `Drawer.svelte`, the "Create New" card overrides `--electric-cyan` to `var(--gunmetal)`. This causes its label text and border glows to blend into the `var(--glass-base)` footer background, making them invisible. We will restore compliant contrast using high-contrast Nordic tokens.
2. **Disabled Card Legibility & Colors**: In `LibraryCard.svelte`, disabled entity selection cards apply `filter: grayscale(1)` and low opacity. This completely desaturates the signature border glows of active/unselected entities (e.g. `DEV` or `P`) and makes their labels unreadable. We will soft-desaturate and preserve high-contrast label typography.
3. **Desaturated Initials Placeholder**: In `ProfilePicture.svelte`, the large background initials watermark uses `color: var(--pure-white)` and `mix-blend-mode: overlay` at 0.3 opacity. Over the dark `var(--chalk)` background, this causes letters to blend darkly, stripping them of all color and brightness. We will replace this with a beautiful custom signature glow reflecting the entity's signature color.

### 📊 Success Criteria

- [x] **"Create New" Visibility**: Ensure the "Create New" label text is perfectly readable and styled with vibrant, high-contrast tokens.
- [x] **Legible Inactive Cards**: Disabled entity cards are readable, using a clear, premium `var(--frozen)` text override, while preserving a soft hint of their signature colors.
- [x] **Vibrant Watermark Initials**: Watermark initials glow with the entity's distinct signature color rather than fading into a dull grey.
- [x] **Full Quality Pass**: Zero raw colors (`#`, `px`, etc.) in style changes, and a successful local `npm run verify` check.

## FUTURE

### Phase 1: Design Review & Target Identification

- [x] Verify existing CSS layouts and token values in `Drawer.svelte`, `LibraryCard.svelte`, and `ProfilePicture.svelte`.
- [x] Align style remediation changes with Nordic collection specifications in `DESIGN.md`.

### Phase 2: Code Refactoring & Implementation

- [x] Refactor inline overrides and CSS classes in `src/ui/drawer/Drawer.svelte`.
- [x] Refactor `.card.disabled` and `.disabled .name` text colors in `src/ui/drawer/LibraryCard.svelte`.
- [x] Refactor `.profile-initials` styles (color, blend-mode, shadows) in `src/ui/atoms/ProfilePicture.svelte`.

### Phase 3: Quality Gates & Verification

- [x] Run `npm run verify` to guarantee CSS stylelint compliance, eslint safety, and unit test success.
- [x] Conduct browser checks to visually confirm pristine aesthetics and legibility.

## PRESENT

- **Current Status**: ✅ Done
- **Active Task**: Track Complete
- **Pulse**:
  - 2026-05-18T21:03:00Z: Initialize track and plan for drawer/avatar contrast remediation.
  - 2026-05-19T09:15:00Z: Complete Phase 1 and start Phase 2 implementation.
  - 2026-05-19T09:29:00Z: Complete Phase 2 refactoring and execute global verification suite via npm run verify. All quality gates pass.
