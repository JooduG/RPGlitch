<script>
    /**
     * LibraryCard - A compact version of StoryboardCard for the Library drawer.
     */
    let {
        entity,
        type = "ai", // "ai" | "user" | "fractal"
        onSelect,
        onViewProfile,
    } = $props()

    import { fade } from "svelte/transition"
    import { fitText } from "../artificer/actions/fitText.js"
    import { themeStore } from "../mesmer/logic/theme.svelte.js"

    let signatureColor = $derived(themeStore.getSignatureColor(entity))
    let signatureRgb = $derived(themeStore.hexToRgb(signatureColor))
    let avatar = $derived(entity?.visuals?.profilePictureUrl)
    let name = $derived(entity?.name || "Untitled")
</script>

<button
    class="drawer-card"
    class:fractal-card={type === "fractal"}
    style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
    onclick={onSelect}
    oncontextmenu={(e) => {
        e.preventDefault()
        onViewProfile()
    }}
>
    <div class="card-visual">
        {#if avatar}
            <img
                src={avatar}
                alt="{name} Avatar"
                class="profile-picture-image"
                transition:fade={{ duration: 200 }}
            />
        {:else}
            <div
                class="profile-picture-placeholder"
                class:fractal-mode={type === "fractal"}
            >
                {themeStore.getInitials(name)}
            </div>
        {/if}
    </div>

    <div class="card-info">
        <h5>
            <span class="entity-name" use:fitText>{name}</span>
        </h5>
    </div>

    <div class="signature-bar"></div>
</button>

<style lang="scss">
    @use "sass:color";
    @use "../mesmer/scss/abstracts/variables" as *;
    @use "../mesmer/scss/abstracts/mixins" as *;
    @use "../mesmer/scss/abstracts/placeholders" as *;

    .drawer-card {
        aspect-ratio: 2 / 3;
        background: var(--bg-card);
        /* Border purged */
        border-radius: var(--spacing-s);
        position: relative;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding: 0;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: left;
        width: 140px;
        flex: 0 0 auto;
        border: 0;

        @extend %material-interactive;

        &:hover {
            transform: translateY(-4px);
            /* Border-color purged */
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .card-visual {
            flex: 1.5;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;

            .profile-picture-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.6s ease;
            }

            .profile-picture-placeholder {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background: var(--signature-color);
                color: #ffffff;
                font-size: var(--font-size-xxxxxl);
                font-weight: 800;
                transition: transform 0.6s ease;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                font-family: "Ubuntu";

                &.fractal-mode {
                    font-size: var(--font-size-xxxxxl);
                }
            }
        }

        .card-info {
            flex: 0.6;
            padding: var(--spacing-xs) var(--spacing-s);
            display: flex;
            align-items: center;
            background: var(--bg-app);

            h5 {
                margin: 0;
                padding: 0;
            }

            .entity-name {
                color: var(--signature-color);
                text-wrap: balance;
                display: -webkit-box;
                line-clamp: 2;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin: 0;
                padding: 0;
            }
        }
    }
</style>
