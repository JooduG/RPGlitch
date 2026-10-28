/**
 * src/intelligence/modules/task.js
 * 🎯 TASK MODULE — Turn Execution, Action Directives, Somatics & Staging
 * Compiles the Layer 6 (<TASK>) turn execution block and instruction envelopes.
 */

import { escape_xml, prompt_escape, inline_or_block, render_atom_xml, render_xml_tag } from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { resolve_style_dna } from "./style.js";
import { resolve_output_plan, render_output_plan, render_json_return } from "./output.js";
import { resolve_macro_directive, resolve_optics_atom } from "./protocols.js";
import { get_reflex_atom, render_environmental_hint, render_prose_reflex, resolve_turn_state_plan } from "./reflex.js";
import { resolve_optics_subject } from "./entities.js";

// ============================================================================
// [SECTION 1: UNIFIED TASK DIRECTIVES & PROTOCOLS CATALOG]
// ============================================================================

export const TASK_LIBRARY = Object.freeze({
  // ── 1.1 Turn Foundations & Cognition Protocols ─────────────────────────────
  PROTOCOLS: Object.freeze({
    THINK_GROUNDING_DEFAULT: Object.freeze({
      tag: "GROUNDING",
      body: "Hold your established temperament.",
    }),

    THINK_CHARACTER: Object.freeze({
      tag: "THINK_FORMAT",
      body: `Open your output with one internal <THINK> block (under 200 words). {grounding} Reason in order:
1. Stance — the speaker's unsaid want and internal feeling.
2. Friction — what resists that want in this beat.
3. Mask — how their psychology leaks or conceals the feeling.
4. Smallest observable action — the single physical tell or movement that carries the beat. Never pre-draft dialogue.
Close </THINK> before the narrative. Never emit visible prose inside think tags.`,
    }),

    THINK_NARRATOR: Object.freeze({
      tag: "THINK_FORMAT",
      body: `Open your output with one internal <THINK> block (under 200 words). Reason in order:
1. Tableau — freeze every body in space; fix positions before psychology.
2. Vector — the single mechanical or environmental change this beat delivers.
3. Sensorium — {grounding} Commit to one dominant sensory channel.
Close </THINK> before the narrative. Never emit visible prose inside think tags.`,
    }),

    THINK_ENHANCEMENT: Object.freeze({
      tag: "THINK_FORMAT",
      body: `Open your output with one internal <THINK> block (under 200 words). Reason in order:
1. Canon check — verify the new trait against established identity.
2. Contrast — differentiate from the rest of the cast on this axis.
3. Compression — cut everything that does not sharpen the field; subtract, never pad.
Close </THINK> before emitting the final content.`,
    }),

    THINK_OPTICS: Object.freeze({
      tag: "THINK_FORMAT",
      body: `Calibrate "_thought_process" first (under 200 words). Reason in order:
1. Focal subject — identity traits, stripped of proper names.
2. Spatial layers — foreground, focal subject, background.
3. Light and palette — sources, color, and textures from the active style.
4. Wardrobe mechanics — exposure checks before composing.
Close "_thought_process" before composing the image payload. This calibration is internal reasoning and is never part of the payload.`,
    }),
  }),

  // ── 1.2 Keyword Directives (Director & Sensory Optics) ─────────────────────
  KEYWORD_DIRECTIVES: Object.freeze({
    DIRECTOR: Object.freeze({
      tag: "KEYWORD_DIRECTIVES",
      body: `- Function: Select 1-5 keywords from the list below to steer the next speaker's physical tells and scene tone.
- Neutral state: Emit "[]" if no keywords apply.
- Whitelist rule: Select strictly from the list below. Never alter or invent keywords.`,
    }),
    OPTICS: Object.freeze({
      tag: "KEYWORD_DIRECTIVES",
      body: "Integrate 2-4 appropriate keywords from below.",
    }),
  }),

  // ── 1.3 Shot 2A: Prose Turn Directives (character / scene / ghostwrite) ─────
  PROSE: Object.freeze({
    CHARACTER: Object.freeze({
      BASE: Object.freeze({
        tag: "DIRECTIVE",
        body: "Advance the scene authentically from your own perspective; end on a natural beat.",
      }),
      GHOSTWRITE: Object.freeze({
        tag: "DIRECTIVE",
        body: "Draft an assistive turn suggestion for {speaker_name} to review, edit, or send. Embody {speaker_name}'s voice, perspective, and physical agency without speaking for other participants.",
      }),
    }),

    SCENE: Object.freeze({
      PROLOGUE: Object.freeze({
        tag: "DIRECTIVE",
        body: `Open the scene. Use thinking to establish: What does this Fractal demand? What brought «AI_CHARACTER» and «USER_PERSONA» here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place «USER_PERSONA» inside, connecting them via their profile thread.
3. Place «AI_CHARACTER» inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
Strictly zero spoken dialogue or quote marks. No dialogue.
    Input: {scene_input}`,
      }),
      EPILOGUE: Object.freeze({
        tag: "DIRECTIVE",
        body: `Close the scene. Evaluate unresolved threads and active agendas in thinking. Depict environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. Strictly zero spoken dialogue or quote marks. No dialogue.`,
      }),
      COLLAPSE: Object.freeze({
        tag: "DIRECTIVE",
        body: `Close the scene on irrevocable tragedy. Weigh permanent loss in thinking. Depict aftermath and environmental scars without forcing player physical surrender or unearned closure. End on enduring sensory silence. Strictly zero spoken dialogue or quote marks. No dialogue.`,
      }),
      CONTINUATION: Object.freeze({
        tag: "DIRECTIVE",
        body: `Narrate through ambient physics, sensory textures, and environmental shifts in reaction to recent events. Never puppeteer «AI_CHARACTER» or «USER_PERSONA». End on one dominant hook (decisive statement, single action, or deliberate silence). Zero bracket labels.`,
      }),
    }),
  }),

  // ── 1.5 Shot 2B: Continuum Caretaker Consolidation Directives (continuum) ──
  CONTINUUM: Object.freeze({
    MANDATE: Object.freeze({
      tag: "DIRECTIVE",
      body: `TARGET FOCUS: Consolidate temporal state for {target_name}. Analyze «RECENT_ROUNDS».
EXECUTION MANDATE:
1. Memory Formation: Extract 1-3 anchored memories in past tense. Empty list if nothing noteworthy transpired.
2. Delta-Only Principle: For all temporal quadrants below, emit ONLY net changes or deltas. If a layer, condition, or agenda has not changed in «RECENT_ROUNDS», leave it empty ("") or omit it. DO NOT regurgitate unchanged established facts.
3. Strict Bracket Syntax: Emit ONLY [KEY: value] brackets inside string fields. Unbracketed prose is forbidden. Atomic clearing: [KEY: none] or [KEY: cleared].
4. Eternal Biometric Lock: Eternal biometrics (gender, age, ethnicity, build, face, eyes, hair) are permanent. Never re-submit or paraphrase baseline biometrics unless an irreversible transformation occurred.
5. Dynamic State: Update physical and non-physical state per its schema directive:
{taxonomy_lines}
6. Future Trajectory: Consolidate only the active delta for standing agenda in future tense bracket syntax [KEY: value].
7. Relational Graph: Update directed relational brackets ([@TARGET: dynamic | flags]) across non-physical layers — eternal.non_physical carries baseline bonds, present.non_physical carries situational dynamics.`,
    }),
  }),

  // ── 1.6 Tool B: Profile Structuring & Ingestion Directives (sorting) ───────
  SORTING: Object.freeze({
    FOCUS: Object.freeze({
      tag: "DIRECTIVE",
      body: `FOCUS: Extracting data for {entity_label}. Discard text belonging to the other entity half.
{macro_directive}
{taxonomy_lines}`,
    }),
    REDISTRIBUTE: Object.freeze({
      tag: "DIRECTIVE",
      body: `REDISTRIBUTE: The source profile may have content in the wrong field. Relocate each fact to its correct field per the taxonomy lines above — anything outside a field's stated domain is misplaced. For physical and temporal layers, structure traits into [KEY: value] bracket directives. Never move content into or out of 'description' (internal notes). Preserve factual truth; update only field locations and phrasing. Strip XML tags, markdown bolding, or headers from values — output clean bracket directives and prose.`,
    }),
    INGESTION: Object.freeze({
      tag: "DIRECTIVE",
      body: `SOURCE OF TRUTH & INGESTION RULES:
- Source text is absolute truth. Map details faithfully into schema fields.
- For physical and temporal layers, structure traits into canonical [KEY: value] bracket directives.
- For absent details (attire, motivations): synthesize lore-consistent defaults.
- Never emit null, undefined, or empty strings.`,
    }),
  }),
});

