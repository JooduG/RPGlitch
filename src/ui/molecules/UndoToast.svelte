<script>
  /**
   * @file src/ui/molecules/UndoToast.svelte
   * Role-status undo bar with CSS countdown progress indicator.
   */
  import { Button } from "@atoms";

  /**
   * @typedef {Object} Props
   * @property {number} undo_window_ms
   * @property {() => void} on_undo
   * @property {string} [message]
   * @property {string} [action_label]
   */

  /** @type {Props} */
  let { undo_window_ms, on_undo, message = "Entry removed", action_label = "Undo" } = $props();
</script>

<div
  role="status"
  style:--signature-color="var(--color-dev-accent)"
  class="glass-panel relative flex w-full items-center justify-between gap-standard overflow-hidden rounded-2xl px-5 py-3.5 text-xs text-slate-200">
  <div class="flex items-center gap-tight">
    <span class="h-2 w-2 animate-pulse rounded-full bg-dev-accent shadow-[0_0_8px_var(--color-dev-accent)]"></span>
    <span class="type-data text-slate-300">{message}</span>
  </div>
  <Button variant="secondary" size="small" onclick={on_undo}>{action_label}</Button>
  <span
    aria-hidden="true"
    class="absolute inset-x-0 bottom-0 h-px origin-left bg-dev-accent"
    style="animation: undo-countdown-shrink {undo_window_ms}ms linear forwards;"></span>
</div>
