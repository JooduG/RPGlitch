<script>
    /**
     * @file ProfilePicture.svelte
     * 🖼️ AGNOSTIC PROFILE IMAGE RENDERER
     * Handles real images, placeholders, and glitch overlays.
     * RUTHLESSLY FLATTENED — Zero backward compatibility.
     */
    import { themeStore } from "@theme/palette.svelte.js"
    import { fitText } from "@ui/utils/actions/fitText.js"

    let { entity } = $props()

    // 1. Core Flattened Properties
    let name = $derived(entity?.name || "Entity")
    let pictureUrl = $derived(entity?.profile_picture)
    let signatureColor = $derived(themeStore.getSignatureColor(entity))
    let initials = $derived(themeStore.getInitials(name))

    // 2. Minor Modifiers (Fallback safely if visuals object is missing)
    let isNoBg = $derived(entity?.visuals?.noBackground ?? false)
    let isFlipped = $derived(entity?.visuals?.flipped ?? false)
</script>

<div class="profile-picture" style="--signature-color: {signatureColor}">
    {#if pictureUrl}
        <div class="image-container">
            <img src={pictureUrl} alt="{name} Profile" class="picture" class:no-bg={isNoBg} class:flipped={isFlipped} />
            <div class="glitch-overlay"></div>
        </div>
    {:else}
        <div
            class="placeholder"
            use:fitText={{
                maxSize: 150,
                minSize: 40,
                lineHeight: "1",
            }}
        >
            {initials}
            <div class="glitch-overlay"></div>
        </div>
    {/if}
</div>

<style lang="scss">
    .profile-picture {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 0;
        background: var(--surface-void);
    }

    .image-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .picture {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform var(--transition-speed-slow) var(--physics-transition-elastic);

        &.no-bg {
            object-fit: contain;
            filter: drop-shadow(0 0.5rem 1rem rgba(0, 0, 0, 0.5));
        }

        &.flipped {
            transform: scaleX(-1);
        }
    }

    .glitch-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        mix-blend-mode: overlay;
        opacity: var(--opacity-s);
        background: linear-gradient(transparent 50%, rgba(var(--pure-black-rgb), var(--opacity-xs)) 50%);
        background-size: 100% var(--spacing-xxs);

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(255, 0, 0, var(--opacity-xs)), rgba(0, 255, 0, var(--opacity-xs)), rgba(0, 0, 255, var(--opacity-xs)));
            background-size: 300% 100%;
            animation: chromatic-drift 10s infinite linear;
        }
    }

    @keyframes chromatic-drift {
        0% {
            background-position: 0% 0%;
        }
        100% {
            background-position: 300% 0%;
        }
    }

    .placeholder {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-family: var(--font-header);
        font-weight: 700;
        color: white;
        text-shadow: var(--shadow-l);
        background-color: var(--signature-color);
        background-image: radial-gradient(at 0% 0%, color-mix(in srgb, var(--signature-color), white var(--opacity-m-val)) 0, transparent 50%), radial-gradient(at 100% 100%, color-mix(in srgb, var(--signature-color), black var(--opacity-l-val)) 0, transparent 50%);
        background-blend-mode: overlay;
        text-transform: uppercase;
    }
</style>
