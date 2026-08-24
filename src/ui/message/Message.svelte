<script>
  /**
   * @file Message.svelte
   * ❄️ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Chassis. Orchestrates header, body,
   * attachments, and the prologue/epilogue entity trio. Standard: Pure Svelte 5
   * layout primitives, fully decoupled event chains, and deterministic metrics.
   */
  import { parse_message } from "./render.js";
  import { resolve_voice_register } from "@data";
  import { Button } from "@primitives";
  import { Audio, get_cadence_rate, resolve_voice_uri, get_signature_color } from "@media";
  import { ProfilePicture } from "@image";
  import { claim_menu, get_menu_epoch } from "../entity/ContextMenu.svelte.js";
  import { app, runtime } from "@state";
  import TelemetryCard from "./TelemetryCard.svelte";
  import MessageHeader from "./MessageHeader.svelte";
  import Body from "./Body.svelte";
  import Attachments from "./Attachments.svelte";
  import Prologue from "./Prologue.svelte";
  import Epilogue from "./Epilogue.svelte";

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
  let is_npc = $derived(sender === "npc");
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
  let register = $derived(resolve_voice_register(entity, active_style));
  let is_streaming_target = $derived(!!(app.streaming.active && (app.streaming.node_id === id || (meta?.id && app.streaming.node_id === meta.id))));
  let active_text = $derived(is_streaming_target ? app.streaming.content : text);
  let parsed = $derived(parse_message(active_text, register));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think);
  let should_use_typewriter = $derived(is_streaming_target || (was_streaming && !is_typing_finished));

  // Track when this specific message becomes an active stream target
  $effect(() => {
    if (is_streaming_target) {
      was_streaming = true;
    }
  });

  // When typewriter finishes animating after being an active stream target, trigger notification sound
  let has_played_notification = false;
  $effect(() => {
    if (was_streaming && is_typing_finished && !has_played_notification) {
      has_played_notification = true;
      if ((sender === "ai" || sender === "fractal") && has_display_text) {
        Audio?.play?.("notification");
      }
    }
  });

  // If another message becomes the active stream target while this message is still typing, force-finish this typewriter animation
  // without triggering a spurious chime
  $effect(() => {
    if (app.streaming.active && !is_streaming_target && was_streaming && !is_typing_finished) {
      has_played_notification = true; // Mark as handled to avoid premature chime on interruption
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
   * Toggles message header pinned status.
   * @param {MouseEvent} e
   */
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
   * Speaks the entire message in the sender's voice (selected_voice set above
   * from the entity's voice profile) — no per-line voice switching.
   * @returns {void}
   */
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
  let my_menu_epoch = 0;

  function portal_to_body(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

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
          if (app.regenerate_image_handler) {
            app.regenerate_image_handler({
              prompt: `A cinematic shot of ${entity.name || "the NPC"} situated within the active setting`,
              mode: "story_character",
              log_id: id,
              attach_idx: 0,
              signature_color,
            });
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

    requestAnimationFrame(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = 160;
      const height = (badge_actions.length || 1) * 36;
      if (menu_x + width > vw) menu_x = vw - width;
      if (menu_y + height > vh) menu_y = vh - height;
      if (menu_x < 0) menu_x = 0;
      if (menu_y < 0) menu_y = 0;
    });
  }

  // Close this menu when another card/badge claims the menu epoch
  $effect(() => {
    const current = get_menu_epoch();
    if (menu_open && current !== my_menu_epoch) {
      menu_open = false;
    }
  });

  function handle_badge_click(e) {
    e.stopPropagation();
    if (!entity) return;
    if (badge_actions && badge_actions.length) {
      open_menu_at(e.clientX, e.clientY);
    } else {
      app.toggle_profile(true, entity);
    }
  }

  function handle_item_click(e, item) {
    e.stopPropagation();
    menu_open = false;
    if (item.onSelect) item.onSelect();
  }

  function close_menu() {
    menu_open = false;
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
          w-(--spacing-column-unit)
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
            [isolation:isolate]
            m-0
            aspect-3/4
            w-(--spacing-column-unit)
            [transform:translateZ(0)]
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
      <MessageHeader
        {is_extended}
        entity_name={entity?.name || character_name || (is_fractal ? "Fractal" : sender)}
        {time_label}
        {is_editing}
        is_ai={is_ai || is_npc}
        {is_last}
        {id}
        clean_markdown_available={!!clean_markdown}
        on_save={() => on_save?.(local_text)}
        {on_cancel}
        {on_continue}
        {on_regenerate}
        on_speak={handle_speak}
        {on_edit}
        on_copy={handle_copy}
        {on_delete}
      />

      <!-- CARD BODY -->
      <div class="relative p-4">
        {#if meta?.is_prologue}
          <Prologue {card_actions} />
        {:else if meta?.is_epilogue}
          <Epilogue {card_actions} />
        {/if}

        <Body
          {is_editing}
          bind:local_text
          {signature_color}
          {think_block}
          {should_use_typewriter}
          bind:is_typing_finished
          {meta}
          {has_display_text}
          {busy}
          attachments_length={attachments.length}
          {display_text}
          {is_fractal}
        />

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
          w-(--spacing-column-unit)
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
            [isolation:isolate]
            m-0
            aspect-3/4
            w-(--spacing-column-unit)
            [transform:translateZ(0)]
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

<svelte:window onclick={close_menu} onkeydown={(e) => e.key === "Escape" && close_menu()} />

{#if menu_open}
  <div
    use:portal_to_body
    class="fixed z-9999 min-w-40 overflow-hidden rounded-standard bg-glass-elevated shadow-(--shadow-standard) [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay"
    style="left:{menu_x}px;top:{menu_y}px"
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close_menu()}
  >
    {#each badge_actions as item, i (i)}
      {#if item.separator}
        <div class="block h-px bg-current opacity-20"></div>
      {:else}
        <Button
          variant="bare"
          class="
            flex h-9 w-full cursor-default items-center gap-2 px-2.5 text-xs font-bold tracking-widest text-slate-200 uppercase transition-colors duration-150 outline-none select-none hover:bg-(--signature-color,var(--color-slate-50))/10 hover:text-white
            {item.danger ? 'text-red-400/80 hover:text-red-400' : ''}
            {item.active ? 'text-(--signature-color,var(--color-slate-50))' : ''}
          "
          disabled={item.disabled}
          onclick={(e) => handle_item_click(e, item)}
          role="menuitem"
        >
          {#if item.active}
            <span
              class="size-1.5 shrink-0 rounded-full bg-(--signature-color,var(--color-slate-50)) shadow-[0_0_4px_var(--signature-color,var(--color-slate-50))]"
            ></span>
          {/if}
          {item.label}
        </Button>
      {/if}
    {/each}
  </div>
{/if}
