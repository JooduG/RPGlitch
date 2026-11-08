<script>
  /**
   * @file src/ui/message/ChatBubble.svelte
   * 💬 THE SOVEREIGN CHAT BUBBLE
   * Unified message chassis consolidating message headers, narrative prose,
   * thinking cognition blocks, audio playback, edit controls, prologue, and epilogue cards.
   */
  import { parse_message } from "../Storymode.svelte";
  import { resolve_speaking_style, safe_html } from "@utils";
  import { Audio, get_cadence_rate, resolve_voice_uri, get_signature_color, render_optics_fallback } from "@media";
  import { ProfilePicture, Attachments } from "@image";
  import ContextMenu from "../entity/ContextMenu.svelte";
  import { claim_menu } from "../entity/ContextMenu.svelte.js";
  import { app, runtime, simulation_state } from "@state";
  import TelemetryCard from "./TelemetryCard.svelte";
  import Typewriter from "./Typewriter.svelte";
  import { Accordion, Button, Shimmer, StyleBadge, TextField, tooltip } from "@primitives";
  import { EntityCard } from "@entity";

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
   * @property {{ ai: any[], user: any[], fractal: any[] }} [card_actions]
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
    is_last: _is_last = false,
    busy = false,
    meta = {},
    is_editing = false,
    on_save = undefined,
    on_cancel = undefined,
    card_actions = { ai: [], user: [], fractal: [] },
  } = $props();

  // --- LOCAL INTERACTION STATE ---
  let is_focused = $state(false);
  let local_text = $state("");
  let is_typing_finished = $state(false);
  let was_streaming = $state(false);

  // --- ENTITY & ROLE DERIVATIONS ---
  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_npc = $derived(sender === "npc");
  let is_fractal = $derived(sender === "fractal");
  let is_telemetry = $derived(
    sender === "system" &&
      (meta?.type === "DYNAMICS_DELTA" ||
        meta?.type === "STORY_START" ||
        meta?.type === "VECTOR_RESOLUTION" ||
        meta?.type === "CONTINUUM_FORMATION" ||
        meta?.type === "MEMORY_FORMATION"),
  );

  let entity = $derived(
    is_user
      ? runtime.active_user || app.selected_user
      : is_ai
        ? runtime.active_ai || app.selected_ai
        : is_npc
          ? Object.values(runtime.active_npcs || {}).find((n) => String(n.name) === character_name) || null
          : is_fractal
            ? runtime.active_fractal && runtime.active_fractal.id !== "active_fractal"
              ? runtime.active_fractal
              : app.selected_fractal || runtime.active_fractal
            : null,
  );

  let signature_color = $derived(get_signature_color(entity, sender === "system" ? "var(--color-slate-600)" : "var(--color-slate-700)"));
  let is_pinned = $derived(app.pinned_message_id != null && String(app.pinned_message_id) === String(id));
  let is_extended = $derived(is_pinned || is_focused || is_editing);

  let active_style = $derived(runtime.active_fractal?.narrative_style || "");
  let speaking_style = $derived(resolve_speaking_style(entity, active_style));
  let is_streaming_target = $derived(!!(app.streaming.active && (app.streaming.node_id === id || (meta?.id && app.streaming.node_id === meta.id))));
  let active_text = $derived(is_streaming_target ? app.streaming.content : text);
  let parsed = $derived(parse_message(active_text, speaking_style));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think || meta?.think || null);
  let should_use_typewriter = $derived(is_streaming_target || (was_streaming && !is_typing_finished));

  // Track stream targeting
  $effect(() => {
    if (is_streaming_target) {
      was_streaming = true;
    }
  });

  // Chime notification on typewriter completion
  let has_played_notification = false;
  $effect(() => {
    if (was_streaming && is_typing_finished && !has_played_notification) {
      has_played_notification = true;
      if ((sender === "ai" || sender === "fractal") && has_display_text) {
        Audio?.play?.("notification");
      }
    }
  });

  // Force-finish if interrupted by a subsequent turn
  $effect(() => {
    if (app.streaming.active && !is_streaming_target && was_streaming && !is_typing_finished) {
      has_played_notification = true;
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

  let entity_display_name = $derived(entity?.name || character_name || (is_fractal ? "Fractal" : sender));

  // --- ACTIONS & UTILITIES ---
  function handle_message_click(e) {
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (target?.closest("button, input, textarea, a, select, [role='button']")) {
      return;
    }
    if (app.pinned_message_id === id) {
      app.pinned_message_id = null;
    } else {
      app.pinned_message_id = id;
    }
  }

  function handle_focus() {
    is_focused = true;
  }

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

  function handle_speak() {
    if (!clean_markdown) return;
    Audio.voice.active_message_id = id;

    if (entity && entity.voice) {
      const v_id = entity.voice.name || entity.voice.uri;
      Audio.voice.selected_voice = resolve_voice_uri(v_id);
      const dyn_val = is_user ? 50 : is_ai || is_npc ? (entity.dynamics?.intensity ?? 50) : (entity.dynamics?.velocity ?? 50);
      Audio.voice.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
    }

    Audio.voice.speak(clean_markdown, true, true);
  }

  // --- CONTEXT MENU RUNES ---
  let menu_open = $state(false);
  let menu_x = $state(0);
  let menu_y = $state(0);
  let my_menu_epoch = $state(0);

  let badge_actions = $derived.by(() => {
    if (is_user) return card_actions.user;
    if (is_ai) return card_actions.ai;
    if (is_npc && entity) {
      const items = [{ label: "Profile", onSelect: () => app.toggle_profile(true, entity) }];

      if (entity?.profile_picture) {
        items.push({
          label: "Profile Picture",
          onSelect: () =>
            app.open_image_preview({
              src: entity.profile_picture,
              metadata: entity.modifiers
                ? {
                    prompt: entity.modifiers.prompt,
                    negative_prompt: entity.modifiers.negative_prompt,
                    seed: entity.modifiers.last_generated_seed,
                  }
                : null,
            }),
        });
      }

      items.push({
        label: Audio.entity_voice.ai ? "Disable AI Voice" : "Enable AI Voice",
        active: Audio.entity_voice.ai,
        onSelect: () => Audio.toggle_entity_voice("ai"),
      });

      items.push({ separator: true });
      items.push({
        label: "Generate NPC Picture",
        onSelect: () => {
          if (app.take_photo_handler) {
            const active_fractal = runtime.active_fractal || app.selected_fractal;
            const raw_fallback = render_optics_fallback({
              tier: "story_character",
              subject: "ai",
              ai: entity,
              fractal: active_fractal,
            });
            const photo_prompt = raw_fallback.replace(/<\/?image_prompt>/g, "").trim();

            app.take_photo_handler("npc", photo_prompt, "story_character", entity);
          }
        },
      });

      return items;
    }
    if (is_fractal) return card_actions.fractal;
    return [];
  });

  function open_menu_at(x, y) {
    my_menu_epoch = claim_menu();
    menu_x = x;
    menu_y = y;
    menu_open = true;
  }

  function handle_badge_click(e) {
    e.stopPropagation();
    if (!entity) return;
    if (badge_actions && badge_actions.length) {
      open_menu_at(e.clientX, e.clientY);
    } else {
      app.toggle_profile(true, entity);
    }
  }

  $effect(() => {
    if (is_editing) {
      local_text = clean_markdown;
    }
  });

  let is_image_only = $derived(
    attachments.length > 0 && !has_display_text && !think_block && !meta?.is_prologue && !meta?.is_epilogue && !is_editing && !meta?.type && !busy,
  );
</script>

{#snippet header_bar()}
  {#if is_extended}
    <div
      class="
        relative
        flex
        h-9
        w-full
        items-center
        justify-between
        overflow-hidden
        rounded-t-[15px]
        border-b
        border-white/10
        bg-(--signature-color)
        px-4
        font-mono
        tracking-widest
        uppercase
        opacity-100
        transition-all
        duration-300
        ease-out
      "
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="text-xs font-bold whitespace-nowrap text-white">
          {entity_display_name}
        </span>
        <span class="text-[10px] font-normal text-white/60">
          {time_label}
        </span>
      </div>

      <!-- HEADER ACTIONS -->
      <div class="flex items-center gap-2 opacity-100 transition-opacity duration-200">
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
          {#if is_ai}
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
              aria-label={Audio.voice.is_paused ? "Resume Audio" : "Pause Audio"}
              actions={[tooltip]}
              onclick={() => Audio.voice.toggle_pause()}
              class="text-white/85 transition-colors hover:text-white"
            >
              {#if Audio.voice.is_paused}
                <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current stroke-none">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              {:else}
                <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current stroke-none">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              {/if}
            </Button>
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
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"></path>
            </svg>
          </Button>
        {/if}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet body_content()}
  {#if app.settings.dev_mode && think_block}
    <div class="mb-4">
      <Accordion label="Thoughts">
        <div
          class="terminal-box max-h-75 overflow-y-auto p-4 text-sm leading-relaxed text-pretty text-[#f2f7fa] [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono! [&_em]:italic [&_em]:opacity-75 [&_p]:mb-4"
        >
          <div class="think-block-container" style="display: contents" use:safe_html={think_block}></div>
        </div>
      </Accordion>
    </div>
  {/if}

  {#if !should_use_typewriter}
    {#if app.settings.dev_mode}
      {#if meta && (meta.dynamics || meta.vectors || meta.deltas || meta.updates)}
        <div class="mb-4">
          <TelemetryCard {meta} />
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
      "
      style={!should_use_typewriter ? "content-visibility: auto;" : ""}
    >
      {#if should_use_typewriter}
        {#if has_display_text}
          <Typewriter target_html={display_text} bind:is_finished={is_typing_finished} show_cursor={true} cursor_style="block" />
        {:else if busy}
          <div class="relative h-6 w-24 overflow-hidden rounded">
            <Shimmer color={signature_color || "var(--color-electric-cyan)"} />
          </div>
        {/if}
      {:else if has_display_text}
        <div class="display-text-container" style="display: contents" use:safe_html={display_text}></div>
      {:else if busy}
        <div class="relative h-6 w-24 overflow-hidden rounded">
          <Shimmer color={signature_color || "var(--color-electric-cyan)"} />
        </div>
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet entity_trio()}
  <div class="my-2 flex h-character-card-height w-full items-stretch gap-2 md:gap-4" data-msg-trio>
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
{/snippet}

{#snippet cursive_title()}
  {#if app.story_title}
    <h2 class="mb-4 text-center text-[clamp(1.3rem,2.8vw,2.2rem)] font-normal text-balance" style="font-family: Satisfy, cursive;" data-msg-title>
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
{/snippet}

<!-- ========================================================================= -->
<!-- CHASSIS RENDERING                                                         -->
<!-- ========================================================================= -->

{#if is_telemetry}
  {#if app.settings.dev_mode}
    <div class="relative flex w-full justify-center p-4 transition-all duration-200">
      <div class="w-[calc(var(--spacing-column-unit)*6)]">
        <TelemetryCard {meta} />
      </div>
    </div>
  {/if}
{:else if sender === "system" && !app.settings.dev_mode}
  <!-- System / Director messages are purely internal background data and never render in normal mode -->
{:else if is_image_only}
  <div class="relative flex w-full items-center justify-center p-4">
    <div class="w-[calc(var(--spacing-column-unit)*5)] max-w-full">
      <Attachments {attachments} {id} {signature_color} {is_fractal} {has_display_text} {busy} {should_use_typewriter} />
    </div>
  </div>
{:else if !has_display_text && !think_block && attachments.length === 0 && !busy && !is_telemetry && !is_editing && !meta?.is_prologue && !meta?.is_epilogue}
  <!-- Empty ghost row suppressed: no DOM node emitted -->
{:else}
  <div
    class="
      relative
      flex
      w-full
      items-start
      p-4
      transition-all
      duration-200
      {is_user
      ? 'justify-end pr-[calc(var(--spacing-column-unit)*2)]'
      : is_ai || is_npc
        ? 'justify-start pl-[calc(var(--spacing-column-unit)*2)]'
        : 'justify-center'}
    "
  >
    {#if (is_ai || is_npc || is_fractal) && entity && !meta?.is_prologue && !meta?.is_epilogue}
      <div
        class="
          absolute
          top-1/2
          left-[calc(var(--spacing-column-unit)*0.5)]
          m-0
          flex
          w-column-unit
          -translate-y-1/2
          items-center
          justify-center
          p-0
          select-none
        "
        style="--signature-color: {signature_color};"
      >
        <button
          type="button"
          onclick={handle_badge_click}
          class="
            group/badge
            relative
            isolate
            m-0
            aspect-3/4
            w-column-unit
            transform-[translateZ(0)]
            cursor-pointer
            overflow-hidden
            rounded-xl
            border
            border-solid
            border-(--signature-color,rgba(255,255,255,0.25))
            bg-black/60
            p-0
            shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            transition-all
            duration-300
            ease-out
            hover:scale-[1.02]
            hover:border-(--signature-color)
            hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_20%,transparent)]
            focus-visible:outline-none
          "
          aria-label="{is_fractal ? 'Fractal' : 'Character'} Menu"
        >
          <ProfilePicture
            {entity}
            alt=""
            class="h-full w-full rounded-[inherit] [&_img]:h-full [&_img]:w-full [&_img]:rounded-[inherit] [&_img]:object-cover [&_img]:object-top"
          />
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-20 transition-opacity duration-200 group-hover/badge:opacity-0"
            style="background-color: {signature_color}; mix-blend-mode: color;"
          ></div>
        </button>
      </div>
    {/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
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
      onclick={handle_message_click}
      onfocusin={handle_focus}
      onfocusout={handle_focus_out}
      role="region"
      aria-label="Message Context"
    >
      <!-- HEADER BAR -->
      {@render header_bar()}

      <!-- CARD BODY -->
      <div class="relative p-4">
        {#if meta?.is_prologue}
          <div data-msg-prologue>
            {@render cursive_title()}
            {@render entity_trio()}
          </div>
        {:else if meta?.is_epilogue}
          <div class="flex flex-col items-center gap-4 text-center" data-msg-epilogue>
            {@render cursive_title()}
            {@render entity_trio()}
          </div>
        {/if}

        {@render body_content()}

        <Attachments {attachments} {id} {signature_color} {is_fractal} {has_display_text} {busy} {should_use_typewriter} />
      </div>
    </div>

    {#if is_user && entity && !meta?.is_prologue && !meta?.is_epilogue}
      <div
        class="
          absolute
          top-1/2
          right-[calc(var(--spacing-column-unit)*0.5)]
          m-0
          flex
          w-column-unit
          -translate-y-1/2
          items-center
          justify-center
          p-0
          select-none
        "
        style="--signature-color: {signature_color};"
      >
        <button
          type="button"
          onclick={handle_badge_click}
          class="
            group/badge
            relative
            isolate
            m-0
            aspect-3/4
            w-column-unit
            transform-[translateZ(0)]
            cursor-pointer
            overflow-hidden
            rounded-xl
            border
            border-solid
            border-(--signature-color,rgba(255,255,255,0.25))
            bg-black/60
            p-0
            shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            transition-all
            duration-300
            ease-out
            hover:scale-[1.02]
            hover:border-(--signature-color)
            hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_20%,transparent)]
            focus-visible:outline-none
          "
          aria-label="User Persona Menu"
        >
          <ProfilePicture
            {entity}
            alt=""
            class="h-full w-full rounded-[inherit] [&_img]:h-full [&_img]:w-full [&_img]:rounded-[inherit] [&_img]:object-cover [&_img]:object-top"
          />
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-20 transition-opacity duration-200 group-hover/badge:opacity-0"
            style="background-color: {signature_color}; mix-blend-mode: color;"
          ></div>
        </button>
      </div>
    {/if}
  </div>
{/if}

<ContextMenu bind:open={menu_open} x={menu_x} y={menu_y} epoch={my_menu_epoch} actions={badge_actions} {signature_color} />
