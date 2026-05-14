<script>
  /**
   * @file GridOverlay.svelte
   * THE CHESS BOARD VISUALIZER (a-l | 1-12)
   * Purely visual, non-clickable overlay for layout debugging.
   */
  import { app } from "@state/app.svelte.js";

  const COLS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
  const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
</script>

{#if app.settings.dev_grid_visible}
  <div class="grid-overlay" aria-hidden="true">
    <!-- Vertical Lines & Column Labels -->
    {#each COLS as col (col)}
      <div class="col-line" style:grid-column="col-{col}">
        <span class="label col-label">{col}</span>
      </div>
    {/each}
    <!-- End Boundary Column -->
    <div class="col-line is-end" style:grid-column="col-end">
      <span class="label col-label">END</span>
    </div>

    <!-- Horizontal Lines & Row Labels -->
    {#each ROWS as row (row)}
      <div class="row-line" style:grid-row="row-{row}">
        <span class="label row-label">{row}</span>
      </div>
    {/each}
    <!-- End Boundary Row -->
    <div class="row-line is-end" style:grid-row="row-end">
      <span class="label row-label">END</span>
    </div>

    <!-- Intersection Points -->
    {#each COLS as col (col)}
      {#each ROWS as row (`${col}-${row}`)}
        <div class="point" style:grid-column="col-{col}" style:grid-row="row-{row}"></div>
      {/each}
    {/each}
  </div>
{/if}

<style>
  .grid-overlay {
    position: fixed;
    inset: 0;
    width: var(--grid-width);
    height: var(--grid-height);
    margin-inline: auto;
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
    pointer-events: none;
    z-index: var(--z-index-max);
    opacity: var(--opacity-muted);
    border: var(--spacing-pixel) dashed var(--frozen);
  }

  /* Lines */
  .col-line {
    border-left: var(--spacing-pixel) solid var(--frozen);
    height: 100%;
    grid-row: 1 / -1;
    position: relative;
  }

  .row-line {
    border-top: var(--spacing-pixel) solid var(--frozen);
    width: 100%;
    grid-column: 1 / -1;
    position: relative;
  }

  /* Labels */
  .label {
    position: absolute;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    color: var(--frozen);
    background: var(--void-black);
    padding: var(--spacing-0) var(--spacing-1);
    opacity: var(--opacity-heavy);
  }

  .col-label {
    top: var(--spacing-2);
    left: var(--spacing-2);
    text-transform: uppercase;
  }

  .row-label {
    left: var(--spacing-2);
    top: var(--spacing-2);
  }

  .point {
    width: var(--spacing-1);
    height: var(--spacing-1);
    background: var(--frozen);
    border-radius: var(--radius-full);
    transform: translate(-50%, -50%);
  }
</style>
