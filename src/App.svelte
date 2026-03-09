<script>
    /**
     * @file App.svelte
     * 🎮 THE CORE SHELL
     * View-switching logic using storyboard and storymode terminology.
     */
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

    // Reactively derive the background image from the flattened schema
    let fractalBg = $derived(app.selectedFractal?.profile_picture || "")
</script>

{#if mounted}
    <div class="app-container" class:view-storyboard={app.view === "storyboard"} class:view-storymode={app.view === "storymode"} class:has-tension={app.tension > 0} class:has-fractal-bg={!!fractalBg} transition:fade={{ duration: 800 }}>
        {#if fractalBg}
            <div id="fractal-background" style:background-image="url('{fractalBg}')" style:opacity={app.view === "storymode" ? 0.4 : 0.75}></div>
        {/if}

        {#if lightbox.active}
            <Lightbox />
        {/if}

        {#if app.profileOpen}
            <Profile entity_id={app.profileTargetId} entity_type={app.profileTargetType} />
        {/if}

        {#if app.controlPanelOpen}
            <ControlPanel />
        {/if}

        {#if app.settings.dev_mode}
            <DebugPanel />
        {/if}

        {#if app.view === "storyboard"}
            <Storyboard />
        {:else if app.view === "storymode"}
            <Storymode />
        {/if}

        {#if app.settings.dev_mode && app.controlPanelOpen}
            <button class="swap-view-trigger" onclick={() => (app.view = app.view === "storymode" ? "storyboard" : "storymode")} title="Toggle View Mode"> ⇄ </button>
        {/if}
    </div>
{/if}

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/surfaces" as *;

    .app-container {
        @include grain();
        width: 100%;
        height: 100vh;
        overflow: hidden;
        position: relative;
        background: $black;

        :global(html),
        :global(body) {
            overflow: hidden;
            width: 100%;
            height: 100%;
        }

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
        z-index: -1;
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

    .swap-view-trigger {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 10001;
        background: rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 0 1px var(--glass-border);
        color: var(--zinc-500);
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: all 0.2s;

        &:hover {
            background: rgba(var(--pure-white-rgb), 0.1);
            color: white;
            transform: scale(1.1);
        }
    }
</style>
