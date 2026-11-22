# Domain UI & Views (`src/ui/`)

## Overview

Presentation layer organized as a strict 4-tier downward DAG:

1. [UI Atoms (`./atoms/README.md`)](./atoms/README.md) (`@atoms`): Domain-agnostic `bits-ui` leaf controls (`Accordion`, `Avatar`, `Backdrop`, `Button`, `Icon`, `Label`, `LayoutGrid`, `ProgressBar`, `ScrollArea`, `Shimmer`, `Slider`, `Toggle`, `Tooltip`, `Typewriter`).
2. [UI Molecules (`./molecules/README.md`)](./molecules/README.md) (`@molecules`): Stateless presentation/input components (`BracketList`, `CardSkeleton`, `Dialog`, `Dropdown`, `MacroText`, `Meter`, `Modal`, `SourceField`, `StoryCard`, `StoryboardTitle`, `TextField`, `UndoToast`).
3. [UI Organisms (`./organisms/README.md`)](./organisms/README.md) (`@organisms`): Domain-coupled components and reactive controllers (`AudioWing`, `CardHand`, `ChatBubble`, `Console`, `ContextMenu`, `DevBubble`, `DevWing`, `EntityCard`, `ImageBubble`, `ImagePreview`, `ImagePreview.svelte.js`, `RelationalGraph`, `StoryLibrary`, `VisualWing`).
4. **Stage Views (`src/ui/`, `@ui`)**: Top-level stage views and controllers mounted directly by [`App.svelte`](../App.svelte) (`Storyboard`, `Storyboard.svelte.js`, `Storymode`, `Profile`, `Profile.svelte.js`).

## Interface

- [`index.js`](./index.js): Barrel exporting `Profile`, `ProfileState`, `Storyboard`, `StoryboardController`, `claimed_entity_lock`, `deck_geometry`, `storyboard`, `Storymode`, and re-exporting `Console` and `StoryLibrary` from [`./organisms/index.js`](./organisms/index.js).
- [`Storyboard.svelte`](./Storyboard.svelte), [`Storyboard.svelte.js`](./Storyboard.svelte.js) & [`Storyboard.test.js`](./Storyboard.test.js): Pre-story deck-selection stage, orbital card-hand dialog, and Import Entity modal; exports `deck_geometry`, `claimed_entity_lock`, `StoryboardController`, and `storyboard`.
- [`Storymode.svelte`](./Storymode.svelte): Narrative feed stage, undo-delete window (`5000ms`), scroll follow, and `<script module>` exports `storymode_state`, `take_photo`, `take_group_photo`, `regenerate_image`, `ghostwrite`, and `run_mock`.
- [`Profile.svelte`](./Profile.svelte), [`Profile.svelte.js`](./Profile.svelte.js) & [`Profile.test.js`](./Profile.test.js): Entity profile editor modal coordinating `ProfileState`, `RelationalGraph`, `BracketList`, `TimeTravelBar`, and auxiliary wings (`VisualWing`, `AudioWing`, `DevWing`).

## Invariants

- **Strict Downward DAG (`graphit.architecture.json`)**: `@atoms` and `@molecules` stay domain-agnostic (`@config`, `@utils`, `@media`, `bits-ui`); `@organisms` never import `@organisms` or views; `src/ui/` root views consume `@atoms`, `@molecules`, `@organisms`, and Ranks 0-4.
- **No Raw `bits-ui` in Organisms/Views**: `bits-ui` primitives remain encapsulated inside `atoms/` and `molecules/`.
- **Co-Located Test Suites**: `Console.test.js` and `Storyboard.test.js` live alongside their subjects in `src/ui/`; organism tests (`ChatBubble.test.js`, `ImagePreview.test.js`, `Profile.test.js`, `RelationalGraph.test.js`, `VisualWing.test.js`) live in `src/ui/organisms/`.
- **View Contracts**: `Storyboard`, `Storymode`, `Console`, `Profile`, and `ImagePreview` preserve existing persistence, streaming, keyboard/outside-click, and view-transition guards documented across `DESIGN.md` and `README.md`.

## Side Effects

- `Storymode` manages `requestAnimationFrame` auto-scroll, `MutationObserver`/`ResizeObserver`, and undo-delete timers; `Storyboard` runs `fly_card_*` and `fly_storyboard_cards_into_prologue`; `Console` mounts `install_begin_flight_effect()`, exports Markdown transcripts, and runs story rewind/reset/epilogue dispatches; `Profile` queries entity mutation history and attaches capture listeners; `ImagePreview` allocates canvas clones, triggers PNG downloads, and copies prompts to `navigator.clipboard`.

## Verification

- Run: `npm run audit:layers; if ($?) { npm test }`
