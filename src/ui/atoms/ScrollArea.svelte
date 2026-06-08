<script>
  /**
   * @file src/ui/atoms/ScrollArea.svelte
   * 📜 THE ATOMIC SCROLLAREA
   * Custom scroll container powered by bits-ui/ScrollArea & Chalk Regime design tokens.
   */
  import { ScrollArea } from "bits-ui";

  /** @type {{
   *   children?: import('svelte').Snippet;
   *   class?: string;
   *   style?: string;
   *   orientation?: "vertical" | "horizontal";
   * }} */
  let { children, class: className = "", style = "", orientation = "vertical", ...rest } = $props();

  // Fix compiler validation warning: assemble modifier classes inside Svelte 5 reactive $derived
  const rootClasses = $derived(["scroll-area-root", className].filter(Boolean).join(" "));
</script>

<ScrollArea.Root {style} class={rootClasses} {...rest}>
  <ScrollArea.Viewport class="scroll-area-viewport">
    {@render children?.()}
  </ScrollArea.Viewport>

  <ScrollArea.Scrollbar {orientation} class="scroll-area-track">
    <ScrollArea.Thumb class="scroll-area-thumb" />
  </ScrollArea.Scrollbar>

  <ScrollArea.Corner class="scroll-area-corner" />
</ScrollArea.Root>

<style>
  /* Root manages the bounding display flow */
  :global(.scroll-area-root) {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Viewport inherits sizing structures to avoid height collapse */
  :global(.scroll-area-viewport) {
    width: 100%;
    height: 100%;
    max-height: inherit;
    border-radius: inherit;
  }

  /* Scroll bar overlay layers */
  :global(.scroll-area-track) {
    display: flex;
    user-select: none;
    touch-action: none;
    padding: var(--spacing-pixel);
    background: var(--glass-sunken);
    transition: background var(--duration-fast);
    z-index: var(--z-index-elevated);
  }

  :global(.scroll-area-track[data-orientation="vertical"]) {
    width: calc(var(--spacing-unit) * 2);
  }

  :global(.scroll-area-track[data-orientation="horizontal"]) {
    height: calc(var(--spacing-unit) * 2);
    flex-direction: column;
  }

  /* Handle thumb element */
  :global(.scroll-area-thumb) {
    flex: 1;
    background: var(--frozen);
    border-radius: var(--radius-standard);
    position: relative;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-fast);
  }

  :global(.scroll-area-thumb:hover) {
    opacity: var(--opacity-solid);
  }
</style>
