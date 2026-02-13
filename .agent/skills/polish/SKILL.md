---
name: polish
description: Workflow for refactoring raw Skeleton components into production-grade UI. Replaces utility classes with semantic SCSS and Design Tokens.
---

# ✨ Polish Protocol

> "Separation of Concerns: Logic drives the behavior; Style drives the emotion."

## ⛔ The Constraints

1.  **IMMUTABLE SCRIPT**: Do NOT modify `<script>` logic. Variable names, state, and imports are sacred.
2.  **SVELTE 5 SYNTAX**: Use Runes syntax for events (`onclick` instead of `on:click`).
3.  **NO UTILITIES**: Strip all utility classes (Tailwind, Bootstrap). Replace with semantic class names.
4.  **TOKEN ENFORCEMENT**: Replace all hex codes with `var(--token)`. See [TOKENS.scss](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/scss/templates/TOKENS.scss).

## 📂 Architecture: Church & State

Ensure the component follows this structure:

1.  **Script**: Top of file. Logic only.
2.  **HTML**: Middle. Semantic tags (`section`, `article`, `button`) with semantic classes.
3.  **Style**: Bottom. `<style lang="scss">`.

## 📝 Output Template

```svelte
<script>
    // 🔒 LOGIC IS PRESERVED
    let { title, count = 0 } = $props()
</script>

<article class="data-card">
    <header class="card-header">
        <h2 class="title">{title}</h2>
    </header>

    <div class="actions">
        <button class="btn-primary" onclick={() => count++}>
            Count: {count}
        </button>
    </div>
</article>

<style lang="scss">
    /* - No Borders on cards (Use Shadows)
     - Snappy Transitions on interaction
  */

    .data-card {
        background: var(--surface-panel);
        box-shadow: var(--shadow-card);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .title {
        color: var(--text-primary);
        font-weight: 700;
    }

    .btn-primary {
        background: var(--surface-void);
        color: var(--text-primary);
        border-radius: var(--radius-sm);
        padding: 0.5rem 1rem;
        transition: transform 200ms var(--curve-snappy);

        &:active {
            transform: scale(0.98);
        }
    }
</style>
```
