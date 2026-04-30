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
  <div class="data-content" class:is-code={isCode}>{@render children()}</div>
</div>

<style>
  .data-box {
    width: 100%;
    background: var(--glass-xs);
    border: var(--border-s);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: var(--box-height);
    max-height: var(--box-max-height);
    transition: all var(--motion-l);
    text-align: left;
    font-family: var(--font-family-mono);
    opacity: var(--opacity-xl);
  }

  .data-header {
    padding: var(--spacing-xs) var(--spacing-s);
    background: rgb(var(--color-white-rgb) / 3%);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    color: var(--color-cyan);
  }

  .data-content {
    padding: var(--spacing-s);
    overflow: hidden auto;
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    color: var(--font-color-m);
  }

  .data-content.is-code {
    background: rgb(var(--color-black-rgb) / 10%);
  }

  /* Custom Scrollbar for the data content */
  .data-content::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  .data-content::-webkit-scrollbar-thumb {
    background: var(--color-border-l);
    border-radius: var(--border-radius-full);
  }

  :global(.data-content pre) {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: var(--font-size-xxs);
    opacity: 0.9;
  }
</style>
