<script>
  /**
   * @file StoryCard.svelte
   * STORY MODULE
   * A high-fidelity atmospheric card representing a story archive.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { Button } from "@primitives";
  import { get_signature_color } from "@media";
  import { tick } from "svelte";

  /** @type {import('@data/repository.js').Story} Story */
  /** @type {{
   *    story: Story,
   *    active?: boolean,
   *    onclick?: (e: MouseEvent) => void,
   *    ondelete?: (story: Story) => void,
   *    onrename?: (story: Story, title: string) => void,
   *    onexport?: (story: Story) => void
   *  }} */
  let { story, active = false, onclick = () => {}, ondelete = null, onrename = null, onexport = null } = $props();

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

  let signature_color = $derived(get_signature_color({ signature_color: story.signature_color }, "var(--color-gunmetal)"));

  let is_hovering = $state(false);
  let is_editing_title = $state(false);
  let title_draft = $state("");
  /** @type {HTMLInputElement | undefined} */
  let title_input = $state();

  function start_edit_title(e) {
    e.stopPropagation();
    title_draft = story.title;
    is_editing_title = true;
    void tick().then(() => title_input?.focus());
  }

  function commit_title() {
    if (!is_editing_title) return;
    const trimmed = title_draft.trim();
    if (trimmed && trimmed !== story.title && onrename) {
      onrename(story, trimmed);
    }
    is_editing_title = false;
  }

  function cancel_edit_title() {
    is_editing_title = false;
  }

  function handle_delete(e) {
    e.stopPropagation();
    if (ondelete) ondelete(story);
  }

  function handle_export(e) {
    e.stopPropagation();
    if (onexport) onexport(story);
  }
</script>

<div
  role="group"
  aria-label={story.title || "Story card"}
  class="
    group
    relative
    flex
    w-full
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
  onpointerenter={() => (is_hovering = true)}
  onpointerleave={() => (is_hovering = false)}
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
    {#if is_editing_title}
      <input
        bind:this={title_input}
        bind:value={title_draft}
        class="
          pointer-events-auto
          max-w-48
          rounded-sm
          border
          border-(--signature-color)
          bg-black/40
          px-1
          py-0
          text-base
          font-bold
          text-slate-50
          outline-none
        "
        onkeydown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit_title();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel_edit_title();
          }
        }}
        onblur={commit_title}
        onclick={(e) => e.stopPropagation()}
      />
    {:else}
      <span
        class="
        text-base
        font-bold
        text-slate-50
      ">{story.title}</span
      >
    {/if}
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
      {format_timestamp(story.last_played)}{#if active}
        · ACTIVE{/if}
    </span>
  </div>

  {#if is_hovering || is_editing_title}
    <div
      class="
        pointer-events-auto
        absolute
        top-1
        right-1
        z-20
        flex
        items-center
        gap-1
      "
    >
      {#if onrename && !is_editing_title}
        <Button
          variant="invisible"
          size="small"
          aria-label="Edit Title"
          onclick={start_edit_title}
          class="h-7! w-7! rounded-md! border border-(--signature-color)/30! bg-(--signature-color)/20! p-1.5! text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-(--signature-color)/60! hover:bg-(--signature-color)/40! hover:text-slate-50"
        >
          <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Button>
      {/if}
      {#if onexport}
        <Button
          variant="invisible"
          size="small"
          aria-label="Save Story (.md)"
          onclick={handle_export}
          class="h-7! w-7! rounded-md! border border-(--signature-color)/30! bg-(--signature-color)/20! p-1.5! text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-(--signature-color)/60! hover:bg-(--signature-color)/40! hover:text-slate-50"
        >
          <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </Button>
      {/if}
      {#if ondelete}
        <Button
          variant="invisible"
          size="small"
          aria-label="Delete Story"
          onclick={handle_delete}
          class="h-7! w-7! rounded-md! border border-(--signature-color)/30! bg-(--signature-color)/20! p-1.5! text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-red-500/50! hover:bg-red-500/25! hover:text-red-300"
        >
          <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </Button>
      {/if}
    </div>
  {/if}

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
      style="mask-image: linear-gradient(to left, black 0%, black 20%, transparent 100%); background-image: url({story.fractal_profile_picture})"
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
      style="mask-image: linear-gradient(to left, black 0%, black 20%, transparent 100%); background-color: var(--signature-color)"
    ></div>
  {/if}
</div>
