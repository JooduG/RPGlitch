<script>
  /**
   * @file Message.svelte
   * ❄️ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Chassis.
   * Standard: Pure Svelte 5 layout primitives, fully decoupled event chains, and deterministic metrics.
   */
  import { clean_image_prompts, parse_message, strip_cognition_blocks } from "@intelligence";
  import { Audio, get_signature_color } from "@media";
  import { Typewriter } from "@motion";
  import { app, runtime } from "@state";
  import { session_driver } from "@engine";
  import { Button, DataBox, TextField, tooltip } from "@atoms";
  import { DevTelemetryBlock, EntityCard } from "@molecules";
  import { safe_html } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {string|number} [id=""]
   * @property {string} [text=""]
   * @property {string} [sender="system"]
   * @property {string} [character_name=""]
   * @property {Date} [timestamp=new Date()]
   * @property {string[]} [attachments=[]]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_delete]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_regenerate]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_continue]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_edit]
   * @property {boolean} [is_last=false]
   * @property {boolean} [busy=false]
   * @property {Record<string, any>} [meta={}]
   * @property {boolean} [is_editing=false]
   * @property {(new_text: string) => any} [on_save]
   * @property {() => any} [on_cancel]
   */

  /** @type {Props} */
  let {
    id = "",
    text = "",
    sender = "system",
    character_name = "",
    timestamp = new Date(),
    attachments = [],
    on_delete = undefined,
    on_regenerate = undefined,
    on_continue = undefined,
    on_edit = undefined,
    is_last = false,
    busy = false,
    meta = {},
    is_editing = false,
    on_save = undefined,
    on_cancel = undefined,
  } = $props();

  // --- STATE RUNES ---
  let isFocused = $state(false);
  let local_text = $state("");
  let is_typing_finished = $state(false);
  let was_streaming = $state(false);

  // --- DERIVATIONS & RECONCILIATIONS ---
  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_fractal = $derived(sender === "fractal");
  let is_telemetry = $derived(
    sender === "system" &&
      (meta?.type === "DYNAMICS_DELTA" || meta?.type === "STORY_START" || meta?.type === "VECTOR_RESOLUTION" || meta?.type === "MEMORY_FORMATION"),
  );

  let entity = $derived(
    is_user
      ? runtime.active_user || app.selected_user
      : is_ai
        ? runtime.active_ai || app.selected_ai
        : is_fractal
          ? runtime.active_fractal && runtime.active_fractal.id !== "active_fractal"
            ? runtime.active_fractal
            : app.selected_fractal || runtime.active_fractal
          : null,
  );

  let signature_color = $derived(get_signature_color(entity, sender === "system" ? "var(--color-slate-600)" : "var(--color-slate-700)"));

  let is_extended = $derived(isFocused || is_editing);

  let parsed = $derived(parse_message(text));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think);

  let is_streaming_target = $derived(!!(app.streaming.active && id && (app.streaming.nodeId === id || app.streaming.node_id === id)));
  let should_use_typewriter = $derived(is_streaming_target || (was_streaming && !is_typing_finished));

  // Track when this specific message becomes an active stream target
  $effect(() => {
    if (is_streaming_target) {
      was_streaming = true;
    }
  });

  // If another message becomes the active stream target while this message is still typing, force-finish this typewriter animation
  $effect(() => {
    if (app.streaming.active && !is_streaming_target && was_streaming && !is_typing_finished) {
      is_typing_finished = true;
    }
  });

  let has_display_text = $derived(!!(display_text && display_text !== "<p></p>"));
  let clean_markdown = $derived(clean_image_prompts(strip_cognition_blocks(text)).trim());

  let time_label = $derived(
    timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  // --- ACTIONS & UTILITIES ---

  /**
   * Focus activation event pipeline handler.
   * @returns {void}
   */
  function handle_focus() {
    isFocused = true;
  }

  /**
   * Handles focus eviction gestures from the message bubble tree block boundaries.
   * @param {FocusEvent & { currentTarget: HTMLElement, relatedTarget: EventTarget | null }} e
   * @returns {void}
   */
  function handle_focus_out(e) {
    if (e.relatedTarget && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    isFocused = false;
  }

  /**
   * Invokes system-level clipboard streaming write sequences for text chunks.
   * @returns {Promise<void>}
   */
  async function handle_copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }

  /**
   * Orchestrates audio speech synthesis sequences matching character audio profile configurations.
   * @returns {void}
   */
  function handle_speak() {
    if (!clean_markdown) return;

    Audio.voice.activeMessageId = id;

    if (entity && entity.voice) {
      Audio.voice.selectedVoice = entity.voice.uri || Audio.voice.selectedVoice;
      Audio.voice.rate = entity.voice.rate ?? 1.0;
    }

    Audio.voice.speak(clean_markdown, true, true);
  }

  $effect(() => {
    if (is_editing) {
      local_text = clean_markdown;
    }
  });

  $effect(() => {
    if (is_streaming_target) {
      was_streaming = true;
    }
  });
</script>

{#if is_telemetry}
  {#if app.settings.dev_mode}
    <div
      class="
        relative
        flex
        w-full
        justify-center
        p-4
        transition-all
        duration-200
      "
    >
      <div class="w-[calc(var(--spacing-column-unit)*6)]">
        <DevTelemetryBlock {meta} />
      </div>
    </div>
  {/if}
{:else}
  <div
    class="
      relative
      flex
      w-full
      p-4
      transition-all
      duration-200
      {is_user ? 'justify-end pr-column-unit' : is_ai ? 'justify-start pl-column-unit' : 'justify-center'}
    "
  >
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="
        group
        relative
        flex
        min-w-0
        flex-col
        rounded-2xl
        border
        border-transparent
        shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        [backdrop-filter:var(--blur-mist)]
        transition-all
        duration-300
        ease-out
        outline-none

        before:pointer-events-none
        before:absolute
        before:inset-0
        before:rounded-[inherit]
        before:mask-border-solid
        before:p-px
        before:transition-all
        before:duration-300
        before:content-['']!

        {!is_extended
        ? `
          bg-[color-mix(in_srgb,var(--signature-color)_5%,rgba(15,15,15,0.7))]
          before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)]
          before:opacity-30
        `
        : `
          bg-[color-mix(in_srgb,var(--signature-color)_10%,rgba(15,15,15,0.75))]
          shadow-[0_8px_32px_color-mix(in_srgb,var(--signature-color),transparent_95%)]
          before:bg-[linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
          before:opacity-100
        `}

        w-[calc(var(--spacing-column-unit)*5)]
      "
      style="--signature-color: {signature_color};"
      tabindex="0"
      onfocusin={handle_focus}
      onfocusout={handle_focus_out}
      role="region"
      aria-label="Message Context"
    >
      <!-- HEADER BAR -->
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
              {entity?.name || character_name || (is_fractal ? "Fractal" : sender)}
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
                onclick={() => on_save?.(local_text)}
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
                  aria-label="Reroll"
                  actions={[tooltip]}
                  onclick={on_regenerate}
                  class="text-white/85 transition-colors hover:text-white"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
                    <polyline points="23 4 23 10 17 10" stroke="currentColor" stroke-width="2"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" stroke-width="2"></path>
                  </svg>
                </Button>
              {/if}
              {#if Audio.voice.isSpeaking && Audio.voice.activeMessageId === id}
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
                  onclick={handle_speak}
                  disabled={!clean_markdown}
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
                onclick={handle_copy}
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
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"
                  ></path>
                </svg>
              </Button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- CARD BODY -->
      <div class="relative p-4">
        {#if meta?.is_prologue || meta?.is_epilogue}
          <div class="mb-4 flex h-storyboard-character-card-height w-full items-stretch gap-2 md:gap-4">
            {#if runtime.active_ai || app.selected_ai}
              {@const a = runtime.active_ai || app.selected_ai}
              <div class="min-w-0" style="flex-grow: 1">
                <EntityCard entity={a} type="ai" variant="message" onclick={() => app.open_profile(a)} onViewProfile={() => app.open_profile(a)} />
              </div>
            {/if}
            {#if runtime.active_fractal || app.selected_fractal}
              {@const f = runtime.active_fractal || app.selected_fractal}
              <div class="min-w-0" style="flex-grow: 2">
                <EntityCard
                  entity={f}
                  type="fractal"
                  variant="message"
                  onclick={() => app.open_profile(f)}
                  onViewProfile={() => app.open_profile(f)}
                />
              </div>
            {/if}
            {#if runtime.active_user || app.selected_user}
              {@const u = runtime.active_user || app.selected_user}
              <div class="min-w-0" style="flex-grow: 1">
                <EntityCard entity={u} type="user" variant="message" onclick={() => app.open_profile(u)} onViewProfile={() => app.open_profile(u)} />
              </div>
            {/if}
          </div>
        {/if}

        {#if app.settings.dev_mode && think_block}
          <DataBox label="Thoughts" isCode={false} class="mb-4">
            <div
              class="
                text-left
                text-sm
                leading-relaxed
                text-pretty
                text-slate-300

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
              "
            >
              <div class="think-block-container" style="display: contents" use:safe_html={think_block}></div>
            </div>
          </DataBox>
        {/if}
        {#if !should_use_typewriter}
          {#if app.settings.dev_mode}
            {#if meta && (meta.dynamics || meta.vectors || meta.deltas)}
              <div class="mb-4">
                <DevTelemetryBlock {meta} />
              </div>
            {/if}
          {/if}
        {/if}

        {#if is_editing}
          <TextField bind:value={local_text} is_edit={true} {signature_color} no_background={true} placeholder="Edit message..." />
        {:else if has_display_text || busy}
          <div
            class="
              text-left
              text-base
              leading-relaxed
              text-pretty
              text-white

              [&_.dialogue]:text-[1.12em]
              [&_.dialogue]:font-medium

              [&_em]:italic
              [&_em]:opacity-75

              [&_p]:mb-4
              [&_p:last-child]:mb-0

              [&_strong]:font-bold
              [&_strong]:text-(--signature-color,var(--color-slate-400))
              [&_strong]:[text-shadow:0_0_8px_color-mix(in_srgb,var(--signature-color,var(--color-slate-400)),transparent_85%)]

              {is_fractal ? 'text-center' : ''}
            "
            style={!should_use_typewriter ? "content-visibility: auto;" : ""}
          >
            {#if should_use_typewriter}
              {#if has_display_text}
                <Typewriter targetHtml={display_text} bind:isFinished={is_typing_finished} />
              {:else if busy}
                <div class="flex items-center gap-1 p-2 opacity-60 {is_fractal ? 'justify-center' : ''}">
                  <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
                  <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
                  <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
                </div>
              {/if}
            {:else if has_display_text}
              <div class="display-text-container" style="display: contents" use:safe_html={display_text}></div>
            {:else if busy}
              <div class="flex items-center gap-1 p-2 opacity-60 {is_fractal ? 'justify-center' : ''}">
                <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
                <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
                <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
              </div>
            {/if}
          </div>
        {/if}

        {#if attachments.length > 0}
          <div class="flex justify-center">
            {#each attachments as attachment, attach_idx (typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url)}
              {@const src = typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url}
              {#if src}
                <button
                  type="button"
                  class="
                    mx-auto
                    block
                    w-fit
                    overflow-hidden
                    rounded-lg
                    bg-neutral-900/50
                    transition-[filter] duration-200
                    hover:brightness-110
                  "
                  onclick={() => {
                    const previewOptions = typeof attachment === "string" ? { src: attachment, metadata: {} } : { ...attachment };
                    if (!previewOptions.metadata) previewOptions.metadata = {};
                    previewOptions.signature_color = signature_color;

                    if (previewOptions.metadata?.prompt) {
                      previewOptions.on_reroll = async () => {
                        app.busy = true;
                        try {
                          const payload = await app.visual.generate(previewOptions.metadata.prompt, {
                            seed: null,
                            resolution: previewOptions.metadata.resolution,
                            negativePrompt: previewOptions.metadata.negativePrompt,
                            mode: previewOptions.metadata.mode || "character",
                            returnPayload: true,
                          });
                          if (payload?.url && id) {
                            const newAttachment = {
                              src: payload.url,
                              metadata: payload.metadata,
                              signature_color,
                            };
                            await session_driver.update_log_attachment(id, attach_idx, newAttachment);
                            app.open_image_preview(newAttachment);
                          }
                        } finally {
                          app.busy = false;
                        }
                      };
                    }

                    app.open_image_preview(previewOptions);
                  }}
                  aria-label="View Attachment"
                  use:tooltip
                >
                  <img
                    {src}
                    alt="Attachment {attach_idx + 1}"
                    class="
                      mx-auto
                      max-h-120
                      w-auto
                      max-w-full
                      cursor-zoom-in
                      rounded-sm
                      object-contain
                      shadow-sm
                    "
                  />
                </button>
              {:else}
                <div class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900/50 p-4 opacity-60">
                  <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
                  <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
                  <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes scan {
    from {
      transform: translateX(-100%) skewX(-20deg);
    }

    to {
      transform: translateX(100%) skewX(-20deg);
    }
  }
</style>
