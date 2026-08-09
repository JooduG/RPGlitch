<script>
  /**
   * @file src/ui/primitives/DataBox.svelte
   * 📦 DATABOX ATOM
   * A standardized frosted container for informational blocks.
   * Part of the RPGlitch UI collection.
   */

  import { ScrollArea } from "@primitives";

  let {
    label = "",
    isCode = true,
    isProse = false,
    height = "auto",
    maxHeight = "none",
    class: className = "",
    children,
    isResonating = false,
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
    {isResonating ? 'animate-[pulse-resonance_3s_infinite_cubic-bezier(0.4,0,0.2,1)] border-(--color-dev-accent)' : 'border-electric-cyan/20'}
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
        border-electric-cyan/20
        bg-electric-cyan/5
        px-4
        py-3
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

        {isProse
        ? `
          leading-relaxed
          text-pretty

          [&_em]:italic
          [&_em]:opacity-75

          [&_h1]:mb-2
          [&_h1]:text-base
          [&_h1]:font-bold
          [&_h1]:text-white

          [&_h2]:mb-1
          [&_h2]:text-base
          [&_h2]:font-bold
          [&_h2]:text-slate-200

          [&_h3]:mt-3
          [&_h3]:mb-1
          [&_h3]:text-[0.95rem]
          [&_h3]:font-bold
          [&_h3]:text-slate-300

          [&_p]:mb-4
          [&_strong]:font-bold
        `
        : ''}

        {isCode ? `bg-black/10` : ''}"
    >
      {@render children()}
    </div>
  </ScrollArea>
</div>
