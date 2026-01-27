<script>
    import { app } from "../../gamemaster/state.svelte.js"
    import Button from "../Button.svelte"
    import Levitator from "../Levitator.svelte"
    import { storyboard } from "./storyboardActions.svelte.js"

    // Derived State
    let readyToBegin = $derived(
        app.selectedAi && app.selectedUser && app.selectedFractal
    )
</script>

<div class="pill-container">
    <Levitator className="unified-capsule" lift="-4px">
        <!-- 1: Shuffle (Left) -->
        <Button
            className="capsule-flank"
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

        <div class="divider"></div>

        <!-- 2: Settings (Middle) -->
        <Button
            className="capsule-flank"
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

        <div class="divider"></div>

        <!-- 3: Begin (Right) -->
        <Button
            className="capsule-action"
            variant="ghost"
            disabled={!readyToBegin}
            onclick={storyboard.beginStory}
        >
            <div class="core-content">
                {#if readyToBegin}
                    <span class="label">Begin Story</span>
                    <!-- Star Icon -->
                    <svg viewBox="0 0 24 24" class="icon-star">
                        <path
                            fill="currentColor"
                            d="M12,2L14.43,8.35L21.17,9.27L16.24,13.91L17.48,20.57L12,17.27L6.52,20.57L7.76,13.91L2.83,9.27L9.57,8.35L12,2Z"
                        />
                    </svg>
                {:else}
                    <span class="label">Begin Story</span>
                {/if}
            </div>

            <div class="illumination"></div>
        </Button>
    </Levitator>
</div>

<style lang="scss">
    @use "../../mesmer/scss/abstracts/variables" as *;

    .pill-container {
        display: flex;
        justify-content: center;
        width: 100%;
        padding-bottom: var(--space-md);
        pointer-events: none; /* Let clicks pass through container */
    }

    /* We use :global here because the class is passed to a child component (Levitator) */
    :global(.unified-capsule) {
        pointer-events: auto;
        display: flex;
        align-items: center;
        background: rgba(
            10,
            10,
            15,
            0.5
        ); /* Match StoryboardCard empty state */
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        padding: 0;
        height: 64px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        /* Transition is now handled by Levitator */
        overflow: hidden;

        /* Removed hover styles as Levitator handles physics now */
    }

    .divider {
        width: 1px;
        height: 40%;
        background: rgba(255, 255, 255, 0.1);
    }

    /* Flank Buttons (Shuffle & Settings) */
    :global(.capsule-flank.btn) {
        height: 100%;
        width: 60px;
        border-radius: 0;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.4);
        transition:
            color 0.2s ease,
            background 0.2s ease;
        display: grid;
        place-content: center;

        &:hover {
            color: white;
            background: rgba(255, 255, 255, 0.05);
        }

        .icon-small {
            width: 24px;
            height: 24px;
        }
    }

    /* Primary Action Button (Begin) */
    :global(.capsule-action.btn) {
        height: 100%;
        min-width: 180px; /* Slightly wider */
        border: none;
        border-radius: 0;
        background: transparent;
        position: relative;
        overflow: hidden;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            filter: grayscale(1);
        }

        &:not(:disabled):hover {
            .illumination {
                opacity: 0.8;
                transform: scale(1.1);
            }

            .label {
                letter-spacing: 0.1em;
            }
        }
    }

    .core-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        z-index: 2;
        position: relative;
        width: 100%;
        padding: 0;
    }

    .label {
        font-family: var(--font-display);
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        /* text-transform: uppercase; REMOVED per user preference */
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        transition: letter-spacing 0.3s ease;
    }

    .icon-star {
        width: 20px;
        height: 20px;
        filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.6));
        color: var(--app-color-primary, #ffd700);
        animation: pulse 3s infinite ease-in-out;
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

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.8;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.1);
        }
    }
</style>
