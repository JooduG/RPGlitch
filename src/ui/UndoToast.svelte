<script>
  import { Button } from "./primitives/index.js";
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
    border-transparent
    bg-[color-mix(in_srgb,var(--color-dev-accent)_5%,rgba(15,15,15,0.7))]
    px-5
    py-3.5
    text-xs
    text-slate-200
    shadow-[0_8px_32px_rgba(0,0,0,0.5)]
    [backdrop-filter:var(--blur-mist)]
  "
>
  <div class="flex items-center gap-2">
    <span class="h-2 w-2 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_8px_var(--color-dev-accent)]"></span>
    <span class="font-mono text-xs tracking-wide text-slate-300">Entry removed</span>
  </div>
  <Button variant="secondary" size="small" onclick={on_undo}>Undo</Button>
  <span
    aria-hidden="true"
    class="absolute inset-x-0 bottom-0 h-px origin-left bg-(--color-dev-accent)"
    style="animation: undo-countdown-shrink {undo_window_ms}ms linear forwards;"
  ></span>
</div>
