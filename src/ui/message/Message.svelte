<script>
  /**
   * @file Message.svelte
   * ❄️ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Chassis. Orchestrates header, body,
   * attachments, and the prologue/epilogue entity trio. Standard: Pure Svelte 5
   * layout primitives, fully decoupled event chains, and deterministic metrics.
   */
  import { parse_message, resolve_voice_register } from "@intelligence";
  import { Audio, get_cadence_rate, resolve_voice_uri, get_signature_color } from "@media";
  import { app, runtime } from "@state";
  import TelemetryCard from "./TelemetryCard.svelte";
  import Header from "./Header.svelte";
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
  let is_streaming_target = $derived(!!(app.streaming.active && (app.streaming.node_id === id || (meta?.id && app.streaming.node_id === meta.id))));
  let active_text = $derived(is_streaming_target ? app.streaming.text : text);
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
   * Orchestrates audio speech synthesis sequences matching character audio profile configurations.
   * @returns {void}
   */
  function handle_speak() {
    if (!clean_markdown) return;

    Audio.voice.active_message_id = id;

    if (entity && entity.voice) {
      const v_id = entity.voice.name || entity.voice.uri;
      Audio.voice.selected_voice = resolve_voice_uri(v_id);
      const dyn_val = is_user ? 50 : is_ai ? (entity.dynamics?.intensity ?? 50) : (entity.dynamics?.velocity ?? 50);
      Audio.voice.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
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
        <TelemetryCard {meta} />
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
      <Header
        {is_extended}
        entity_name={entity?.name || character_name || (is_fractal ? "Fractal" : sender)}
        {time_label}
        {is_editing}
        {is_ai}
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
          <Epilogue {card_actions} status={meta?.conclusion_status || meta?.story_status || "CONCLUDED"} />
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
