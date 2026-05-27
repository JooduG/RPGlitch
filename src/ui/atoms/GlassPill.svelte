<script>
  /**
   * @file GlassPill.svelte
   * 💊 THE GLASS CAPSULE
   * A standardized, layout-agnostic capsule for high-frequency actions.
   * REFACTORED: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import { use_actions } from "@ui/actions";

  /**
   * @typedef {Object} Props
   * @property {"horizontal" | "vertical"} [orientation="horizontal"] - Arrangement direction
   * @property {boolean} [is_focused=false] - Whether the pill is focused
   * @property {boolean} [busy=false] - Whether the pill is in a busy/loading state
   * @property {boolean} [disabled=false] - Whether the pill is in a disabled state
   * @property {string} [class=""] - External custom class name
   * @property {string} [signature_color=undefined] - Accent signature color
   * @property {import('svelte').Snippet} [children] - Main content
   * @property {import('svelte').Snippet} [top] - Top alignment content (vertical mode)
   * @property {import('svelte').Snippet} [center] - Center alignment content
   * @property {import('svelte').Snippet} [bottom] - Bottom alignment content (vertical mode)
   * @property {import('svelte').Snippet} [left] - Left alignment content (horizontal mode)
   * @property {import('svelte').Snippet} [right] - Right alignment content (horizontal mode)
   * @property {any[]} [actions=[]] - Kinetic actions to register
   */

  /** @type {Props & Record<string, any>} */
  let {
    orientation = "horizontal",
    is_focused = false,
    busy = false,
    disabled = false,
    class: className = "",
    signature_color = undefined,
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
  class:is-disabled={disabled}
  style:--signature-color={signature_color || undefined}
  use:use_actions={actions}
>
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

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - Foundational structural capsule.
   */
  .root {
    /* --- Layout & Dimension Tuning --- */
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-tight);
    z-index: var(--z-index-surface);
    pointer-events: auto;
    padding: var(--padding-tight);

    /* Fluid width mapping to respect parent viewport slots */
    width: 100%;

    /* Standardized vertical footprint constraints */
    min-height: calc(var(--row-unit) * 0.5);

    /* --- Surface & Border --- */
    border-radius: var(--radius-full);

    /* --- Motion & Kinetic Transitions --- */
    transition:
      border-color var(--duration-slow) var(--ease-standard),
      box-shadow var(--duration-slow) var(--ease-standard),
      background var(--duration-slow) var(--ease-standard),
      filter var(--duration-slow) var(--ease-standard),
      transform var(--duration-slow) var(--ease-standard),
      opacity var(--duration-slow) var(--ease-standard),
      width var(--duration-slow) var(--ease-standard);
  }

  /* --- Kinetic Stabilization --- */
  .root[data-kinetic="true"] {
    /* Stabilize layout during Waapi physical operations (prevent transform fights) */
    transition:
      border-color var(--duration-slow) var(--ease-standard),
      box-shadow var(--duration-slow) var(--ease-standard),
      background var(--duration-slow) var(--ease-standard),
      filter var(--duration-slow) var(--ease-standard),
      opacity var(--duration-slow) var(--ease-standard),
      width var(--duration-slow) var(--ease-standard);
  }

  /* --- Orientation Logic --- */
  .horizontal {
    flex-direction: row;
  }

  .vertical {
    flex-direction: column;
    width: max-content;
  }

  /* --- Shared Pill Chassis Layout --- */
  .root.pill-chassis {
    width: calc(var(--column-unit) * 4);
    margin-inline: auto;
  }

  /* --- Focus States --- */
  .root.is-focused {
    border-color: var(--signature-color, var(--frozen));
    box-shadow: 0 0 calc(var(--spacing-unit) * 4)
      color-mix(in srgb, var(--signature-color, var(--frozen)) 30%, transparent);
    width: calc(var(--column-unit) * 6);

    /* Snappy signature focus with springy elastic layout expansion */
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard),
      background var(--duration-fast) var(--ease-standard),
      filter var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard),
      opacity var(--duration-fast) var(--ease-standard),
      width var(--duration-slow) var(--ease-elastic);
  }

  /* --- Busy & Disabled States --- */
  .root.is-busy,
  .root.is-disabled {
    filter: grayscale(1) var(--brightness-dim);
    pointer-events: none;
    opacity: var(--opacity-whisper);
  }

  .root.is-busy {
    cursor: wait;
  }

  .root.is-disabled {
    cursor: not-allowed;
  }

  /* --- Global Child Resets --- */
  .root :global(svg) {
    display: block;
  }
</style>
