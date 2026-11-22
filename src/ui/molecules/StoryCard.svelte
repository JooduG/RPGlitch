<script>
  /**
   * @file src/ui/molecules/StoryCard.svelte
   * Interactive story archive card with inline title editing, export, and delete actions.
   */
  import { Button, Icon } from "@atoms";
  import { format_datetime, get_signature_color } from "@utils";
  import { tick } from "svelte";

  /**
   * @typedef {Object} StoryRecord
   * @property {string|number} [id]
   * @property {string} [title]
   * @property {string} [signature_color]
   * @property {string} [state]
   * @property {number|string|Date} [last_played]
   * @property {string} [fractal_profile_picture]
   */

  /** @type {{
   *    story: StoryRecord,
   *    active?: boolean,
   *    onclick?: (e: MouseEvent) => void,
   *    ondelete?: (story: StoryRecord) => void,
   *    onrename?: (story: StoryRecord, title: string) => void,
   *    onexport?: (story: StoryRecord) => void
   *  }} */
  let { story, active = false, onclick = () => {}, ondelete = null, onrename = null, onexport = null } = $props();

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
  class={[
    "group @container relative flex w-full transform-[translateZ(0)] cursor-pointer items-center justify-start overflow-hidden rounded-md border bg-black/15 p-tight text-left backdrop-blur-sm transition duration-standard ease-in-out @sm:p-standard",
    active ?
      "border-(--signature-color) bg-white/10 shadow-[var(--signature-glow),var(--shadow-standard)]"
    : "border-white/5 shadow-sm hover:border-(--signature-color) hover:bg-white/10 hover:shadow-md",
  ]}
  style="--signature-color: {signature_color}"
  onpointerenter={() => (is_hovering = true)}
  onpointerleave={() => (is_hovering = false)}>
  <Button variant="invisible" cover={true} {onclick} />

  <div class="pointer-events-none relative z-10 flex flex-col gap-tight pl-tight">
    <h4 class="text-frisk">
      {#if is_editing_title}
        <input
          bind:this={title_input}
          bind:value={title_draft}
          aria-label="Story title"
          class="pointer-events-auto max-w-48 rounded-sm border border-(--signature-color) bg-black/40 px-1 py-0 outline-none"
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
          onclick={(e) => e.stopPropagation()} />
      {:else}
        {story.title}
      {/if}
    </h4>
    <span
      class={[
        "type-data",
        story.state === "concluded" ? "font-bold text-amber-400"
        : active ? "font-bold text-(--signature-color)"
        : "text-frisk",
      ]}>
      {format_datetime(story.last_played)}{#if story.state === "concluded"}
        · CONCLUDED{:else if active}
        · ACTIVE{/if}
    </span>
  </div>

  {#if is_hovering || is_editing_title}
    <div class="pointer-events-auto absolute top-1 right-1 z-20 flex items-center gap-tight">
      {#if onrename && !is_editing_title}
        <Button
          variant="invisible"
          size="small"
          aria-label="Edit Title"
          onclick={start_edit_title}
          class="h-7! w-7! rounded-md! border border-(--signature-color)/30! bg-(--signature-color)/20! p-tight! text-slate-200 backdrop-blur-md transition-colors duration-200 hover:border-(--signature-color)/60! hover:bg-(--signature-color)/40! hover:text-slate-50">
          <Icon name="edit" class="size-4" />
        </Button>
      {/if}
      {#if onexport}
        <Button
          variant="invisible"
          size="small"
          aria-label="Save Story (.md)"
          onclick={handle_export}
          class="h-7! w-7! rounded-md! border border-(--signature-color)/30! bg-(--signature-color)/20! p-tight! text-slate-200 backdrop-blur-md transition-colors duration-200 hover:border-(--signature-color)/60! hover:bg-(--signature-color)/40! hover:text-slate-50">
          <Icon name="download" class="size-4" />
        </Button>
      {/if}
      {#if ondelete}
        <Button
          variant="invisible"
          size="small"
          aria-label="Delete Story"
          onclick={handle_delete}
          class="h-7! w-7! rounded-md! border border-(--signature-color)/30! bg-(--signature-color)/20! p-tight! text-slate-200 backdrop-blur-md transition-colors duration-200 hover:border-red-500/50! hover:bg-red-500/25! hover:text-red-300">
          <Icon name="trash" class="size-4" />
        </Button>
      {/if}
    </div>
  {/if}

  {#if story.fractal_profile_picture}
    <div
      class={[
        "pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-[70%] rounded-[inherit] bg-cover bg-center opacity-15 transition-[width,opacity] duration-150 ease-in-out group-hover:w-[80%] group-hover:opacity-30",
        active && "w-[80%] opacity-30",
      ]}
      style="mask-image: linear-gradient(to left, black 0%, black 20%, transparent 100%); background-image: url({story.fractal_profile_picture})">
    </div>
  {:else}
    <div
      class={[
        "pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-[70%] rounded-[inherit] opacity-15 transition-[width,opacity] duration-150 ease-in-out group-hover:w-[80%] group-hover:opacity-30",
        active && "w-[80%] opacity-30",
      ]}
      style="mask-image: linear-gradient(to left, black 0%, black 20%, transparent 100%); background-color: var(--signature-color)">
    </div>
  {/if}
</div>
