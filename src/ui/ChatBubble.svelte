<script module>
  /**
   * 🔭 TELEMETRY FORMATTERS
   * Pure helpers that turn Director/continuum metadata (DYNAMICS_DELTA, telemetry
   * cards) into renderable per-entity blocks.
   */
  const ENTITY_KEYS = {
    AI_CHARACTER: "ai",
    USER_PERSONA: "user",
    FRACTAL: "fractal",
  };

  /**
   * Resolves a telemetry entity key to its display name - the runtime's active
   * entity when available, otherwise a static label. Unknown keys pass through.
   * @param {string} key
   * @param {{ active_ai?: any, active_user?: any, active_fractal?: any, active_npcs?: Record<string, any> }} [runtime]
   * @returns {string}
   */
  export function resolve_entity_name(key, runtime) {
    const map = {
      AI_CHARACTER: () => runtime?.active_ai?.name || "AI CHARACTER",
      USER_PERSONA: () => runtime?.active_user?.name || "USER PERSONA",
      FRACTAL: () => runtime?.active_fractal?.name || "FRACTAL",
      ai: () => runtime?.active_ai?.name || "AI CHARACTER",
      user: () => runtime?.active_user?.name || "USER PERSONA",
      fractal: () => runtime?.active_fractal?.name || "FRACTAL",
    };
    const resolver = map[key];
    if (resolver) return resolver();
    if (runtime?.active_npcs?.[key]?.name) {
      return runtime.active_npcs[key].name;
    }
    return String(key ?? "");
  }

  /**
   * Derives the title label for a telemetry card based on event type and metadata.
   * @param {any} meta
   * @param {{ active_ai?: any, active_user?: any, active_fractal?: any, active_npcs?: Record<string, any> }} [runtime]
   * @returns {string}
   */
  export function get_telemetry_label(meta) {
    if (meta?.type === "STORY_START") {
      return "Simulation initiated";
    }
    if (meta?.type === "MEMORY_FORMATION" || meta?.type === "CONTINUUM_FORMATION") {
      const raw = String(meta.target ?? "ENTITY").toUpperCase();
      const turns = meta.turns_count ? ` from ${meta.turns_count} turns` : "";
      return `Caretaker turn: ${raw}${turns}`;
    }
    if (meta?.type === "VECTOR_RESOLUTION") {
      return "Vector resolution";
    }
    return "Director turn";
  }

  export function vector_label(type, fallback = "past") {
    if (type == null) return fallback === "memory" || fallback === "past" ? "PAST" : fallback.toUpperCase();
    const t = String(type).toUpperCase();
    if (t === "PAST" || t === "MEMORY") return "PAST";
    if (t === "FUTURE" || t === "AGENDUM") return "FUTURE";
    if (t === "PRESENT") return "PRESENT";
    if (t === "ETERNAL") return "ETERNAL";
    return t;
  }

  /**
   * Cleans comma debris, double commas, and leading/trailing punctuation from prose strings.
   * @param {any} text
   * @returns {string}
   */
  export function clean_text_debris(text) {
    if (text == null) return "";
    let s = String(text).trim();
    s = s.replace(/^[\s,;]+/g, "");
    s = s.replace(/,(\s*,)+/g, ",");
    s = s.replace(/[\s,;]+$/g, "");
    return s.trim();
  }

  /**
   * Parses a directed relationship edge string or object into a structured object.
   * String parsing delegates to the canonical `parse_relational_vector` (@utils/text.js:
   * all five arrow notations). The renderer keeps its own rules on top: the `: dynamic`
   * label stays mandatory (canonical alone accepts labelless edges) and strings with a
   * blank side are dropped. Object edges keep the Entity/Target fallbacks.
   * @param {any} edge
   * @returns {{ source: string, target: string, dynamic: string } | null}
   */
  export function parse_relationship_edge(edge) {
    if (!edge) return null;
    if (typeof edge === "object") {
      const source = String(edge.source || "").trim();
      const target = String(edge.target || "").trim();
      const dynamic = String(edge.dynamic ?? edge.content ?? "").trim();
      if (!source && !target && !dynamic) return null;
      return { source: source || "Entity", target: target || "Target", dynamic };
    }
    if (typeof edge === "string") {
      const parsed = parse_relational_vector(edge);
      if (!parsed || !parsed.dynamic) return null;
      if (!parsed.source_name && !parsed.target_name) return null;
      return {
        source: parsed.source_name || "Entity",
        target: parsed.target_name || "Target",
        dynamic: parsed.dynamic,
      };
    }
    return null;
  }

  /**
   * Projects a DYNAMICS_DELTA `updates` map into renderable per-entity blocks.
   * @param {any} meta
   * @returns {Array<any>}
   */
  export function process_entity_blocks(meta) {
    const updates = meta?.updates && typeof meta.updates === "object" ? meta.updates : {};
    const blocks = [];
    for (const [key, raw] of Object.entries(updates)) {
      if (!raw || typeof raw !== "object") continue;
      const block_key = ENTITY_KEYS[key];
      if (!block_key) continue;

      const dynamics = (Array.isArray(raw.dynamics) ? raw.dynamics : []).map((d) => ({
        axis: d.axis,
        value: d.new_value,
        old_value: d.old_value,
        new_value: d.new_value,
        diff: d.diff,
        has_delta: true,
      }));

      const new_vectors = (Array.isArray(raw.vectors?.new) ? raw.vectors.new : []).map((v) => ({
        type: v.type,
        weight: v.emotional_weight,
        ...(v.id ? { id: v.id } : {}),
        content: clean_text_debris(v.content),
      }));

      const retrieval = (Array.isArray(raw.vectors?.retrieval) ? raw.vectors.retrieval : []).map((v) => ({
        type: v.type,
        id: v.id,
        content: clean_text_debris(v.content),
        relevance: v._relevance,
      }));

      const physical = clean_text_debris(raw.present_mutations?.physical ?? "");
      const non_physical = clean_text_debris(raw.present_mutations?.non_physical ?? "");
      const eternal_physical = clean_text_debris(raw.eternal_mutations?.physical ?? "");
      const eternal_non_physical = clean_text_debris(raw.eternal_mutations?.non_physical ?? "");
      const has_mods = !!eternal_physical || !!eternal_non_physical;
      const raw_relationships = Array.isArray(raw.relationships)
        ? raw.relationships
        : Array.isArray(meta?.relationships) && ((meta.consolidated_entity ?? meta.forged_entity) === block_key || meta.target === key)
          ? meta.relationships
          : [];
      const relationships = raw_relationships
        .map(parse_relationship_edge)
        .filter((r) => r !== null && (r.source !== "Entity" || r.target !== "Target" || r.dynamic));

      if (
        !dynamics.length &&
        !new_vectors.length &&
        !retrieval.length &&
        !physical &&
        !non_physical &&
        !eternal_physical &&
        !eternal_non_physical &&
        !relationships.length
      ) {
        continue;
      }

      blocks.push({
        key: block_key,
        name: raw.name || resolve_entity_name(key, {}),
        physical,
        non_physical,
        eternal_physical,
        eternal_non_physical,
        dynamics,
        new_vectors,
        retrieval,
        relationships,
        has_mods,
      });
    }
    return blocks;
  }
