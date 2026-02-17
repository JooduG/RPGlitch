<script>
    import { app } from "@state/app.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"

    /**
     * 🎭 StorymodePanel (Polish/UI)
     * High-fidelity visual representing an entity in the story feed.
     * Follows the [Polish Protocol] v1.0.0
     */

    let { entity, side = "left", title: rawTitle = "" } = $props() // side: 'left' | 'right'

    // Default Fallback
    let name = $derived(entity?.name || "Unknown")

    // Derived Title State
    let title = $derived(rawTitle || name)

    let signatureColor = $derived(themeStore.getSignatureColor(entity))
</script>

<article
    class="panel-container"
    class:side-left={side === "left"}
    class:side-right={side === "right"}
    style="--entity-color: {signatureColor}"
>
    <div
        class="visual-anchor"
        role="button"
        tabindex="0"
        onclick={() => app.toggleProfile(true, entity)}
        onkeydown={(e) => e.key === "Enter" && app.toggleProfile(true, entity)}
        aria-label="View Profile: {name}"
    >
        <ProfilePicture {entity} />

        <!-- Corner Nameplate -->
        <header class="nameplate">
            <h3 class="nameplate-text">{title}</h3>
        </header>

        <!-- Dynamic Cinematic Overlay -->
        <div class="cinematic-overlay"></div>
    </div>
</article>

<style lang="scss">
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

        /* Corner Nameplate: Neural Minimalism */
        .nameplate {
            position: absolute;
            top: var(--spacing-m);
            z-index: var(--z-index-ui, 10);
            display: inline-block;
            padding: var(--spacing-xs) var(--spacing-m);
            background: var(--gunmetal, #363840);
            box-shadow: var(--shadow-card);
            border-radius: var(--radius-sm);
            width: fit-content;
            max-width: 70%;
            isolation: isolate;
        }

        .nameplate-text {
            font-family: var(--font-family-sans);
            color: var(--entity-color);
            font-size: var(--font-size-s);
            font-weight: 600;
            letter-spacing: 0.5px;
            margin: 0;
            text-wrap: balance;
        }

        .cinematic-overlay {
            display: none;
        }

        &:hover .cinematic-overlay {
            opacity: 0.8;
        }
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
