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

    import Button from "@ui/atoms/Button.svelte"

    import { app } from "@state/app.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
    import { fitText } from "@ui/utils/actions/fitText.js"
    import { tilt } from "@ui/utils/actions/tilt.js"
    // Import Actions
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"
    import LoadingSkeleton from "@ui/molecules/LoadingSkeleton.svelte"

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

    // Animation Persistance State
    let isShimmering = $state(false)

    function triggerShimmer() {
        if (!isShimmering) isShimmering = true
    }

    function resetShimmer() {
        isShimmering = false
    }
</script>

<div
    class="split-card {type}-card"
    class:fractal-card={type === "fractal"}
    onmouseenter={triggerShimmer}
    onanimationend={resetShimmer}
    role="group"
    aria-label="{roleLabel || 'Entity'} Card"
    style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
    data-testid="storyboard-card"
    use:tilt={{
        max: isEmpty || isLoading ? 0 : 25,
        scale: isEmpty || isLoading ? 1 : 1.05,
        speed: 400,
        perspective: 1000,
    }}
>
    <!-- Inner Surface: Handles Atmosphere (Glow, Color, Shimmer) - Protected from Tilt.js -->
    <div
        class="card-surface"
        class:is-empty={isEmpty}
        class:is-loading={isLoading}
        class:is-processing={isProcessing}
        class:shimmering={isShimmering}
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
                    <h2
                        use:fitText={{
                            maxSize: 42,
                            minSize: 16,
                            lineHeight: "1.1",
                        }}
                    >
                        {entity?.name || `Select ${roleLabel}`}
                    </h2>
                </div>
                <div class="text-half desc-half">
                    <p>{entity?.description || "Click to browse choices..."}</p>
                </div>
            </Button>
        {/snippet}

        {#if isLoading}
            <div class="card-illusion">
                <LoadingSkeleton variant="card" width="100%" height="100%" />
            </div>
        {:else if isEmpty}
            {@render emptyState()}
        {:else}
            {@render populatedState()}
        {/if}
    </div>
    <!-- End .card-surface -->
</div>

<!-- End .split-card -->

<style lang="scss">
    @use "sass:color";
    @use "../../../theme/abstracts/variables" as *;
    @use "../../../theme/abstracts/mixins" as *;
    @use "../../../theme/abstracts/placeholders" as *;

    .split-card {
        @extend %card-base;
        @extend %material-interactive;

        /* FIX: Strip default card styles that bleed out during tilt */
        background: transparent;
        box-shadow: none;
        border-radius: 0; /* Let children handle shape */

        display: flex;
        flex-direction: column;
        /* Physics Only: Layout & Transform */
        transition: transform 0.3s ease; /* Tilt handles this, but good fallback */

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

        /* Center Card (Fractal/Landscape) */
        /* Center Card (Fractal/Landscape) */
        &.fractal-card {
            height: var(--short-side);
            width: var(--long-side);
            /* Transform scale handled by tilt/hover */
            transform: scale(1.02);
            z-index: 10;
        }

        /* Hover: Lift Component z-index */
        &:hover {
            z-index: 20;
        }

        /* INNER SURFACE: Visuals & Atmosphere */
        .card-surface {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;

            /* The Glass/Card Visuals */
            border-radius: var(--spacing-l);
            overflow: hidden;
            background: var(--chalk);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            transform: translateZ(
                0
            ); /* Force GPU layer to fix 3D clipping artifacts */

            /* THE HOLY GRAIL TRANSITION: Protected from JS */
            transition:
                background 1.5s ease,
                box-shadow 1.5s ease-in-out;

            /* Hover State for Surface */
            &:not(.is-empty):not(.is-loading):hover {
                box-shadow: 0 30px 60px rgba(var(--signature-rgb) / 0.25); /* Boosted to 0.25 */
            }

            /* Diagonal Depth Lighting: Removed per user request (R3) */

            /* State: Loading - Chalk Regime */
            &.is-loading {
                background: var(--chalk, #222326);

                /* Kill blue tints in loading state children if any */
                :global(*) {
                    border-color: rgba(255, 255, 255, 0.1);
                }
            }

            /* State: Shimmering */
            &.shimmering {
                &::after {
                    animation: shimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1)
                        forwards;
                }
            }

            /* Universal Shimmer Overlay (Hidden by default) */
            &::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    105deg,
                    transparent 20%,
                    rgba(255, 255, 255, 0.05) 35%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0.05) 65%,
                    transparent 80%
                );
                transform: translateX(-100%);
                z-index: 10;
                pointer-events: none;
            }

            /* State: Empty */
            &.is-empty {
                &:hover {
                    box-shadow: 0 0 30px rgba(255, 255, 255, 0.25); /* Boosted form 0.1 to 0.25 */

                    /* Unified Trigger: Brighten Children on PARENT hover */
                    :global(.empty-icon) {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    :global(.empty-label) {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }

            /* Pass down fractal sizing */
            :global(.card-top) {
                height: 60%;
            }
            :global(.card-bottom) {
                height: 40%;
            }
        }

        /* FRACTAL OVERRIDES for Inner Surface Layout */
        &.fractal-card .card-surface {
            flex-direction: row;
            /* Checking old code... it just changed heights of children usually */
            :global(.card-top) {
                height: 100%;
                width: 50%;
            }
            :global(.card-bottom) {
                height: 100%;
                width: 50%;
                border-top: none;
                border-left: 1px solid rgba(255, 255, 255, 0.05);
            }
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
        border-radius: 0;

        /* animation: shimmer 5s infinite; -- Removed per user request */

        /* FIX: Neutralize inner button physics to prevent flicker during tilt */
        &:hover {
            transform: none;
            box-shadow: none;
            filter: none;
            z-index: auto;
        }
    }

    /* Trigger logic moved to inside .split-card */

    :global(.card-bottom.btn) {
        height: 40%;
        width: 100%;
        /* Gunmetal + 5% Sig (Matches Profile Header/Footer) */
        background: color-mix(
            in oklab,
            var(--signature-color) 10%,
            var(--gunmetal, #363840)
        );
        backdrop-filter: none; /* Opaque per request */
        border: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--spacing-xxs);
        border-radius: 0;

        /* FIX: Neutralize inner button physics to prevent flicker during tilt */
        &:hover {
            transform: none;
            box-shadow: none;
            filter: none;
            z-index: auto;
            /* Maintain Gunmetal Mix on Hover */
            background: color-mix(
                in oklab,
                var(--signature-color) 10%,
                var(--gunmetal, #363840)
            );
        }

        .text-half {
            width: 100%;
        }

        .title-half {
            h2 {
                margin: 0;
                color: rgb(var(--signature-rgb));
                font-weight: 700;
                /* Increased Base Size for fitText scaling */
                font-size: var(--font-size-xxxxl);
                line-height: 1.1;
                word-break: normal;
                overflow-wrap: normal; /* CRITICAL: Prevent browser from hiding overflow via splitting */
                white-space: normal;
                text-align: left;
                padding-top: var(--spacing-m);

                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;

                /* Fractal cards get 1 line only - Moved to .fractal-card block */
            }
            /* User added padding-top in prev step, keeping it if present, ensuring bottom padding */
            padding-bottom: 0.25rem;
        }

        .desc-half {
            p {
                margin: 0;
                color: white;
                opacity: var(--text-secondary);
                font-size: var(--font-size-m);
                text-align: left;
                line-height: 1.35;
                word-break: break-word;
                overflow-wrap: anywhere;

                display: -webkit-box;
                -webkit-line-clamp: 3; /* FIX: Truncate description */
                line-clamp: 3;
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
        gap: var(--spacing-m);
        background: transparent;
        border: none;

        /* Neutralize Button Physics */
        transform: none;
        box-shadow: none;
        filter: none; /* Kill brightness zap */
        transition: all 1.5s ease; /* Force slow transition for any residue */

        /* Shimmer Base */
        position: relative;
        overflow: hidden;
        border-radius: 24px; /* Ensure shimmer respects corners */

        /* Shimmer removed - handled by parent .card-surface */

        /* Hover Effect for Placeholder */
        &:hover {
            background: transparent; /* Disable ghost hover background */
            transform: none; /* Kill button up-movement */
            box-shadow: none;
            filter: none; /* Kill brightness zap */

            /* trigger moved to .card-surface.is-empty parent */

            /* Trigger Shimmer - Moved to .shimmering class */
        }

        .empty-label {
            position: absolute;
            bottom: 25%;
            font-size: 1.1rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-family: var(--font-heading, "Inter", sans-serif);
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: opacity 1.5s ease;
            pointer-events: none;
        }

        .empty-icon {
            color: rgba(255, 255, 255, 0.9);
            width: 4rem; /* Increased from 32px */
            opacity: 0.5; /* Visible but dim */
            transition:
                opacity 1.5s ease,
                filter 1.5s ease;

            /* Base State for SVG - Respect parent color */
            :global(svg),
            svg {
                fill: currentColor;
                transition: fill 1.5s ease;
            }
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
