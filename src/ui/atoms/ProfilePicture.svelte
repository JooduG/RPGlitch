<script>
    /**
     * ProfilePicture - Agnostic profile image renderer
     * Handles: real images, placeholders, AI art, phone pics - whatever
     * Profile.svelte doesn't need to know the details.
     *
     * @typedef {Object} Entity
     * @property {string} name
     * @property {Object} [visuals]
     * @property {string} [visuals.profilePictureUrl]
     * @property {string} [visuals.signatureColor]
     * @property {boolean} [visuals.noBackground]
     * @property {boolean} [visuals.flipped]
     */

    import { themeStore } from "@theme/palette.svelte.js"
    import { fitText } from "@ui/utils/actions/fitText.js"

    let { entity } = $props()

    // Extract what we need from the entity
    let pictureUrl = $derived(entity?.visuals?.profilePicture)
    let name = $derived(entity?.name || "Entity")
    let signatureColor = $derived(themeStore.getSignatureColor(entity))
    let initials = $derived(themeStore.getInitials(name))
    let isNoBg = $derived(entity?.visuals?.noBackground)
    let isFlipped = $derived(entity?.visuals?.flipped || entity?.visuals?.flip)
</script>

<div class="profile-picture" style="--signature-color: {signatureColor}">
    {#if pictureUrl}
        <!-- Real image exists - show it -->
        <div class="image-container">
            <img
                src={pictureUrl}
                alt="{name} Profile"
                class="picture"
                class:no-bg={isNoBg}
                class:flipped={isFlipped}
            />
            <div class="glitch-overlay"></div>
        </div>
    {:else}
        <!-- No image - show initials placeholder -->
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

        &.no-bg {
            object-fit: contain;
        }

        &.flipped {
            transform: scaleX(-1);
        }
    }

    .glitch-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        mix-blend-mode: overlay;
        opacity: 0.15;

        background: linear-gradient(
            transparent 50%,
            rgba(0, 0, 0, 0.1) 50%,
            rgba(0, 0, 0, 0.1)
        );
        background-size: 100% 4px;

        &::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                rgba(255, 0, 0, 0.05),
                rgba(0, 255, 0, 0.05),
                rgba(0, 0, 255, 0.05)
            );
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
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        display: flex;
        font-family: var(--font-heading);
        font-size: clamp(1rem, 15vw, 10rem);
        font-weight: 700;
        color: white;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        background-color: var(--signature-color);
        background-image:
            radial-gradient(
                at 0% 0%,
                color-mix(in srgb, var(--signature-color), white 20%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 100% 100%,
                color-mix(in srgb, var(--signature-color), black 30%) 0,
                transparent 50%
            );
        background-blend-mode: overlay;
    }
</style>
