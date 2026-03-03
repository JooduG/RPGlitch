<script>
    /**
     * @typedef {Object} Entity
     * @property {string} name
     * @property {string} description
     * @property {Object} [visuals]
     * @property {string} [visuals.signature_color]
     * @property {string} [visuals.profile_picture]
     */

    let {
        entity,
        roleLabel: role_label = "",
        type = "user", // "ai" | "fractal" | "user"
        onSelect: on_select = () => {},
        onViewProfile: on_view_profile = () => {},
    } = $props()

    import Button from "@ui/atoms/Button.svelte"

    import { app } from "@state/app.svelte.js"
    import { engineState } from "@state/status.svelte.js"
    // [R5] Unified State
    import { themeStore } from "@theme/palette.svelte.js"
    import { fitText } from "@ui/utils/actions/fitText.js"
    import { tilt } from "@ui/utils/actions/tilt.js"
    // Import Actions
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"
    import LoadingSkeleton from "@ui/molecules/LoadingSkeleton.svelte"

    // Derived Values
    let is_empty = $derived(!entity)
    let is_loading = $derived(app.simulation.loading)
    let is_processing = $derived(engineState.phase !== "idle")

    let signature_color = $derived(themeStore.getSignatureColor(entity))
    let signature_rgb = $derived(themeStore.hexToRgb(signature_color))

    // Animation Persistance State
    let is_shimmering = $state(false)

    function trigger_shimmer() {
        if (!is_shimmering) is_shimmering = true
    }

    function reset_shimmer() {
        is_shimmering = false
    }
</script>

<div
    class="split-card {type}-card"
    class:fractal-card={type === "fractal"}
    onmouseenter={trigger_shimmer}
    onanimationend={reset_shimmer}
    role="group"
    aria-label="{role_label || 'Entity'} Card"
    style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
    data-testid="storyboard-card"
    use:tilt={{
        max: is_empty || is_loading ? 0 : 25,
        scale: is_empty || is_loading ? 1 : 1.05,
        speed: 400,
        perspective: 1000,
    }}
