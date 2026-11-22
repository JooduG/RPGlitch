<script>
  /**
   * @file src/ui/molecules/CardSkeleton.svelte
   * Glassmorphic loading placeholder card with shimmer sweep.
   */
  import { Shimmer } from "@atoms";

  let { color = "rgba(255, 255, 255, 0.4)", class: className = "" } = $props();
</script>

<div
  class={["relative isolate h-full min-h-50 w-full overflow-hidden rounded-xl border border-solid border-white/10 bg-zinc-900/40 backdrop-blur-sm", className]}>
  <Shimmer {color} />
</div>
