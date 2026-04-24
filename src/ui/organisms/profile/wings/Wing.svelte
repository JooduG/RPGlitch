<script>
  /**
   * @file src/ui/organisms/profile/wings/Wing.svelte
   * 🛸 THE WING SHELL
   * Shared decorative and structural container for Profile wings.
   * Handles glass-l aesthetics and height-constrained scrolling.
   */
  let { children, class: className = "", ...rest } = $props();
</script>

<div class="wing-shell glass-l {className}" {...rest}>
  <div class="scroller">
    {@render children()}
  </div>
</div>

<style>
  .wing-shell {
    width: 100%;
    height: 100%;
    overflow: visible; /* Scroller handles it */
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    transition: all var(--motion-l) var(--motion-elastic);
    background-color: rgb(var(--color-gunmetal-rgb) / 45%);
    backdrop-filter: var(--blur-l);
    border-radius: var(--border-radius-m);
  }

  .scroller {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-m);
    gap: var(--spacing-m);

    /* Custom Scrollbar */
    scrollbar-width: thin;
    scrollbar-color: var(--border-l) transparent;
  }

  .scroller::-webkit-scrollbar {
    width: 4px;
  }

  .scroller::-webkit-scrollbar-thumb {
    background: var(--border-l);
    border-radius: var(--border-radius-full);
  }

  /* Shared internal group styling */
  :global(.wing-shell .group) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    width: 100%;
  }

  :global(.wing-shell .group-label) {
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--font-color-s);
    font-weight: var(--font-weight-bold);
    padding-left: var(--spacing-xs);
  }
</style>
