<script>
  /**
   * @file src/ui/atoms/LayoutGrid.svelte
   * 12x12 diagnostic grid overlay for layout verification.
   */
  let { view = "storyboard" } = $props();
</script>

<div data-dev="grid" data-view={view} aria-hidden="true">
  {#each ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"] as col_id (col_id)}
    <div data-axis="col" style:grid-column="col-{col_id}">
      <span data-label="col">{col_id}</span>
    </div>
  {/each}
  <div data-axis="col" data-end="true" style:grid-column="col-end">
    <span data-label="col">END</span>
  </div>

  {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as row_id (row_id)}
    <div data-axis="row" style:grid-row="row-{row_id}">
      <span data-label="row">{row_id}</span>
    </div>
  {/each}
  <div data-axis="row" data-end="true" style:grid-row="row-end">
    <span data-label="row">END</span>
  </div>
</div>

<style>
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
    outline: var(--spacing-pixel) dashed var(--color-frozen);
    outline-offset: calc(-1 * var(--spacing-pixel));
    background-image: radial-gradient(
      circle at 0 0,
      var(--color-frozen) calc(var(--spacing-unit) / 2),
      transparent calc(var(--spacing-unit) / 2 + var(--spacing-pixel))
    );
    background-size: calc(100% / 12) calc(100% / 12);
    background-repeat: repeat;
  }

  [data-dev="grid"] [data-axis="col"] {
    border-left: var(--spacing-pixel) solid var(--color-frozen);
    height: 100%;
    grid-row: 1 / -1;
    position: relative;
  }

  [data-dev="grid"] [data-axis="row"] {
    border-top: var(--spacing-pixel) solid var(--color-frozen);
    width: 100%;
    grid-column: 1 / -1;
    position: relative;
  }

  [data-dev="grid"] [data-label] {
    position: absolute;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-frozen);
    background: var(--color-void-black);
    padding: 0 var(--spacing-tight);
    opacity: var(--opacity-whisper);
  }

  [data-dev="grid"] [data-label="col"] {
    top: calc(var(--spacing-unit) * 2);
    left: calc(var(--spacing-unit) * 2);
    text-transform: uppercase;
  }

  [data-dev="grid"] [data-label="row"] {
    left: calc(var(--spacing-unit) * 2);
    top: calc(var(--spacing-unit) * 2);
  }
</style>
