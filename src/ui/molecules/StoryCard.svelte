<script>
  /**
   * @file src/ui/molecules/StoryCard.svelte
   * Interactive story archive card with inline title editing, export, and delete actions.
   */
  import { Button, Icon, tooltip } from "@atoms";
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
   *    ondelete?: ((story: StoryRecord) => void) | null,
   *    onrename?: ((story: StoryRecord, title: string) => void) | null,
   *    onexport?: ((story: StoryRecord) => void) | null
   *  }} */
  let { story, active = false, onclick = () => {}, ondelete = null, onrename = null, onexport = null } = $props();

  const signature_color = $derived(get_signature_color({ signature_color: story.signature_color }, "var(--color-gunmetal)"));

  let is_editing_title = $state(false);
  let title_draft = $state("");
  /** @type {HTMLInputElement | undefined} */
  let title_input = $state();

  function start_edit_title(e) {
    e.stopPropagation();
    title_draft = story.title || "";
    is_editing_title = true;
    void tick().then(() => {
      title_input?.focus();
      title_input?.select();
    });
  }

  function commit_title() {
    if (!is_editing_title) return;
    const trimmed = title_draft.trim();
    is_editing_title = false;
    if (trimmed && trimmed !== story.title) onrename?.(story, trimmed);
  }
</script>

{#snippet CardAction(icon, label, handler, danger = false)}
  <Button
    variant="invisible"
    size="small"
    square={true}
    aria-label={label}
    actions={[tooltip]}
    onclick={(e) => {
      e.stopPropagation();
      handler(e);
    }}
    class={[
      "size-7 rounded-md border border-(--signature-color)/30 bg-(--signature-color)/20 p-1 text-slate-200 backdrop-blur-md transition-colors duration-200",
      danger ?
        "hover:border-red-500/50 hover:bg-red-500/25 hover:text-red-300"
      : "hover:border-(--signature-color)/60 hover:bg-(--signature-color)/40 hover:text-slate-50",
    ]}>
    <Icon name={icon} class="size-4" />
  </Button>
{/snippet}

<div
  role="group"
  aria-label={story.title || "Story card"}
  class={[
    "group @container relative flex w-full transform-[translateZ(0)] cursor-pointer items-center justify-between gap-tight overflow-hidden rounded-md border bg-black/15 p-tight text-left backdrop-blur-sm transition duration-standard ease-in-out @sm:p-standard",
    active ?
      "border-(--signature-color) bg-white/10 shadow-[var(--signature-glow),var(--shadow-standard)]"
    : "border-white/5 shadow-sm hover:border-(--signature-color) hover:bg-white/10 hover:shadow-md",
  ]}
  style:--signature-color={signature_color}>
  <Button variant="invisible" cover={true} aria-label={`Open ${story.title || "story"}`} {onclick} />

  <div class="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col gap-tight pl-tight">
    <h4 class="m-0 truncate text-frisk">
      {#if is_editing_title}
        <input
          bind:this={title_input}
          bind:value={title_draft}
          aria-label="Story title"
          class="pointer-events-auto w-full rounded-sm border border-(--signature-color) bg-black/40 px-1 py-0 text-inherit outline-none"
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit_title();
            } else if (e.key === "Escape") {
              e.preventDefault();
              is_editing_title = false;
            }
          }}
          onblur={commit_title}
          onclick={(e) => e.stopPropagation()} />
      {:else}
        {story.title || "Untitled Story"}
      {/if}
    </h4>

    <span
      class={[
        "truncate type-data",
        story.state === "concluded" ? "text-amber-400"
        : active ? "text-(--signature-color)"
        : "text-frisk/75",
      ]}>
      {format_datetime(story.last_played)}{story.state === "concluded" ? " · CONCLUDED"
      : active ? " · ACTIVE"
      : ""}
    </span>
  </div>

  {#if onrename || onexport || ondelete}
    <div
      class={[
        "pointer-events-auto relative z-20 flex shrink-0 items-center gap-tight transition-opacity duration-150",
        is_editing_title ? "opacity-100" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
      ]}>
      {#if onrename && !is_editing_title}
        {@render CardAction("edit", "Edit Title", start_edit_title)}
      {/if}
      {#if onexport}
        {@render CardAction("download", "Save Story (.md)", () => onexport(story))}
      {/if}
      {#if ondelete}
        {@render CardAction("trash", "Delete Story", () => ondelete(story), true)}
      {/if}
    </div>
  {/if}

  <div
    aria-hidden="true"
    class={[
      "pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-[70%] rounded-[inherit] bg-cover bg-center opacity-15 transition-[width,opacity] duration-150 ease-in-out group-hover:w-[80%] group-hover:opacity-30",
      active && "w-[80%] opacity-30",
    ]}
    style:mask-image="linear-gradient(to left, black 0%, black 20%, transparent 100%)"
    style:background-image={story.fractal_profile_picture ? `url(${story.fractal_profile_picture})` : undefined}
    style:background-color={story.fractal_profile_picture ? undefined : "var(--signature-color)"}>
  </div>
</div>
