# UI Molecules (`src/ui/molecules/`)

## Overview

Domain-agnostic composite UI widgets (`@molecules`) assembled from `@atoms`, `@utils`, `@media`, and headless `bits-ui` dialog/select/meter primitives.

## Interface

- [`index.js`](./index.js): Barrel exporting 9 components (`CardSkeleton`, `ContextMenu`, `Dialog`, `Dropdown`, `Meter`, `Modal`, `SourceField`, `TextField`, `UndoToast`) and menu/morph coordination signals (`claim_menu`, `get_menu_epoch`, `claim_morph_epoch`, `get_morph_epoch`).
- [`CardSkeleton.svelte`](./CardSkeleton.svelte): Glassmorphic loading placeholder card wrapping `@atoms` `Shimmer`.
- [`ContextMenu.svelte`](./ContextMenu.svelte) & [`ContextMenu.svelte.js`](./ContextMenu.svelte.js): Portalled viewport-clamped floating menu and embedded 3D card-back menu coordinated via `menu_epoch` and `morph_epoch`.
- [`Dialog.svelte`](./Dialog.svelte): Alert and confirmation dialog wrapping `bits-ui` `AlertDialog`, `Backdrop`, and `Button`.
- [`Dropdown.svelte`](./Dropdown.svelte): Select menu wrapping `bits-ui` `Select`, `Icon`, and `tooltip`.
- [`Meter.svelte`](./Meter.svelte): Generic bounded gauge wrapping `bits-ui` `Meter.Root` with optional `editable` `+/-` steppers and compositor `scaleX()` fill bar.
- [`Modal.svelte`](./Modal.svelte): Glassmorphic dialog container wrapping `bits-ui` `Dialog` and `@atoms` `Backdrop`, with `dismissible` toggle and declarative `interactOutsideBehavior="ignore"`.
- [`SourceField.svelte`](./SourceField.svelte): Multi-source ingestion field wrapping [`TextField.svelte`](./TextField.svelte) for `.json`/`.png` cards, URLs, and images.
- [`TextField.svelte`](./TextField.svelte): Editable/read-only prose instrument with 50-step undo/redo history and AST markdown tokenization.
- [`UndoToast.svelte`](./UndoToast.svelte): Role-status countdown bar for soft-delete recovery.

## Invariants

- **Domain Purity**: Molecules never import `@state`, `@engine`, `@data`, `@simulation`, `@definitions`, `@organisms`, or views.
- **`bits-ui` Boundary**: `AlertDialog`, `Dialog`, `Meter`, and `Select` remain encapsulated inside `Dialog`, `Modal`, `Meter`, and `Dropdown`.
- **Reduced Motion**: `Dropdown` `scale` and `TextField` `fade`/`slide` transitions collapse to `0ms` when `motion.is_reduced` is `true`; `Modal` inherits reduced motion via `@media` `overlay_in` / `overlay_out`.

## Side Effects

- `ContextMenu` portals standalone menus into `document.body` and binds capture-phase dismissal listeners on `window`.
- `Dialog` binds `window` `keydown` (`Enter`) confirmation listeners.
- `SourceField` runs `fetch_web`, validates/reads dropped files, and triggers hidden `<input type="file">` pickers.
- `TextField` tracks module-level `sync_focus_counts[sync_id]`.

## Verification

- Run: `npm run audit:layers; if ($?) { npm run test:unit }`
