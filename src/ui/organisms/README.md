# UI Organisms (`src/ui/organisms/`)

## Overview

Domain-aware presentation components and controllers (`@organisms`) built atop `@atoms`, `@molecules`, `@engine`, `@state`, `@data`, `@simulation`, and `@definitions`.

## Interface

- [`index.js`](./index.js): Barrel exporting `AudioWing`, `CardHand`, `ChatBubble` (`parse_message`), `Console`, `ContextMenu` (`build_entity_actions`, `close_context_menu`, `context_menu_state`, `open_context_menu`), `DevBubble` (`get_telemetry_label`, `process_entity_blocks`, `resolve_entity_name`), `DevWing`, `EntityCard`, `ImageBubble`, `ImagePreview`, `RelationalGraph`, `StoryLibrary`, `VisualWing`, and the reactive `ImagePreview.svelte.js` controllers (`image_preview`, `image_picker`, `open_image_preview`, `close_image_preview`, `open_picker`, `select_candidate`, `close_regenerate`, `regenerate_image`, `run_image_regeneration`).
- [`AudioWing.svelte`](./AudioWing.svelte): Voice selection, preview, and cadence controls for `Profile`.
- [`CardHand.svelte`](./CardHand.svelte): Orbital card-hand dialog and selection deck for `Storyboard`.
- [`ChatBubble.svelte`](./ChatBubble.svelte) & `ChatBubble.svelte`: Narrative message chassis, `parse_message()` pipeline, attachments gallery, and telemetry cards.
- [`Console.svelte`](./Console.svelte) & [`Console.test.js`](./Console.test.js): Persistent stage console (`[data-testid="unified-console"]`), composer, pending FIFO send queue, and collapsible settings/library panel.
- [`ContextMenu.svelte`](./ContextMenu.svelte): Portalled viewport-clamped floating menu and entity action builder (`build_entity_actions`, `open_context_menu`, `close_context_menu`, `context_menu_state`).
- [`DevBubble.svelte`](./DevBubble.svelte): Developer telemetry bubble (`get_telemetry_label`, `process_entity_blocks`, `resolve_entity_name`).
- [`DevWing.svelte`](./DevWing.svelte): Developer dynamics grid (`Meter`) and raw entity JSON accordion.
- [`EntityCard.svelte`](./EntityCard.svelte): Multi-variant (`library`, `slot`, `panel`, `message`) entity card with eject/swap transitions and context menus.
- [`ImageBubble.svelte`](./ImageBubble.svelte): Inline generated image attachment bubble with lightbox and regeneration triggers.
- [`ImagePreview.svelte`](./ImagePreview.svelte), [`ImagePreview.svelte.js`](./ImagePreview.svelte.js) & [`ImagePreview.test.js`](./ImagePreview.test.js): Lightbox preview and 3-candidate image regeneration controller (`layer="image"`).
- [`RelationalGraph.svelte`](./RelationalGraph.svelte) & [`RelationalGraph.test.js`](./RelationalGraph.test.js): Interactive radial SVG relationship constellation.
- [`StoryLibrary.svelte`](./StoryLibrary.svelte): Saved story browser, import/export, and deletion manager.
- [`VisualWing.svelte`](./VisualWing.svelte) & [`VisualWing.test.js`](./VisualWing.test.js): Signature color, visual style, seed, and diffusion prompt wing for `Profile`.

## Invariants

- **Intra-Tier Imports**: Organisms import `@atoms` and `@molecules` via barrels, never `@organisms` or top-level views (`Storyboard`, `Storymode`, `Console`, `Profile`, `ImagePreview`); sibling organism imports use relative `./` paths.
- **No Raw `bits-ui`**: Organisms never import `bits-ui` directly; headless primitives live exclusively in `@atoms` and `@molecules`.
- **Signature Color Scoping**: `AudioWing` and `VisualWing` pin `--signature-color` to `--color-frozen`; `DevWing` pins `--signature-color` to `--color-electric-cyan`.

## Side Effects

- `ImagePreview.svelte.js`, `ChatBubble`, `Console`, `ContextMenu`, `EntityCard`, `RelationalGraph`, `StoryLibrary`, `AudioWing`, and `VisualWing` coordinate Dexie persistence, LLM enhancement, image diffusion, Web Speech playback, DOM portals, and view-transition morph epochs.

## Verification

- Run: `npm run audit:layers; if ($?) { npm test }`
