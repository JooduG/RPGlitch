<script>
  /**
   * @file FitText.svelte
   * 📐 RESIZE-OBSERVING KINETIC TEXT ENGINE
   * Uses ResizeObserver to accurately measure bounds, fixing the zero-width initialization bug.
   */
  import { tick } from "svelte";

  let { text = "", class: className = "", max_size = 96 } = $props();

  let container = $state();
  let content = $state();
  let font_size = $state(96);

  /**
   * @param {ResizeObserverEntry[]} [entries]
   */
  async function calculate_fit(entries) {
    if (!container || !content) return;

    // Abort if the container has no physical footprint (0-width bug)
    if (entries && entries[0] && entries[0].contentRect.width === 0) return;
    if (container.clientWidth === 0) return;

    // Reset to maximum limit
    font_size = max_size;
    await tick();

    let loops = 0;
    // Observe container vs content overflow
    while (
      (content.scrollWidth > container.clientWidth ||
        content.scrollHeight > container.clientHeight) &&
      font_size > 12 &&
      loops < 50
    ) {
      font_size -= 2;
      await tick();
      loops++;
    }
  }

  // Observe node dimensions reactively
  $effect(() => {
    if (!container) return;
    const observer = new ResizeObserver((entries) => calculate_fit(entries));
    observer.observe(container);
    return () => observer.disconnect();
  });

  // Observe text and max_size changes
  $effect(() => {
    text;
    max_size;
    calculate_fit();
  });
</script>

<div
  bind:this={container}
  class="
    root

    {className}"
>
  <span bind:this={content} class="text-content" style:font-size="{font_size}px">{text}</span>
</div>

<style>
  .root {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;

    /* Maintain layout container constraints */
    container-type: inline-size;
  }

  .text-content {
    display: block;
    font-family: inherit;
    font-weight: var(--font-weight-bold);
    white-space: pre-wrap;
    overflow-wrap: break-word;
    text-align: inherit;
    line-height: 1.1;
  }
</style>
