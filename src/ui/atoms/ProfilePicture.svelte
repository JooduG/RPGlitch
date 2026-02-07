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
    let pictureUrl = $derived(entity?.visuals?.profilePictureUrl)
    let name = $derived(entity?.name || "Entity")
    let signatureColor = $derived(themeStore.getSignatureColor(entity))
    let initials = $derived(themeStore.getInitials(name))
    let isNoBg = $derived(entity?.visuals?.noBackground)
    let isFlipped = $derived(entity?.visuals?.flipped || entity?.visuals?.flip)
</script>

<div class="profile-picture" style="--signature-color: {signatureColor}">
    {#if pictureUrl}
        <!-- Real image exists - show it -->
        <img
            src={pictureUrl}
            alt="{name} Profile"
            class="picture"
            class:no-bg={isNoBg}
            class:flipped={isFlipped}
        />
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

    .picture {
        width: 100%;
        height: 100%;
        object-fit: cover;

        &.no-bg {
            object-fit: contain;
        }

        &.flipped {
            transform: scaleX(-1);
        }
    }

    .placeholder {
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

        // Premium Mesh Gradient
        background-color: var(--signature-color);
        background-image:
            radial-gradient(
                at 0% 0%,
                color-mix(in srgb, var(--signature-color), white 20%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 50% 0%,
                color-mix(in srgb, var(--signature-color), black 20%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 100% 0%,
                color-mix(in srgb, var(--signature-color), white 10%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 0% 50%,
                color-mix(in srgb, var(--signature-color), black 30%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 100% 50%,
                color-mix(in srgb, var(--signature-color), white 30%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 0% 100%,
                color-mix(in srgb, var(--signature-color), black 20%) 0,
                transparent 50%
            ),
            radial-gradient(
                at 50% 100%,
                color-mix(in srgb, var(--signature-color), white 10%) 0,
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
