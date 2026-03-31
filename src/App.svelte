<script>
  /**
   * @file App.svelte
   * 🎮 THE CORE SHELL
   * View-switching logic using storyboard and storymode terminology.
   */
  import { app } from "@state/app.svelte.js";
  import { lightbox } from "@state/lightbox.svelte.js";
  import Lightbox from "@ui/molecules/dialogs/Lightbox.svelte";
  import ControlPanel from "@ui/organisms/panels/ControlPanel.svelte";
  import LeftPanel from "@ui/organisms/panels/LeftPanel.svelte";
  import DebugPanel from "@ui/organisms/panels/DebugPanel.svelte";
  import Profile from "@ui/organisms/profile/Profile.svelte";
  import Storyboard from "@ui/organisms/storyboard/Storyboard.svelte";
  import Storymode from "@ui/organisms/storymode/Storymode.svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });
  // Reactively derive the background image from the flattened schema
  let fractal_bg = $derived(app.selected_fractal?.profile_picture || "");
</script>

{#if mounted}
  <div
    class="app-container"
    class:view-storyboard={app.view === "storyboard"}
    class:view-storymode={app.view === "storymode"}
    class:has-tension={app.tension > 0}
    class:has-fractal-bg={!!fractal_bg}
    transition:fade={{ duration: 800 }}
  >
    {#if fractal_bg}
      <div
        class="fractal-background"
        style:background-image="url('{fractal_bg}')"
        style:opacity={app.view === "storymode" ? 0.4 : 0.75}
      ></div>
    {/if}
    {#if lightbox.active}
      <Lightbox />
    {/if}
    {#if app.profile_open}
      <Profile entity_id={app.profile_target_id} entity_type={app.profile_target_type} />
    {/if}
    {#if app.control_panel_open}
      <ControlPanel />
    {/if}
    {#if app.left_panel_open}
      <LeftPanel />
    {/if}
    {#if app.settings.dev_mode}
      <DebugPanel />
    {/if}
    {#if app.view === "storyboard"}
      <Storyboard />
    {:else if app.view === "storymode"}
      <Storymode />
    {/if}

    <!-- UI TRIGGER: Console -->
    <button
      class="console-trigger"
      class:active={app.left_panel_open}
      onclick={() => app.toggle_left_panel()}
      title="Toggle Generation Console"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/>
      </svg>
    </button>

    {#if app.settings.dev_mode && app.control_panel_open}
      <button
        class="swap-view-trigger"
        onclick={() => (app.view = app.view === "storymode" ? "storyboard" : "storymode")}
        title="Toggle View Mode"
      >
        ⇄
      </button>
    {/if}
  </div>
{/if}

<style>
  .app-container {
    /* Grain overlay */
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: transparent;
  }

  .app-container::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: var(--opacity-xxs);
    pointer-events: none;
    z-index: var(--z-index-m);
  }

  :global(html),
  :global(body) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  .app-container.has-tension {
    animation: reality-tremor 4s infinite ease-in-out;
    filter: saturate(1.2) contrast(1.1);
  }

  .fractal-background {
    position: fixed;
    inset: 0;
    background-size: cover;
    background-position: center;
    pointer-events: none;
    z-index: var(--z-index-xs);
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
    bottom: var(--spacing-m);
    right: var(--spacing-m);
    z-index: var(--z-index-max);
    background: var(--glass-l);
    box-shadow: 0 0 0 1px var(--glass-border);
    color: var(--color-frisk);
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--border-radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all var(--motion-fast);
  }

  .swap-view-trigger:hover {
    background: var(--glass-xs);
    color: var(--color-white);
    transform: scale(1.1);
  }

  .console-trigger {
    position: fixed;
    top: var(--spacing-m);
    left: var(--spacing-m);
    z-index: var(--z-index-max);
    background: var(--glass-l);
    box-shadow: 0 0 0 1px var(--glass-border);
    color: var(--color-frisk);
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--border-radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--motion-fast);
  }

  .console-trigger:hover,
  .console-trigger.active {
    background: var(--glass-xs);
    color: var(--color-white);
    transform: scale(1.1);
  }

  .console-trigger svg {
    transition: transform var(--motion-slow) var(--motion-elastic);
  }

  .console-trigger.active svg {
    transform: rotate(45deg);
  }
</style>
