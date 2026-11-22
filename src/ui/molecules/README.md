# UI Molecules (`src/ui/molecules/`)

## Overview

Domain-agnostic composite UI widgets (`@molecules`) assembled from `@atoms`, `@utils`, `@media`, and headless `bits-ui` dialog/select/meter primitives.

## Interface

- [`index.js`](./index.js): Barrel exporting 12 components (`BracketList`, `CardSkeleton`, `Dialog`, `Dropdown`, `MacroText`, `Meter`, `Modal`, `SourceField`, `StoryboardTitle`, `StoryCard`, `TextField`, `UndoToast`).
- [`BracketList.svelte`](./BracketList.svelte): Structured `[KEY: value]` and relationship bracket renderer.
- [`CardSkeleton.svelte`](./CardSkeleton.svelte): Glassmorphic loading placeholder card wrapping `@atoms` `Shimmer`.
- [`Dialog.svelte`](./Dialog.svelte): Alert and confirmation dialog wrapping `bits-ui` `AlertDialog`, `Backdrop`, and `Button`.
- [`Dropdown.svelte`](./Dropdown.svelte): Select menu wrapping `bits-ui` `Select`, `Icon`, and `tooltip`.
- [`MacroText.svelte`](./MacroText.svelte): Inline `@ID` macro handle renderer with hover card previews.
- [`Meter.svelte`](./Meter.svelte): Generic bounded gauge wrapping `bits-ui` `Meter.Root` with optional `editable` `+/-` steppers and compositor `scaleX()` fill bar.
- [`Modal.svelte`](./Modal.svelte): Glassmorphic dialog container wrapping `bits-ui` `Dialog` and `@atoms` `Backdrop`, with `dismissible` toggle and declarative `interactOutsideBehavior="ignore"`.
- [`SourceField.svelte`](./SourceField.svelte): Multi-source ingestion field wrapping [`TextField.svelte`](./TextField.svelte) for `.json`/`.png` cards, URLs, and images.
- [`StoryboardTitle.svelte`](./StoryboardTitle.svelte): Stage title display and inline editor for `Storyboard`.
- [`StoryCard.svelte`](./StoryCard.svelte): Story library summary card with inline title editing, export, and delete actions.
- [`TextField.svelte`](./TextField.svelte): Editable/read-only prose instrument with 50-step undo/redo history and AST markdown tokenization.
- [`UndoToast.svelte`](./UndoToast.svelte): Role-status countdown bar for soft-delete recovery.

## Invariants

- **Domain Purity**: Molecules never import `@state`, `@engine`, `@data`, `@simulation`, `@definitions`, `@organisms`, or views.
- **`bits-ui` Boundary**: `AlertDialog`, `Dialog`, `Meter`, and `Select` remain encapsulated inside `Dialog`, `Modal`, `Meter`, and `Dropdown`.
- **Reduced Motion**: `Dropdown` `scale` and `TextField` `fade`/`slide` transitions collapse to `0ms` when `motion.is_reduced` is `true`; `Modal` inherits reduced motion via `@media` `overlay_in` / `overlay_out`.

## Side Effects

- `Dialog` binds `window` `keydown` (`Enter`) confirmation listeners.
- `SourceField` runs `fetch_web`, validates/reads dropped files, and triggers hidden `<input type="file">` pickers.
- `TextField` tracks module-level `sync_focus_counts[sync_id]`.

## Verification

- Run: `npm run audit:layers; if ($?) { npm test }`
