<script>
  /**
   * @file Layout.svelte
   * THE UNIVERSAL 12-COLUMN STAGE
   * Logic:
   * 1. 12 Columns total (repeat(12, 1fr)).
   * 2. Storyboard: Gutter(1), Side(2), Main(6), Side(2), Gutter(1).
   * 3. Storymode: Side(2), Main(8), Side(2) - Full Bleed.
   */
  import { app } from "@state/app.svelte.js";

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
  class="stage"
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

  <!-- Track 1: Left Column -->
  <aside class="column is-side is-left">
    {#if left}
      {@render left()}
    {/if}
  </aside>

  <!-- Track 2: Main Column -->
  <main class="column is-main">
    {#if center}
      {@render center()}
    {/if}
  </main>

  <!-- Track 3: Right Column -->
  <aside class="column is-side is-right">
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
  /* ── The 12-Column Stage ────────────────────────────────────── */

  .stage {
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
    margin-inline: auto;
    width: var(--grid-width);
    height: var(--grid-height);
    overflow: hidden;
    z-index: var(--surface-z-index);
    color: var(--color-white);
    transition: opacity var(--motion-fast);
  }

  .stage.is-transparent {
    background: transparent;
  }

  /* ── Layout Physics (Desktop) ───────────────────────────────── */

  .column {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: var(--state-align, center);
    transition:
      opacity var(--motion-fast),
      transform var(--motion-fast);
    min-height: 0;
    grid-row: row-2 / row-12;
  }

  /* Storyboard Layout */
  .stage:not(.is-mobile, .is-storymode) .is-left {
    grid-column: col-b / col-d;
  }

  .stage:not(.is-mobile, .is-storymode) .is-main {
    grid-column: col-d / col-j;
  }

  .stage:not(.is-mobile, .is-storymode) .is-right {
    grid-column: col-j / col-l;
  }

  .stage:not(.is-mobile, .is-storymode) .header,
  .stage:not(.is-mobile, .is-storymode) .footer {
    grid-column: col-b / col-l;
  }

  /* Storymode Layout */
  .stage:not(.is-mobile).is-storymode .is-left {
    grid-column: col-a / col-c;
  }

  .stage:not(.is-mobile).is-storymode .is-main {
    grid-column: col-c / col-k;
  }

  .stage:not(.is-mobile).is-storymode .is-right {
    grid-column: col-k / col-end;
  }

  .stage:not(.is-mobile).is-storymode .header,
  .stage:not(.is-mobile).is-storymode .footer {
    grid-column: col-a / col-end;
  }

  /* ── Mobile Stacking ────────────────────────────────────────── */

  .stage.is-mobile {
    grid-template-columns: 1fr;
    grid-template-rows: min-content auto auto auto min-content;
    overflow-y: auto;

    .header,
    .footer,
    .column {
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

    .is-main {
      grid-row: 3;
    }

    .is-right {
      grid-row: 4;
    }

    .footer {
      grid-row: 5;
    }

    /* Storymode Stacking (Hero Focus) */
    &.is-storymode {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: min-content var(--spacing-24) 1fr min-content;

      .is-left {
        grid-column: 1 / 2;
        grid-row: 2;
        height: 100%;
        background: radial-gradient(
          circle at top center,
          var(--color-gunmetal),
          var(--color-black)
        );
      }

      .is-right {
        grid-column: 2 / 3;
        grid-row: 2;
        height: 100%;
      }

      .is-main {
        grid-row: 3;
        overflow: auto;
      }

      .footer {
        grid-row: 4;
      }
    }
  }

  /* ── Overlays (Header/Footer) ──────────────────────────────── */

  .header,
  .footer {
    z-index: var(--overlay-z-index);
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
  }

  .footer {
    grid-row: row-11;
    align-items: flex-start;
    z-index: var(--overlay-peak-z-index);
    height: var(--row);
  }
</style>
