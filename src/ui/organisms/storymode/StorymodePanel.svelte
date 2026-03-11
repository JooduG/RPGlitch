<script>
    /**
     * @file StorymodePanel.svelte
     * 🎭 THE ENTITY SHOWCASE
     * High-fidelity visual representing an entity in the story feed.
     * Flattened Schema Compliant.
     */
    import { app } from "@state/app.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"

    let { entity, side = "left", title: raw_title = "" } = $props()

    // Default Fallbacks
    let name = $derived(entity?.name || "Unknown")
    let title = $derived(raw_title || name)
    let signature_color = $derived(themeStore.get_signature_color(entity))
</script>

<article class="panel-container" class:side-left={side === "left"} class:side-right={side === "right"} style="--entity-color: {signature_color}">
    <div class="visual-anchor" role="button" tabindex="0" onclick={() => app.toggle_profile(true, entity)} onkeydown={(e) => e.key === "Enter" && app.toggle_profile(true, entity)} aria-label="View Profile: {name}">
        <ProfilePicture {entity} />

        <header class="nameplate">
            <h3 class="nameplate-text">{title}</h3>
        </header>

        <div class="cinematic-overlay"></div>
    </div>
</article>

<style>
    .panel-container {
        width: 100%;
        height: 100%;
        pointer-events: auto;
        position: relative;
        overflow: hidden;
    }

    .visual-anchor {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: pointer;
        background: var(--surface-void);
    }

    /* Corner Nameplate: Neural Minimalism */
    .visual-anchor .nameplate {
        position: absolute;
        top: var(--spacing-m);
        z-index: var(--z-overlay);
        display: inline-block;
        padding: var(--spacing-xs) var(--spacing-m);
        background: var(--surface-sunken);
        backdrop-filter: blur(var(--blur-s));
        box-shadow: var(--shadow-l);
        border-radius: var(--border-radius-s);
        width: fit-content;
        max-width: 70%;
        isolation: isolate;
    }

    .visual-anchor .nameplate-text {
        font-family: var(--font-sans);
        color: var(--entity-color);
        font-size: var(--font-size-s);
        font-weight: 600;
        letter-spacing: var(--spacing-xxs);
        margin: 0;
        text-wrap: balance;
    }

    .visual-anchor .cinematic-overlay {
        display: none;
    }

    .visual-anchor:hover .cinematic-overlay {
        opacity: var(--opacity-xl);
    }

    /* Side positioning logic */
    .side-left .nameplate {
        left: var(--spacing-s);
        right: auto;
    }

    .side-right .nameplate {
        right: var(--spacing-s);
        left: auto;
        text-align: right;
    }
</style>
