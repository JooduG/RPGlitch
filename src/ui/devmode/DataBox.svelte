<script>
  /**
   * DATABOX ATOM
   * A standardized frosted container for informational blocks.
   * Used for AI "Think" blocks, JSON Data, and System Logs.
   */
  let {
    label = "",
    isCode = true,
    height = "auto",
    maxHeight = "none",
    className = "",
    children,
  } = $props();
</script>

<div class="data-box {className}" style="--box-height: {height}; --box-max-height: {maxHeight}">
  {#if label}
    <header class="data-header">{label}</header>
  {/if}
  <div class="data-content scrollbar" class:is-code={isCode}>{@render children()}</div>
</div>

<style>
  .data-box {
    width: 100%;
    background: var(--glass-sunken);
    border: var(--border-bottom);
    border-radius: var(--radius-subtle);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: var(--box-height);
    max-height: var(--box-max-height);
    transition: all var(--duration-standard);
    text-align: left;
    font-family: var(--font-family-mono);
    opacity: var(--opacity-heavy);
  }

  .data-header {
    padding: var(--spacing-2) var(--spacing-3);
    background: rgb(from var(--color-white) r g b / 3%);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-heavy);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--color-cyan);
  }

  .data-content {
    padding: var(--spacing-3);
    overflow: hidden auto;
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    color: var(--font-color-base);
  }

  .data-content.is-code {
    background: rgb(from var(--color-black) r g b / 10%);
  }

  :global(.data-content pre) {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: var(--font-size-tiny);
    opacity: 0.9;
  }
</style>
