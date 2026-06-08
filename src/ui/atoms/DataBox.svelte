<script>
  /**
   * @file src/ui/devmode/DataBox.svelte
   * 📦 DATABOX ATOM
   * A standardized frosted container for informational blocks.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */

  import { ScrollArea } from "@atoms";

  let {
    label = "",
    isCode = true,
    height = "auto",
    maxHeight = "none",
    class: className = "",
    children,
  } = $props();
</script>

<div
  class="
    flex
    w-full
    flex-col
    overflow-hidden
    rounded-sm
    border
    border-solid
    border-white/10
    bg-zinc-900/40
    text-left
    font-mono
    backdrop-blur-sm
    transition-all
    duration-300
    ease-in-out

    {className}"
  style="height: {height}; max-height: {maxHeight}"
>
  {#if label}
    <header
      class="
        border-b
        border-solid
        border-white/10
        bg-white/10
        px-4
        py-1
        text-xs
        font-extrabold
        tracking-wider
        text-[#f2f7fa]
        uppercase
      "
    >
      {label}
    </header>
  {/if}
  <ScrollArea
    class="
      flex-1
      overflow-hidden
    "
  >
    <div
      class="
        min-h-full
        p-4
        text-sm
        leading-normal
        text-[#f2f7fa]

        [&_pre]:m-0
        [&_pre]:font-[inherit]
        [&_pre]:text-xs
        [&_pre]:whitespace-pre-wrap

        {isCode ? `bg-black/10` : ''}"
    >
      {@render children()}
    </div>
  </ScrollArea>
</div>
