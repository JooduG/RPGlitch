<script>
  /**
   * @file Button.svelte
   * 🕹️ SOTA ATOMIC BUTTON COMPONENT
   * High-performance, multi-variant interaction layer.
   * Headless refactor powered by bits-ui/Button and Svelte 5.
   */
  import { Button } from "bits-ui";
  import { controlState } from "@state";

  let {
    // Data
    label = "",
    children = null,

    // State
    variant = "primary", // 'primary' | 'secondary' | 'danger' | 'invisible'
    size = "md", // 'small' | 'md'
    busy = false,
    disabled = false,

    // Design
    cover = false,
    square = false,
    full_width = false,
    class: className = "",

    // Handlers
    actions = [],

    ...rest
  } = $props();

  /** @type {HTMLButtonElement|null} */
  let element = $state(null);

  /** API: Focus the button */
  export function focus() {
    element?.focus();
  }

  const is_interrupt_btn = $derived(
    label?.toLowerCase().includes("interrupt") ||
      rest["aria-label"]?.toLowerCase().includes("interrupt") ||
      className?.toLowerCase().includes("interrupt"),
  );

  let is_disabled = $derived(disabled || (controlState.intent_active && !is_interrupt_btn));

  // Assemble classes dynamically to comply with Svelte 5 component rules.
  // Add .svelte-button to allow safe global scoping of CSS for the bits-ui Button.Root component.
  const button_class = $derived(
    [
      "root",
      "svelte-button",
      `variant-${variant}`,
      className,
      cover ? "is-cover" : "",
      size === "small" ? "is-small" : "",
      square ? "is-square" : "",
      full_width ? "is-full" : "",
      busy ? "is-busy" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );

  // Svelte 5 Action delegation: Apply Svelte actions dynamically when element reference becomes active
  $effect(() => {
    if (element && actions.length > 0) {
      const active_actions = actions.map((act) => {
        if (Array.isArray(act)) {
          return act[0](element, act[1]);
        } else {
          return act(element);
        }
      });

      return () => {
        active_actions.forEach((res) => res?.destroy?.());
      };
    }
  });
</script>

<Button.Root
  bind:ref={element}
  disabled={is_disabled || busy}
  type="button"
  class={button_class}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  {...rest}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</Button.Root>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .svelte-button - Main interaction layer (globally scoped to avoid Svelte template compilation limits).
   */
  :global(.svelte-button) {
    /* --- Layout --- */

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-standard);
    padding: 0 var(--padding-standard);
    height: calc(var(--spacing-unit) * 12);
    position: relative;

    /* --- Typography --- */
    font-family: inherit;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    text-decoration: none;
    user-select: none;

    /* --- Surface --- */
    cursor: pointer;
    pointer-events: auto;
    border: var(--border-width-base) solid transparent;
    border-radius: var(--radius-standard);
    background: transparent;
    color: var(--frisk);

    /* --- Motion --- */
    transition:
      background-color var(--duration-slow) var(--ease-elastic),
      color var(--duration-slow) var(--ease-elastic),
      box-shadow var(--duration-slow) var(--ease-elastic),
      transform var(--duration-slow) var(--ease-elastic),
      filter var(--duration-slow) var(--ease-elastic),
      border-color var(--duration-slow) var(--ease-elastic);
  }

  /* --- Kinetic Stabilization --- */
  :global(.svelte-button[data-kinetic="true"]) {
    /* Disable CSS transform transitions when WAAPI is active to prevent jitter */
    transition:
      background-color var(--duration-slow) var(--ease-elastic),
      color var(--duration-slow) var(--ease-elastic),
      box-shadow var(--duration-slow) var(--ease-elastic),
      filter var(--duration-slow) var(--ease-elastic),
      border-color var(--duration-slow) var(--ease-elastic);
  }

  /* --- Structural Modifiers --- */
  :global(.svelte-button.is-small) {
    padding: 0 var(--padding-tight);
    font-size: var(--font-size-tiny);
  }

  :global(.svelte-button.is-square) {
    width: calc(var(--spacing-unit) * 12);
    height: calc(var(--spacing-unit) * 12);
    aspect-ratio: var(--aspect-square);
    flex-shrink: 0;
  }

  :global(.svelte-button.is-square.is-small) {
    width: calc(var(--spacing-unit) * 8);
    height: calc(var(--spacing-unit) * 8);
  }

  :global(.svelte-button.is-full) {
    width: 100%;
    flex: 1;
  }

  :global(.svelte-button.is-cover) {
    position: absolute;
    inset: 0;
    z-index: var(--z-index-surface);
    border-radius: inherit;
    padding: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* --- Thematic Variants --- */
  :global(.svelte-button.variant-primary) {
    background: var(--pure-white);
    color: var(--chalk);
    box-shadow: var(--shadow-standard);
  }

  :global(.svelte-button.variant-secondary) {
    background: var(--signature-color, var(--frozen));
    color: var(--pure-white);
    box-shadow: var(--shadow-ghost);
  }

  :global(.svelte-button.variant-danger) {
    background: transparent;
    color: var(--crimson-red);
  }

  :global(.svelte-button.variant-invisible) {
    background: transparent;
    color: var(--frozen);
  }

  /* --- Operational States --- */
  :global(.svelte-button:focus-visible) {
    outline: var(--border-width-base) solid var(--pure-white);
    outline-offset: var(--border-width-base);
  }

  :global(.svelte-button:disabled) {
    opacity: var(--opacity-whisper);
    filter: grayscale(var(--opacity-solid));
    pointer-events: none;
    transform: none;
    box-shadow: none;
  }

  :global(.svelte-button:active:not(:disabled)) {
    transform: var(--scale-sink);
  }

  :global(.svelte-button[data-kinetic="true"]:active:not(:disabled)) {
    transform: none; /* Let kinetic engine handle the physics */
  }

  :global(.svelte-button:hover:not(:disabled)) {
    filter: var(--brightness-glow);
  }

  :global(.svelte-button.is-busy) {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(var(--opacity-whisper));
    pointer-events: none;
  }

  /* --- Interaction Refinements --- */
  :global(.svelte-button.variant-primary:hover:not(:disabled)) {
    filter: var(--brightness-glow);
    box-shadow: var(--shadow-standard);
    transform: var(--scale-lift);
  }

  :global(.svelte-button.variant-primary[data-kinetic="true"]:hover:not(:disabled)) {
    transform: none;
  }

  :global(.svelte-button.variant-secondary:hover:not(:disabled)) {
    box-shadow: var(--shadow-standard);
    border-color: var(--pure-white);
  }

  :global(.svelte-button.variant-danger:hover:not(:disabled)) {
    background: var(--crimson-red);
    color: var(--pure-white);
    box-shadow: var(--danger-hover-shadow);
  }

  :global(.svelte-button.variant-invisible:hover:not(:disabled)) {
    background: transparent;
    color: var(--pure-white);
    filter: var(--brightness-glow);
  }

  /* --- Flank Button Modifier --- */
  :global(.svelte-button.flank) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    transition:
      transform var(--duration-standard) var(--ease-elastic),
      color var(--duration-standard) var(--ease-standard),
      opacity var(--duration-standard) var(--ease-standard) !important;
    color: var(--pure-white) !important;
    opacity: var(--opacity-muted);
  }

  :global(.svelte-button.flank svg),
  :global(.svelte-button.flank svg path) {
    fill: var(--pure-white) !important;
    transition: fill var(--duration-standard) var(--ease-standard);
  }

  :global(.svelte-button.flank:hover:not(:disabled)) {
    opacity: var(--opacity-solid) !important;
    transform: var(--scale-lift) !important;
  }

  :global(.svelte-button.flank:active:not(:disabled)) {
    transform: var(--scale-sink) !important;
  }

  :global(.svelte-button.flank[data-kinetic="true"]:hover:not(:disabled)),
  :global(.svelte-button.flank[data-kinetic="true"]:active:not(:disabled)) {
    transform: none !important;
  }

  :global(.svelte-button.flank:disabled) {
    color: var(--frozen) !important;
    opacity: var(--opacity-ghost) !important;
    cursor: not-allowed;
    transform: none !important;
  }

  :global(.svelte-button.flank:disabled svg),
  :global(.svelte-button.flank:disabled svg path) {
    fill: var(--frozen) !important;
  }

  /* --- Global Resets --- */
  :global(.svelte-button .icon) {
    pointer-events: none;
  }
</style>
