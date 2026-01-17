<script>
  /**
   * Layout.svelte
   * The Universal 10-Column Grid System for RPGlitch.
   *
   * Logic:
   * 1. 10 Columns total (repeat(10, 1fr)).
   * 2. Standard Mode: Margins (1,10), Left (2-3), Center (4-7), Right (8-9).
   * 3. Cinematic Mode: Left (1-2), Center (3-8), Right (9-10) - Full Bleed.
   */

  let {
    header,
    footer,
    left,
    center,
    right,
    transparent = false,
    mode = "standard", // 'standard' | 'cinematic'
  } = $props();
</script>

<div
  class="universal-stage"
  class:is-transparent={transparent}
  class:layout-cinematic={mode === "cinematic"}
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

<style lang="scss">
  @use "../scss/abstracts" as *;

  /* ------------------------------------------------------------
     THE 10-COLUMN GRID SYSTEM
     ------------------------------------------------------------ */
  .universal-stage {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    grid-template-rows: 1fr;
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: fixed;
    inset: 0;
    z-index: 0;
    transform: translateZ(0);

    /* Atmospheric Background - transparent to show body's gradient */
    background: transparent;
    color: #fff;
    transition: all 0.6s ease;
    pointer-events: none;

    &.is-transparent {
      background: transparent;
    }

    /* Mobile Stack */
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      grid-template-rows: min-content 1fr min-content;

      .stage-column--side {
        display: none;
      }
      .stage-header,
      .stage-footer {
        grid-column: 1 / -1;
        position: relative;
        height: auto;
        padding: 1rem;
      }
      .stage-column--center {
        grid-column: 1 / -1;
      }
    }
  }

  /* --- HEADER & FOOTER --- */
  /* Default: Centered 80% (Cols 2-9) */
  .stage-header,
  .stage-footer {
    grid-column: 2 / 10;
    grid-row: 1;
    z-index: 100;
    pointer-events: none;
    align-self: stretch;
    height: 100%;
    display: flex;
    justify-content: center;

    & :global(> *) {
      pointer-events: auto;
    }
  }

  .stage-header {
    align-items: flex-start;
    padding-top: 15vh;
  }
  .stage-footer {
    align-items: flex-end;
    padding-bottom: 15vh;
  }

  /* --- COLUMN BEHAVIOR --- */
  .stage-column {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: all 0.6s ease;
    overflow: visible;
    min-height: 0;
    pointer-events: auto;
    grid-row: 1;
  }

  /* 
     === DESKTOP GRID LOGIC (min-width: 769px) ===
     Isolating strictly to desktop so mobile doesn't fight specificity.
  */
  @media (min-width: 769px) {
    /* Standard Mode (Lobby) */
    .universal-stage:not(.layout-cinematic) {
      .stage-column.left {
        grid-column: 2 / span 2;
      }
      .stage-column--center {
        grid-column: 4 / span 4;
        align-items: center;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.03) 0%,
          transparent 70%
        );
      }
      .stage-column.right {
        grid-column: 8 / span 2;
      }
    }

    /* Cinematic Mode (Storymode) */
    .universal-stage.layout-cinematic {
      .stage-column.left {
        grid-column: 1 / span 2;
      }
      .stage-column--center {
        grid-column: 3 / span 6;
      }
      .stage-column.right {
        grid-column: 9 / span 2;
      }

      .stage-header,
      .stage-footer {
        grid-column: 1 / -1;
        padding-left: 2rem;
        padding-right: 2rem;
      }
    }
  }

  /* === MOBILE GRID LOGIC (max-width: 768px) === */
  /* Handled in the main .universal-stage block, but defining column overrides here for clarity if needed, 
     though currently they are defined in .universal-stage media query. 
     Let's check the main block to ensure no conflicts. */

  .gutter-col {
    pointer-events: none;
    grid-row: 1 / -1;
  }
</style>
