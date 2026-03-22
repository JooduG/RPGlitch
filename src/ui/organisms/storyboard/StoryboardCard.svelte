<script>
    /**
     * @file StoryboardCard.svelte
     * 🃏 THE SELECTION TAROT
     * Handles the display and selection of Characters or Fractals.
     * RUTHLESSLY FLATTENED — Zero backward compatibility.
     * * @typedef {Object} Entity
     * @property {string} name
     * @property {string} description
     * @property {string} [signature_color]
     * @property {string} [profile_picture]
     */
    let {
        entity,
        role_label = "",
        type = "user", // "ai" | "fractal" | "user"
        on_select = () => {},
        on_view_profile = () => {},
    } = $props()
    import Button from "@ui/atoms/Button.svelte"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"
    import LoadingSkeleton from "@ui/molecules/LoadingSkeleton.svelte"
    import { app } from "@state/app.svelte.js"
    import { engineState } from "@state/status.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
    import { fitText } from "@ui/utils/actions/fitText.js"
    import { tilt } from "@ui/utils/actions/tilt.js"
    // --- DERIVED STATE ---
    let is_empty = $derived(!entity)
    let is_loading = $derived(app.simulation.loading)
    let is_processing = $derived(engineState.phase !== "idle")
    // Theme Store now natively handles top-level signature_color
    let signature_color = $derived(themeStore.get_signature_color(entity))
    let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color))
    // --- ANIMATION STATE ---
    let is_shimmering = $state(false)
    function trigger_shimmer() {
        if (!is_shimmering) is_shimmering = true
    }
    function reset_shimmer() {
        is_shimmering = false
    }
</script>

<div
    class="split-card {type}-card material-interactive"
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
            <Button className="card-top" variant="ghost" onclick={on_view_profile} aria-label="View {role_label} Profile">
                <ProfilePicture {entity} />
            </Button>
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
</div>

<style>
    .split-card {
        background: transparent;
        box-shadow: none;
        border-radius: 0;
        transition: transform var(--transition-speed) var(--physics-transition-elastic);
        container-type: inline-size;
        --card-height: 40vh;
        --card-width: 25vh;
        height: var(--card-height);
        width: var(--card-width);
        margin: auto;
        justify-self: center;
        position: relative;
        &.fractal-card {
            height: var(--card-width);
            width: var(--card-height);
            transform: scale(1.02);
            z-index: var(--z-chip);
        }
        &:hover {
            z-index: var(--z-chip);
        }
        .card-surface {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            border-radius: var(--border-radius-l);
            overflow: hidden;
            background: var(--surface-raised);
            box-shadow:
                var(--shadow-xl),
                inset 0 0 0 1px var(--border-light);
            border: none;
            transform: translateZ(0);
            transition:
                background var(--transition-speed) ease,
                box-shadow var(--transition-speed) ease-in-out;
            &:not(.is-empty):not(.is-loading):hover {
                box-shadow: 0 var(--spacing-xxl) var(--spacing-xxxl) color-mix(in srgb, var(--signature-color), transparent 70%);
            }
            &.is-loading {
                background: var(--surface-sunken);
                :global(*) {
                    border-color: var(--border-light);
                }
            }
            &.shimmering::after {
                animation: shimmer 1.5s var(--physics-transition-elastic) forwards;
            }
            &::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(105deg, transparent 20%, var(--border-light) 35%, var(--border-light) 50%, var(--border-light) 65%, transparent 80%);
                transform: translateX(-100%);
                z-index: var(--z-overlay);
                pointer-events: none;
            }
            &.is-empty {
                background: var(--surface-sunken);
                box-shadow: inset 0 2px 10px var(--surface-elevated);
                &::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(90deg, transparent 0, var(--border-light) 20%, var(--surface-elevated) 60%, transparent);
                    filter: blur(var(--blur-l));
                    animation: skeleton-shimmer 2.5s infinite;
                    z-index: var(--z-overlay);
                    pointer-events: none;
                }
                &:hover {
                    box-shadow: var(--surface-elevated), var(--shadow-glow);
                    transition: 
                        background var(--transition-speed-slow) ease,
                        box-shadow var(--transition-speed-slow) ease-in-out;
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
            :global(.card-top) {
                height: 60%;
            }
            :global(.card-bottom) {
                height: 40%;
            }
        }
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
                box-shadow: inset var(--spacing-px) 0 0 var(--border-light);
                padding: var(--spacing-m);
            }
        }
    }
    :global(.card-top.btn) {
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
        &:hover {
            transform: none;
            box-shadow: none;
            filter: none;
            z-index: auto;
        }
    }
    :global(.card-bottom.btn) {
        width: 100%;
        background: color-mix(in oklab, var(--signature-color) 10%, var(--surface-sunken));
        border: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--spacing-xs); /* Tighter gap for better grouping */
        padding: var(--spacing-l); /* Increased padding for premium feel */
        border-radius: 0;
        &:hover {
            transform: none;
            box-shadow: none;
            filter: none;
            z-index: auto;
            background: color-mix(in oklab, var(--signature-color) 10%, var(--surface-sunken));
        }
        .text-half {
            width: 100%;
        }
        .title-half h2 {
            margin: 0;
            color: rgb(var(--signature-rgb));
            font-weight: var(--font-bold);
            font-family: var(--font-heading); /* Reinforce branding */
            font-size: var(--font-size-xxl);
            line-height: var(--line-height-heading);
            text-shadow: var(--shadow-text); /* Added for contrast */
            word-break: normal;
            overflow-wrap: normal;
            white-space: normal;
            text-align: left;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .desc-half p {
            margin: 0;
            color: var(--font-color);
            opacity: var(--opacity-l);
            font-family: var(--font-sans); /* Reinforce branding */
            font-size: var(--font-size-m);
            text-align: left;
            line-height: var(--line-height-base);
            word-break: break-word;
            overflow-wrap: anywhere;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
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
        transform: none;
        box-shadow: none;
        filter: none;
        transition: all var(--transition-speed-slow) var(--physics-transition-elastic);
        position: relative;
        overflow: hidden;
        border-radius: var(--border-radius-l);
        &:hover {
            background: transparent;
            transform: none;
            box-shadow: none;
            filter: none;
        }
        .empty-label {
            position: absolute;
            bottom: 25%;
            font-size: var(--font-size-s);
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-family: var(--font-heading);
            color: var(--font-color);
            text-shadow: var(--shadow-text);
            opacity: 0;
            transition:
                opacity var(--transition-speed-slow) ease,
                transform var(--transition-speed-slow) ease;
            pointer-events: none;
        }
        .empty-icon {
            color: var(--color-white);
            width: var(--spacing-xxxl);
            height: var(--spacing-xxxl);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: var(--opacity-l);
            transition:
                opacity var(--transition-speed-slow) ease,
                filter var(--transition-speed-slow) ease;
            :global(svg),
            svg {
                width: 100%;
                height: 100%;
                fill: currentColor;
                transition: fill var(--transition-speed-slow) var(--physics-transition-elastic);
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
