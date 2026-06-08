<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * Central view orchestration shell executing view-switching logic natively.
   */
  import { ImagePreview, Tooltip } from "@atoms";
  import { motion } from "@motion";
  import { ControlPanel, Profile, Storyboard, Storymode } from "@organisms";
  import { app } from "@state";

  // --- DERIVED RUNES ---

  let fractal_url = $derived(app.selected_fractal?.profile_picture || "");
  let fractal_opacity = $derived(
    app.view === "storymode" ? "var(--opacity-muted)" : "var(--opacity-muted)",
  );

  // --- LIFECYCLE EFFECTS ---

  $effect(() => {
    app.load_entities();
  });

  // Centralized State Reset: Restores engine physics velocity when streaming begins
  $effect(() => {
    if (app.streaming.active) {
      motion.intensity = 1.0;
    }
  });
</script>

<main
  class="root"
  class:is-storyboard={app.view === "storyboard"}
  class:is-storymode={app.view === "storymode"}
>
  <div class="stage" aria-hidden="true">
    <div class="gradient"></div>

    <div
      class="fractal"
      style:background-image={fractal_url ? `url('${fractal_url}')` : "none"}
      style:opacity={fractal_url ? fractal_opacity : 0}
      style:view-transition-name={app.view === "storymode" ? "entity-morph-fractal" : undefined}
    ></div>

    <div
      class="noise-overlay"
      class:is-generating={app.sim_phase === "generating"}
      data-motion-reduced={motion.isReduced}
    ></div>
  </div>

  <ImagePreview />

  {#if app.view === "storyboard"}
    <Storyboard />
  {:else if app.view === "storymode"}
    <Storymode />
  {/if}

  {#if app.profile_open}
    <Profile entity_type={app.profile_target_type} />
  {/if}

  {#if app.control_panel_open}
    <ControlPanel />
  {/if}
</main>

<Tooltip />

{#if app.settings.dev_grid_visible}
  <div class="global-dev-grid" class:is-storymode={app.view === "storymode"} aria-hidden="true">
    {#each ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"] as col (col)}
      <div class="col" style:grid-column="col-{col}">
        <span class="label is-col">{col}</span>
      </div>
    {/each}
    <div class="col is-end" style:grid-column="col-end">
      <span class="label is-col">END</span>
    </div>

    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as row (row)}
      <div class="row" style:grid-row="row-{row}">
        <span class="label is-row">{row}</span>
      </div>
    {/each}
    <div class="row is-end" style:grid-row="row-end">
      <span class="label is-row">END</span>
    </div>
  </div>
{/if}

<style>
  /* ── Core Shell (Ultra-Lean Stage Matrix) ────────────────────── */

  .root {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    z-index: var(--z-index-surface);
    animation: fade-in var(--duration-slow) var(--ease-standard) forwards;
  }

  /* ── Atmospheric Stage Configuration ────────────────────────── */

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
      opacity var(--duration-ambient) ease-in-out,
      filter var(--duration-ambient) ease-in-out;
  }

  /* ── Global Document Resets ─────────────────────────────────── */

  :global(html),
  :global(body) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  /* ── Kinetic Physics Realization ────────────────────────────── */

  @keyframes fade-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  /* ── Diagnostic Global Grid ─────────────────────────────────── */

  .global-dev-grid {
    position: fixed;
    inset: 0;
    margin: auto;
    width: var(--grid-width);
    height: var(--grid-height);
    display: grid;
    grid-template-columns:
      [col-a] 1fr [col-b] 1fr [col-c] 1fr [col-d] 1fr [col-e] 1fr [col-f] 1fr
      [col-g] 1fr [col-h] 1fr [col-i] 1fr [col-j] 1fr [col-k] 1fr [col-l] 1fr [col-end];
    grid-template-rows:
      [row-1] 1fr [row-2] 1fr [row-3] 1fr [row-4] 1fr [row-5] 1fr [row-6] 1fr
      [row-7] 1fr [row-8] 1fr [row-9] 1fr [row-10] 1fr [row-11] 1fr [row-12] 1fr [row-end];
    pointer-events: none;
    z-index: var(--z-index-max);
    opacity: var(--opacity-whisper);
    border: var(--spacing-pixel) dashed var(--frozen);
    background-image: radial-gradient(
      circle at 0 0,
      var(--frozen) calc(var(--spacing-unit) / 2),
      transparent calc(var(--spacing-unit) / 2 + var(--spacing-pixel))
    );
    background-size: calc(100% / 12) calc(100% / 12);
    background-repeat: repeat;
  }

  .global-dev-grid.is-storymode {
    width: 100vw;
    height: 100vh;
  }

  .global-dev-grid .col {
    border-left: var(--spacing-pixel) solid var(--frozen);
    height: 100%;
    grid-row: 1 / -1;
    position: relative;
  }

  .global-dev-grid .row {
    border-top: var(--spacing-pixel) solid var(--frozen);
    width: 100%;
    grid-column: 1 / -1;
    position: relative;
  }

  .global-dev-grid .label {
    position: absolute;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    color: var(--frozen);
    background: var(--void-black);
    padding: 0 var(--padding-tight);
    opacity: var(--opacity-whisper);
  }

  .global-dev-grid .label.is-col {
    top: calc(var(--spacing-unit) * 2);
    left: calc(var(--spacing-unit) * 2);
    text-transform: uppercase;
  }

  .global-dev-grid .label.is-row {
    left: calc(var(--spacing-unit) * 2);
    top: calc(var(--spacing-unit) * 2);
  }
</style>