>
    <!-- Inner Surface: Handles Atmosphere (Glow, Color, Shimmer) - Protected from Tilt.js -->
    <div class="card-surface" class:is-empty={is_empty} class:is-loading={is_loading} class:is-processing={is_processing} class:shimmering={is_shimmering}>
        {#snippet emptyState()}
            <Button className="empty-card" variant="ghost" onclick={on_select} aria-label="Select {role_label}">
                <span class="empty-label">{role_label}</span>
                <div class="empty-icon">
                    {#if type === "fractal"}
                        <svg viewBox="0 0 24 24" class="icon">
                            <path fill="currentColor" d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" class="icon">
                            <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                        </svg>
                    {/if}
                </div>
            </Button>
        {/snippet}

        {#snippet populatedState()}
            <!-- Top Half: Visuals & Trigger for Profile -->
            <Button className="card-top" variant="ghost" onclick={on_view_profile} aria-label="View {role_label} Profile">
                <ProfilePicture {entity} />
            </Button>

            <!-- Bottom Half: Info & Trigger for Selection -->
            <Button className="card-bottom" variant="ghost" onclick={on_select}>
                <div class="text-half title-half">
                    <h2
                        use:fitText={{
                            maxSize: 42,
                            minSize: 16,
                            lineHeight: "1.1",
                        }}
                    >
                        {entity?.name || `Select ${role_label}`}
                    </h2>
                </div>
                <div class="text-half desc-half">
                    <p>{entity?.description || "Click to browse choices..."}</p>
                </div>
            </Button>
        {/snippet}

        {#if is_loading}
            <div class="card-illusion">
                <LoadingSkeleton variant="card" width="100%" height="100%" />
            </div>
        {:else if is_empty}
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
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/mixins" as *;
    @use "@theme/abstracts/placeholders" as *;

    .split-card {
        @extend %card-base;
        @extend %material-interactive;

        /* FIX: Strip default card styles that bleed out during tilt */
        background: transparent;
        box-shadow: none;
        border-radius: 0; /* Let children handle shape */

        /* Layout & Transform */
        transition: transform var(--transition-speed) var(--physics-transition-elastic);

        container-type: inline-size;

        /* Geometric Containment Variables */
        --card-height: 40vh;
        --card-width: 25vh;

        /* Default: Side Card (Portrait) */
        height: var(--card-height);
        width: var(--card-width);
        margin: auto;
        justify-self: center;
        position: relative;

        /* Center Card (Fractal/Landscape) */
        &.fractal-card {
            height: var(--card-width);
            width: var(--card-height);
            /* Transform scale handled by tilt/hover */
            transform: scale(1.02);
            z-index: var(--z-chip);
        }

        /* Hover: Lift Component z-index */
        &:hover {
            z-index: var(--z-chip);
        }

        /* INNER SURFACE: Visuals & Atmosphere */
        .card-surface {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;

            /* The Glass/Card Visuals */
            border-radius: var(--border-radius-l);
            overflow: hidden;
            background: var(--layer-surface);
            backdrop-filter: blur(var(--blur-m));
            box-shadow:
                var(--shadow-xl),
                inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xs));
            border: none;
            transform: translateZ(0); /* Force GPU layer */

            /* THE HOLY GRAIL TRANSITION */
            transition:
                background 1s ease,
                box-shadow 1s ease-in-out;

            /* Hover State for Surface */
            &:not(.is-empty):not(.is-loading):hover {
                box-shadow: 0 var(--spacing-xxl) var(--spacing-xxxl) rgb(var(--signature-rgb) / var(--opacity-s));
            }

            /* State: Loading - Surface Sunken */
            &.is-loading {
                background: var(--surface-sunken);

                /* Kill blue tints in loading state children if any */
                :global(*) {
                    border-color: var(--glass-border);
                }
            }

            /* State: Shimmering */
            &.shimmering {
                &::after {
                    animation: shimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            }

            /* Universal Shimmer Overlay (Hidden by default) */
            &::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(105deg, transparent 20%, rgb(255 255 255 / var(--opacity-xxs)) 35%, rgb(255 255 255 / var(--opacity-xs)) 50%, rgb(255 255 255 / var(--opacity-xxs)) 65%, transparent 80%);
                transform: translateX(-100%);
                z-index: var(--z-overlay);
                pointer-events: none;
            }

            /* State: Empty (Skeleton Layout) */
            &.is-empty {
                background: var(--surface-sunken);
                box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);

                /* Continuous pulsing shimmer for skeleton effect */
                &::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(90deg, transparent 0, rgb(var(--pure-white-rgb) / var(--opacity-xxs)) 20%, rgb(var(--pure-white-rgb) / var(--opacity-s)) 60%, transparent);
                    filter: blur(var(--blur-l));
                    animation: skeleton-shimmer 2.5s infinite;
                    z-index: var(--z-overlay);
                    pointer-events: none;
                }

                &:hover {
                    box-shadow:
                        inset 0 2px 10px rgba(0, 0, 0, 0.5),
                        var(--shadow-glow);

                    /* Unified Trigger: Brighten Children on PARENT hover */
                    :global(.empty-icon) {
                        opacity: 1;
                        filter: drop-shadow(0 0 8px rgb(var(--signature-rgb) / 0.8));
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
            :global(.card-top) {
                height: 100%;
                width: 50%;
            }
            :global(.card-bottom) {
                height: 100%;
                width: 50%;
                border-top: none;
                box-shadow: inset var(--spacing-px) 0 0 var(--glass-border);
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
        background-color: transparent;
        overflow: hidden;
        border-radius: 0;

        /* FIX: Neutralize inner button physics to prevent flicker during tilt */
        &:hover {
            transform: none;
            box-shadow: none;
            filter: none;
            z-index: auto;
        }
    }

    :global(.card-bottom.btn) {
        height: 40%;
        width: 100%;
        /* Surface Sunken + 10% Sig (Matches Profile Header/Footer) */
        background: color-mix(in oklab, var(--signature-color) 10%, var(--surface-sunken));
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
            /* Maintain Surface Mix on Hover */
            background: color-mix(in oklab, var(--signature-color) 10%, var(--surface-sunken));
        }

        .text-half {
            width: 100%;
        }

        .title-half {
            h2 {
                margin: 0;
                color: rgb(var(--signature-rgb));
                font-weight: var(--font-bold);
                /* Increased Base Size for fitText scaling */
                font-size: var(--font-size-xxxxl);
                line-height: var(--line-height-heading);
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
            padding-bottom: var(--spacing-xs);
        }

        .desc-half {
            p {
                margin: 0;
                color: var(--app-color);
                opacity: var(--opacity-l);
                font-size: var(--font-size-m);
                text-align: left;
                line-height: var(--line-height-base);
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
        border-radius: var(--border-radius-l); /* Ensure shimmer respects corners */

        /* Hover Effect for Placeholder */
        &:hover {
            background: transparent; /* Disable ghost hover background */
            transform: none; /* Kill button up-movement */
            box-shadow: none;
            filter: none; /* Kill brightness zap */
        }

        .empty-label {
            position: absolute;
            bottom: 25%;
            font-size: var(--font-size-s);
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-family: var(--font-family-heading);
            color: var(--app-color);
            text-shadow: var(--rp-text-shadow);
            opacity: 0;
            transition:
                opacity 1s ease,
                transform 1s ease;
            pointer-events: none;
        }

        .empty-icon {
            color: rgb(var(--pure-white-rgb) / var(--opacity-xl));
            width: var(--spacing-xxxl);
            height: var(--spacing-xxxl);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: var(--opacity-m);
            transition:
                opacity 1s ease,
                filter 1s ease;

            /* Base State for SVG - Respect parent color */
            :global(svg),
            svg {
                width: 100%;
                height: 100%;
                fill: currentColor;
                transition: fill 1s ease;
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
