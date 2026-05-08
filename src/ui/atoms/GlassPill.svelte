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
   * @property {any[]} [actions=[]]
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
  class="wrapper {orientation} {className} glass-l"
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
    /* --- Layout --- */
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xxs);
    z-index: var(--z-index-m);
    pointer-events: auto;

    /* --- Surface --- */
    border-radius: var(--border-radius-full);

    /* --- Motion --- */
    transition:
      border-color var(--motion-l),
      box-shadow var(--motion-l),
      background var(--motion-l),
      filter var(--motion-l),
      transform var(--motion-l),
      opacity var(--motion-l);
  }

  /* --- Kinetic Stabilization --- */
  .wrapper[data-kinetic="true"] {
    transition:
      border-color var(--motion-l),
      box-shadow var(--motion-l),
      background var(--motion-l),
      filter var(--motion-l),
      opacity var(--motion-l);
  }

  /* --- Orientation Logic --- */
  .horizontal {
    flex-direction: row;
    padding: var(--spacing-xxs) var(--spacing-xs);
  }

  .vertical {
    flex-direction: column;
    width: max-content;
    padding: var(--spacing-xs) var(--spacing-xxs);
  }

  /* --- Focus States --- */
  .wrapper.is-focused {
    border-color: var(--pill-signature);
    box-shadow: 0 0 var(--spacing-m) color-mix(in srgb, var(--pill-signature) 30%, transparent);
  }

  /* --- Busy State --- */
  .wrapper.is-busy {
    cursor: wait;
    filter: grayscale(1) brightness(0.8);
    pointer-events: none;
  }

  /* --- Global Child Resets --- */
  .wrapper :global(svg) {
    display: block;
  }
</style>
