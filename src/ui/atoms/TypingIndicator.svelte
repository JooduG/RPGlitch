<script>
  let { color = "var(--color-gunmetal)" } = $props();
</script>

<div class="typing-indicator" style="--dot-color: {color}">
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
</div>

<style>
  .typing-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xxs);
    padding: var(--spacing-s) var(--spacing-xl);
    background: var(--glass-l);
    border-radius: var(--border-radius-full);
    box-shadow: var(--shadow-sm);
    height: var(--spacing-xxl);
    width: fit-content;
  }

  .dot {
    width: var(--spacing-xs);
    height: var(--spacing-xs);
    background-color: var(--dot-color, currentColor);
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
    }

    40% {
      transform: scale(1);
    }
  }
</style>