// ============================================================================
// [SECTION 2: DYNAMIC DIRECTIVE COMPILER]
// ============================================================================
//
// Protocols.js pattern applied to Layer 6: one hierarchical, dotted-key catalog
// (TASK_LIBRARY) plus one generic compiler that resolves an ordered directive
// selection into paragraphs. Selection stays pure data; conditional text is a
// distinct key chosen by the selection function, so atoms never branch.

/**
 * Resolves one dotted directive key against `TASK_LIBRARY` (`REFLEX.*` keys delegate to reflex.js `get_reflex_atom`) and interpolates its
 * `{placeholder}` tokens from the shared values bag. Missing keys resolve to "".
 *
 * @param {string} directive_key
 * @param {Record<string, any>} [values={}]
 * @returns {string}
 */
export function get_directive_atom(directive_key, values = {}) {
  return render_atom_xml(TASK_LIBRARY, directive_key, values, { body_only: true });
}

/**
 * Generic directive compiler — resolves an ordered dotted-key selection into directive
 * paragraphs (the Layer 6 analogue of protocols.js
 * `compile_protocol_tags`). Each entry is either a dotted key (one paragraph) or a
 * `{ group: [keys], separator? }` shape (one paragraph joining its atoms, spaces by
 * default). Blanks are dropped; order is the selection's order.
 *
 * `REFLEX.*` leaf keys delegate to reflex.js `get_reflex_atom` (both as bare entries
 * and inside `{ group }` members); every other key resolves against `TASK_LIBRARY`.
 * @param {Array<string|{ group: string[], separator?: string }>} directive_selection
 * @param {Record<string, any>} [values={}]
 * @returns {string[]} Ordered, non-empty directive paragraphs.
 */
