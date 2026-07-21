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
  let last_container_width = 0;
  let is_calculating = false;

  /**
   * Fits the text by reducing font_size until content fits within the container.
   * Uses requestAnimationFrame batching to break the synchronous ResizeObserver
   * loop that occurs when font_size changes trigger further resize observations.
   * @param {ResizeObserverEntry[]} [entries]
   */
  function calculate_fit(entries) {
    if (!container || !content) return;

    // Abort if the container has no physical footprint (0-width bug)
    if (entries && entries[0] && entries[0].contentRect.width === 0) return;
    if (container.clientWidth === 0) return;

    // Skip re-calculation if the container width hasn't changed AND we already have a fitted size.
    // This prevents the oscillation loop: ResizeObserver fires when font_size changes,
    // but if the container width is stable, the current font_size is still correct.
    if (container.clientWidth === last_container_width && font_size < max_size) return;
    last_container_width = container.clientWidth;

    // Guard against re-entrancy within the same frame
    if (is_calculating) return;
    is_calculating = true;

    requestAnimationFrame(async () => {
      try {
        // Reset to maximum limit
        font_size = max_size;
        await tick();

        let loops = 0;
        // Observe container vs content overflow
        while ((content.scrollWidth > container.clientWidth || content.scrollHeight > container.clientHeight) && font_size > 12 && loops < 50) {
          font_size -= 2;
          await tick();
          loops++;
        }
      } finally {
        is_calculating = false;
      }
    });
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
    @container
    block
    h-full
    w-full
    overflow-visible

    {className}"
>
  <span
    bind:this={content}
    class="
      block
      font-[inherit]
      leading-[1.1]
      font-extrabold
      wrap-break-word
      whitespace-pre-wrap
      text-inherit
    "
    style:font-size="{font_size}px"
  >
    {text}
  </span>
</div>
