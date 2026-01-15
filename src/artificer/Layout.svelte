<script>
  /**
   * Layout.svelte
   * The Universal 10-Column Grid System for RPGlitch.
   *
   * Grid Definition:
   * 1. Margin (1fr) - Spacer
   * 2. Left Slot (2fr) - AI / Side Menu
   * 3. Center Slot (4fr) - Main Stage / Chat
   * 4. Right Slot (2fr) - User / Tools
   * 5. Margin (1fr) - Spacer
   */

  let { header, left, center, right, transparent = false } = $props();
</script>

<div class="universal-stage" class:is-transparent={transparent}>
  <!-- Track 1: Margin -->
  <div class="gutter-col start"></div>

  {#if header}
    <!-- Header: Spans Center 3 Columns -->
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

  <!-- Track 3: Center Column (4fr) -->
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

  <!-- Track 5: Margin -->
  <div class="gutter-col end"></div>
</div>

<style lang="scss">
  @use "../scss/abstracts" as *;

  .universal-stage {
    display: grid;
    grid-template-columns: 1fr 2fr 4fr 2fr 1fr;
    grid-template-rows: 1fr; /* Single row: Header and Content overlap */
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: fixed;
    inset: 0;
    z-index: 0;
    transform: translateZ(0);

    // Atmospheric Background (Migrated from _grid.scss)
    --fractal-ambience-rgb: 17, 25, 31;
    background-image: radial-gradient(
      circle at 50% 30%,
      rgb(var(--fractal-ambience-rgb) / 15%) 0%,
      transparent 70%
    );
    background-color: #000;
    color: #fff;
    transition: all 0.6s ease;
    pointer-events: none;

    &.is-transparent {
      background: transparent;
    }

    /* Mobile Stack */
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      grid-template-rows: min-content 1fr;

      .stage-column--side {
        display: none;
      }

      .stage-header {
        grid-column: 1 / -1;
      }
    }
  }

  .gutter-col {
    pointer-events: none;
    grid-row: 1 / -1;
  }

  .stage-header {
    grid-column: 2 / 5; /* 80% width (Cols 2, 3, 4) */
    grid-row: 1; /* Shared row */
    z-index: 100;
    pointer-events: none;
    display: flex;
    justify-content: center;
    align-items: center; /* Center everything within the full viewport height */

    & :global(> *) {
      pointer-events: auto; /* Allow interactions with title/inputs */
    }
  }

  .stage-column {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center; /* PERFECT VERTICAL CENTERING */
    transition: all 0.6s ease;
    overflow: hidden;
    min-height: 0;
    pointer-events: auto;
    grid-row: 1; /* Shared row */
  }

  .stage-column--center {
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center the middle card too */
    height: 100%;
    overflow: hidden;
    grid-row: 1;
    grid-column: 3;

    // Spotlight effect (Migrated from _grid.scss)
    background: radial-gradient(
      circle at center,
      rgb(255 255 255 / 3%) 0%,
      transparent 70%
    );

    @media (max-width: 768px) {
      grid-column: 1;
    }
  }

  .stage-column--side {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    grid-row: 1;

    &.left {
      grid-column: 2;
    }
    &.right {
      grid-column: 4;
    }
  }
</style>