/**
 * Resolves one selection entry: `REFLEX.*` keys delegate to the reflex catalog,
 * everything else compiles against `TASK_LIBRARY`.
 * @param {string|null|undefined} directive_key
 * @param {Record<string, any>} [values={}]
 * @returns {string}
 */
function resolve_directive_entry(directive_key, values = {}) {
  const text = String(directive_key ?? "").trim();
  if (text.startsWith("<")) return text;
  const directive_head = text.split(".")[0];
  if (directive_head === "REFLEX") return get_reflex_atom(directive_key, values);
  if (directive_head === "OPTICS") return resolve_optics_atom(directive_key, values);
  return get_directive_atom(directive_key, values);
}

export function compile_directive_tags(directive_selection, values = {}) {
  const directive_entries = Array.isArray(directive_selection) ? directive_selection : [];
  return directive_entries
    .map((entry) =>
      typeof entry === "string" || entry == null
        ? resolve_directive_entry(entry, values).trim()
        : (entry.group || [])
            .map((directive_key) => resolve_directive_entry(directive_key, values).trim())
            .filter(Boolean)
            .join(entry.separator ?? " ")
            .trim(),
    )
    .filter(Boolean);
}

// ============================================================================
// [SECTION 3: TASK SIGNALS & CURRENTS]
// ============================================================================
// Pacing, environmental hints, delivery posture, and stability copy live in
// reflex.js — this section keeps the turn-signal and currents compilers.

/**
 * Renders the <CURRENTS> block (sensory experience + subtext).
 * @param {any} style_dna - resolved NarrativeStyle DNA
 * @param {string} subtext_xml - pre-rendered <SUBTEXT> block
 * @returns {string}
 */
export function render_task_currents(style_dna, subtext_xml) {
  const children = [
    style_dna?.sensory ? `<SENSORY_EXPERIENCE>${prompt_escape(style_dna.sensory)}</SENSORY_EXPERIENCE>` : null,
    String(subtext_xml || "").trim() ? subtext_xml : null,
  ].filter(Boolean);

  return children.length
    ? render_xml_tag({
        tag: "CURRENTS",
        children,
        indent: 0,
        child_indent: 4,
        separator: "\n",
      })
    : "";
}

export const TASK_INPUT_TYPES = Object.freeze({
  ACTION: "action",
  REPLY: "reply",
  INTENT: "intent",
  CONTENT: "content",
  INGESTION: "ingestion",
});

