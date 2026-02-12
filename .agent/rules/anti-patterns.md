# 🚫 Anti-Patterns & Banned Syntax

The following patterns are **STRICTLY PROHIBITED**. Detection of these patterns constitutes a critical failure.

## Svelte 4 Legacy (CRITICAL VIOLATIONS)

- **DO NOT USE** `export let prop`. (Reason: Deprecated in favor of `$props()`)
- **DO NOT USE** `$: variable = ...`. (Reason: Deprecated in favor of `$derived()`)
- **DO NOT USE** `$: { ... }`. (Reason: Deprecated in favor of `$effect()`)
- **DO NOT USE** `createEventDispatcher`. (Reason: Deprecated. Use callback props).
- **DO NOT USE** `<slot>`. (Reason: Deprecated. Use snippets).
- **DO NOT USE** `$$props` or `$$restProps`.

## Styling Violations

- **DO NOT USE** Inline styles (`style="..."`).
- **DO NOT USE** Utility classes (e.g., Tailwind) unless explicitly authorized by the `ui-skin` skill.
- **DO NOT USE** Global styles in component files.

## Code Quality

- **DO NOT USE** `console.log` in production code. Use the logger service.
- **DO NOT USE** `any` type in TypeScript.
- **DO NOT LEAVE** Dead code or commented-out blocks.
