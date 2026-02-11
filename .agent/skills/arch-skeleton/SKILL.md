---
name: arch-skeleton
description: Generates the logical backbone of a Svelte 5 component. Handles state, types, and data flow. NO STYLING.
---

# 💀 Skeleton Generation Protocol

## Objective

Create a functionally complete, unstyled Svelte 5 component. The output must be compilable but devoid of aesthetic choices.

## Steps

1.  **Define Interface:** Create a TypeScript interface for `Props` and `State` within the module.
2.  **State Logic:** Implement reactivity using strictly `$state` and `$derived`.
3.  **Markup Structure:** Write semantic HTML (section, article, button) to house the data.
4.  **Verification:** Scan the generated code for any legacy syntax (`export let`, `$:`).

## ⛔ Constraints (Logic Only)

- **NO STYLING:** Do not add CSS classes, style blocks, or Tailwind attributes.
- **NO LEGACY:** If Svelte 4 syntax is detected, the generation is considered a FAILURE.
- **NO VISUALS:** Do not worry about layout or colors. Focus on the raw DOM hierarchy.

## Output Template

```svelte
<script lang="ts">
    interface Props {
        data: string
    }
    let { data }: Props = $props()

    let count = $state(0)
    let double = $derived(count * 2)

    function handleIncrement() {
        count += 1
    }
</script>

<section>
    <h1>{data}</h1>
    <button onclick={handleIncrement}>
        Value: {count}, Doubled: {double}
    </button>
</section>
```
