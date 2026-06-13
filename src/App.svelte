<script>
  /**
   * @file App.svelte
   * THE CORE SHELL
   * Central view orchestration shell executing view-switching logic natively.
   */
  import { ImagePreview, Tooltip } from "@atoms";
  import { motion } from "@motion";
  import { Profile, Storyboard, Storymode } from "@organisms";
  import { app } from "@state";

  // --- DERIVED RUNES ---

  let fractal_url = $derived(app.selected_fractal?.profile_picture || "");
  let fractal_opacity = $derived(app.view === "storymode" ? "var(--opacity-muted)" : "var(--opacity-muted)");

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

<main class="relative z-10 h-screen w-full animate-[fade-in_var(--duration-slow)_var(--ease-standard)_forwards] overflow-hidden text-left" data-view={app.view}>
  <div class="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-neutral-900" aria-hidden="true">
    <div data-bg="gradient"></div>

    <div
      class="absolute inset-0 bg-cover bg-center filter-[var(--blur-mist)_brightness(var(--brightness-muted))] transition-all duration-(--duration-ambient) ease-in-out will-change-[opacity,filter]"
      style:background-image={fractal_url ? `url('${fractal_url}')` : "none"}
      style:opacity={fractal_url ? fractal_opacity : 0}
      style:view-transition-name={app.view === "storymode" ? "entity-morph-fractal" : undefined}
    ></div>

    <div
      class="pointer-events-none fixed -inset-5 z-max bg-(image:--noise-url) mix-blend-overlay {app.sim_phase === 'generating' ? 'animate-[noise-breathing_0.08s_steps(4)_infinite] opacity-[calc(var(--opacity-whisper)+0.1)]' : 'animate-[noise-breathing_0.2s_steps(4)_infinite] opacity-ghost'}"
      style:animation-play-state={motion.isReduced ? "paused" : "running"}
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
</main>

<Tooltip />

{#if app.settings.dev_grid_visible}
  <div data-dev="grid" data-view={app.view} aria-hidden="true">
    {#each ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"] as colId (colId)}
      <div data-axis="col" style:grid-column="col-{colId}">
        <span data-label="col">{colId}</span>
      </div>
    {/each}
    <div data-axis="col" data-end="true" style:grid-column="col-end">
      <span data-label="col">END</span>
    </div>

    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as rowId (rowId)}
      <div data-axis="row" style:grid-row="row-{rowId}">
        <span data-label="row">{rowId}</span>
      </div>
    {/each}
    <div data-axis="row" data-end="true" style:grid-row="row-end">
      <span data-label="row">END</span>
    </div>
  </div>
{/if}

<style>
  /* ── Core Shell (Ultra-Lean Stage Matrix) ────────────────────── */

  /* ── Atmospheric Stage Configuration ────────────────────────── */

  [data-bg="gradient"] {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 15% 50%, var(--color-background-gradient-1), transparent 50%), radial-gradient(circle at 85% 30%, var(--color-background-gradient-2), transparent 50%), radial-gradient(circle at 50% 80%, var(--color-background-gradient-3), transparent 50%),
      radial-gradient(circle at 50% 10%, var(--color-background-gradient-4), transparent 50%);
    background-size: cover;
    background-attachment: fixed;
    background-repeat: no-repeat;
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

  [data-dev="grid"] {
    position: fixed;
    inset: 0;
    margin: auto;
    width: var(--spacing-grid-width);
    height: var(--spacing-grid-height);
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
    border: var(--spacing-spacing-pixel) dashed var(--color-frozen);
    background-image: radial-gradient(circle at 0 0, var(--color-frozen) calc(var(--spacing-spacing-unit) / 2), transparent calc(var(--spacing-spacing-unit) / 2 + var(--spacing-spacing-pixel)));
    background-size: calc(100% / 12) calc(100% / 12);
    background-repeat: repeat;
  }

  [data-dev="grid"][data-view="storymode"] {
    width: 100vw;
    height: 100vh;
  }

  [data-dev="grid"] [data-axis="col"] {
    border-left: var(--spacing-spacing-pixel) solid var(--color-frozen);
    height: 100%;
    grid-row: 1 / -1;
    position: relative;
  }

  [data-dev="grid"] [data-axis="row"] {
    border-top: var(--spacing-spacing-pixel) solid var(--color-frozen);
    width: 100%;
    grid-column: 1 / -1;
    position: relative;
  }

  [data-dev="grid"] [data-label] {
    position: absolute;
    font-family: var(--font-mono);
    font-size: var(--text-nano);
    color: var(--color-frozen);
    background: var(--color-void-black);
    padding: 0 var(--spacing-padding-tight);
    opacity: var(--opacity-whisper);
  }

  [data-dev="grid"] [data-label="col"] {
    top: calc(var(--spacing-spacing-unit) * 2);
    left: calc(var(--spacing-spacing-unit) * 2);
    text-transform: uppercase;
  }

  [data-dev="grid"] [data-label="row"] {
    left: calc(var(--spacing-spacing-unit) * 2);
    top: calc(var(--spacing-spacing-unit) * 2);
  }
</style>
