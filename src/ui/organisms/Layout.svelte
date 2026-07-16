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
        ? "h-grid-height w-grid-width grid-cols-2 grid-rows-[min-content_calc(var(--spacing-spacing-unit)*24)_1fr_min-content] overflow-hidden"
        : "h-grid-height w-grid-width grid-cols-1 grid-rows-[min-content_auto_auto_auto_min-content] overflow-y-auto"
      : mode === "storymode"
        ? "h-screen w-screen grid-cols-12 grid-rows-12"
        : "h-grid-height w-grid-width grid-cols-12 grid-rows-12",
  );

  // ── HEADER CLASS MATRIX ──────────────────────────────────────────────────
  let header_class = $derived(
    app.viewport.mobile
      ? "relative inset-auto col-span-full row-start-1 h-auto items-center"
      : mode === "storymode"
        ? "absolute right-0 left-0 col-[1/13] row-start-2 items-end self-stretch"
        : "absolute right-0 left-0 col-[2/12] row-start-2 items-end self-stretch",
  );

  // ── LEFT ASIDE CLASS MATRIX ──────────────────────────────────────────────
  let left_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "col-[1/2] row-2 h-full items-center bg-[radial-gradient(circle_at_top_center,var(--color-slate-700),var(--color-void-black))]"
        : "inset-auto col-span-full row-2 h-auto items-center"
      : mode === "storymode"
        ? `col-[1/3] row-[1/13] h-full ${align_class}`
        : `col-[2/4] row-[3/11] h-full ${align_class}`,
  );

  // ── CENTER MAIN CLASS MATRIX ─────────────────────────────────────────────
  let center_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "inset-auto col-span-full row-3 h-full items-center overflow-hidden"
        : "inset-auto col-span-full row-3 h-auto items-center"
      : mode === "storymode"
        ? `col-[3/11] row-[1/13] h-full ${align_class}`
        : `col-[4/10] row-[3/11] h-full ${align_class}`,
  );

  // ── RIGHT ASIDE CLASS MATRIX ────────────────────────────────────────────
  let right_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "col-[2/3] row-2 h-full items-center"
        : "inset-auto col-span-full row-4 h-auto items-center"
      : mode === "storymode"
        ? `col-[11/13] row-[1/13] h-full ${align_class}`
        : `col-[10/12] row-[3/11] h-full ${align_class}`,
  );

  // ── FOOTER CLASS MATRIX ──────────────────────────────────────────────────
  let footer_class = $derived(
    app.viewport.mobile
      ? mode === "storymode"
        ? "relative inset-auto col-span-full row-4 h-auto items-center"
        : "relative inset-auto col-span-full row-5 h-auto items-center"
      : mode === "storymode"
        ? "absolute right-0 left-0 col-[1/13] row-start-11 h-row-unit items-start self-stretch"
        : "absolute right-0 left-0 col-[2/12] row-start-11 h-row-unit items-start self-stretch",
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

  <aside class="relative flex min-h-0 flex-col justify-center transition-all duration-300 {left_class}">
    {#if left}
      {@render left()}
    {/if}
  </aside>

  <main class="relative flex min-h-0 flex-col justify-center transition-all duration-300 {center_class}">
    {#if center}
      {@render center()}
    {/if}
  </main>

  <aside class="relative flex min-h-0 flex-col justify-center transition-all duration-300 {right_class}">
    {#if right}
      {@render right()}
    {/if}
  </aside>

  {#if footer}
    <footer class="z-30 flex justify-center {footer_class}">
      {@render footer()}
    </footer>
  {/if}
</div>
