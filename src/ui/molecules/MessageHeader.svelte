<script>
  import { Button, tooltip } from "@atoms";
  import { Audio } from "@media";
  import { simulation_state } from "@state";

  /**
   * @typedef {Object} Props
   * @property {boolean} is_extended
   * @property {string} entity_name
   * @property {string} time_label
   * @property {boolean} is_editing
   * @property {boolean} is_ai
   * @property {boolean} is_last
   * @property {string} id
   * @property {boolean} clean_markdown_available
   * @property {() => void} [on_save]
   * @property {() => void} [on_cancel]
   * @property {() => void} [on_continue]
   * @property {() => void} [on_regenerate]
   * @property {() => void} [on_speak]
   * @property {() => void} [on_edit]
   * @property {() => void} [on_copy]
   * @property {() => void} [on_delete]
   */

  /** @type {Props} */
  let {
    is_extended,
    entity_name,
    time_label,
    is_editing,
    is_ai,
    is_last,
    id,
    clean_markdown_available,
    on_save,
    on_cancel,
    on_continue,
    on_regenerate,
    on_speak,
    on_edit,
    on_copy,
    on_delete,
  } = $props();
</script>

<div
  class="
    relative
    flex
    w-full
    items-center
    justify-between
    overflow-hidden
    rounded-t-[15px]
    bg-(--signature-color)
    font-mono
    tracking-widest
    uppercase
    transition-all
    duration-300
    ease-out
    {!is_extended ? 'h-0 overflow-hidden border-b-0 px-0 opacity-0' : 'h-9 border-b border-white/10 px-4 opacity-100'}
  "
>
  {#if is_extended}
    <div class="flex items-center gap-2 overflow-hidden">
      <span class="text-xs font-bold whitespace-nowrap text-white">
        {entity_name}
      </span>
      <span class="text-[10px] font-normal text-white/60">
        {time_label}
      </span>
    </div>

    <!-- ACTIONS -->
    <div
      class="
        flex
        items-center
        gap-2
        opacity-100
        transition-opacity
        duration-200
      "
    >
      {#if is_editing}
        <Button
          variant="invisible"
          size="small"
          square={true}
          aria-label="Save"
          actions={[tooltip]}
          onclick={on_save}
          class="text-white/85 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
            <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
          </svg>
        </Button>
        <Button
          variant="invisible"
          size="small"
          square={true}
          aria-label="Cancel"
          actions={[tooltip]}
          onclick={on_cancel}
          class="text-white/85 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line>
          </svg>
        </Button>
      {:else}
        {#if is_ai && is_last}
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Continue"
            actions={[tooltip]}
            onclick={on_continue}
            disabled={simulation_state.busy}
            class="text-white/85 transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current stroke-none">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
            </svg>
          </Button>
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Regenerate"
            actions={[tooltip]}
            onclick={on_regenerate}
            disabled={simulation_state.busy}
            class="text-white/85 transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
              <polyline points="23 4 23 10 17 10" stroke="currentColor" stroke-width="2"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" stroke-width="2"></path>
            </svg>
          </Button>
        {/if}
        {#if Audio.voice.is_speaking && Audio.voice.active_message_id === id}
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Interrupt Audio"
            actions={[tooltip]}
            onclick={() => Audio.voice.stop()}
            class="text-white/85 transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current stroke-none">
              <rect x="6" y="6" width="12" height="12" rx="1"></rect>
            </svg>
          </Button>
        {:else}
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Read Message"
            actions={[tooltip]}
            onclick={on_speak}
            disabled={!clean_markdown_available}
            class="text-white/85 transition-colors hover:text-white disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current stroke-none">
              <path
                fill="currentColor"
                d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
              />
            </svg>
          </Button>
        {/if}
        <Button
          variant="invisible"
          size="small"
          square={true}
          aria-label="Edit"
          actions={[tooltip]}
          onclick={on_edit}
          class="text-white/85 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"></path>
          </svg>
        </Button>
        <Button
          variant="invisible"
          size="small"
          square={true}
          aria-label="Copy"
          actions={[tooltip]}
          onclick={on_copy}
          class="text-white/85 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"></path>
          </svg>
        </Button>
        <Button
          variant="invisible"
          size="small"
          square={true}
          aria-label="Delete"
          actions={[tooltip]}
          onclick={on_delete}
          class="text-white/85 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
            <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"></path>
          </svg>
        </Button>
      {/if}
    </div>
  {/if}
</div>
