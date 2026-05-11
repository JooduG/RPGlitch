<script>
  /**
   * Layout.svelte
   * The Universal 10-Column Grid System for RPGlitch.
   *
   * Logic:
   * 1. 12 Columns total (repeat(12, 1fr)).
   * 2. Standard Mode: Margins (1,12), Left (2-3), Center (4-9), Right (10-11).
   * 3. Cinematic Mode: Left (1-2), Center (3-10), Right (11-12) - Full Bleed.
   */
  import { app } from "@state/app.svelte.js";

  let {
    header = undefined,
    footer = undefined,
    left = undefined,
    center = undefined,
    right = undefined,
    transparent = false,
    mode = "standard", // 'standard' | 'cinematic'
    align = "center", // 'center' | 'end' | 'start'
  } = $props();
</script>

<div
  class="universal-stage"
  class:is-transparent={transparent}
  class:layout-cinematic={mode === "cinematic"}
  class:is-mobile={app.viewport.mobile}
  class:is-mini={app.viewport.mini}
  style:--stage-align={align === "end" ? "flex-end" : align === "start" ? "flex-start" : "center"}
>
  <!-- Track 1: Margin -->
  <div class="gutter-col start"></div>
  {#if header}
    <!-- Header: Spans Center 3 Columns, Top Aligned -->
    <header class="stage-header">
      {@render header()}
    </header>
  {/if}
  <!-- Track 2: Left Column (2fr) -->
  <aside class="stage-column stage-column--side left">
    {#if left}
      <!-- LEFT: AI Profile -->
      {@render left()}
    {/if}
  </aside>
  <!-- Track 3: Center Column (4fr / 6fr) -->
  <main class="stage-column stage-column--center">
    {#if center}
      {@render center()}
    {/if}
  </main>
  <!-- Track 4: Right Column (2fr) -->
  <aside class="stage-column stage-column--side right">
    {#if right}
      {@render right()}
    {/if}
  </aside>
  {#if footer}
    <!-- Footer: Spans Center 3 Columns, Bottom Aligned -->
    <footer class="stage-footer">
      {@render footer()}
    </footer>
  {/if}
  <!-- Track 5: Margin -->
  <div class="gutter-col end"></div>
</div>

<style>
  /* ------------------------------------------------------------
     THE 12-COLUMN GRID SYSTEM (UPDATED)
     ------------------------------------------------------------ */
  .universal-stage {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: 1fr;
    height: 100%;
    width: var(--grid-width);
    margin-inline: auto;
    overflow: hidden;
    position: fixed;
    inset: 0;
    z-index: var(--z-surface);
    transform: translateZ(0);
    color: var(--color-white);
    transition:
      opacity var(--motion-fast),
      transform var(--motion-fast);
    pointer-events: none;
  }

  .universal-stage.is-transparent {
    background: transparent;
  }

  /* --- MOBILE STACK --- */
  .universal-stage.is-mobile {
    grid-template-columns: 1fr;
    grid-template-rows: min-content auto auto auto min-content;
    overflow-y: auto;
  }

  /* Standard Mode: Show sides as part of the stack */
  .universal-stage.is-mobile:not(.layout-cinematic) .stage-column--side {
    display: flex;
    grid-column: 1 / -1;
    height: auto;
    min-height: auto;
  }

  .universal-stage.is-mobile .stage-header,
  .universal-stage.is-mobile .stage-footer {
    grid-column: 1 / -1;
    position: relative;
    height: auto;
    inset: auto;
    align-items: center;
  }

  .universal-stage.is-mobile .stage-header {
    grid-row: 1;
  }

  .universal-stage.is-mobile .stage-column.left {
    grid-row: 2;
  }

  .universal-stage.is-mobile .stage-column--center {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  .universal-stage.is-mobile .stage-column.right {
    grid-row: 4;
  }

  .universal-stage.is-mobile .stage-footer {
    grid-row: 5;
  }

  /* Cinematic Mode: Stacked Header */
  .universal-stage.is-mobile.layout-cinematic {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: min-content var(--mobile-hero-height) 1fr min-content;
  }

  .universal-stage.is-mobile.layout-cinematic .stage-header {
    grid-row: 1;
  }

  .universal-stage.is-mobile.layout-cinematic .stage-column--side {
    display: flex;
    grid-row: 2;
    height: 100%;
    overflow: hidden;
  }

  .universal-stage.is-mobile.layout-cinematic .stage-column.left {
    grid-column: 1 / 2;
    background: radial-gradient(circle at top center, var(--color-gunmetal), var(--color-black));
  }

  .universal-stage.is-mobile.layout-cinematic .stage-column.right {
    grid-column: 2 / 3;
  }

  .universal-stage.is-mobile.layout-cinematic .stage-column--center {
    grid-column: 1 / -1;
    grid-row: 3;
    min-height: 0;
    overflow: auto;
  }

  .universal-stage.is-mobile.layout-cinematic .stage-footer {
    grid-row: 4;
  }

  /* --- HEADER & FOOTER --- */

  /* Default: Spans central 10 columns (Cols 2-11) */
  .stage-header,
  .stage-footer {
    grid-column: 2 / 12;
    grid-row: 1;
    z-index: var(--z-overlay);
    pointer-events: none;
    align-self: stretch;
    display: flex;
    justify-content: center;
  }

  .stage-header :global(> *),
  .stage-footer :global(> *) {
    pointer-events: auto;
  }

  .stage-header {
    position: absolute;
    top: var(--offset-header);
    left: 0;
    right: 0;
    align-items: flex-end;
  }

  .stage-footer {
    position: absolute;
    bottom: var(--offset-footer);
    left: 0;
    right: 0;
    align-items: flex-start;
    z-index: var(--z-overlay-peak);
  }

  /* --- COLUMN BEHAVIOR --- */
  .stage-column {
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
    pointer-events: auto;
    grid-row: 1;
  }

  /* 
     === DESKTOP GRID LOGIC ===
    */
  .universal-stage:not(.is-mobile) {
    /* Standard Mode (Lobby) 
       Structure: Gutter(1) | Left(2) | Center(6) | Right(2) | Gutter(1)
    */
    &:not(.layout-cinematic) {
      .stage-column.left {
        grid-column: 2 / span 2;
      }

      .stage-column--center {
        grid-column: 4 / span 6; /* 50% width */
        align-items: center;
      }

      .stage-column.right {
        grid-column: 10 / span 2;
      }
    }

    /* Cinematic Mode (Storymode)
       Structure: Left(2) | Center(8) | Right(2)
    */
    &.layout-cinematic {
      .stage-column.left {
        grid-column: 1 / span 2;
      }

      .stage-column--center {
        grid-column: 3 / span 8; /* 66% width */
      }

      .stage-column.right {
        grid-column: 11 / span 2;
      }

      .stage-header,
      .stage-footer {
        grid-column: 1 / -1;
      }
    }
  }

  .gutter-col {
    pointer-events: none;
    grid-row: 1 / -1;
  }
</style>
