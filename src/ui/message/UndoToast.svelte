<script>
  /**
   * @typedef {Object} Props
   * @property {number} undo_window_ms
   * @property {() => void} on_undo
   */

  /** @type {Props} */
  let { undo_window_ms, on_undo } = $props();
</script>

<div
  role="status"
  class="relative mx-(--spacing-padding-standard) flex items-center gap-(--spacing-gap-tight) overflow-hidden rounded-(--radius-standard) bg-glass-sunken px-(--spacing-padding-tight) py-(--spacing-padding-tight) text-sm text-frozen"
>
  <span class="flex-1 opacity-80">Message deleted</span>
  <button
    class="cursor-pointer rounded-(--radius-standard) bg-(--color-electric-cyan) px-[calc(var(--spacing-unit)*3)] py-1.5 text-xs font-semibold text-(--color-void-black) transition-[filter] duration-150 hover:brightness-[1.15]"
    onclick={on_undo}
  >
    Undo
  </button>
  <span
    aria-hidden="true"
    class="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-(--color-electric-cyan)"
    style="animation: undo-countdown-shrink {undo_window_ms}ms linear forwards;"
  ></span>
</div>
