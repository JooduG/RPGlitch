# 🧪 Prototyping: The Stitch Loop

> **Objective:** Rapidly iterate on visual concepts and transform them into semantic RPGlitch code.

## 1. The Collaboration Loop (REQUIRED)

Before building, you must discuss the direction with the USER.

1.  **Define**: Identify the component/page mission.
2.  **Aura**: Propose the visual mood (e.g., "Heavy Glitch", "Subtle Glass").
3.  **Confirm**: Wait for USER acknowledgement.

## 2. Concept Generation

Call `stitch:generate_screen_from_text` using the [Stitch Prompting Block](../../DESIGN.md#5-stitch-prompting-block-stitch-ready) as a base.

## 3. The "Empty Shell" Transformation

Convert visual designs into production-ready Svelte 5 while strictly separating concerns:

- **Mesmer (The Illusion)**: Apply global tokens and mixins for styles. **No hex codes or box-shadows** in the component.
- **Artificer (The Body)**: Build the structural skeleton with Svelte 5 Runes.
- **Sanitization**: All dynamic content (AI text, user input) MUST use `DOMPurify.sanitize()`.

### Implementation Standard

```svelte
<script>
    import DOMPurify from "dompurify"
    let { title, content, children } = $props()

    // Derived state for sanitized output
    let cleanContent = $derived(DOMPurify.sanitize(content))
</script>

<div class="glass-panel layout-stack">
    <h2 class="text-heading">{title}</h2>
    <div class="content-area">{@html cleanContent}</div>
    {@render children?.()}
</div>

<style lang="scss">
    // LAYOUT ONLY: Flex, Grid, Spacing.
    // THEME comes from .glass-panel and .text-heading classes.
    .layout-stack {
        display: flex;
        flex-direction: column;
        gap: var(--app-spacing-md);
        padding: var(--app-spacing-lg);
    }
</style>
```

## 4. Verification & Feedback

1.  **Local Dev**: Run `npm run dev`.
2.  **Visual Audit**: Run `/review-design` to check atmospheric fidelity.
3.  **Sanity Check**: Ensure no hardcoded colors leaked into the component.
4.  **Baton Pass**: Update [ideation.md](../nexus/vision/ideation.md) with progress.
