<script>
  /**
   * @file Layout.svelte
   * 🗺️ THE UNIVERSAL 12-COLUMN STAGE & VISUALIZER CHASSIS
   * Clean Tailwind class token mapping safely isolated via build insulation.
   */
  import { app } from "@state";

  let {
    header = undefined,
    footer = undefined,
    left = undefined,
    center = undefined,
    right = undefined,
    transparent = false,
    mode = "storyboard", // 'storyboard' | 'storymode'
    align = "center", // 'center' | 'end' | 'start'
  } = $props();

  let align_class = $derived(align === "end" ? "items-end" : align === "start" ? "items-start" : "items-center");

  // ── CONTAINER CLASS MATRIX ───────────────────────────────────────────────
  let container_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "h-[100dvh] w-grid-width grid-cols-2 grid-rows-[min-content_16rem_1fr_min-content] overflow-hidden"
        : "h-grid-height w-grid-width grid-cols-12 grid-rows-12 overflow-hidden"
      : "h-grid-height w-grid-width grid-cols-12 grid-rows-12 overflow-hidden",
  );

  // ── HEADER CLASS MATRIX ──────────────────────────────────────────────────
  let header_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "relative inset-auto col-span-full row-start-1 h-auto items-center"
        : "relative inset-auto col-start-1 col-end-13 row-start-1 row-end-3 self-end items-center justify-center"
      : mode === "storymode"
        ? "absolute right-0 left-0 col-start-1 col-end-13 row-start-2 items-end self-stretch"
        : "col-start-2 col-end-12 row-start-1 row-end-4 self-end pb-[calc(var(--spacing-row-unit)*0.5)]",
  );

  // ── LEFT ASIDE CLASS MATRIX ──────────────────────────────────────────────
  let left_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "col-start-1 col-end-2 row-start-2 h-full items-center bg-[radial-gradient(circle_at_top_center,var(--color-slate-700),var(--color-void-black))]"
        : "relative inset-auto col-start-1 col-end-7 row-start-6 row-end-12 h-full items-center justify-center"
      : mode === "storymode"
        ? `col-start-1 col-end-3 row-start-1 row-end-13 h-full ${align_class}`
        : `col-start-2 col-end-4 row-start-3 row-end-11 h-full ${align_class}`,
  );

  // ── CENTER MAIN CLASS MATRIX ─────────────────────────────────────────────
  let center_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "inset-auto col-span-full row-3 h-full items-center overflow-hidden"
        : "relative inset-auto col-start-1 col-end-13 row-start-3 row-end-6 h-full items-center justify-center"
      : mode === "storymode"
        ? `col-start-3 col-end-11 row-start-1 row-end-13 h-full ${align_class}`
        : `col-start-4 col-end-10 row-start-3 row-end-11 h-full ${align_class}`,
  );

  // ── RIGHT ASIDE CLASS MATRIX ────────────────────────────────────────────
  let right_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "col-start-2 col-end-3 row-start-2 h-full items-center"
        : "relative inset-auto col-start-7 col-end-13 row-start-6 row-end-12 h-full items-center justify-center"
      : mode === "storymode"
        ? `col-start-11 col-end-13 row-start-1 row-end-13 h-full ${align_class}`
        : `col-start-10 col-end-12 row-start-3 row-end-11 h-full ${align_class}`,
  );

  // ── FOOTER CLASS MATRIX ──────────────────────────────────────────────────
  let footer_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "relative inset-auto col-span-full row-4 h-auto items-center"
        : "relative inset-auto col-start-1 col-end-13 row-start-12 h-full items-end justify-center"
      : mode === "storymode"
        ? "col-start-1 col-end-13 row-start-11 h-row-unit items-start self-stretch"
        : "col-start-2 col-end-12 row-start-10 h-row-unit items-end self-stretch",
  );
</script>

<div
  class="fixed inset-0 z-20 m-auto grid overflow-hidden text-white transition-opacity duration-300 {transparent
    ? 'bg-transparent'
    : ''} {container_class}"
>
  {#if header}
    <header class="pointer-events-none z-30 flex justify-center {header_class}">
      {@render header()}
    </header>
  {/if}

  <aside class="relative z-10 flex min-h-0 flex-col justify-center transition-all duration-300 {left_class}">
    {#if left}
      {@render left()}
    {/if}
  </aside>

  <main class="relative z-10 flex min-h-0 flex-col justify-center transition-all duration-300 {center_class}">
    {#if center}
      {@render center()}
    {/if}
  </main>

  <aside class="relative z-10 flex min-h-0 flex-col justify-center transition-all duration-300 {right_class}">
    {#if right}
      {@render right()}
    {/if}
  </aside>

  {#if footer}
    <footer class="relative z-40 flex justify-center {footer_class}">
      {@render footer()}
    </footer>
  {/if}
</div>
