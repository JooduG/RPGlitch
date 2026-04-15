<script>
  /**
   * @file GlassPill.svelte
   * 💊 THE GLASS CAPSULE
   * A standardized, layout-agnostic capsule for high-frequency actions.
   * Patterned after the Storyboard Pill.
   */
  /**
   * @typedef {Object} Props
   * @property {"horizontal" | "vertical"} [orientation="horizontal"]
   * @property {boolean} [isFocused=false]
   * @property {string} [signatureColor="var(--color-frozen)"]
   * @property {string} [className=""]
   * @property {import('svelte').Snippet} [children]
   * @property {import('svelte').Snippet} [top]
   * @property {import('svelte').Snippet} [center]
   * @property {import('svelte').Snippet} [bottom]
   * @property {import('svelte').Snippet} [left]
   * @property {import('svelte').Snippet} [right]
   */

  /** @type {Props} */
  let {
    orientation = "horizontal",
    isFocused = false,
    signatureColor = "var(--color-frozen)",
    className = "",
    children = undefined,
    top = undefined,
    center = undefined,
    bottom = undefined,
    left = undefined,
    right = undefined,
  } = $props();
</script>

<div
  class="glass-pill {orientation} {className}"
  class:is-focused={isFocused}
  style="--pill-signature: {signatureColor};"
>
  <div class="pill-backing glass-base"></div>
  
  <div class="pill-content">
    {#if orientation === "horizontal"}
      {#if left}{@render left()}{/if}
      {#if center}{@render center()}{/if}
      {#if children}{@render children()}{/if}
      {#if right}{@render right()}{/if}
    {:else}
      {#if top}{@render top()}{/if}
      {#if center}{@render center()}{/if}
      {#if children}{@render children()}{/if}
      {#if bottom}{@render bottom()}{/if}
    {/if}
  </div>
</div>

<style>
  .glass-pill {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-full);
    transition: all var(--motion-fast);
    z-index: var(--z-index-m);
    pointer-events: auto;
  }

  .pill-backing {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    z-index: -1;
    pointer-events: none;
    background: var(--glass-xl);
    backdrop-filter: var(--glass-blur-l);
    border: var(--glass-edge-xl);
    transition: all var(--motion-fast);
  }

  .pill-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-xxs);
    padding: var(--spacing-xxs);
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* Orientation Overrides */
  .vertical {
    flex-direction: column;
    width: max-content;
  }

  .vertical .pill-content {
    flex-direction: column;
    padding: var(--spacing-xs) var(--spacing-xxs);
  }

  .horizontal .pill-content {
    padding: var(--spacing-xxs) var(--spacing-xs);
  }

  /* Focused State (InputBar Alignment) */
  .is-focused .pill-backing {
    border-color: var(--pill-signature);
    box-shadow: 0 0 var(--spacing-m) color-mix(in srgb, var(--pill-signature) 30%, transparent);
  }
</style>
