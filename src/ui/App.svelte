<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * View-switching logic using storyboard and storymode terminology.
   */
  import { app } from "@state/app.svelte.js";
  import ImagePreview from "@atoms/ImagePreview.svelte";
  import ControlPanel from "@devmode/ControlPanel.svelte";
  import Profile from "@profile/Profile.svelte";
  import Storyboard from "@storyboard/Storyboard.svelte";
  import Storymode from "@storymode/Storymode.svelte";
  import GridOverlay from "@devmode/GridOverlay.svelte";
  import Tooltip from "@atoms/Tooltip.svelte";

  // --- DERIVED ---

  let fractal_url = $derived(app.selected_fractal?.profile_picture || "");
  let fractal_opacity = $derived(
    app.view === "storymode" ? "var(--opacity-muted)" : "var(--opacity-muted)",
  );

  // --- EFFECTS ---

  $effect(() => {
    app.load_entities();
  });
</script>

<div class="stage" aria-hidden="true">
  <!-- Layer 1: The Nordic Gradient -->
  <div class="gradient"></div>

  <!-- Layer 2: Fractal Imagery -->
  <div
    class="fractal"
    style:background-image={fractal_url ? `url('${fractal_url}')` : "none"}
    style:opacity={fractal_url ? fractal_opacity : 0}
  ></div>
</div>

<main
  class="root"
  class:is-storyboard={app.view === "storyboard"}
  class:is-storymode={app.view === "storymode"}
  class:is-tense={app.tension > 0}
>
  <ImagePreview />

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
</main>

<Tooltip />
<GridOverlay />

<style>
  /* ── Core Shell (Ultra-Lean Layout) ────────────────────────── */

  .root {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    z-index: var(--z-index-surface);
    animation: fade-in 800ms var(--ease-standard) forwards;
  }

  .root.is-tense {
    animation: tremor var(--duration-ambient) infinite var(--ease-standard);
    filter: var(--saturation-tension) var(--contrast-tension);
  }

  /* ── Atmospheric Stage ─────────────────────────────────────── */

  .stage {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--z-index-base);
    background-color: var(--chalk);
    overflow: hidden;
    pointer-events: none;
  }

  .gradient {
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

  .fractal {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: var(--blur-mist) var(--brightness-muted);
    will-change: opacity, filter;
    transition:
      opacity 2000ms ease-in-out,
      filter 2000ms ease-in-out;
  }

  /* ── Global Overrides ─────────────────────────────────────── */

  :global(html),
  :global(body) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  /* ── Kinetic Physics ──────────────────────────────────────── */

  @keyframes tremor {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    25% {
      transform: translate(calc(var(--kinetic-shimmy-offset) * -1), var(--kinetic-shimmy-offset))
        var(--scale-pulse);
    }

    50% {
      transform: translate(var(--kinetic-shimmy-offset), calc(var(--kinetic-shimmy-offset) * -1))
        var(--scale-pulse);
    }

    75% {
      transform: translate(
          calc(var(--kinetic-shimmy-offset) * -1),
          calc(var(--kinetic-shimmy-offset) * -1)
        )
        var(--scale-pulse);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }
</style>
