---
description: The Build Protocol. Materializes new UI atoms.
constraints:
    - "MUST execute Rule 07: Clarity Gate before any file generation."
    - "MUST adopt the Artificer Persona."
---

# 🏗️ Construct Protocol

> **Goal:** Materialize a new UI atom with perfect architectural DNA.

## 1. Specification

0. **Ambiguity Check**: Rate Ambiguity (1-5). If >= 3, Ask. Else, Proceed.
1. **Ask User**: "Name?" (e.g., `ControlPill`), "Domain?" (e.g., `artificer`, `mesmer`).
2. **Prerequisite**: Ensure a **Visual Spec** exists.
    - If **NO Spec**: Execute the **[Imagine Protocol](../mesmer/imagine.md)** (as Mesmer) to generate it.
    - If **YES Spec**: Proceed to Generation.

## 2. Generation

### Option A: AI Scaffolding (Stitch)

Use **Stitch** to generate the initial Svelte markup.

- **Tool**: `stitch:generate_screen_from_text`
- **Prompt**: "Create a Svelte 5 component named [Name]. Use [Chalk Regime] colors, runes ($state, $props), and no Svelte 4 legacy syntax. [Description...]"

### Option B: Manual Construction

Create `src/<domain>/<Name>.svelte`:

```svelte
<script>
    /** @type {{ children?: any, class?: string }} */
    let { children, class: className = "", ...rest } = $props()

    let state = $state({
        active: false,
        value: 0,
    })
</script>

<div class="base {className}" {...rest}>
    {@render children?.()}
</div>

<style lang="scss">
    .base {
        // Artificer: Structural Core
        display: flex;
        position: relative;

        // Mesmer: Atmospheric Layer
        background: var(--app-surface-chalk);
        color: var(--app-text-primary);
        transition: all var(--app-motion-snappy);

        &:hover {
            transform: scale(1.02);
            filter: brightness(1.1);
        }
    }
</style>
```

## 3. Enforcement (The Chalk Regime)

- **Rule**: NO hardcoded hex codes. Use `var(--app-...)`.
- **Rule**: NO native HTML margins. Use `Gap` or `Layout` containers.
- **Rule**: Always include a hover or active micro-interaction.

## 4. Verification

1. **Lint**: Run `npm run lint:fix`.
2. **Registry**: Ensure the component is exported from its domain `index.js`.
3. **Critique**: Run the **[Critique Protocol](../mesmer/critique.md)**.
