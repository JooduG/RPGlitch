<script>
  /**
   * @file StoryCard.svelte
   * ðŸ“– STORY MODULE
   * A high-fidelity atmospheric card representing a story archive.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { Button } from "@atoms";
  import { get_signature_color } from "@media";

  /** @typedef {import('@data/repository.js').Story} Story */
  /** @type {{
   *    story: Story,
   *    active?: boolean,
   *    onclick?: (e: MouseEvent) => void
   *  }} */
  let { story, active = false, onclick = () => {} } = $props();

  /**
   * Formats timestamps to a standard Swedish/ISO-adjacent format.
   * Clean YYYY-MM-DD HH:mm without seconds or commas.
   * @param {number|string|Date} ts
   */
  function format_timestamp(ts) {
    if (!ts) return "---";
    return new Date(ts)
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  }

  let signature_color = $derived(get_signature_color({ signature_color: story.signature_color }, "var(--gunmetal)"));
</script>

<div
  class="
    group
    relative
    flex
    w-auto
    transform-[translateZ(0)]
    cursor-pointer
    items-center
    justify-start
    overflow-hidden
    rounded-md
    border
    bg-black/15
    p-4
    text-left
    backdrop-blur-sm
    transition-all
    duration-300
    ease-in-out

    {active
    ? `
      border-(--signature-color)
      bg-white/10
      shadow-[var(--signature-glow),var(--shadow-standard)]
    `
    : `
      border-white/5
      shadow-sm

      hover:border-(--signature-color)
      hover:bg-white/10
      hover:shadow-md
    `}
  "
  style="--signature-color: {signature_color}"
>
  <Button variant="invisible" cover={true} {onclick} />

  <div
    class="
    pointer-events-none
    relative
    z-10
    flex
    flex-col
    gap-1
    pl-2
  "
  >
    <span
      class="
      text-base
      font-bold
      text-slate-50
    ">{story.title}</span
    >
    <span
      class="
      text-xs

      {active
        ? `
        font-bold
        text-(--signature-color)
      `
        : 'text-slate-50'}"
    >
      {format_timestamp(story.lastPlayed)}{#if active}
        · ACTIVE{/if}
    </span>
  </div>

  {#if story.fractal_profile_picture}
    <div
      class="
        pointer-events-none
        absolute
        top-0
        right-0
        bottom-0
        z-0
        w-[70%]
        rounded-[inherit]
        mask-[linear-gradient(to_left,black_0%,black_20%,transparent_100%)]
        bg-cover
        bg-center
        opacity-15
        transition-all
        duration-150
        ease-in-out

        group-hover:w-[80%]
        group-hover:opacity-30

        {active
        ? `
          w-[80%]
          opacity-30
        `
        : ''}
      "
      style="background-image: url({story.fractal_profile_picture})"
    ></div>
  {:else}
    <div
      class="
        pointer-events-none
        absolute
        top-0
        right-0
        bottom-0
        z-0
        w-[70%]
        rounded-[inherit]
        mask-[linear-gradient(to_left,black_0%,black_20%,transparent_100%)]
        opacity-15
        transition-all
        duration-150
        ease-in-out

        group-hover:w-[80%]
        group-hover:opacity-30

        {active
        ? `
          w-[80%]
          opacity-30
        `
        : ''}
      "
      style="background-color: var(--signature-color)"
    ></div>
  {/if}
</div>
