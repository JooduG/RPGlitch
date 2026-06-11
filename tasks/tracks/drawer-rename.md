# Track: Rename `app.drawer` → `app.card_hand`

**Status**: 🧊 Backlog  
**Priority**: Low — cosmetic, zero functional impact

## Why

`Drawer.svelte` was replaced by `CardHand.svelte` but `app.drawer` / `DrawerState` in state
were never renamed. The naming mismatch is confusing — the state says "drawer", the component
says "card hand".

## Scope

- `src/state/app.svelte.js` — rename `drawer` state field + `open_drawer` / `close_drawer` / `reroll_title` methods
- `src/state/status.svelte.js` — rename `DrawerState` typedef + `menu_open` getter reference
- `src/ui/organisms/CardHand.svelte` — update derived reads (`app.drawer.*` → `app.card_hand.*`)
- `src/ui/organisms/Storyboard.svelte` — update `app.open_drawer` call
- `src/ui/organisms/EntityCard.svelte` — update `app.drawer.open` / `app.drawer.type` reads
- `src/ui/organisms/StoryboardDynamicTitle.svelte` — update `app.drawer.reroll_count` read

## Notes

- Pure rename, zero logic change. Grep-and-replace friendly.
- `app.drawer` is exposed on `window.app` — no external consumers expected, but worth a quick check before shipping.
