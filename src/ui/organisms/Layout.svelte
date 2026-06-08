<script>
  /**
   * @file Layout.svelte
   * THE UNIVERSAL 12-COLUMN STAGE & VISUALIZER CHASSIS
   * Architectural Unification of Stage Layout and Diagnostic Grid Overlay.
   */
  import { app } from "@state";

  let {
    header = undefined,
    footer = undefined,
    left = undefined,
    center = undefined,
    right = undefined,
    transparent = false,
    mode = "storyboard", // 'storyboard' | 'storymode'
    align = "center", // 'center' | 'end' | 'start'
  } = $props();
</script>

<div
  class="wrapper"
  class:is-transparent={transparent}
  class:is-storymode={mode === "storymode"}
  class:is-mobile={app.viewport.mobile}
  class:is-mini={app.viewport.mini}
  style:--stage-align={align === "end" ? "flex-end" : align === "start" ? "flex-start" : "center"}
>
  {#if header}
    <header class="header">
      {@render header()}
    </header>
  {/if}

  <aside
    class="
      sidebar
      is-left
    "
  >
    {#if left}
      {@render left()}
    {/if}
  </aside>

  <main class="body">
    {#if center}
      {@render center()}
    {/if}
  </main>

  <aside
    class="
      sidebar
      is-right
    "
  >
    {#if right}
      {@render right()}
    {/if}
  </aside>

  {#if footer}
    <footer class="footer">
      {@render footer()}
    </footer>
  {/if}
</div>

<style>
  /* ── Structural Chassis (Universal Stage) ────────────────────── */

  .wrapper {
    display: grid;
    grid-template-columns:
      [col-a] 1fr
      [col-b] 1fr
      [col-c] 1fr
      [col-d] 1fr
      [col-e] 1fr
      [col-f] 1fr
      [col-g] 1fr
      [col-h] 1fr
      [col-i] 1fr
      [col-j] 1fr
      [col-k] 1fr
      [col-l] 1fr
      [col-end];
    grid-template-rows:
      [row-1] 1fr
      [row-2] 1fr
      [row-3] 1fr
      [row-4] 1fr
      [row-5] 1fr
      [row-6] 1fr
      [row-7] 1fr
      [row-8] 1fr
      [row-9] 1fr
      [row-10] 1fr
      [row-11] 1fr
      [row-12] 1fr
      [row-end];
    position: fixed;
    inset: 0;
    margin: auto;
    width: var(--grid-width);
    height: var(--grid-height);
    overflow: hidden;
    z-index: var(--z-index-surface);
    color: var(--pure-white);
    transition: opacity var(--motion-fast);
  }

  .wrapper.is-transparent {
    background: transparent;
  }

  /* ── Layout Physics (Desktop Focus) ─────────────────────────── */

  .sidebar,
  .body {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: var(--stage-align, center);
    transition:
      opacity var(--motion-fast),
      transform var(--motion-fast);
    min-height: 0;
    grid-row: row-2 / row-12;
  }

  /* Storyboard Layout Config */
  .wrapper:not(.is-mobile, .is-storymode) .is-left {
    grid-column: col-b / col-d;
  }

  .wrapper:not(.is-mobile, .is-storymode) .body {
    grid-column: col-d / col-j;
  }

  .wrapper:not(.is-mobile, .is-storymode) .is-right {
    grid-column: col-j / col-l;
  }

  .wrapper:not(.is-mobile, .is-storymode) .header,
  .wrapper:not(.is-mobile, .is-storymode) .footer {
    grid-column: col-b / col-l;
  }

  /* Storymode Layout Config */
  .wrapper.is-storymode {
    width: 100vw;
    height: 100vh;
  }

  .wrapper:not(.is-mobile).is-storymode .sidebar,
  .wrapper:not(.is-mobile).is-storymode .body {
    grid-row: row-1 / row-end;
  }

  .wrapper:not(.is-mobile).is-storymode .is-left {
    grid-column: col-a / col-c;
  }

  .wrapper:not(.is-mobile).is-storymode .body {
    grid-column: col-c / col-k;
  }

  .wrapper:not(.is-mobile).is-storymode .is-right {
    grid-column: col-k / col-end;
  }

  .wrapper:not(.is-mobile).is-storymode .header,
  .wrapper:not(.is-mobile).is-storymode .footer {
    grid-column: col-a / col-end;
  }

  /* ── Mobile Stacking Realization ────────────────────────────── */

  .wrapper.is-mobile {
    grid-template-columns: 1fr;
    grid-template-rows: min-content auto auto auto min-content;
    overflow-y: auto;

    .header,
    .footer,
    .sidebar,
    .body {
      grid-column: 1 / -1;
      position: relative;
      height: auto;
      inset: auto;
      align-items: center;
    }

    .header {
      grid-row: 1;
    }

    .is-left {
      grid-row: 2;
    }

    .body {
      grid-row: 3;
    }

    .is-right {
      grid-row: 4;
    }

    .footer {
      grid-row: 5;
    }

    /* Storymode Stacking (Hero Blueprint) */
    &.is-storymode {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: min-content calc(var(--spacing-unit) * 24) 1fr min-content;

      .is-left {
        grid-column: 1 / 2;
        grid-row: 2;
        height: 100%;
        background: radial-gradient(circle at top center, var(--gunmetal), var(--void-black));
      }

      .is-right {
        grid-column: 2 / 3;
        grid-row: 2;
        height: 100%;
      }

      .body {
        grid-row: 3;
        overflow: auto;
      }

      .footer {
        grid-row: 4;
      }
    }
  }

  /* ── Interface Boundary Overlays ────────────────────────────── */

  .header,
  .footer {
    z-index: var(--z-index-overlay);
    align-self: stretch;
    display: flex;
    justify-content: center;
    position: absolute;
    left: 0;
    right: 0;
  }

  .header {
    grid-row: row-2;
    align-items: flex-end;
    pointer-events: none;
  }

  .footer {
    grid-row: row-11;
    align-items: flex-start;
    height: var(--row-unit);
  }
</style>
