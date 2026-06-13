<script>
  /**
   * @file Layout.svelte
   * ðŸ £ THE UNIVERSAL 12-COLUMN STAGE & VISUALIZER CHASSIS
   * Architectural Unification of Stage Layout and Diagnostic Grid Overlay.
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
</script>

<div
  class="
    fixed
    inset-0
    z-20
    m-auto
    grid
    overflow-hidden
    text-white
    transition-opacity
    duration-300

    {transparent ? 'bg-transparent' : ''}
    {app.viewport.mobile
    ? mode === 'storymode'
      ? `
        h-(--grid-height)
        w-(--grid-width)
        grid-cols-2
        grid-rows-[min-content_calc(var(--spacing-spacing-unit)*24)_1fr_min-content]
        overflow-y-auto
      `
      : `
        h-(--grid-height)
        w-(--grid-width)
        grid-cols-1
        grid-rows-[min-content_auto_auto_auto_min-content]
        overflow-y-auto
      `
    : mode === 'storymode'
      ? `
        h-screen
        w-screen
        grid-cols-12
        grid-rows-12
      `
      : `
        h-(--grid-height)
        w-(--grid-width)
        grid-cols-12
        grid-rows-12
      `}"
>
  {#if header}
    <header
      class="
        pointer-events-none
        z-30
        flex
        justify-center

        {app.viewport.mobile
        ? `
          relative
          inset-auto
          col-span-full
          row-start-1
          h-auto
          items-center
        `
        : mode === 'storymode'
          ? `
            absolute
            right-0
            left-0
            col-[1/13]
            row-2
            items-end
            self-stretch
          `
          : `
            absolute
            right-0
            left-0
            col-[2/12]
            row-2
            items-end
            self-stretch
          `}"
    >
      {@render header()}
    </header>
  {/if}

  <aside
    class="
      relative
      flex
      min-h-0
      flex-col
      justify-center
      transition-all
      duration-300

      {app.viewport.mobile
      ? mode === 'storymode'
        ? `
          col-[1/2]
          row-2
          h-full
          items-center
          bg-[radial-gradient(circle_at_top_center,var(--color-slate-700),var(--color-void-black))]
        `
        : `
          inset-auto
          col-span-full
          row-2
          h-auto
          items-center
        `
      : mode === 'storymode'
        ? `
          col-[1/3]
          row-[1/13]
          h-full

          ${align_class}
        `
        : `
          col-[2/4]
          row-[2/12]
          h-full

          ${align_class}
        `}"
  >
    {#if left}
      {@render left()}
    {/if}
  </aside>

  <main
    class="
      relative
      flex
      min-h-0
      flex-col
      justify-center
      transition-all
      duration-300

      {app.viewport.mobile
      ? mode === 'storymode'
        ? `
          inset-auto
          col-span-full
          row-3
          h-auto
          items-center
          overflow-auto
        `
        : `
          inset-auto
          col-span-full
          row-3
          h-auto
          items-center
        `
      : mode === 'storymode'
        ? `
          col-[3/11]
          row-[1/13]
          h-full

          ${align_class}
        `
        : `
          col-[4/10]
          row-[2/12]
          h-full

          ${align_class}
        `}"
  >
    {#if center}
      {@render center()}
    {/if}
  </main>

  <aside
    class="
      relative
      flex
      min-h-0
      flex-col
      justify-center
      transition-all
      duration-300

      {app.viewport.mobile
      ? mode === 'storymode'
        ? `
          col-[2/3]
          row-2
          h-full
          items-center
        `
        : `
          inset-auto
          col-span-full
          row-4
          h-auto
          items-center
        `
      : mode === 'storymode'
        ? `
          col-[11/13]
          row-[1/13]
          h-full

          ${align_class}
        `
        : `
          col-[10/12]
          row-[2/12]
          h-full

          ${align_class}
        `}"
  >
    {#if right}
      {@render right()}
    {/if}
  </aside>

  {#if footer}
    <footer
      class="
        z-30
        flex
        justify-center

        {app.viewport.mobile
        ? mode === 'storymode'
          ? `
            relative
            inset-auto
            col-span-full
            row-4
            h-auto
            items-center
          `
          : `
            relative
            inset-auto
            col-span-full
            row-5
            h-auto
            items-center
          `
        : mode === 'storymode'
          ? `
            absolute
            right-0
            left-0
            col-[1/13]
            row-11
            h-(--row-unit)
            items-start
            self-stretch
          `
          : `
            absolute
            right-0
            left-0
            col-[2/12]
            row-11
            h-(--row-unit)
            items-start
            self-stretch
          `}"
    >
      {@render footer()}
    </footer>
  {/if}
</div>
