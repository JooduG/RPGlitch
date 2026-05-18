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
    border: var(--border-ghost);
    border-radius: var(--radius-sharp);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: var(--box-height);
    max-height: var(--box-max-height);
    transition: all var(--duration-standard);
    text-align: left;
    font-family: var(--font-family-mono);
    opacity: var(--opacity-whisper);
  }

  .data-header {
    padding: var(--padding-tight) var(--padding-standard);
    background: rgb(from var(--pure-white) r g b / 3%);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--electric-cyan);
  }

  .data-content {
    padding: var(--padding-standard);
    overflow: hidden auto;
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    color: var(--frisk);
  }

  .data-content.is-code {
    background: rgb(from var(--void-black) r g b / 10%);
  }

  :global(.data-content pre) {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: var(--font-size-tiny);
    opacity: 0.9;
  }
</style>
