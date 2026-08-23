<!--
  @file src/ui/primitives/Indicator.svelte
  📍 UNIFIED PULSING STATUS INDICATOR
  Single pulsing status dot for live queues, telemetry beacons, and connection monitors.
-->
<script>
  /**
   * @type {{
   *   color?: string,
   *   size?: 'sm' | 'md' | 'lg',
   *   glow?: boolean,
   *   class?: string
   * }}
   */
  let { color = "bg-(--signature-color,var(--color-electric-cyan))", size = "md", glow = false, class: extra_class = "" } = $props();

  const size_classes = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-3",
  };

  const current_size = $derived(size_classes[size] || size_classes.md);
</script>

<span
  class="inline-block shrink-0 animate-pulse rounded-full motion-reduce:animate-none {current_size} {color} {extra_class}"
  style={glow ? "box-shadow: 0 0 8px currentColor;" : ""}
  role="status"
  aria-label="Status indicator"
></span>
