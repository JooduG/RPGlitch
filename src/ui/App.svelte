<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * View-switching logic using storyboard and storymode terminology.
   */
  import { app } from "@state/app.svelte.js";
  import { lightbox } from "@state/lightbox.svelte.js";
  import Lightbox from "@ui/core/Lightbox.svelte";
  import ControlPanel from "@ui/devmode/ControlPanel.svelte";
  import Profile from "./Profile.svelte";
  import Storyboard from "./Storyboard.svelte";
  import Storymode from "./Storymode.svelte";
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
    {#if app.view === "storyboard"}
      <Storyboard />
    {:else if app.view === "storymode"}
      <Storymode />
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
</style>
