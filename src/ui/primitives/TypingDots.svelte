<script>
  /** Unified Loading / Busy Dots Primitive
   * @type {{ size?: 'sm' | 'md' | 'lg', color?: string, class?: string, delay?: number[] }}
   */
  let { size = "md", color = "bg-(--signature-color,white)", class: extra_class = "", delay = [0, 150, 300] } = $props();

  const size_map = {
    sm: "h-1.5 w-1.5 gap-1",
    md: "h-2 w-2 gap-1.5",
    lg: "h-3 w-3 gap-2",
  };

  const gap = $derived(size_map[size]?.split(" ")[2] || "gap-1.5");
  const dot_size = $derived((size_map[size] || size_map.md).split(" ").slice(0, 2).join(" "));
</script>

<div class="flex items-center justify-center {gap} {extra_class}" role="status" aria-label="Loading">
  {#each [0, 1, 2] as i (i)}
    <span class="{dot_size} {color} animate-pulse rounded-full motion-reduce:animate-none" style="animation-delay: {delay[i] ?? 0}ms"></span>
  {/each}
</div>
