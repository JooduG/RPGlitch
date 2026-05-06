<script>
  /**
   * @file GlassPill.svelte
   * 💊 THE GLASS CAPSULE
   * A standardized, layout-agnostic capsule for high-frequency actions.
   * RUTHLESSLY FLATTENED: Zero design drift.
   */
  import { use_actions } from "@ui/utils/use-actions.js";

  /**
   * @typedef {Object} Props
   * @property {"horizontal" | "vertical"} [orientation="horizontal"]
   * @property {boolean} [is_focused=false]
   * @property {boolean} [busy=false]
   * @property {string} [signature_color="var(--color-frozen)"]
   * @property {string} [class=""]
   * @property {import('svelte').Snippet} [children]
   * @property {import('svelte').Snippet} [top]
   * @property {import('svelte').Snippet} [center]
   * @property {import('svelte').Snippet} [bottom]
   * @property {import('svelte').Snippet} [left]
   * @property {import('svelte').Snippet} [right]
   * @property {any[]} [actions]
   */

  /** @type {Props} */
  let {
    orientation = "horizontal",
    is_focused = false,
    busy = false,
    signature_color = "var(--color-frozen)",
    class: className = "",
    children,
    top,
    center,
    bottom,
    left,
    right,
    actions = [],
    ...rest
  } = $props();
</script>

<div
  {...rest}
  class="wrapper {orientation} {className}"
  class:is-focused={is_focused}
  class:is-busy={busy}
  style="--pill-signature: {signature_color};"
  use:use_actions={actions}
>
  {#if orientation === "horizontal"}
    {@render left?.()}
    {@render center?.()}
    {@render children?.()}
    {@render right?.()}
  {:else}
    {@render top?.()}
    {@render center?.()}
    {@render children?.()}
    {@render bottom?.()}
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-full);
    transition: all var(--motion-l);
    z-index: var(--z-index-m);
    pointer-events: auto;

    /* Merged glass-base/pill-backing logic */
    background: var(--glass-xl);
    backdrop-filter: var(--blur-l);
    border: var(--border-xl);
    gap: var(--spacing-xxs);
  }

  /* --- ORIENTATION LOGIC --- */
  .horizontal {
    flex-direction: row;
    padding: var(--spacing-xxs) var(--spacing-xs);
  }

  .vertical {
    flex-direction: column;
    width: max-content;
    padding: var(--spacing-xs) var(--spacing-xxs);
  }

  /* --- FOCUS STATES --- */
  .wrapper.is-focused {
    border-color: var(--pill-signature);
    box-shadow: 0 0 var(--spacing-m) color-mix(in srgb, var(--pill-signature) 30%, transparent);
  }

  /* --- BUSY STATE --- */
  .wrapper.is-busy {
    cursor: wait;
    filter: grayscale(1) brightness(0.8);
    pointer-events: none;
  }

  /* Ensure child snippets inherit alignment */
  .wrapper :global(svg) {
    display: block;
  }
</style>
