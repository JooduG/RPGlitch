# Community Patterns & Library Integration (Svelte 5)

## Bits UI
- Use `Snippet` for reusable components (e.g., Dialog titles).
- Render delegation via `{#snippet child({ props })}`.
- Components like `Accordion` use `$state` for expansion.

## Melt UI (Next Gen)
- Builders pattern: `const accordion = new Accordion({ ... })`.
- Spread attributes: `<div {...accordion.root}>`.
- Programmatic control via `item.expand()`, `item.isExpanded`.

## Dexie.js
- Use `liveQuery` for reactive data fetching.
- In Svelte 5, wrap `liveQuery` in a way that respects rune-based reactivity if needed, or use `$()` for store-like behavior in legacy mode.
- Preferred pattern: Fetch data in `load` functions and pass to components as props.

## Validation (Zod & Valibot)
- Use `Zod` or `Valibot` for strict data boundaries.
- Validate `load` data before returning to components.
- Infer TypeScript types directly from schemas for 100% type safety.
