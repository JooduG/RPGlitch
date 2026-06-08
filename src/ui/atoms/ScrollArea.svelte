<script>
  /**
   * @file src/ui/atoms/ScrollArea.svelte
   * 📜 THE ATOMIC SCROLLAREA
   * Custom scroll container powered by bits-ui/ScrollArea & Chalk Regime design tokens.
   */
  import { ScrollArea } from "bits-ui";

  /** @type {{
   * children?: import('svelte').Snippet;
   * class?: string;
   * style?: string;
   * orientation?: "vertical" | "horizontal";
   * }} */
  let { children, class: className = "", style = "", orientation = "vertical", ...rest } = $props();
</script>

<ScrollArea.Root
  {style}
  class="
    relative
    flex
    flex-col
    overflow-hidden

    {className}"
  {...rest}
>
  <ScrollArea.Viewport
    class="
      h-full
      max-h-[inherit]
      w-full
      rounded-[inherit]
    "
  >
    {@render children?.()}
  </ScrollArea.Viewport>

  <ScrollArea.Scrollbar
    {orientation}
    class="
      z-50
      flex
      touch-none
      glass-sunken
      p-px
      backdrop-blur-sm
      transition-colors
      duration-150
      select-none

      data-[orientation=horizontal]:h-2
      data-[orientation=horizontal]:flex-col

      data-[orientation=vertical]:w-2
    "
  >
    <ScrollArea.Thumb
      class="
        relative
        flex-1
        rounded-xl
        bg-(--frozen)
        opacity-30
        transition-opacity
        duration-150

        hover:opacity-100
      "
    />
  </ScrollArea.Scrollbar>

  <ScrollArea.Corner />
</ScrollArea.Root>
