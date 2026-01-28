<script>
    import { app } from "../../gamemaster/state.svelte.js"
    import { tilt } from "../actions/tilt.js"
    import Button from "../Button.svelte"
    import { storyboard } from "./storyboardActions.svelte.js"

    // Derived State
    let readyToBegin = $derived(
        app.selectedAi && app.selectedUser && app.selectedFractal
    )
</script>

<div class="pill-container">
    <div
        class="unified-capsule"
        use:tilt={{ max: 15, scale: 1.05, speed: 400 }}
    >
        <!-- Option 1: "The Twitch" (Subtle nervous energy) -->
        <div class="anim-wrapper twitch">
            <Button
                className="capsule-flank icon-glow"
                variant="ghost"
                onclick={storyboard.shuffle}
                aria-label="Shuffle All"
                title="Randomize Entities"
            >
                <svg viewBox="0 0 24 24" class="icon-small">
                    <path
                        fill="currentColor"
                        d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
                    />
                </svg>
            </Button>
        </div>

        <!-- Option 2: "The Spin" (Smooth rotation) -->
        <div class="anim-wrapper spin">
            <Button
                className="capsule-flank icon-glow"
                variant="ghost"
                onclick={app.toggleControlPanel}
                aria-label="Settings"
                title="Open Control Panel"
            >
                <svg viewBox="0 0 24 24" class="icon-small">
                    <path
                        fill="currentColor"
                        d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.35 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.35 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.95C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                    />
                </svg>
            </Button>
        </div>

        <!-- Option 3: "The Pop" (Scale + Brightness) -->
        <Button
            className="capsule-action pop"
            variant="ghost"
            disabled={!readyToBegin}
            onclick={storyboard.beginStory}
        >
            <div class="core-content">
                {#if readyToBegin}
                    <span class="label">Begin Story</span>
                {:else}
                    <span class="label">Begin Story</span>
                {/if}
            </div>

            <div class="illumination"></div>
        </Button>
    </div>
</div>

<style lang="scss">
    @use "../../mesmer/scss/abstracts/variables" as *;

    .pill-container {
        display: flex;
        justify-content: center;
        width: 100%;
        padding-bottom: var(--space-md);
        pointer-events: none;
    }

    .unified-capsule {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 1rem; /* User's gap */
        background: rgba(10, 10, 15, 0.5);
        backdrop-filter: blur(12px);
        border: 0; /* User's border choice */
        border-radius: 999px;
        padding: 1rem; /* User's padding */
        height: 3rem; /* User's height */
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    /* --- Universal Icon Glow --- */
    :global(.icon-glow:hover .icon-small) {
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
        color: white;
        transition: all 0.2s ease;
    }

    /* --- Animation 1: twitch (for Shuffle) --- */
    .anim-wrapper.twitch {
        margin-left: 5px;
    }

    .anim-wrapper.twitch:hover {
        animation: twitch 0.4s ease-in-out infinite;
    }

    @keyframes twitch {
        0% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(-10deg);
        }
        50% {
            transform: rotate(0deg);
        }
        75% {
            transform: rotate(10deg);
        }
        100% {
            transform: rotate(0deg);
        }
    }

    /* --- Animation 2: Spin (for Settings) --- */
    .anim-wrapper.spin:hover :global(svg) {
        transform: rotate(90deg);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* --- Animation 3: "Green for Go" (for Begin) --- */
    :global(.capsule-action.pop) {
        transition: all 0.3s ease;
        margin-right: 15px;
    }

    :global(.capsule-action.pop:hover) {
        background: transparent !important;
    }

    /* Green Hover Effect */
    :global(.capsule-action.pop:hover .label) {
        color: $color-success; /* Compliance Fix: System Emerald */
        text-shadow: 0 0 12px rgba($color-success, 0.4);
        letter-spacing: 0.1em;
    }

    /* Override Button Defaults to kill background hover */
    :global(.capsule-flank:hover),
    :global(.capsule-action:hover) {
        background: transparent !important;
    }

    /* Ensure icons reset nicely */
    .icon-small {
        transition:
            transform 0.3s ease,
            filter 0.3s ease;
    }

    /* Flank Buttons (Shuffle/Settings) */
    :global(.capsule-flank.btn) {
        width: 1.5rem; /* User's width */
        height: 100%;
        border-radius: 0;
        border: none;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Primary Action Button (Begin) */
    :global(.capsule-action.btn) {
        height: 100%;
        min-width: 130px;
        border: none;
        border-radius: 0;
        background: transparent;
        position: relative;
        overflow: hidden;
        margin-right: 10px;
        padding: 0.5rem;
        opacity: 0.5;

        &:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }
    }

    .core-content {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .label {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
        /* text-transform: uppercase; Removed per Compliance */
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        transition: all 0.3s ease;
    }

    .illumination {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            circle at center,
            rgba(var(--app-color-primary-rgb), 0.3),
            transparent 70%
        );
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.4s ease;
        z-index: 1;
        pointer-events: none;
    }
</style>
