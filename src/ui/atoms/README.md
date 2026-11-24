# UI Atoms (`src/ui/atoms/`)

## Overview

Domain-agnostic UI primitives (`@atoms`) wrapping `bits-ui` headless elements and indivisible controls. Atoms import only `@config`, `@utils`, `@media`, `bits-ui`, `svelte/*`, and sibling `./Label.svelte`, `./Avatar.svelte`, and `./Tooltip.svelte`.

## Interface

- [`index.js`](./index.js): Barrel exporting all 15 components (`Accordion`, `Avatar`, `Backdrop`, `Button`, `LayoutGrid`, `Icon`, `Label`, `ProgressBar`, `ScrollArea`, `Shimmer`, `Slider`, `StyleTile`, `Toggle`, `Tooltip`, `Typewriter`) and the tooltip control API (`tooltip`, `hide_tooltip`, `pin_tooltip_menu`, `unpin_tooltip`, `set_tooltip_suppressed`).
- [`Accordion.svelte`](./Accordion.svelte): Collapsible container wrapping `bits-ui` `Collapsible`.
- [`Avatar.svelte`](./Avatar.svelte): Media portrait and error/no-media initials renderer using native `<img>` + `onerror` fallback (`src`, `alt`, `initials`, `signature_color`, `flipped`, `contain`, `landscape`).
- [`Backdrop.svelte`](./Backdrop.svelte): Viewport overlay backdrop mapping `layer` (`sticky`/`console`, `overlay`/`cardhand`, `modal`, `image`/`lightbox`, `max`) to `--z-index-*`.
- [`Button.svelte`](./Button.svelte): Multi-variant button (`primary`, `secondary`, `danger`, `invisible`, `bare`) wrapping `bits-ui` `Button.Root` with kinetic `data-kinetic` coordination.
- [`LayoutGrid.svelte`](./LayoutGrid.svelte): 12x12 diagnostic stage grid overlay.
- [`Icon.svelte`](./Icon.svelte): 24x24 SVG `<path d="..." />` registry.
- [`Label.svelte`](./Label.svelte): Accessible label wrapping `bits-ui` `Label.Root`.
- [`ProgressBar.svelte`](./ProgressBar.svelte): Determinate/indeterminate progress bar wrapping `bits-ui` `Progress`.
- [`ScrollArea.svelte`](./ScrollArea.svelte): Custom vertical scroll container wrapping `bits-ui` `ScrollArea`.
- [`Shimmer.svelte`](./Shimmer.svelte): Decorative light-sweep indicator.
- [`Slider.svelte`](./Slider.svelte): Range slider wrapping `bits-ui` `Slider` with centered neutral fill track.
- [`StyleTile.svelte`](./StyleTile.svelte): Signature-bordered style tile wrapping `./Avatar.svelte` and `./Tooltip.svelte`.
- [`Toggle.svelte`](./Toggle.svelte): Boolean switch wrapping `bits-ui` `Switch`.
- [`Tooltip.svelte`](./Tooltip.svelte): Global `bits-ui` `Tooltip` portal (`preview_content` snippet) and `use:tooltip` action supporting cursor tracking and pinned interactive previews.
- [`Typewriter.svelte`](./Typewriter.svelte): HTML-tag-safe single-HTML streaming typewriter atom (`sanitize()`).

## Invariants

- **Domain Purity**: Atoms never import `@state`, `@engine`, `@data`, `@simulation`, `@definitions`, `@molecules`, or `@organisms`.
- **`bits-ui` Encapsulation**: Direct `bits-ui` `Button`, `Collapsible`, `Label`, `Progress`, `ScrollArea`, `Slider`, `Switch`, and `Tooltip` bindings stay inside atoms; raw `bits-ui` exports are prohibited from [`index.js`](./index.js).
- **Reduced Motion**: `Backdrop` `fade`, `ProgressBar` `Tween`, `Tooltip` `scale`, and `Typewriter` speed all collapse cleanly under `motion.is_reduced`.
- **Avatar Fallback Guard**: Initials fallback renders strictly when `!has_media` or `has_error` so cached images paint on frame 0 without flashing.

## Side Effects

- `Button` mounts and destroys arbitrary Svelte actions via `$effect`.
- `Label` dispatches synthetic `pointerdown`/`click` events when targeting non-switch `<button>` controls.
- `ProgressBar`, `Tooltip`, and `Typewriter` manage `Tween` / `window` event listeners / `setTimeout` & `rAF` timers during active mounts.

## Verification

- Run: `npm run audit:layers; if ($?) { npm test }`
