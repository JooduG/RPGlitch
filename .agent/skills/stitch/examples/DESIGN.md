# UI Specification: Kinetic Button

## 1. Description

A highly tactile Svelte 5 button component using Chalk design tokens.

## 2. Architecture

- **Framework**: Svelte 5
- **Styling**: Native CSS via `<style>` block.

## 3. Implementation Blueprint

```svelte
<script lang="ts">
    let { label = "Click Me", onclick } = $props()
</script>

<button {onclick} class="kinetic-btn">
    {label}
</button>

<style>
    .kinetic-btn {
        background: var(--chalk-surface);
        color: var(--chalk-foreground);
        border: 1px solid var(--chalk-border);
        transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .kinetic-btn:hover {
        transform: translateY(-2px);
        border-color: var(--chalk-accent);
    }
</style>
```
