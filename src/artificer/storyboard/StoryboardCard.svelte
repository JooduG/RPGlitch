<script>
    /**
     * @typedef {Object} Entity
     * @property {string} name
     * @property {string} description
     * @property {Object} [visuals]
     * @property {string} [visuals.signatureColor]
     * @property {string} [visuals.avatar]
     */

    let {
        entity,
        roleLabel,
        type = "user", // "ai" | "fractal" | "user"
        onSelect,
        onViewProfile,
    } = $props()

    import Button from "../Button.svelte"

    import { app } from "../../gamemaster/state.svelte.js"
    import { themeStore } from "../../mesmer/logic/theme.svelte.js"
    import Illusion from "../../mesmer/ui/Illusion.svelte"
    import ProfilePicture from "../../mesmer/ui/ProfilePicture.svelte"

    // Derived Values
    let isEmpty = $derived(!entity)
    let isLoading = $derived(app.simulation.loading)
    let isProcessing = $derived(
        ["scanning reality", "synthesizing", "saving"].includes(
            app.simulation.status
        )
    )

    let signatureColor = $derived(themeStore.getSignatureColor(entity))
    let signatureRgb = $derived(themeStore.hexToRgb(signatureColor))
</script>

<div
    class="split-card {type}-card"
    class:fractal-card={type === "fractal"}
    class:is-empty={isEmpty}
    class:is-loading={isLoading}
    class:is-processing={isProcessing}
    style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
>
    {#snippet emptyState()}
        <Button
            className="empty-card"
            variant="ghost"
            onclick={onSelect}
            aria-label="Select {roleLabel}"
        >
            <span class="empty-label">{roleLabel}</span>
            <div class="empty-icon">
                {#if type === "fractal"}
                    <svg viewBox="0 0 24 24" class="icon">
                        <path
                            fill="currentColor"
                            d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z"
                        />
                    </svg>
                {:else}
                    <svg viewBox="0 0 24 24" class="icon">
                        <path
                            fill="currentColor"
                            d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
                        />
                    </svg>
                {/if}
            </div>
        </Button>
    {/snippet}

    {#snippet populatedState()}
        <!-- Top Half: Visuals & Trigger for Profile -->
        <Button
            className="card-top"
            variant="ghost"
            onclick={onViewProfile}
            aria-label="View {roleLabel} Profile"
        >
            <ProfilePicture {entity} />
        </Button>

        <!-- Bottom Half: Info & Trigger for Selection -->
        <Button className="card-bottom" variant="ghost" onclick={onSelect}>
            <div class="text-half title-half">
                <h3>{entity?.name || `Select ${roleLabel}`}</h3>
            </div>
            <div class="text-half desc-half">
                <p>{entity?.description || "Click to browse choices..."}</p>
            </div>
        </Button>
    {/snippet}

    {#if isLoading}
        <Illusion variant="card" width="100%" height="100%" />
    {:else if isEmpty}
        {@render emptyState()}
    {:else}
        {@render populatedState()}
    {/if}
</div>

<style lang="scss">
    @use "../../mesmer/scss/abstracts/variables" as *;
    @use "../../mesmer/scss/abstracts/mixins" as *;
    @use "../../mesmer/scss/abstracts/placeholders" as *;

    .split-card {
        @extend %card-base;
        @extend %material-interactive;

        display: flex;
        flex-direction: column;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            border-color 0.3s ease;
        container-type: inline-size;

        /* Geometric Containment Variables */
        --long-side: 40vh;
        --short-side: 25vh;

        /* Default: Side Card (Portrait) */
        height: var(--long-side);
        width: var(--short-side);
        margin: auto;
        justify-self: center;
        position: relative;

        /* Signature Border Sync Purged */
        /* border: 1px solid rgba(var(--signature-rgb) / 0.2); */

        /* Center Card (Fractal/Landscape) */
        &.fractal-card {
            height: var(--short-side);
            width: var(--long-side);
            transform: scale(1.02);
            z-index: 10;

            :global(.card-top) {
                height: 50%;
            }
            :global(.card-bottom) {
                height: 50%;
            }

            :global(.card-bottom.btn .title-half h3) {
                -webkit-line-clamp: 1;
                line-clamp: 1;
            }
        }

        &:hover:not(.is-empty):not(.is-loading) {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 30px 60px rgba(var(--signature-rgb) / 0.3);
            /* Border-color purged */
            z-index: 20;
        }

        &.is-empty {
            /* Border purged */
            background: rgba(10, 10, 15, 0.5);
        }
    }

    :global(.card-top.btn) {
        height: 60%; /* Characters: 60/40 Split */
        width: 100%;
        border: none;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        background-color: var(--signature-color);
        overflow: hidden;
        border-radius: 0; /* Reset radius */

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.1),
                transparent
            );
            transform: translateX(-100%);
            animation: shimmer 5s infinite;
        }
    }

    :global(.card-bottom.btn) {
        height: 40%;
        width: 100%;
        background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.4),
            rgba(0, 0, 0, 0.85)
        );
        border: none;
        /* Border-top purged */
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--space-xs);
        padding: var(--space-sm) var(--space-md-lg);
        border-radius: 0; /* Reset radius */

        .text-half {
            width: 100%;
        }

        .title-half {
            h3 {
                margin: 0;
                color: rgb(var(--signature-rgb));
                font-weight: 700;
                text-align: left;
                word-break: break-word;
                overflow-wrap: anywhere;

                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;

                /* Fractal cards get 1 line only - Moved to .fractal-card block */
            }
        }

        .desc-half {
            p {
                margin: 0;
                color: white;
                opacity: var(--text-secondary);
                font-size: 0.8125rem;
                text-align: left;
                line-height: 1.35;
                word-break: break-word;
                overflow-wrap: anywhere;

                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        }
    }

    :global(.empty-card.btn) {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background: transparent;
        border: none;

        .empty-label {
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(255, 255, 255, 0.5);
        }

        .empty-icon {
            color: rgba(255, 255, 255, 0.3);
            width: 32px;
        }
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        50% {
            transform: translateX(100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
</style>
