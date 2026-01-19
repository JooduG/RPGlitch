<script>
    import Storyboard from "./artificer/storyboard/Storyboard.svelte"
    import Storymode from "./artificer/storymode/Storymode.svelte"
    import Lightbox from "./mesmer/ui/Lightbox.svelte"
    import Profile from "./scholar/Profile.svelte"
    import ControlPanel from "./warden/ui/ControlPanel.svelte"
    import DebugPanel from "./warden/ui/DebugPanel.svelte"

    import { app } from "./gamemaster/state.svelte.js"
    import { lightbox } from "./mesmer/ui/lightbox.svelte.js"

    import { onMount } from "svelte"
    import { fade } from "svelte/transition"

    let mounted = $state(false)

    onMount(() => {
        mounted = true
    })
</script>

{#if mounted}
    <div
        class="app-container"
        class:view-lobby={app.view === "lobby"}
        class:view-game={app.view === "game"}
        class:has-tension={app.tension > 0}
        transition:fade={{ duration: 800 }}
    >
        <!-- FRACTAL BACKGROUND -->
        {#if app.selectedFractal?.profilePictureUrl}
            <div
                id="fractal-background"
                style="background-image: url('{app.selectedFractal
                    .profilePictureUrl}'); opacity: {app.view === 'game'
                    ? 0.4
                    : 0.15};"
            ></div>
        {/if}

        <!-- GLOBAL: Lightbox Overlay -->
        {#if lightbox.active}
            <Lightbox />
        {/if}

        <!-- GLOBAL: Profile Modal -->
        {#if app.profileOpen}
            <Profile
                entityId={app.profileTargetId}
                entityType={app.profileTargetType}
                onClose={() => app.closeProfile()}
            />
        {/if}

        <!-- GLOBAL: Control Panel (Settings / Admin) -->
        {#if app.controlPanelOpen}
            <div class="modal-overlay">
                <ControlPanel />
            </div>
        {/if}

        <!-- TELEMETRY HUD -->
        {#if app.settings.devMode}
            <div class="telemetry-gutter">
                <DebugPanel />
            </div>
        {/if}

        <!-- MAIN VIEW SWITCHER -->
        {#if app.view === "lobby"}
            <Storyboard />
        {:else if app.view === "game"}
            <Storymode />
        {/if}
    </div>
{/if}

<style lang="scss">
    /* Global Reset/Base is handled in index.scss */

    .app-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        background: #000;

        :global(html),
        :global(body) {
            overflow: hidden;
            width: 100%;
            height: 100%;
        }

        /* 
        GRID ARCHITECTURE Note:
        The 10-column system is managed strictly within Layout.svelte.
        App.svelte only handles the top-level app-container and modal overlays.
    */

        &.has-tension {
            animation: reality-tremor 4s infinite ease-in-out;
            filter: saturate(1.2) contrast(1.1);
        }
    }

    #fractal-background {
        position: fixed;
        inset: 0;
        background-size: cover;
        background-position: center;
        pointer-events: none;
        z-index: 0;
        transition:
            opacity 2s ease-in-out,
            filter 2s ease-in-out;
        filter: blur(8px) brightness(0.3);
    }

    @keyframes reality-tremor {
        0%,
        100% {
            transform: translate(0, 0) scale(1);
        }
        25% {
            transform: translate(-1px, 1px) scale(1.002);
        }
        50% {
            transform: translate(1px, -1px) scale(0.998);
        }
        75% {
            transform: translate(-1px, -1px) scale(1.001);
        }
    }

    .telemetry-gutter {
        position: fixed;
        top: 0;
        left: 0;
        width: 10%; /* Matches Col 1 of the 10-column grid */
        height: 100vh;
        z-index: 2000;
        border-right: 1px solid rgba(255, 255, 255, 0.1);

        @media (max-width: 1024px) {
            display: none; /* Hide HUD on mobile/small screens */
        }
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 150;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
