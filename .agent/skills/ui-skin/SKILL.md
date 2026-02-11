---
name: ui-skin
description: Applies SCSS styling to an existing Skeleton component. DOES NOT modify script logic.
---

# 🎨 Skin Application Protocol (SCSS Edition)

## Objective

Transform a raw Skeleton component into a production-grade UI using SCSS and Semantic HTML.

## ⛔ Constraints (Presentation Only)

- **IMMUTABLE SCRIPT:** Do NOT modify the content inside `<script>` tags under any circumstances.
- **IMMUTABLE LOGIC:** Do NOT change variable names, function calls, or logic flow.
- **NO TAILWIND:** Use semantic class names and SCSS modules/blocks.
- **ACTION:** Add `class` attributes to existing HTML tags.
- **ACTION:** Create a `<style lang="scss">` block at the bottom of the file.

## Style Guide (Theme: Chalk Regime)

- **Architecture:** Use the "Church & State" pattern. Logic in script, Style in style.
- **Tokens:** ALWAYS use CSS variables (e.g., `var(--color-surface-1)`). Never hardcode hex values.
- **Layout:** Use `display: flex` and `display: grid` for structural layout.
- **Depth:** Use `box-shadow` for elevation, not borders.

## Output Template

```svelte
<!-- ... existing script ... -->

<section class="counter-card">
    <h1 class="counter-title">{data}</h1>
    <button class="btn-primary" onclick={handleIncrement}>
        Value: {count}
    </button>
</section>

<style lang="scss">
    .counter-card {
        background: var(--color-surface-1);
        padding: var(--spacing-md);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);

        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .counter-title {
        font-size: var(--font-xl);
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .btn-primary {
        background: var(--color-primary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-sm);
        transition: transform 0.2s;

        &:hover {
            transform: translateY(-2px);
        }
    }
</style>
```
