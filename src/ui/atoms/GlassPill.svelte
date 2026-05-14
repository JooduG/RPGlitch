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
   * @property {string} [signature_color="var(--frozen)"]
   * @property {string} [class=""]
   * @property {import('svelte').Snippet} [children]
   * @property {import('svelte').Snippet} [top]
   * @property {import('svelte').Snippet} [center]
   * @property {import('svelte').Snippet} [bottom]
   * @property {import('svelte').Snippet} [left]
   * @property {import('svelte').Snippet} [right]
   * @property {any[]} [actions=[]]
   */

  /** @type {Props & Record<string, any>} */
  let {
    orientation = "horizontal",
    is_focused = false,
    busy = false,
    signature_color = "var(--frozen)",
    class: className = "",
    children = undefined,
    top = undefined,
    center = undefined,
    bottom = undefined,
    left = undefined,
    right = undefined,
    actions = [],
    ...rest
  } = $props();
</script>

<div
  {...rest}
  class="root {orientation} {className} glass-elevated"
  class:is-focused={is_focused}
  class:is-busy={busy}
  style="--state-signature-color: {signature_color};"
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
  .root {
    /* --- Layout --- */
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    z-index: var(--surface-z-index);
    pointer-events: auto;

    /* --- Surface --- */
    border-radius: var(--radius-full);

    /* --- Motion --- */
    transition:
      border-color var(--duration-slow),
      box-shadow var(--duration-slow),
      background var(--duration-slow),
      filter var(--duration-slow),
      transform var(--duration-slow),
      opacity var(--duration-slow);
  }

  /* --- Kinetic Stabilization --- */
  .root[data-kinetic="true"] {
    transition:
      border-color var(--duration-slow),
      box-shadow var(--duration-slow),
      background var(--duration-slow),
      filter var(--duration-slow),
      opacity var(--duration-slow);
  }

  /* --- Orientation Logic --- */
  .horizontal {
    flex-direction: row;
    padding: var(--spacing-1) var(--spacing-2);
  }

  .vertical {
    flex-direction: column;
    width: max-content;
    padding: var(--spacing-2) var(--spacing-1);
  }

  /* --- Focus States --- */
  .root.is-focused {
    border-color: var(--state-signature-color);
    box-shadow: 0 0 var(--spacing-4)
      color-mix(in srgb, var(--state-signature-color) 30%, transparent);
  }

  /* --- Busy State --- */
  .root.is-busy {
    cursor: wait;
    filter: grayscale(1) var(--brightness-dim);
    pointer-events: none;
  }

  /* --- Global Child Resets --- */
  .root :global(svg) {
    display: block;
  }
</style>
