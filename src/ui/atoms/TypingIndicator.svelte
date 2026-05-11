<script>
  /**
   * @file TypingIndicator.svelte
   * 📡 TYPING INDICATOR
   * Animated activity dots for entity "is typing" states.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/utils/use-actions.js";

  let {
    // Design
    variant = "glass", // 'glass' | 'pill' | 'minimal'
    signature_color = "var(--color-gunmetal)",
    class: className = "",

    // State
    busy = false,

    // Slots/Snippets
    actions = [],

    ...rest
  } = $props();
</script>

<div
  {...rest}
  class="wrapper {variant} {className}"
  class:is-busy={busy}
  style="--activity-color: {signature_color}"
  use:use_actions={actions}
>
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
</div>

<style>
  /* ── Root ─────────────────────────────────────────────── */
  .wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    width: fit-content;
    border-radius: var(--radius-pill);
    transition: all var(--duration-standard) var(--ease-elastic);
  }

  /* ── Variant: glass (default — floating bubble) ──────── */
  .wrapper.glass {
    padding: var(--spacing-2) var(--spacing-8);
    background: var(--glass-elevated-color); /* Maps to glass-elevated foundation */
    backdrop-filter: var(--glass-elevated-blur);
    box-shadow: var(--shadow-ghost);
    height: 2.5rem;
  }

  .wrapper.glass .dot {
    background-color: var(--font-color-base);
  }

  /* ── Variant: pill (inline / chat) ───────────────────── */
  .wrapper.pill {
    padding: var(--spacing-2) var(--spacing-4);
    background: var(--activity-color);
    height: var(--spacing-12);
  }

  /* ── Variant: minimal (bare dots) ────────────────────── */
  .wrapper.minimal {
    padding: 0;
    background: transparent;
    border: none;
    height: auto;
  }

  /* ── Dot ──────────────────────────────────────────────── */
  .dot {
    width: var(--spacing-2);
    height: var(--spacing-2);
    background-color: var(--color-white);
    border-radius: var(--radius-pill);
    animation: typing-pulse 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  .wrapper.is-busy {
    filter: var(--brightness-dim) grayscale(0.5);
    opacity: var(--opacity-muted);
  }

  /* ── Keyframes ────────────────────────────────────────── */
  @keyframes typing-pulse {
    0%,
    80%,
    100% {
      transform: scale(0);
      opacity: 0.3;
    }

    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