</script>

<script>
  /**
   * @file src/ui/ChatBubble.svelte
   * 💬 THE SOVEREIGN CHAT BUBBLE
   * Unified message chassis consolidating message headers, narrative prose,
   * thinking cognition blocks, audio playback, edit controls, prologue, and epilogue cards.
   */
  import { parse_bracket_entries, parse_think_block, simulation_log, strip_bracket_engine_flags } from "@data";
  import { runtime, simulation_state } from "@engine";
  import { Audio, get_cadence_rate, get_resolution, get_signature_color, render_optics_fallback, resolve_voice_uri } from "@media";
  import { Accordion, Button, Shimmer, StyleBadge, TextField, tooltip } from "@primitives";
  import { EntityCard, ProfilePicture, image_picker, open_picker } from "@ui";
  import { get_percentage, parse_relational_vector, resolve_speaking_style, safe_html } from "@utils";
  import ContextMenu from "./ContextMenu.svelte";
  import { claim_menu } from "./ContextMenu.svelte.js";
  import { app } from "./interface.svelte.js";
  import { parse_message } from "./Storymode.svelte";
  import Typewriter from "./Typewriter.svelte";

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

  /** Voice-flag role for this message (npc speech is covered by the ai flag). */
  let speak_role = $derived(is_user ? "user" : is_fractal ? "fractal" : "ai");
  /** Effective audibility: master switch AND per-role flag. Reactive - menu labels and the Read button follow toggles. */
  let voice_audible = $derived(Audio.is_role_enabled(speak_role));
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
  // Director seed split: Turn 1 `directors_note` is passed as Turn 2 `startWith`
  // (`<think>${note}\n(`), so the AI Thoughts block opens with the exact
  // director text. Highlight that prefix cyan-blue to separate director staging
  // from model-generated cognition.
  let director_seed_raw = $derived((meta?.director_staging?.directors_note || meta?.director_staging?.director_note || "").trim());
  let raw_think_plain = $derived.by(() => {
    try {
      const from_text = parse_think_block(active_text || "")?.think || "";
      if (from_text && from_text.trim()) return from_text;
    } catch {
      /* fall through to meta.think */
    }
    return meta?.think || "";
  });
  let director_seed_active = $derived.by(() => {
    if (!director_seed_raw) return "";
    const plain = String(raw_think_plain || "").trimStart();
    if (plain.startsWith(director_seed_raw)) return director_seed_raw;
    return "";
  });
  let think_remainder_raw = $derived.by(() => {
    if (!director_seed_active) return "";
    const plain = String(raw_think_plain || "").trimStart();
    return plain.slice(director_seed_active.length).replace(/^\n+/, "");
  });
  let director_think_html = $derived.by(() => {
    if (!director_seed_active) return null;
    try {
      return parse_message(`<think>${director_seed_active}</think>`, speaking_style)?.think || null;
    } catch {
      return null;
    }
  });
  let remainder_think_html = $derived.by(() => {
    if (!director_seed_active) return null;
    const rem = String(think_remainder_raw || "").trim();
    if (!rem) return null;
    try {
      return parse_message(`<think>${rem}</think>`, speaking_style)?.think || null;
    } catch {
      return null;
    }
  });
  let show_director_split = $derived(!!(director_seed_active && director_think_html));
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
    if (!Audio.is_role_enabled(speak_role)) {
      app.log(`${entity_display_name || "This voice"} is muted - enable it from the message menu to hear it read aloud.`, "warn");
      return;
    }
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
        label: Audio.is_role_enabled("ai") ? "Disable AI Voice" : "Enable AI Voice",
        active: Audio.is_role_enabled("ai"),
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
    if (!mode && image_picker.regenerating_key === regenerate_key && image_picker.last_mode) {
      mode = image_picker.last_mode;
    }
    if (!mode) {
      mode = is_fractal ? "landscape" : "character";
    }
    return get_resolution(mode);
  }

  /**
   * Builds the preview payload for an attachment, wiring the regenerate handler
   * when the attachment carries an image-generation prompt.
   * @param {any} attachment
   * @param {string|number} preview_id
   * @param {number} attach_idx
   * @param {string} preview_signature
   * @returns {any}
   */
  function build_preview_options(attachment, preview_id, attach_idx, preview_signature) {
    const preview_options = typeof attachment === "string" ? { src: attachment, metadata: {} } : { ...attachment };
    if (!preview_options.metadata) preview_options.metadata = {};
    preview_options.signature_color = preview_signature;
    if (preview_id) {
      preview_options.on_delete = () => {
        simulation_log.delete_attachment(String(preview_id), attach_idx);
      };
    }
    if (preview_id && app.regenerate_image_handler) {
      preview_options.on_regenerate = () => {
        app.regenerate_image_handler({
          prompt: preview_options.metadata?.prompt || "A cinematic scene portrait",
          negative_prompt: preview_options.metadata?.negative_prompt,
          mode: preview_options.metadata?.mode || (is_fractal ? "landscape" : "character"),
          log_id: preview_id,
          attach_idx,
          signature_color: preview_signature,
          regenerate_count: preview_options.metadata?.regenerate_count || 0,
        });
      };
    }
    return preview_options;
  }

  // Telemetry processing helpers
  let consolidated_vectors = $derived(
    Array.isArray(meta?.vectors) ? meta.vectors : Array.isArray(meta?.past) ? meta.past : Array.isArray(meta?.memories) ? meta.memories : [],
  );

  let entity_blocks = $derived(meta ? process_entity_blocks(meta) : []);

  let telemetry_card_label = $derived(meta ? get_telemetry_label(meta, runtime) : "");

  // Director turn (A2): signed per-turn deltas + post-clamp absolute levels.
  const DIRECTOR_AXES = ["chaos", "intensity", "openness", "affinity", "velocity", "entropy"];
  let director_deltas = $derived(meta?.deltas && typeof meta.deltas === "object" ? meta.deltas : null);
  let director_levels = $derived(meta?.levels && typeof meta.levels === "object" ? meta.levels : null);
  let director_rows = $derived.by(() => {
    if (!director_deltas) return [];
    return DIRECTOR_AXES.filter((axis) => director_deltas[axis] !== undefined).map((axis) => {
      const delta = Number(director_deltas[axis]) || 0;
      const level = director_levels?.[axis] !== undefined ? Number(director_levels[axis]) : null;
      const fill = level != null && Number.isFinite(level) ? get_percentage(level) : Math.min(100, Math.abs(delta) * 10);
      return { axis, delta, level, fill };
    });
  });

  const get_entity_name = (key) => {
    return resolve_entity_name(key, runtime);
  };

  const render_telemetry_text = (txt) => {
    if (!txt) return "";
    return parse_message(strip_bracket_engine_flags(clean_text_debris(txt))).displayText;
  };

  /**
   * Parses a quadrant bracket payload into per-item chip objects (B2, renderer-side).
   * Filters `| hide` internals so they never leak into the card. Weight is parsed
   * but visual emphasis is deferred per user call - chips render neutral for now.
   * @param {any} text_or_obj
   * @returns {Array<{key:string,value:string}>}
   */
  function extract_bracket_items(text_or_obj) {
    if (!text_or_obj) return [];
    const raw = typeof text_or_obj === "string" ? text_or_obj : `${text_or_obj.physical || ""} ${text_or_obj.non_physical || ""}`.trim();
    if (!raw) return [];
    const entries = parse_bracket_entries(raw);
    if (entries.length > 0) {
      return entries
        .filter((e) => {
          const vis = e.visibility || (e.flags?.hide ? "hide" : null);
          if (vis === "hide" || e.flags?.hide || e.hide) return false;
          return true;
        })
        .map((e) => ({ key: String(e.key || "").toUpperCase(), value: String(e.value ?? "").trim() }))
        .filter((it) => it.key || it.value);
    }
    return [{ key: "", value: raw }];
  }
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
        px-standard
        font-mono
        tracking-widest
        uppercase
        opacity-100
        transition-all
        duration-300
        ease-out
      "
    >
      <div class="flex items-center gap-tight overflow-hidden">
        <span class="text-xs font-bold whitespace-nowrap text-white">
          {entity_display_name}
        </span>
        <span class="text-[10px] font-normal text-white/60">
          {time_label}
        </span>
      </div>

      <!-- HEADER ACTIONS -->
      <div class="flex items-center gap-tight opacity-100 transition-opacity duration-200">
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
              disabled={!clean_markdown || !voice_audible}
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
    <div class="mb-standard">
      <Accordion label="Thoughts">
        {#if show_director_split}
          <div
            class="terminal-box max-h-75 overflow-y-auto p-standard text-sm leading-relaxed text-pretty text-[#f2f7fa] [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono! [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard"
          >
            <div class="mb-tight border-l-2 border-cyan-400 bg-cyan-400/10 px-tight py-1 text-cyan-200">
              <div class="think-block-container" style="display: contents" use:safe_html={director_think_html}></div>
            </div>
            {#if remainder_think_html}
              <div class="think-block-container" style="display: contents" use:safe_html={remainder_think_html}></div>
            {/if}
          </div>
        {:else}
          <div
            class="terminal-box max-h-75 overflow-y-auto p-standard text-sm leading-relaxed text-pretty text-[#f2f7fa] [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono! [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard"
          >
            <div class="think-block-container" style="display: contents" use:safe_html={think_block}></div>
          </div>
        {/if}
      </Accordion>
    </div>
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

        [&_p]:mb-standard
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
  <div class="my-tight flex h-character-card-height w-full items-stretch gap-tight md:gap-standard" data-msg-trio>
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
        <div class="flex h-full w-full flex-col gap-tight md:gap-standard">
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
          <div class="flex w-full shrink-0 justify-center gap-tight md:gap-standard" data-msg-style-badge>
            <StyleBadge entity={f} layout="prologue" class="flex w-full justify-center gap-tight md:gap-standard" />
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
    <h2
      class="mb-standard text-center text-[clamp(1.3rem,2.8vw,2.2rem)] font-normal text-balance"
      style="font-family: Satisfy, cursive;"
      data-msg-title
    >
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

{#snippet attachments_gallery()}
  {#if attachments.length > 0}
    <div class="flex justify-center {has_display_text || (should_use_typewriter && (has_display_text || busy)) ? 'mt-standard' : ''}">
      {#each attachments as attachment, attach_idx (typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url)}
        {@const src = typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url}
        {@const regenerate_key = `${id}:${attach_idx}`}
        {@const res = get_attachment_resolution(attachment, regenerate_key)}
        {@const box_h = 480}
        {@const box_w = Math.round((box_h * res.width) / res.height)}
        {@const container_style = `height: ${box_h}px; width: ${box_w}px; max-width: 100%; max-height: 60vh; aspect-ratio: ${res.width} / ${res.height};`}
        {@const preview_options = build_preview_options(attachment, id, attach_idx, signature_color)}
        {@const is_failed = typeof attachment === "object" && attachment !== null && Boolean(attachment?.metadata?.failed)}
        {#if image_picker.hasError(regenerate_key)}
          <div class="flex flex-col items-center justify-center gap-tight rounded-xl bg-red-900/20 p-standard" style={container_style}>
            <p class="text-center text-sm text-red-400">{image_picker.error}</p>
          </div>
        {:else if image_picker.isReady(regenerate_key)}
          <Button
            variant="bare"
            class="group relative flex cursor-pointer flex-col items-center justify-center gap-standard overflow-hidden rounded-xl border border-(--signature-color,slate-600)/30 bg-neutral-900/50 shadow-md transition-all duration-300 hover:border-(--signature-color,slate-300)/80 hover:bg-neutral-800/80 hover:shadow-[0_0_24px_color-mix(in_srgb,var(--signature-color,white)_25%,transparent)]"
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
            <div class="flex items-center gap-tight transition-transform duration-200 group-hover:scale-105">
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
        {:else if image_picker.isRegenerating(regenerate_key)}
          <div
            class="relative flex flex-col items-center justify-center gap-standard overflow-hidden rounded-xl border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
            style={container_style}
          >
            <Shimmer color="var(--signature-color,var(--color-electric-cyan))" />
          </div>
        {:else if is_failed}
          <div
            class="relative flex flex-col items-center justify-center gap-tight overflow-hidden rounded-xl border border-red-900/50 bg-red-950/25 p-standard"
            style={container_style}
          >
            <svg
              viewBox="0 0 24 24"
              class="h-8 w-8 fill-none stroke-2 text-red-400/80 [stroke-linecap:round] [stroke-linejoin:round]"
              aria-hidden="true"
            >
              <path d="M12 3 L21 21 H3 Z" />
              <line x1="12" y1="9" x2="12" y2="14" />
              <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
            </svg>
            <p class="text-center text-xs font-medium text-red-300">Image generation failed</p>
            <p class="text-center text-[10px] text-red-400/70">The image service timed out. Retry or remove.</p>
            <div class="flex items-center gap-tight">
              {#if preview_options.on_regenerate}
                <Button
                  variant="bare"
                  onclick={preview_options.on_regenerate}
                  class="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-1 text-[11px] font-medium text-red-200 transition-colors hover:border-red-300/70 hover:text-white"
                >
                  Retry
                </Button>
              {/if}
              {#if id}
                <Button
                  variant="bare"
                  onclick={() => simulation_log.delete_attachment(String(id), attach_idx)}
                  class="rounded-md border border-red-400/30 px-3 py-1 text-[11px] font-medium text-red-200/70 transition-colors hover:border-red-300/60 hover:text-white"
                >
                  Remove
                </Button>
              {/if}
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
              rounded-xl
              border
              border-(--signature-color,slate-600)/30
              bg-neutral-900/50
              transition-[filter]
              duration-200
              hover:brightness-110
            "
            onclick={() => app.open_image_preview(preview_options)}
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
                rounded-xl
                object-contain
              "
            />
          </Button>
        {:else}
          <div
            class="relative flex flex-col items-center justify-center gap-standard overflow-hidden rounded-xl border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
            style={container_style}
          >
            <Shimmer color="var(--signature-color,var(--color-electric-cyan))" />
          </div>
        {/if}
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet temporal_quadrant(label, items, isMuted = false)}
  {@const list = Array.isArray(items) ? items : [items]}
  {@const chip_items = list
    .filter(Boolean)
    .map((it) => {
      if (typeof it === "string") return { key: "", value: it };
      if (it.key !== undefined || it.value !== undefined) return { key: it.key || "", value: it.value ?? "" };
      return { key: "", value: it.content || it.directive || "" };
    })
    .filter((it) => clean_text_debris(it.value))}
  {#if chip_items.length > 0}
    <div
      class="flex gap-standard rounded border-l-2 px-3 py-tight font-mono text-xs leading-relaxed {isMuted
        ? 'border-l-slate-500 bg-black/20'
        : 'border-l-(--color-dev-accent) bg-black/40'}"
    >
      <span class="w-28 shrink-0 uppercase {isMuted ? 'text-slate-400' : 'text-(--color-dev-accent)'}">{label}</span>
      <div class="flex flex-1 flex-wrap gap-tight {isMuted ? 'text-slate-300' : 'text-slate-200'}">
        {#each chip_items as item, i (i)}
          {#if item.key}
            <span class="inline-flex max-w-full items-baseline gap-tight rounded border border-white/10 bg-white/5 px-2.5 py-1">
              <span class="shrink-0 text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">{item.key}</span>
              <span class="min-w-0 text-slate-100" use:safe_html={render_telemetry_text(item.value)}></span>
            </span>
          {:else}
            <div class="w-full">
              <span use:safe_html={render_telemetry_text(item.value)}></span>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet telemetry_content()}
  <div
    class="
      group
      relative
      flex w-full
      min-w-0
      flex-col
      overflow-hidden
      rounded
      border
      border-transparent
      bg-[color-mix(in_srgb,var(--signature-color)_5%,rgba(15,15,15,0.7))]
      shadow-[0_8px_32px_rgba(0,0,0,0.5)]
      [backdrop-filter:var(--blur-mist)]
      before:pointer-events-none
      before:absolute
      before:inset-0
      before:rounded-[inherit]
      before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)]
      before:mask-border-solid
      before:p-px
      before:opacity-30
      before:content-['']!
    "
    style="--signature-color: var(--color-dev-accent);"
  >
    {#if telemetry_card_label}
      <!-- display:flex inline: unlayered normalize.css v3 resets header to block, defeating Tailwind's layered flex utility -->
      <header
        style="display: flex;"
        class="flex min-h-10 items-center gap-tight border-b border-white/10 px-standard py-tight font-mono text-xs leading-none font-bold tracking-[0.18em] text-(--color-dev-accent) uppercase"
      >
        <span class="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_6px_var(--color-dev-accent)]"></span>
        <span class="min-w-0 translate-y-[1px] truncate">{telemetry_card_label}</span>
        <span class="ml-auto shrink-0 translate-y-[1px] text-[10px] font-normal tracking-widest text-white/40">{time_label}</span>
      </header>
    {/if}
    <div class="p-standard">
      <div class="flex flex-col gap-standard">
        {#if meta.type === "STORY_START"}
          <p class="font-mono text-xs text-slate-300">The simulation engine has anchored a new narrative sequence.</p>
        {:else}
          <!-- 1. IMAGE TRIGGER INDICATOR -->
          {#if meta.trigger_image === true || meta.image_trigger === true}
            <div class="flex flex-wrap items-center gap-tight rounded border border-(--color-dev-accent)/20 bg-black/40 px-3 py-tight text-xs">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_6px_var(--color-dev-accent)]"></span>
              <span class="font-mono font-bold tracking-widest text-(--color-dev-accent) uppercase">Trigger Image</span>
              {#if meta.image_tier}
                <span
                  class="rounded bg-(--color-dev-accent)/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase"
                >
                  {meta.image_tier}
                </span>
              {/if}
              {#if meta.image_source}
                <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase">({meta.image_source})</span>
              {/if}
              {#if meta.image_signals?.band_entry}
                <span class="font-mono text-[10px] text-slate-400">
                  · Band: {meta.image_signals.band_entry.axis}
                  {meta.image_signals.band_entry.from} → {meta.image_signals.band_entry.to} ({meta.image_signals.band_entry.band})
                </span>
              {/if}
              {#if (meta.image_signals?.displacement || 0) > 0 && (meta.image_signals?.displacement || 0) >= (meta.image_signals?.displacement_threshold || 50)}
                <span class="font-mono text-[10px] text-slate-400">
                  · Displacement: {meta.image_signals.displacement}/{meta.image_signals.displacement_threshold}
                </span>
              {/if}
            </div>
          {/if}

          <!-- 2. DIRECTOR TURN: AXIS GAUGES (A2 levels + signed deltas) -->
          {#if director_rows.length > 0}
            <div class="grid grid-cols-2 gap-standard">
              {#each director_rows as row (row.axis)}
                <div class="flex items-center justify-between gap-standard">
                  <span class="min-w-20 text-xs text-slate-400 lowercase">{row.axis}</span>
                  <div class="flex flex-1 items-center gap-standard">
                    <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div class="absolute h-full" style="left: 0%; width: {row.fill}%; background: var(--color-dev-accent);"></div>
                    </div>
                    <div class="flex min-w-16 items-center justify-end gap-tight font-mono text-xs">
                      <span class="text-slate-50">{row.level != null ? get_percentage(row.level) : `${row.delta > 0 ? "+" : ""}${row.delta}`}</span>
                      {#if row.level != null}
                        <span class={row.delta > 0 ? "text-(--color-dev-accent)" : row.delta < 0 ? "text-slate-500" : "text-slate-500"}>
                          ({row.delta > 0 ? "+" : ""}{row.delta})
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Director `directors_note` intentionally omitted here: it is the Turn 2 `startWith` prefix, so it already opens the AI Thoughts block (highlighted cyan-blue there). The director's own reasoning (`thoughts`) is shown below instead. -->
          {#if meta.thoughts}
            <div
              class="flex gap-standard rounded border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-tight font-mono text-xs leading-relaxed"
            >
              <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">Thoughts</span>
              <span class="flex-1 text-slate-200">{meta.thoughts}</span>
            </div>
          {/if}
          {#if meta.camera_note}
            <div
              class="flex gap-standard rounded border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-tight font-mono text-xs leading-relaxed"
            >
              <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">Camera</span>
              <span class="flex-1 text-slate-200">{meta.camera_note}</span>
            </div>
          {/if}

          <!-- 3. LEGACY UPDATES BRANCH (fallback for old stored rows) -->
          {#if entity_blocks.length > 0}
            <div class="flex flex-col gap-standard">
              {#each entity_blocks as block (block.key)}
                <div class="flex flex-col gap-tight">
                  <header class="text-xs font-bold tracking-widest text-(--color-dev-accent) uppercase">
                    {block.name || get_entity_name(block.key)}
                  </header>

                  <!-- DYNAMICS BAR GAUGES -->
                  {#if block.dynamics.length > 0}
                    <div class="grid grid-cols-2 gap-standard">
                      {#each block.dynamics as delta (delta.axis)}
                        {@const fill_width = delta.has_delta
                          ? Math.min(get_percentage(delta.old_value), get_percentage(delta.new_value))
                          : get_percentage(delta.value)}
                        {@const delta_width = delta.has_delta ? Math.abs(get_percentage(delta.new_value) - get_percentage(delta.old_value)) : 0}
                        <div class="flex items-center justify-between gap-standard">
                          <span class="min-w-20 text-xs text-slate-400 lowercase">{delta.axis}</span>
                          <div class="flex flex-1 items-center gap-standard">
                            <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                              <div
                                class="absolute h-full transition-all duration-300"
                                style="left: 0%; width: {fill_width}%; background: var(--color-dev-accent);"
                              ></div>
                              {#if delta.has_delta}
                                <div
                                  class="absolute z-10 h-full opacity-40 transition-all duration-300"
                                  style="left: {fill_width}%; width: {delta_width}%; background: var(--color-dev-accent);"
                                ></div>
                              {/if}
                            </div>
                            <div class="flex flex-col items-end gap-0.5">
                              <div class="flex min-w-16 items-center justify-end gap-tight font-mono text-xs">
                                <span class="text-slate-50">{delta.has_delta ? get_percentage(delta.new_value) : get_percentage(delta.value)}</span>
                                {#if delta.has_delta}
                                  <span class={delta.diff > 0 ? "text-(--color-dev-accent)" : "text-slate-500"}>
                                    ({delta.diff > 0 ? "+" : ""}{delta.diff})
                                  </span>
                                {/if}
                              </div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}

                  <!-- TEMPORAL ROWS -->
                  {#if block.physical || block.non_physical || block.eternal_physical || block.eternal_non_physical || block.new_vectors.length > 0 || block.retrieval?.length > 0}
                    <div class="flex flex-col gap-tight pb-tight">
                      {@render temporal_quadrant(
                        "ETERNAL",
                        extract_bracket_items(`${block.eternal_physical || ""} ${block.eternal_non_physical || ""}`),
                      )}
                      {@render temporal_quadrant("PRESENT", extract_bracket_items(`${block.physical || ""} ${block.non_physical || ""}`))}

                      {#if block.new_vectors.length > 0}
                        {@render temporal_quadrant(
                          "PAST",
                          block.new_vectors.map((nv) => nv.content),
                        )}
                      {/if}

                      {#if block.retrieval?.length > 0}
                        {@render temporal_quadrant(
                          "PAST (RETRIEVAL)",
                          block.retrieval.map((rv) => rv.content),
                          true,
                        )}
                      {/if}
                    </div>
                  {/if}

                  <!-- RELATIONAL MUTATIONS -->
                  {#if block.relationships?.length > 0}
                    <div class="flex flex-col gap-tight pb-tight">
                      <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">
                        RELATIONAL MUTATIONS
                      </header>
                      <div class="flex flex-col gap-tight">
                        {#each block.relationships as rel, i (i)}
                          <div class="flex items-center gap-tight font-mono text-xs text-slate-300">
                            <span class="text-(--color-dev-accent)">{rel.source} → {rel.target}:</span>
                            <span class="text-slate-100">{rel.dynamic}</span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <!-- 4. CARETAKER TURN: CONTINUUM -->
          {#if meta.type === "CONTINUUM_FORMATION" || meta.type === "MEMORY_FORMATION"}
            <p class="font-mono text-[11px] leading-relaxed text-slate-400">
              Updated brackets merged into {get_entity_name(meta.target) || String(meta.target || "target entity")}’s profile fields.
            </p>
            <div class="flex flex-col gap-tight pb-tight">
              {@render temporal_quadrant("ETERNAL", extract_bracket_items(meta.eternal))}
              {@render temporal_quadrant("PRESENT", extract_bracket_items(meta.present))}
              {@render temporal_quadrant("FUTURE", extract_bracket_items(meta.future))}

              {#if consolidated_vectors.length > 0}
                {@render temporal_quadrant(
                  "PAST",
                  consolidated_vectors.map((v) => v.content || v.directive),
                )}
              {/if}
            </div>
          {/if}

          <!-- 5. VECTOR RESOLUTION -->
          {#if meta.type === "VECTOR_RESOLUTION"}
            <div class="flex flex-col gap-tight pb-tight">
              {#if meta.vector}
                {@render temporal_quadrant(vector_label(meta.vector.type, "past"), [meta.vector.content], true)}
              {/if}
              {#if meta.resolution}
                <div class="flex gap-standard rounded border-l-2 border-l-slate-500 bg-black/20 px-3 py-tight font-mono text-xs leading-relaxed">
                  <span class="w-28 shrink-0 text-slate-400 uppercase">RESOLUTION</span>
                  <span class="flex-1 text-slate-300" use:safe_html={render_telemetry_text(meta.resolution)}></span>
                </div>
              {/if}
            </div>
          {/if}

          <!-- 6. RAW DATA ACCORDION -->
          <Accordion label="View Raw Data">
            <div class="terminal-box max-h-60 overflow-y-auto bg-black/10 p-standard text-sm">
              <pre class="m-0 font-[inherit] text-xs whitespace-pre-wrap">{JSON.stringify(meta, null, 2)}</pre>
            </div>
          </Accordion>
        {/if}
      </div>
    </div>
  </div>
{/snippet}

<!-- ========================================================================= -->
<!-- CHASSIS RENDERING                                                         -->
<!-- ========================================================================= -->

{#if is_telemetry}
  {#if app.settings.dev_mode}
    <div class="relative flex w-full justify-center p-standard transition-all duration-200">
      <div class="w-[calc(var(--spacing-column-unit)*6)]">
        {@render telemetry_content()}
      </div>
    </div>
  {/if}
{:else if sender === "system" && !app.settings.dev_mode}
  <!-- System / Director messages are purely internal background data and never render in normal mode -->
{:else if is_image_only}
  <div class="relative flex w-full items-center justify-center p-standard">
    <div class="w-[calc(var(--spacing-column-unit)*5)] max-w-full">
      {@render attachments_gallery()}
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
      p-standard
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
      <div class="relative p-standard">
        {#if meta?.is_prologue}
          <div data-msg-prologue>
            {@render cursive_title()}
            {@render entity_trio()}
          </div>
        {:else if meta?.is_epilogue}
          <div class="flex flex-col items-center gap-standard text-center" data-msg-epilogue>
            {@render cursive_title()}
            {@render entity_trio()}
          </div>
        {/if}

        {@render body_content()}

        {@render attachments_gallery()}
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
