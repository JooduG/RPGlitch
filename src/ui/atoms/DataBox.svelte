<script>
  /**
   * @file src/ui/devmode/DataBox.svelte
   * ðŸ“¦ DATABOX ATOM
   * A standardized frosted container for informational blocks.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */

  import { ScrollArea } from "@atoms";

  let {
    label = "",
    isCode = true,
    height = "auto",
    maxHeight = "none",
    class: className = "",
    children,
  } = $props();
</script>

<div
  class="
    root
    {className}"
  style="--box-height: {height}; --box-max-height: {maxHeight}"
>
  {#if label}
    <header class="header">{label}</header>
  {/if}
  <ScrollArea class="databox-scroll">
    <div class="body" class:is-code={isCode}>
      {@render children()}
    </div>
  </ScrollArea>
</div>

<style>
  /* --- ROOT CHASSIS --- */

  .root {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: var(--box-height);
    max-height: var(--box-max-height);
    background: var(--glass-sunken);
    border: var(--border-whisper);
    border-radius: var(--radius-sharp);
    overflow: hidden;
    transition: all var(--duration-standard) var(--ease-standard);
    text-align: left;
    font-family: var(--font-family-mono);
  }

  /* --- HEADER --- */

  .header {
    padding: var(--padding-tight) var(--padding-standard);
    background: rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--frisk);
    border-bottom: var(--border-width-base) solid var(--border-whisper);
  }

  /* --- BODY --- */

  :global(.databox-scroll) {
    flex: 1;
    overflow: hidden;
  }

  .body {
    padding: var(--padding-standard);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    color: var(--frisk);
    min-height: 100%;
  }

  .body.is-code {
    background: rgb(from var(--void-black) r g b / var(--opacity-ghost));
  }

  :global(.body pre) {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: var(--font-size-tiny);
  }
</style>
