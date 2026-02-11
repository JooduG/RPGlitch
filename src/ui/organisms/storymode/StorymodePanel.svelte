<script>
    import { app } from "@state/app.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"

    let { entity, side = "left", title: rawTitle = "" } = $props() // side: 'left' | 'right'

    // Default Fallback
    let name = $derived(entity?.name || "Unknown")

    // 01-Builder: Derived Title State (Original Case)
    let title = $derived(rawTitle || name)

    let signatureColor = $derived(themeStore.getSignatureColor(entity))
</script>

<!-- DYNAMIC CLASS BASED ON MODE -->
<div class="panel-container" style="--entity-color: {signatureColor}">
    <div
        class="full-bleed-visual"
        class:side-left={side === "left"}
        class:side-right={side === "right"}
        role="button"
        tabindex="0"
        onclick={() => app.toggleProfile(true, entity)}
        onkeydown={(e) => e.key === "Enter" && app.toggleProfile(true, entity)}
        aria-label="View Profile: {name}"
    >
        <ProfilePicture {entity} />

        <!-- Corner Nameplate -->
        <div class="nameplate">
            <h3 class="nameplate-text">{title}</h3>
        </div>

        <!-- Bottom Gradient Overlay -->
        <div class="cinematic-overlay"></div>
    </div>
</div>

<style lang="scss">
    .panel-container {
        width: 100%;
        height: 100%;
        pointer-events: auto;
        position: relative;
        overflow: hidden;
    }

    /* === FULL MODE STYLES === */
    .full-bleed-visual {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: pointer;
        background: #000;

        /* Corner Nameplate - positioned at outer top edge */
        .nameplate {
            position: absolute;
            top: 1rem;
            z-index: 10;
            display: inline-block;
            padding: 0.5rem 1rem;
            background: var(--app-chalk, #222326);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            width: fit-content;
            max-width: 70%;
            isolation: isolate;
        }

        /* Side positioning */
        &.side-left .nameplate {
            left: 0.75rem;
            right: auto;
        }

        &.side-right .nameplate {
            right: 0.75rem;
            left: auto;
            text-align: right;
        }

        .nameplate-text {
            font-family: var(--font-heading);
            color: var(--entity-color);
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            margin: 0;
            text-wrap: balance;
        }

        .cinematic-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50%;
            pointer-events: none;
            background: linear-gradient(
                to top,
                var(--entity-color) 0%,
                rgba(0, 0, 0, 0) 100%
            );
            mix-blend-mode: hard-light;
            opacity: 0.6;
        }

        &:hover .cinematic-overlay {
            opacity: 0.8;
        }
    }
</style>
