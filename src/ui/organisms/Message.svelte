<script>
  /**
   * @file Message.svelte
   * ❄️ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Chassis.
   * Standard: Pure Svelte 5 layout primitives, fully decoupled event chains, and deterministic metrics.
   */
  import { safe_html } from "@utils";
  import { Button, DataBox, StyleBadge, TextField, tooltip } from "@atoms";
  import { parse_message, resolve_voice_register } from "@intelligence";
  import { Audio, get_resolution, get_signature_color } from "@media";
  import { DevTelemetryBlock, EntityCard, image_regenerate, open_picker } from "@molecules";
  import { Typewriter } from "@motion";
  import { app, runtime, simulation_state } from "@state";

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
    /** @type {{ ai: any[], user: any[], fractal: any[] }} */
    card_actions = { ai: [], user: [], fractal: [] },
  } = $props();

  // --- STATE RUNES ---
  let is_focused = $state(false);
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

  let is_extended = $derived(is_focused || is_editing);

  let active_style = $derived(runtime.active_fractal?.narrative_style || "");
  let register = $derived(resolve_voice_register(entity, active_style));
  let parsed = $derived(parse_message(text, register));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think);

  let is_streaming_target = $derived(!!(app.streaming.active && id && (app.streaming.node_id === id || app.streaming.node_id === id)));
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
  let clean_markdown = $derived((parsed.detoxedText || "").trim());

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
    is_focused = true;
  }

  /**
   * Handles focus eviction gestures from the message bubble tree block boundaries.
   * @param {FocusEvent & { currentTarget: HTMLElement, relatedTarget: EventTarget | null }} e
   * @returns {void}
   */
  function handle_focus_out(e) {
    if (e.relatedTarget && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_focused = false;
  }

  async function handle_copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }

  /**
   * Resolves exact aspect ratio and dimensions for an attachment or loading placeholder.
   * @param {any} attachment
   * @param {string} regenerate_key
   * @returns {{ width: number, height: number }}
   */
  function get_attachment_resolution(attachment, regenerate_key) {
    const meta_res = typeof attachment === "object" && attachment?.metadata?.resolution;
    if (meta_res && typeof meta_res === "string" && meta_res.includes("x")) {
      const [w, h] = meta_res.split("x").map(Number);
      if (w && h) return { width: w, height: h };
    }
    let mode = typeof attachment === "object" && (attachment?.metadata?.mode || attachment?.mode);
    if (!mode && image_regenerate.regenerating_key === regenerate_key && image_regenerate.last_mode) {
      mode = image_regenerate.last_mode;
    }
    if (!mode) {
      mode = is_fractal ? "landscape" : "character";
    }
    return get_resolution(mode);
  }

  /**
   * Orchestrates audio speech synthesis sequences matching character audio profile configurations.
   * @returns {void}
   */
  function handle_speak() {
    if (!clean_markdown) return;

    Audio.voice.active_message_id = id;

    if (entity && entity.voice) {
      Audio.voice.selected_voice = entity.voice.uri || Audio.voice.selected_voice;
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
          {#if app.story_title}
            <h2 class="mb-4 text-center text-[clamp(1.3rem,2.8vw,2.2rem)] font-normal text-balance" style="font-family: Satisfy, cursive;">
              {#if app.story_title_parts.length > 0}
                {#each app.story_title_parts as part, i (i)}
                  {#if part.color}
                    <span
                      class="inline px-1 whitespace-nowrap text-(--signature-color) text-shadow-[0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]"
                      style:--signature-color={part.color}>{part.text}</span
                    >
                  {:else}
                    <span class="inline px-1 text-shadow-[0_0_var(--spacing-unit)_var(--color-void-black)]">{part.text}</span>
                  {/if}
                {/each}
              {:else}
                {app.story_title}
              {/if}
            </h2>
          {/if}
          <div class="mb-4 flex h-character-card-height w-full items-stretch gap-2 md:gap-4" data-msg-prologue={meta?.is_prologue ? "" : undefined}>
            {#if runtime.active_ai || app.selected_ai}
              {@const a = runtime.active_ai || app.selected_ai}
              <div class="min-w-0" style="flex-grow: 1" data-msg-card="ai">
                <EntityCard
                  entity={a}
                  type="ai"
                  variant="message"
                  actions={card_actions.ai}
                  onclick={() => app.open_profile(a)}
                  onViewProfile={() => app.open_profile(a)}
                />
              </div>
            {/if}
            {#if runtime.active_fractal || app.selected_fractal}
              {@const f = runtime.active_fractal || app.selected_fractal}
              <div class="min-w-0" style="flex-grow: 2" data-msg-card="fractal">
                <div class="flex h-full w-full flex-col gap-2 md:gap-4">
                  <div class="min-h-0 flex-1">
                    <EntityCard
                      entity={f}
                      type="fractal"
                      variant="message"
                      actions={card_actions.fractal}
                      onclick={() => app.open_profile(f)}
                      onViewProfile={() => app.open_profile(f)}
                    />
                  </div>
                  <div class="flex w-full shrink-0 justify-center gap-2 md:gap-4" data-msg-style-badge>
                    <StyleBadge entity={f} layout="prologue" class="flex w-full justify-center gap-2 md:gap-4" />
                  </div>
                </div>
              </div>
            {/if}
            {#if runtime.active_user || app.selected_user}
              {@const u = runtime.active_user || app.selected_user}
              <div class="min-w-0" style="flex-grow: 1" data-msg-card="user">
                <EntityCard
                  entity={u}
                  type="user"
                  variant="message"
                  actions={card_actions.user}
                  onclick={() => app.open_profile(u)}
                  onViewProfile={() => app.open_profile(u)}
                />
              </div>
            {/if}
          </div>
        {/if}

        {#if app.settings.dev_mode && think_block}
          <DataBox label="Thoughts" isCode={false} isProse={true} class="mb-4 [&_.think-block-container_p]:mb-0">
            <div class="think-block-container" style="display: contents" use:safe_html={think_block}></div>
          </DataBox>
        {/if}
        {#if !should_use_typewriter}
          {#if app.settings.dev_mode}
            {#if meta && (meta.dynamics || meta.vectors || meta.deltas || meta.updates)}
              <div class="mb-4">
                <DevTelemetryBlock {meta} />
              </div>
            {/if}
          {/if}
        {/if}

        {#if is_editing}
          <TextField bind:value={local_text} is_edit={true} {signature_color} variant="bare" placeholder="Edit message..." />
        {:else if has_display_text || (busy && attachments.length === 0)}
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
              {meta?.is_prologue || meta?.is_epilogue ? '' : ''}
            "
            style={!should_use_typewriter ? "content-visibility: auto;" : ""}
          >
            {#if should_use_typewriter}
              {#if has_display_text}
                <Typewriter target_html={display_text} bind:is_finished={is_typing_finished} />
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
          <div class="flex justify-center {has_display_text || (should_use_typewriter && (has_display_text || busy)) ? 'mt-4' : ''}">
            {#each attachments as attachment, attach_idx (typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url)}
              {@const src = typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url}
              {@const regenerate_key = `${id}:${attach_idx}`}
              {@const res = get_attachment_resolution(attachment, regenerate_key)}
              {@const box_h = 480}
              {@const box_w = Math.round((box_h * res.width) / res.height)}
              {@const container_style = `height: ${box_h}px; width: ${box_w}px; max-width: 100%; max-height: 60vh; aspect-ratio: ${res.width} / ${res.height};`}
              {#if image_regenerate.hasError(regenerate_key)}
                <div class="flex flex-col items-center justify-center gap-2 rounded-lg bg-red-900/20 p-4" style={container_style}>
                  <p class="text-center text-sm text-red-400">{image_regenerate.error}</p>
                </div>
              {:else if image_regenerate.isReady(regenerate_key)}
                <Button
                  variant="bare"
                  class="group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-(--signature-color,slate-600)/30 bg-neutral-900/50 shadow-md transition-all duration-300 hover:border-(--signature-color,slate-300)/80 hover:bg-neutral-800/80 hover:shadow-[0_0_24px_color-mix(in_srgb,var(--signature-color,white)_25%,transparent)]"
                  style={container_style}
                  onclick={() => open_picker()}
                  aria-label="Select image from candidates"
                >
                  <!-- Mini 3-card spread with dynamic mouseover animation -->
                  <div class="relative h-16 w-24 transition-transform duration-300 group-hover:scale-110">
                    <div
                      class="absolute bottom-0 left-1/2 h-12 w-8 rounded-sm border-2 border-(--signature-color,slate-400)/35 bg-(--signature-color,slate-600)/10 shadow-sm transition-all duration-300 group-hover:-translate-x-7 group-hover:rotate-[-25deg] group-hover:border-(--signature-color,slate-300)/60 group-hover:bg-(--signature-color,slate-400)/25"
                      style="transform: translateX(-50%) rotate(-18deg); transform-origin: bottom center;"
                    ></div>
                    <div
                      class="absolute bottom-0 left-1/2 h-12 w-8 rounded-sm border-2 border-(--signature-color,slate-400)/60 bg-(--signature-color,slate-600)/20 shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-(--signature-color,slate-200)/80 group-hover:bg-(--signature-color,slate-400)/35"
                      style="transform: translateX(-50%) rotate(0deg); transform-origin: bottom center; z-index: 1;"
                    ></div>
                    <div
                      class="absolute bottom-0 left-1/2 h-12 w-8 rounded-sm border-2 border-(--signature-color,slate-400)/35 bg-(--signature-color,slate-600)/10 shadow-sm transition-all duration-300 group-hover:translate-x-3 group-hover:rotate-25 group-hover:border-(--signature-color,slate-300)/60 group-hover:bg-(--signature-color,slate-400)/25"
                      style="transform: translateX(-50%) rotate(18deg); transform-origin: bottom center;"
                    ></div>
                  </div>
                  <div class="flex items-center gap-2 transition-transform duration-200 group-hover:scale-105">
                    <span
                      class="font-mono text-xs font-bold tracking-widest text-(--signature-color,slate-300) uppercase transition-colors duration-200 group-hover:text-white"
                    >
                      Click to select
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      class="h-3.5 w-3.5 fill-none stroke-current stroke-2 text-(--signature-color,slate-300) transition-all duration-200 [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-0.5 group-hover:text-white"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Button>
              {:else if image_regenerate.isRegenerating(regenerate_key)}
                <div
                  class="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
                  style={container_style}
                >
                  <div class="flex gap-1.5">
                    <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
                    <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
                    <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              {:else if src}
                <Button
                  variant="bare"
                  class="
                    mx-auto
                    block
                    w-fit
                    overflow-hidden
                    rounded-lg
                    border
                    border-(--signature-color,slate-600)/30
                    bg-neutral-900/50
                    transition-[filter]
                    duration-200
                    hover:brightness-110
                  "
                  onclick={() => {
                    const preview_options = typeof attachment === "string" ? { src: attachment, metadata: {} } : { ...attachment };
                    if (!preview_options.metadata) preview_options.metadata = {};
                    preview_options.signature_color = signature_color;
                    if (preview_options.metadata?.prompt && id && app.regenerate_image_handler) {
                      preview_options.on_regenerate = () => {
                        app.regenerate_image_handler({
                          prompt: preview_options.metadata.prompt,
                          negative_prompt: preview_options.metadata.negative_prompt,
                          mode: preview_options.metadata.mode || "character",
                          log_id: id,
                          attach_idx,
                          signature_color,
                          regenerate_count: preview_options.metadata.regenerate_count || 0,
                        });
                      };
                    }
                    app.open_image_preview(preview_options);
                  }}
                  aria-label="View Attachment"
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
                      rounded-lg
                      object-contain
                    "
                  />
                </Button>
              {:else}
                <div
                  class="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
                  style={container_style}
                >
                  <div class="flex gap-1.5">
                    <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
                    <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
                    <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
                  </div>
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
  /* Prologue inline cards are art-only — the names/descriptions are removed so
     the cards stay clean while they travel (and scale) with the scroll scrub. */
  :global([data-msg-prologue] [data-card-text]) {
    display: none !important;
  }

  @keyframes scan {
    from {
      transform: translateX(-100%) skewX(-20deg);
    }

    to {
      transform: translateX(100%) skewX(-20deg);
    }
  }
</style>
