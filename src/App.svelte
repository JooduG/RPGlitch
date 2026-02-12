<script>
    import Lightbox from "@ui/molecules/dialogs/Lightbox.svelte"
    import ControlPanel from "@ui/organisms/panels/ControlPanel.svelte"
    import DebugPanel from "@ui/organisms/panels/DebugPanel.svelte"
    import Profile from "@ui/organisms/profile/Profile.svelte"
    import Storyboard from "@ui/organisms/storyboard/Storyboard.svelte"
    import Storymode from "@ui/organisms/storymode/Storymode.svelte"

    import { app } from "@state/app.svelte.js"
    import { lightbox } from "@state/lightbox.svelte.js"

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
                style:background-image="url('{app.selectedFractal
                    .profilePictureUrl}')"
                style:opacity={app.view === "game" ? 0.4 : 0.15}
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
            />
        {/if}

        <!-- GLOBAL: Control Panel (Settings / Admin) -->
        {#if app.controlPanelOpen}
            <ControlPanel />
        {/if}

        <!-- TELEMETRY HUD (Only visible in Dev Mode AND when Control Panel is Open) -->
        {#if app.settings.devMode && app.controlPanelOpen}
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
        <!-- DEV: Swap View Trigger (Only visible when Panel is open) -->
        {#if app.settings.devMode && app.controlPanelOpen}
            <button
                class="swap-view-trigger"
                onclick={() =>
                    (app.view = app.view === "game" ? "lobby" : "game")}
            >
                ⇄
            </button>
        {/if}
    </div>
{/if}

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/surfaces" as *;

    /* Global Reset/Base is handled in index.scss */

    .app-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        background: $black;

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
        box-shadow: 1px 0 0 0 var(--glass-border);

        @media (max-width: 1024px) {
            display: none; /* Hide HUD on mobile/small screens */
        }
    }

    .swap-view-trigger {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 10001; /* Must be above Modal (9999) */
        background: rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 0 1px var(--glass-border);
        color: var(--zinc-500);
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        transition: all 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--zinc-100);
        }
    }
</style>
