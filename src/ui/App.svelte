<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * View-switching logic using storyboard and storymode terminology.
   */
  import { app } from "@state/app.svelte.js";
  import { lightbox } from "@atoms/Lightbox.svelte";
  import Lightbox from "@atoms/Lightbox.svelte";
  import ControlPanel from "@devmode/ControlPanel.svelte";
  import Profile from "@profile/Profile.svelte";
  import Storyboard from "@storyboard/Storyboard.svelte";
  import Storymode from "@storymode/Storymode.svelte";
  import Tooltip from "@atoms/Tooltip.svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  // --- CONSOLIDATED BACKGROUND LOGIC ---
  // Derived state for the active fractal background
  let fractal_url = $derived(app.selected_fractal?.profile_picture || "");

  // Opacity varies based on view for cinematic focus
  // Storymode is dimmer to prioritize text legibility
  let fractal_opacity = $derived(app.view === "storymode" ? 0.4 : 0.75);
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });
</script>

<div class="background-stage" aria-hidden="true">
  <!-- Layer 1: The Nordic Gradient (Always Present) -->
  <div class="gradient-layer"></div>

  <!-- Layer 2: Fractal Imagery (Dynamic) -->
  {#if fractal_url}
    <div
      class="fractal-layer"
      style:background-image="url('{fractal_url}')"
      style:opacity={fractal_opacity}
      transition:fade={{ duration: 2000 }}
    ></div>
  {/if}
</div>

{#if mounted}
  <div
    class="app-container"
    class:view-storyboard={app.view === "storyboard"}
    class:view-storymode={app.view === "storymode"}
    class:has-tension={app.tension > 0}
    transition:fade={{ duration: 800 }}
  >
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
  <Tooltip />
{/if}

<!-- 
  [current_problems]
  - [x] Tooltip Atom Standardization & Bloat Purge
  - [ ] Storymode components migration (Message.svelte actions/attachments)
  - [ ] Library/Drawer refactoring (RC Audit)
  - [ ] Verify background visibility on Perchance build
-->

<style>
  .app-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: transparent;
    z-index: 1; /* Above Background.svelte (0) */
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

  /* --- CONSOLIDATED BACKGROUND STYLES --- */
  .background-stage {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0; /* Floor: behind app-container (1) */
    background-color: var(--bg-base);
    overflow: hidden;
    pointer-events: none;
  }

  .gradient-layer {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 15% 50%, var(--bg-grad-1), transparent 50%),
      radial-gradient(circle at 85% 30%, var(--bg-grad-2), transparent 50%),
      radial-gradient(circle at 50% 80%, var(--bg-grad-3), transparent 50%),
      radial-gradient(circle at 50% 10%, var(--bg-grad-4), transparent 50%);
    background-size: cover;
    background-attachment: fixed;
    background-repeat: no-repeat;
  }

  .fractal-layer {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;

    /* Atmospheric softening */
    filter: blur(8px) brightness(0.3);
    will-change: opacity, filter;
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
