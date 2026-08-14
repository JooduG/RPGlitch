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
  class="
    relative
    flex
    w-full
    items-center
    justify-between
    gap-4
    overflow-hidden
    rounded-2xl
    border
    border-white/10
    bg-[color-mix(in_srgb,var(--color-slate-900)_85%,transparent)]
    px-5
    py-3.5
    text-xs
    text-slate-200
    shadow-[0_8px_32px_rgba(0,0,0,0.5)]
    [backdrop-filter:var(--blur-mist)]
  "
>
  <div class="flex items-center gap-3">
    <span class="h-2 w-2 animate-pulse rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
    <span class="font-mono text-xs tracking-wide text-slate-300">Message deleted</span>
  </div>
  <button
    class="
      cursor-pointer
      rounded-lg
      bg-(--color-dev-accent)
      px-4
      py-1.5
      font-mono
      text-xs
      font-bold
      tracking-wider
      text-slate-950
      uppercase
      transition-all
      hover:brightness-110
      active:scale-95
    "
    onclick={on_undo}
  >
    Undo
  </button>
  <span
    aria-hidden="true"
    class="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-(--color-dev-accent)"
    style="animation: undo-countdown-shrink {undo_window_ms}ms linear forwards;"
  ></span>
</div>
