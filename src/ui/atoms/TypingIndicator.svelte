<script>
  /**
   * 📡 TYPING INDICATOR / ACTIVITY DOTS
   * Standard activity indicator for entities.
   * Supports pill (chat), glass (bubbles), and minimal states.
   */
  let {
    variant = "glass", // 'glass', 'pill', 'minimal'
    signatureColor = "var(--color-gunmetal)",
    className = "",
  } = $props();
</script>

<div class="activity-dots {variant} {className}" style="--activity-color: {signatureColor}">
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
</div>

<style>
  .activity-dots {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xxs);
    width: fit-content;
    border-radius: var(--border-radius-full);
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  /* Variant: Glass (Default - Floating Bubble) */
  .activity-dots.glass {
    padding: var(--spacing-xs) var(--spacing-l);
    background: var(--glass-l);
    border: var(--border-s);
    box-shadow: var(--shadow-s);
    height: 2.5rem;
  }

  /* Variant: Pill (Chat/Inline) */
  .activity-dots.pill {
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--activity-color);
    height: var(--spacing-xl);
  }

  /* Variant: Minimal (Pure dots) */
  .activity-dots.minimal {
    padding: 0;
    background: transparent;
    border: none;
    height: auto;
  }

  .dot {
    width: var(--spacing-xs);
    height: var(--spacing-xs);
    background-color: var(--color-white);
    border-radius: var(--border-radius-full);
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) {
    animation-delay: -0.32s;
  }
  .dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
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

  /* Adjust dot color for glass variant if needed */
  .glass .dot {
    background-color: var(--font-color-m);
  }
</style>