/**
 * Renders a turn-signal block — the ONE signal channel every mode uses. Every signal, from
 * any origin, is an `<INPUT>`; the `origin` attribute names the sender by its real entity id
 * (never a role token, so the attribute always matches the `<ENTITIES>` sheets). For standard
 * user action signals, the type attribute is omitted for clean minimal output. Special payload
 * kinds ("reply" | "content" | "intent" | "ingestion") carry `type="kind"`. `round` is the turn index
 * when known. Blank attributes are omitted.
 *
 * @param {{ input?: string, input_origin?: string|null, input_round?: number|string|null, input_type?: string|null, input_channel?: string|null }} [parameters]
 * @returns {string}
 */
export function render_task_input({ input = "", input_origin = null, input_round = null, input_type = null, input_channel = null } = {}) {
  if (!String(input || "").trim()) return "";
  const attributes = [];
  if (input_round != null && String(input_round) !== "") attributes.push(`round="${escape_xml(String(input_round))}"`);
  if (input_origin) attributes.push(`origin="${escape_xml(String(input_origin))}"`);
  const effective_type = input_type || (input_channel && input_channel !== "action" ? input_channel : null);
  if (effective_type && effective_type !== "action") attributes.push(`type="${escape_xml(String(effective_type))}"`);
  const attribute_string = attributes.length ? ` ${attributes.join(" ")}` : "";
  const content = prompt_escape(String(input).trim());
  return `<ENTRY${attribute_string}>${inline_or_block(content, 2)}</ENTRY>`;
}

/**
 * Renders a semantic turn block for Shot 1 Director signals.
 *
 * @param {{ tag?: string, input?: string, origin?: string|null, round?: number|string|null }} parameters
 * @returns {string}
 */
export function render_task_turn({ _tag = "ENTRY", input = "", origin = null, round = null } = {}) {
  return render_task_input({ input, input_origin: origin, input_round: round });
}

// Track 0.10: moved verbatim from reflex.js Section 6 - the Director keyword
// listing lives beside KEYWORD_DIRECTIVES and render_keyword_directives_xml.

/**
 * Builds <AVAILABLE_KEYWORDS> listing for the Director as a unified, flat bracketed list of tags.
 * @param {string[]} [active_style_keywords=[]]
 * @param {readonly string[]} [available_keywords=[]]
 * @returns {string}
 */
export function render_available_keywords_xml(active_style_keywords = [], available_keywords = []) {
  const motifs = (active_style_keywords || []).filter((k) => typeof k === "string" && k.trim()).map((k) => k.trim().toUpperCase());
  const combined = Array.from(new Set([...available_keywords, ...motifs]));
  return combined.map((k) => `[${k}]`).join(" ");
}

/**
 * Renders the canonical <KEYWORD_DIRECTIVES> XML block for Director or Optics.
 * Takes raw keywords XML or a raw keyword string; the mode selects the directive.
 * @param {string} [content=""] - Raw <AVAILABLE_KEYWORDS> XML or escaped keyword string
 * @param {string} [mode="DIRECTOR"] - "DIRECTOR" | "OPTICS"
 * @returns {string} Formatted <KEYWORD_DIRECTIVES> block
 */
