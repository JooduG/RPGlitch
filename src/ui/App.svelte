<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * View-switching logic using storyboard and storymode terminology.
   */
  import { app } from "@state/app.svelte.js";
  import { imagePreview } from "@atoms/ImagePreview.svelte";
  import ImagePreview from "@atoms/ImagePreview.svelte";
  import ControlPanel from "@devmode/ControlPanel.svelte";
  import Profile from "@profile/Profile.svelte";
  import Storyboard from "@storyboard/Storyboard.svelte";
  import Storymode from "@storymode/Storymode.svelte";
  import Tooltip from "@atoms/Tooltip.svelte";
  import { fade } from "svelte/transition";

  // --- CONSOLIDATED BACKGROUND LOGIC ---
  // Derived state for the active fractal background
  let fractal_url = $derived(app.selected_fractal?.profile_picture || "");

  // Opacity varies based on view for cinematic focus
  // Storymode is dimmer to prioritize text legibility
  let fractal_opacity = $derived(
    app.view === "storymode" ? "var(--opacity-base)" : "var(--opacity-substantial)",
  );
  $effect(() => {
    app.load_entities();
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

<div
  class="app-container"
  class:view-storyboard={app.view === "storyboard"}
  class:view-storymode={app.view === "storymode"}
  class:has-tension={app.tension > 0}
  in:fade={{ duration: 800 }}
>
  {#if imagePreview.active}
    <ImagePreview />
  {/if}
  {#if app.profile_open}
    <Profile entity_type={app.profile_target_type} />
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

<style>
  .app-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: transparent;
    z-index: var(--surface-z-index);
  }

  :global(html),
  :global(body) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  .app-container.has-tension {
    animation: reality-tremor var(--duration-tremor) infinite var(--ease-standard);
    filter: var(--saturation-tension) var(--contrast-tension);
  }

  /* --- CONSOLIDATED BACKGROUND STYLES --- */
  .background-stage {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--floor-z-index);
    background-color: var(--background-base);
    overflow: hidden;
    pointer-events: none;
  }

  .gradient-layer {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 15% 50%, var(--background-gradient-1), transparent 50%),
      radial-gradient(circle at 85% 30%, var(--background-gradient-2), transparent 50%),
      radial-gradient(circle at 50% 80%, var(--background-gradient-3), transparent 50%),
      radial-gradient(circle at 50% 10%, var(--background-gradient-4), transparent 50%);
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
    filter: var(--blur-mist) var(--brightness-muted);
    will-change: opacity, filter;
  }

  @keyframes reality-tremor {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    25% {
      transform: translate(calc(var(--kinetic-shimmy-offset) * -1), var(--kinetic-shimmy-offset))
        var(--scale-tremor-high);
    }

    50% {
      transform: translate(var(--kinetic-shimmy-offset), calc(var(--kinetic-shimmy-offset) * -1))
        var(--scale-tremor-low);
    }

    75% {
      transform: translate(
          calc(var(--kinetic-shimmy-offset) * -1),
          calc(var(--kinetic-shimmy-offset) * -1)
        )
        var(--scale-tremor-mid);
    }
  }
</style>
