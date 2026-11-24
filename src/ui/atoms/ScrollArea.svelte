<script>
  /**
   * @file src/ui/atoms/ScrollArea.svelte
   * Custom scroll container atom powered by bits-ui ScrollArea and design tokens.
   */
  import { ScrollArea } from "bits-ui";

  /** @type {{
   * children?: import("svelte").Snippet;
   * viewport_ref?: HTMLElement | null;
   * fixed_scrollbar?: boolean;
   * allow_overflow_x?: boolean;
   * class?: string;
   * }} */
  let { children, viewport_ref = $bindable(null), fixed_scrollbar = false, allow_overflow_x = false, class: className = "", ...rest } = $props();
</script>

<ScrollArea.Root class={["relative flex flex-col", allow_overflow_x ? "overflow-x-visible overflow-y-hidden" : "overflow-hidden", className]} {...rest}>
  <ScrollArea.Viewport bind:ref={viewport_ref} class="scroll-area-viewport h-full max-h-[inherit] min-h-0 w-full rounded-[inherit]">
    {@render children?.()}
  </ScrollArea.Viewport>

  <ScrollArea.Scrollbar
    orientation="vertical"
    class={[
      "flex w-2 touch-none bg-zinc-900/40 p-px backdrop-blur-sm transition-colors duration-150 select-none",
      fixed_scrollbar ? "fixed! top-0 right-0 bottom-0 z-max h-dvh" : "z-20",
    ]}>
    <ScrollArea.Thumb class="relative flex-1 rounded-xl bg-[#555d66] opacity-30 transition-opacity duration-150 hover:opacity-100" />
  </ScrollArea.Scrollbar>

  <ScrollArea.Corner />
</ScrollArea.Root>