export function render_keyword_directives_xml(content = "", mode = "DIRECTOR") {
  const directive_atom = mode === "OPTICS" ? TASK_LIBRARY.KEYWORD_DIRECTIVES.OPTICS : TASK_LIBRARY.KEYWORD_DIRECTIVES.DIRECTOR;
  const directive = typeof directive_atom === "string" ? directive_atom : (directive_atom?.body ?? "");

  const inner_content = String(content || "").trim();
  const available_tag = inner_content.startsWith("<AVAILABLE_KEYWORDS>")
    ? inner_content
    : `<AVAILABLE_KEYWORDS>${inner_content}</AVAILABLE_KEYWORDS>`;

  return render_xml_tag({
    tag: "KEYWORD_DIRECTIVES",
    children: [directive, available_tag],
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * Resolves character prose action directive across standard, NPC, ghostwrite, and stranger encounter turns.
 * Every prose turn carries the single merged role-boundary directive (ghostwrite is a standard
 * interaction turn with the USER as speaker; speaker naming lives in the role line); the
 * first-contact case layers its turn-state extra on top.
 * @param {Object} [parameters]
 * @param {string} [parameters.speaker_name=""]
 * @param {boolean} [parameters.is_first_contact=false]
 * @returns {string}
 */
export function resolve_character_action_directive({ speaker_name = "", is_first_contact = false, is_ghostwrite = false } = {}) {
  const situation = resolve_turn_state_plan({ is_first_contact });
  const base_directive = is_ghostwrite ? "PROSE.CHARACTER.GHOSTWRITE" : "PROSE.CHARACTER.BASE";
  return compile_directive_tags([base_directive, ...(situation.first_contact ? ["REFLEX.TURN_STATE.FIRST_CONTACT"] : [])], {
    speaker_name,
  }).join("\n\n");
}

/**
 * Resolves scene / fractal narrative action directive (Prologue, Epilogue, Collapse, Continuation).
 * @param {Object} [parameters]
 * @param {string|null} [parameters.scene_template=null]
 * @param {boolean} [parameters.is_prologue=false]
 * @param {string|null} [parameters.conclusion_status=null]
 * @param {string} [parameters.input=""]
 * @returns {string}
 */
export function resolve_scene_action_directive({ scene_template = null, is_prologue = false, conclusion_status = null, input = "" } = {}) {
  const selection =
    is_prologue || scene_template === "PROLOGUE"
      ? ["PROSE.SCENE.PROLOGUE"]
      : [
          String(
            scene_template ||
              (String(conclusion_status || "").toUpperCase() === "COLLAPSED" ? "COLLAPSE" : conclusion_status ? "EPILOGUE" : "CONTINUATION"),
          ),
        ].map((scene_key) => `PROSE.SCENE.${scene_key}`);

  return compile_directive_tags(selection, {
    scene_input: prompt_escape(String(input || "").trim() || "The scene begins."),
  }).join("\n\n");
}

// ============================================================================
// [SECTION 4: UNIVERSAL TASK ENVELOPE COMPILER]
// ============================================================================
//
// One ordered layer table (`TASK_LAYERS`) is walked by a single `render_task`.
// Each mode supplies *state* through `TASK_MODE_PLANS` (slot → named resolver);
// the table owns ordering, the `<DIRECTIVES>` envelope, and indentation. Adding a
// mode is a plan entry; adding a directive is a manifest edit — never a switch branch.

/**
 * Canonical ordered `<TASK>` layer table — the single grammar every mode walks.
 * Each emitter reads one slot from the compiled state; null/blank slots are dropped.
 * @type {ReadonlyArray<{ key: string, emit: (state: Record<string, any>) => (string|null|undefined) }>}
 */
export const TASK_LAYERS = Object.freeze([
  { key: "think_format", emit: (state) => state.think_format },
  { key: "input", emit: (state) => state.input },
  { key: "currents", emit: (state) => state.currents },
  { key: "target", emit: (state) => state.target },
  { key: "spatial_framing", emit: (state) => state.spatial_framing },
  { key: "directives", emit: (state) => render_directives_xml(state.directives) },
  { key: "delivery_posture", emit: (state) => state.delivery_posture },
  { key: "stability_lock", emit: (state) => state.stability_lock },
  { key: "output_format", emit: (state) => state.output_format },
]);

/**
 * Wraps a mode's instruction prose in the single canonical `<DIRECTIVES>` element.
 * Every mode routes its directive text through this one element — no more bare
 * floating prose at mode-specific positions.
 *
 * @param {Array<string|null|undefined>|string} [directives=[]]
 * @returns {string}
 */
export function render_directives_xml(directives = []) {
  const blocks = (Array.isArray(directives) ? directives : [directives]).map((block) => String(block ?? "").trim()).filter(Boolean);
  if (!blocks.length) return "";
  return render_xml_tag({ tag: "DIRECTIVES", children: blocks, child_indent: 2, separator: "\n\n" });
}

/**
 * Wraps a cognition directive in the canonical `<THINK_FORMAT>` element.
 * @param {string} [directive=""]
 * @returns {string}
 */
export function render_think_format(directive = "") {
  const text = String(directive || "").trim();
  return text ? render_xml_tag({ tag: "THINK_FORMAT", children: [text], child_indent: 2 }) : "";
}

export function resolve_optics_target_slot(values) {
  return values.target_tier ? render_xml_tag({ tag: "TARGET", children: [escape_xml(values.target_tier)], inline: true }) : "";
}

export function resolve_optics_spatial_framing_slot(values) {
  const selection = typeof values.config?.spatial_framing === "function" ? values.config.spatial_framing(values) : [];
  const children = compile_directive_tags(selection, values);
  const cinematography = values.cinematography;
  if (cinematography && typeof cinematography === "object") {
    const { mode = "Medium Action", tokens = "", narrative_context = "", visual_staging = "" } = cinematography;
    children.push(
      render_xml_tag({
        tag: "CINEMATOGRAPHY",
        attrs: { mode },
        children: [tokens, narrative_context, visual_staging],
        child_indent: 2,
        separator: "\n",
      }),
    );
  }
  const engine_tokens = values.engine_tokens;
  if (engine_tokens?.camera) {
    children.push(render_xml_tag({ tag: "CAMERA", children: [escape_xml(engine_tokens.camera)], inline: true }));
  } else if (engine_tokens?.composition) {
    children.push(render_xml_tag({ tag: "COMPOSITION", children: [escape_xml(engine_tokens.composition)], inline: true }));
  }
  return render_xml_tag({ tag: "SPATIAL_FRAMING", children, child_indent: 2, separator: "\n" });
}

// ============================================================================

/**
 * Named slot resolvers — the enumerated set of genuinely dynamic Layer-6 computations.
 * Everything else is compiled from the manifest's declarative directive selection.
 * @type {Readonly<Record<string, (values: Record<string, any>) => string|string[]>>}
 */
export const TASK_SLOT_RESOLVERS = Object.freeze({
  director_signals: (values) => {
    const entities = values.entities || {};
    const user_origin = entities?.USER?.id || entities?.USER?.name || "USER";
    const ai_origin = entities?.AI?.id || entities?.AI?.name || "AI_CHARACTER";
    const current_round = values.round ?? null;
    const previous_round = values.last_ai_round ?? (current_round != null ? Math.max(0, Number(current_round) - 1) : null);
    return [
      values.last_ai_text ? render_task_input({ input: values.last_ai_text, input_origin: ai_origin, input_round: previous_round }) : "",
      render_task_input({ input: values.input, input_origin: user_origin, input_round: current_round }),
    ]
      .filter(Boolean)
      .join("\n");
  },

  action_signal: (values) => render_task_input({ input: values.input, input_origin: values.input_origin, input_round: values.round }),
  content_signal: (values) => render_task_input({ input: values.input, input_type: "content" }),
  ingestion_signal: (values) => render_task_input({ input: values.input, input_type: "ingestion" }),
  intent_signal: (values) => render_task_input({ input: values.input_intent, input_type: "intent" }),

  think: (values) => {
    const think_format = values.config?.think_format;
    const grounding_atom = values.style_dna.grounding || TASK_LIBRARY.PROTOCOLS.THINK_GROUNDING_DEFAULT;
    const grounding = typeof grounding_atom === "string" ? grounding_atom : (grounding_atom?.body ?? "");
    if (think_format === "character") return render_think_format(get_directive_atom("PROTOCOLS.THINK_CHARACTER", { grounding }));
    if (think_format === "narrator") return render_think_format(get_directive_atom("PROTOCOLS.THINK_NARRATOR", { grounding }));
    if (think_format === "enhancement") return render_think_format(get_directive_atom("PROTOCOLS.THINK_ENHANCEMENT"));
    if (think_format === "optics") return render_think_format(get_directive_atom("PROTOCOLS.THINK_OPTICS"));
    return "";
  },

  prose_currents: (values) => render_task_currents(values.style_dna, values.subtext_xml),

  optics_target: (values) => resolve_optics_target_slot(values),

  optics_spatial_framing: (values) => resolve_optics_spatial_framing_slot(values),
  manifest_directives: (values) => {
    const selection = typeof values.config?.directives === "function" ? values.config.directives(values) : values.config?.directives || [];
    return [...compile_directive_tags(selection, values), ...(values.directives || []), values.keyword_directives]
      .map((block) => String(block ?? "").trim())
      .filter(Boolean);
  },
  external_directives: (values) => (values.directives || []).map((block) => String(block ?? "").trim()).filter(Boolean),
  action_directive: (values) => {
    const directive = String(values.action_directive || "").trim();
    return directive ? [directive] : [];
  },

  prose_posture: (values) =>
    render_prose_reflex(values.snapshot, values.input, {
      has_input: values.has_input,
      stagnation_turns: values.stagnation_turns ?? values.meta?.stagnation_turns ?? 0,
    }),
  stability_lock: (values) => String(values.stability_lock || "").trim(),

  output_format: (values) => {
    if (values.output_format) {
      return render_output_plan({ kind: "external", body: values.output_format }, { mode: values.output_mode || "prose" });
    }
    if (values.schema) {
      return render_output_plan({ kind: "json", body: render_json_return(values.schema) }, { mode: "json" });
    }
    const effective_mode = values.mode && TASK_MODE_PLANS[values.mode] ? values.mode : "prose";
    if (effective_mode === "prose") {
      return render_output_plan(resolve_output_plan({ format_spec: { mode: "prose" }, has_think: Boolean(values.config?.think_format) }), {
        mode: "prose",
      });
    }
    return "";
  },
});

/**
 * Mode → slot → resolver plan. The single dispatch surface (mirrors the manifest's
 * `layers.task` slot list); adding a mode is one entry, never a builder branch.
 * @type {Readonly<Record<string, Readonly<Record<string, string>>>>}
 */
export const TASK_MODE_PLANS = Object.freeze({
  director: Object.freeze({ input: "director_signals", directives: "manifest_directives", output_format: "output_format" }),
  continuum: Object.freeze({ directives: "manifest_directives", output_format: "output_format" }),
  enhancement: Object.freeze({
    think_format: "think",
    input: "content_signal",
    directives: "external_directives",
    output_format: "output_format",
  }),
  sorting: Object.freeze({ input: "ingestion_signal", directives: "manifest_directives", output_format: "output_format" }),
  optics: Object.freeze({
    think_format: "think",
    input: "intent_signal",
    target: "optics_target",
    spatial_framing: "optics_spatial_framing",
    directives: "manifest_directives",
    output_format: "output_format",
  }),
  prose: Object.freeze({
    think_format: "think",
    input: "action_signal",
    currents: "prose_currents",
    directives: "action_directive",
    delivery_posture: "prose_posture",
    stability_lock: "stability_lock",
    output_format: "output_format",
  }),
});

/**
 * Normalizes raw turn parameters into the shared values bag consumed by every slot
 * resolver and by the manifest's directive-selection functions. Derived values
 * (environmental flag, macro rule, scene input, subject description, keywords) live
 * here so selection atoms stay pure.
 *
 * @param {Record<string, any>} parameters
 * @param {Record<string, any>|null} config
 * @returns {Record<string, any>}
 */
/**
 * Taxonomy layer order walked by the continuum mandate and the sorting focus block.
 */
const TAXONOMY_LAYER_PATHS = Object.freeze([
  "eternal.physical",
  "eternal.non_physical",
  "present.physical",
  "present.non_physical",
  "past",
  "future",
]);

const taxonomy_lines_cache = new Map();

/**
 * Procedural taxonomy walker (Track 0.8/0.9) — emits one instruction line per taxonomy layer
 * from PROFILE_FIELD_CATALOG metadata for the type-selected entity model, so consolidation
 * and sorting directives never restate per-key documentation the JSON schemas already provide.
 * @param {string} [entity_type="character"]
 * @returns {string}
 */
export function resolve_taxonomy_lines(entity_type = "character") {
  const normalized = entity_type === "fractal" ? "fractal" : "character";
  const cached = taxonomy_lines_cache.get(normalized);
  if (cached) return cached;
  const lines = TAXONOMY_LAYER_PATHS.map((path) => {
    const entry = PROFILE_FIELD_CATALOG[`${normalized}.${path}`] || {};
    return `- ${path} (${entry.label || path}): ${entry.directive || ""}`.trim();
  }).join("\n");
  taxonomy_lines_cache.set(normalized, lines);
  return lines;
}

/**
 * Resolves the sorting focus scope label for an entity type.
 * @param {string} [entity_type="character"]
 * @returns {string}
 */
export function resolve_entity_label(entity_type = "character") {
  return entity_type === "fractal" ? "a FRACTAL" : "an individual CHARACTER";
}

function resolve_task_values(parameters, config) {
  const values = { ...parameters, config };
  values.mode = config?.task_state || parameters.task_state || "prose";
  values.has_input = Boolean(String(parameters.input ?? "").trim());
  values.has_environmental_hint = Boolean(render_environmental_hint(parameters.input));
  values.macro_directive = parameters.entity_type ? resolve_macro_directive(parameters.entity_type) : "";
  if (values.mode === "continuum") values.taxonomy_lines = resolve_taxonomy_lines(values.target_type);
  if (values.mode === "sorting") {
    values.entity_label = resolve_entity_label(values.entity_type);
    values.taxonomy_lines = resolve_taxonomy_lines(values.entity_type);
  }
  values.turn_state = resolve_turn_state_plan({
    has_input: values.has_input,
    round: parameters.round ?? 1,
    is_first_contact: parameters.is_first_contact ?? false,
  });
  values.style_dna = values.snapshot?.style_dna ?? resolve_style_dna(values.style ?? values.snapshot?.style ?? null);
  if (values.snapshot) values.snapshot = { ...values.snapshot, style_dna: values.style_dna };

  if (parameters.is_prologue || parameters.scene_template === "PROLOGUE") {
    values.scene_input = prompt_escape(String(parameters.input || "").trim() || "The scene begins.");
  }

  values.subject_description = resolve_optics_subject(parameters.target_tier || "", parameters.subject);
  values.subject_name = prompt_escape(String(parameters.main_entity_name || ""));

  if (parameters.keyword_directives != null) {
    values.keyword_directives = parameters.keyword_directives;
  } else if (values.mode === "optics" && Array.isArray(parameters.keywords) && parameters.keywords.length > 0) {
    values.keyword_directives = render_keyword_directives_xml(parameters.keywords.join(", "), "OPTICS");
  } else {
    values.keyword_directives = null;
  }

  return values;
}

/**
 * Resolves turn parameters into the keyed task slot map consumed by the
 * universal prompt plan. Mode fallback, manifest layer filtering, and slot
 * resolution happen here; child ordering stays in resolve_task_plan.
 * @param {Record<string, any>} [parameters={}]
 * @returns {Readonly<{ mode: string, slots: Readonly<Record<string, any>> }>}
 */
export function resolve_task_slots(parameters = {}) {
  const config = parameters.config || null;
  const mode_key = config?.task_state || parameters.task_state;
  const mode = mode_key && TASK_MODE_PLANS[mode_key] ? mode_key : "prose";
  const plan = TASK_MODE_PLANS[mode];
  const values = resolve_task_values(parameters, config);
  const allowed_layers = Array.isArray(parameters.layers) ? parameters.layers : null;

  const slots = {};
  for (const [slot_key, resolver_key] of Object.entries(plan)) {
    if (allowed_layers && !allowed_layers.includes(slot_key)) continue;
    slots[slot_key] = TASK_SLOT_RESOLVERS[resolver_key](values);
  }
  return Object.freeze({ mode, slots: Object.freeze(slots) });
}

export function resolve_task_plan(parameters = {}) {
  const allowed_layers = Array.isArray(parameters.layers) ? parameters.layers : null;
  const resolved = resolve_task_slots(parameters);
  const children = TASK_LAYERS.filter((layer) => !allowed_layers || allowed_layers.includes(layer.key))
    .map((layer) => layer.emit(resolved.slots))
    .filter(Boolean);
  return { tag: "TASK", mode: resolved.mode, slots: resolved.slots, children };
}

export function render_task_plan(plan) {
  if (!plan?.children?.length) return "";
  return render_xml_tag({ tag: "TASK", children: [...plan.children], indent: 0, child_indent: 2, separator: "\n" });
}

/**
 * Universal Task Envelope Compiler (<TASK>).
 * Resolves the mode's slot plan, walks `TASK_LAYERS`, and emits the canonical
 * `<TASK>` envelope. Modes without a registered plan fall back to story prose.
 *
 * @param {Object} [parameters={}]
 * @param {string} [parameters.task_state] - "director" | "continuum" | "enhancement" | "sorting" | "optics" | "prose" (default)
 * @param {string[]} [parameters.layers] - Declared task-layer order (from the manifest); omitted = all layers.
 * @returns {string}
 */
export function render_task(parameters = {}) {
  const allowed_layers = Array.isArray(parameters.layers) ? parameters.layers : null;
  const resolved = resolve_task_slots(parameters);
  const children = TASK_LAYERS.filter((layer) => !allowed_layers || allowed_layers.includes(layer.key))
    .map((layer) => layer.emit(resolved.slots))
    .filter(Boolean);
  if (!children.length) return "";
  return render_xml_tag({ tag: "TASK", children, indent: 0, child_indent: 2, separator: "\n" });
}
