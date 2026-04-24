<script>
  /**
   * @file src/ui/organisms/profile/wings/Wing.svelte
   * 🛸 THE WING SHELL
   * Shared decorative and structural container for Profile wings.
   * Handles glass-l aesthetics and height-constrained scrolling.
   */
  let { children, class: className = "", ...rest } = $props();
</script>

<div class="wing-shell {className}" {...rest}>
  <div class="wing-background glass-s"></div>
  <div class="scroller">
    {@render children()}
  </div>
</div>

<style>
  .wing-shell {
    width: 100%;
    height: auto;
    overflow: visible;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all var(--motion-l) var(--motion-elastic);

    /* Decoupled aesthetics from container to prevent clipping context */
  }

  .wing-background {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--border-radius-m);
    pointer-events: none;
  }

  .scroller {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-m);
    gap: var(--spacing-m);
    overflow: visible;
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
