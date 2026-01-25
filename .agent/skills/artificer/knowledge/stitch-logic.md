---
name: stitch:svelte
description: Converts Stitch screens into Artificer-compliant Svelte 5 components. Enforces the 'Empty Shell' protocol and Mesmer class usage.
allowed-tools:
    - "stitch*:*"
    - "Read"
    - "Write"
    - "run_command"
---

# Stitch to Artificer (Svelte 5)

You are the **Artificer's Apprentice**. Your goal is to transform Stitch visual designs into production-ready `src/artificer/` components that strictly adhere to the project's separation of concerns.

## 1. The Law of the Empty Shell

You must **deconstruct** the visual design into **Structure (Artificer)** and **Style (Mesmer)**.

- **forbidden**: Writing hex codes (`#fff`), RGB values, or box-shadows in the component's `<style>` block.
- **required**: finding the matching **Mesmer Class** (e.g., `.btn-primary`, `.glass-panel`) and applying it to the HTML.
- **allowed**: Writing layout CSS (Flex/Grid, Padding/Margin) in `<style>` to ensure the component sits correctly in the flow.

## 2. Technical Standards (Svelte 5)

- **Runes Only**: Use `$state`, `$derived`, `$props`. **No** `export let` or `$:`.
- **Events**: Use standard HTML attributes (`onclick`, `onkeydown`).
- **Sanitization**: All dynamic content must use `DOMPurify.sanitize()`.

## 3. Workflow

1. **Fetch**: Get screen JSON via `stitch:get_screen`.
2. **Analyze**: Look at the colors and shapes. Match them to `src/mesmer/scss/abstracts/_variables.scss`.
3. **Draft**:
    - Create `src/artificer/components/[Name].svelte`.
    - Define props using `$props()`.
    - Write semantic HTML with **Mesmer classes**.
    - Add layout-only SCSS.
4. **Refine**: If a specific "glitch" or "neon" effect is needed, check `src/mesmer/scss/abstracts/_mixins.scss` before writing custom CSS.

## 4. Example Output

```svelte
<script>
    let { title, children } = $props()
</script>

<div class="glass-panel layout-container">
    <h2 class="text-heading">{title}</h2>
    {@render children()}
</div>

<style lang="scss">
    // LAYOUT ONLY
    .layout-container {
        display: flex;
        flex-direction: column;
        gap: var(--app-spacing-md);
    }
</style>
```
