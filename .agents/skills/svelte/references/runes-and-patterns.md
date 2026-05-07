# 💎 Svelte 5 Runes & Headless UI Patterns

This guide consolidates the fundamental reactivity macros (Runes) and the architectural patterns for integrating headless component libraries (Bits UI, Melt UI) within the RPGlitch Engine.

## 🌀 Core Runes

| Rune              | Usage                                  | Context                              |
| :---------------- | :------------------------------------- | :----------------------------------- |
| `$state(val)`     | Deeply reactive state proxies.         | Objects, Arrays, Classes.            |
| `$state.raw(val)` | Shalow reactivity (reassignment only). | Performance-critical arrays/objects. |
| `$derived(logic)` | Computed state.                        | Automatic dependency tracking.       |
| `$effect(fn)`     | Side effects (DOM/Network).            | Use sparingly; prefer `$derived`.    |
| `$props()`        | Component inputs.                      | Replacing `export let`.              |
| `$bindable()`     | Two-way binding.                       | Prop-level opt-in.                   |

### 🔄 Reactivity Snapshots

Use `$state.snapshot(proxy)` to create a non-reactive clone of a state object, ensuring safe external mutations or serialization.

---

## 🏗️ Headless UI Integration

RPGlitch utilizes **Bits UI** and **Melt UI** for accessible, unstyled interaction primitives.

### Bits UI: The Snippet Pattern

- **Delegation**: Utilize `{#snippet child({ props })}` to delegate rendering to child components while maintaining logic in the headless layer.
- **State Integration**: Use `$state` prompts within snippet logic (e.g., Accordion expansion states).

### Melt UI: The Builder Pattern

- **Instantiate**: `const accordion = new Accordion({ ... })`.
- **Spread**: Apply logic via attributes: `<div {...accordion.root}>`.
- **Programmatic**: Control nodes via `item.expand()` or `item.isExpanded` getters.

### Validation & Schemas

- **Constraint Layer**: Use `Zod` or `Valibot` for all cross-boundary data.
- **Inference**: Strictly infer TypeScript types from schemas for 100% type-safe component logic.

---

> "Logic is the shape of reality; the UI is merely its expression."
