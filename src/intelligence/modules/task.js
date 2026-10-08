/**
 * src/intelligence/modules/task.js
 * ============================================================================
 * 🎯 TASK MODULE — Turn Execution, Action Directives, Somatics & Staging
 * ============================================================================
 *
 * Compiles the Layer 6 (<TASK>) turn execution block and instruction envelopes
 * across the RPGlitch simulation lifecycle. Symmetrically aligns with the prompt
 * manifest architecture in `src/intelligence/prompts.js`:
 *
 * ── Multi-Shot Simulation Lifecycle Mapping ─────────────────────────────────
 * • Section 1: Unified Task Directives & Protocols Catalog (TASK_LIBRARY)
 *              (Protocols, Director, Continuum, Prose, Sorting directives; optics lives in sensory.js)
 * • Section 2: Dynamic Directive Compiler (get_directive_atom / compile_directive_tags)
 *              (Dotted-key resolution + {placeholder} interpolation → ordered paragraphs)
 * • Section 3: Task Signals & Currents
 *              (Turn-signal envelopes and currents; pacing/reflex live in reflex.js)
 * • Section 4: Universal Task Envelope Compiler (TASK_LAYERS / TASK_MODE_PLANS / render_task)
 *              (One slot-resolver registry + one ordered layer table; modes are data)
 * • Section 5: Subtext, Available Keywords & Protocol Resolvers
 *              (Somatic signals, keyword listings, physics-protocol resolution)
 *
 * Architecture & Design Laws (protocols.js pattern, applied to Layer 6):
 * - Pure-data catalog: `TASK_LIBRARY` holds only strings or `{placeholder}` template
 *   strings — no functions, no per-mode branching. Conditional text is expressed as
 *   distinct keys chosen by a selection function (mirroring `resolve_pov_protocol`).
 * - One generic compiler: `compile_directive_tags` walks any dotted key through the
 *   catalog and emits directive paragraphs (the Layer-6 twin of `compile_protocol_tags`).
 * - Selection is data: each mode's `<DIRECTIVES>` key list lives in the manifest
 *   (`prompts.js` `directives`), compiled here; the slot vocabulary is `TASK_MODE_PLANS`.
 * - Enumerated special cases: the genuinely dynamic slots (inputs, think, currents,
 *   delivery posture, spatial framing, output format) are named slot resolvers, exactly
 *   like protocols.js leaves `PERSPECTIVE`/style resolution explicit.
 * - Layer 6 Sovereignty: single source of truth for turn-level prompt compilation.
 * - Zero Sibling Imports: layout primitives imported exclusively from @utils.
 * - Strict Full-Name Domain Nomenclature: zero clipped tokens or single-letter identifiers.
 * - Zero Backwards Compatibility (P4): pure, uncompromising modern architecture.
 * ============================================================================
 */

import { escape_xml, prompt_escape, inline_or_block, render_xml_tag, resolve_catalog_atom } from "@utils";
import { resolve_style_dna } from "./style.js";
import { resolve_output_plan, render_output_plan, render_json_return } from "./output.js";
import { resolve_macro_directive } from "./protocols.js";
import { get_reflex_atom, render_environmental_hint, render_prose_reflex, resolve_turn_state_plan } from "./reflex.js";
import {
  get_sensory_atom,
  resolve_optics_subject,
  resolve_optics_think_slot,
  resolve_optics_target_slot,
  resolve_optics_spatial_framing_slot,
} from "./sensory.js";

// ============================================================================
// [SECTION 1: UNIFIED TASK DIRECTIVES & PROTOCOLS CATALOG]
// ============================================================================

export const TASK_LIBRARY = Object.freeze({
  // ── 1.1 Turn Foundations & Cognition Protocols ─────────────────────────────
  PROTOCOLS: Object.freeze({
    THINK_GROUNDING_DEFAULT: "Hold your established temperament.",

    THINK_CHARACTER: `Open your output with one internal <THINK> block (under 200 words). Reason across 4 sequential beats:
<BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the «INPUT» element.</BEAT>
<BEAT id="EMOTIONAL_CALIBRATION" step="2">{grounding}</BEAT>
<BEAT id="STRATEGIC_DRIVE" step="3">How active «AGENDA» and/or «TRAJECTORY» navigates immediate friction.</BEAT>
<BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.`,

    THINK_NARRATOR:
      "Open your output with one internal <THINK> block. All internal calculations, scene shifts, and headers must remain inside it, in the conversation language. Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.",

    THINK_ENHANCEMENT:
      "Open your output with one internal <THINK> block. Analyze entity identity, coherence with existing traits, and plan the bracket directives or refined phrasing. Close </THINK> before emitting the final content.",
  }),

  // ── 1.2 Keyword Directives (Director & Sensory Optics) ─────────────────────
  KEYWORD_DIRECTIVES: Object.freeze({
    DIRECTOR: `- Function: Select 1-5 keywords from the list below to steer the next speaker's physical tells and scene tone.
- Neutral state: Emit "[]" if no keywords apply.
- Whitelist rule: Select strictly from the list below. Never alter or invent keywords.`,
    OPTICS: "Integrate 2-4 appropriate keywords from below.",
  }),

  // ── 1.3 Shot 1: Directorial Staging & Evaluation Rules (director) ───────────
  DIRECTOR: Object.freeze({
    DYNAMICS_CALIBRATION: `DYNAMICS CALIBRATION:
1. Calibrate dynamics_deltas conservatively (±1 to ±4 standard; ±8 to ±12 extreme).
2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100.
3. Calibrate dynamics_deltas to reflect the psychological and environmental shift of the turn.`,
    USER_PERSONA_LOCK:
      '"USER_PERSONA", "USER", "PLAYER", or the player character\'s name is NEVER a valid next_action — the Director never speaks for the player. The window for the player to act opens automatically right after the AI beat, so you never need a "yield to player" action: if you believe the player should act next, output "AI_CHARACTER" (the default). Valid actions are strictly: "AI_CHARACTER", "FRACTAL", "npc:<id>", { "genesis": ... }, "EPILOGUE_COLLAPSED", or "EPILOGUE_CONCLUDED". Furthermore, "directors_note" MUST ONLY direct the next_action speaker (AI, Fractal, or NPC) — NEVER direct, script, or suggest actions or thoughts for «USER_PERSONA» (the player has absolute agency).',

    ROUTING: `NEXT ACTION ROUTING RULES:
- "AI_CHARACTER": (Default) AI companion reacts to protagonist. Choose this whenever the player might act next — the player's turn opens immediately after this beat.
- "FRACTAL": Environmental action (exploring atmosphere, architecture, weather, objects without dialogue) or breaking long AI speech streaks.
- "npc:<id>": Present secondary character takes action.
- "GENESIS": Mint a new character only if no candidate below applies.
- "EPILOGUE_COLLAPSED": Fatal consequence, player death, irreversible collapse, or catastrophic defeat. Ends the scenario in tragedy.
- "EPILOGUE_CONCLUDED": Triumphant or peaceful narrative resolution. Concludes the active arc.`,

    CONVERGENCE: `CONVERGENCE & ENTITY REUSE:
Inspect candidate secondary characters below before minting. If an existing entity matches the role or location (medical, security, merchant), you MUST reuse that entity rather than creating a duplicate.`,
  }),

  // ── 1.4 Shot 2A: Prose Turn Directives (character / scene / ghostwrite) ─────
  PROSE: Object.freeze({
    CHARACTER: Object.freeze({
      BASE: "Stay in character: own only your own voice, actions, and perspective. Never speak, act, or decide for other participants.",
      NPC_BOUNDARY:
        "Respond strictly as {speaker_name} (supporting character). Own only your voice, actions, and perspective; never speak for others or resolve overarching quests. End on a natural beat.",
    }),

    GHOSTWRITE: Object.freeze({
      BASE: "Draft «USER_PERSONA»'s turn strictly from their own first-person perspective — their actions, dialogue, and intent. Never narrate other characters' reactions or resolve the scene for them.",
    }),

    SCENE: Object.freeze({
      PROLOGUE: `You see everything. Open the scene. Use thinking to establish: What does this Fractal demand? What brought «AI_CHARACTER» and «USER_PERSONA» here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place «USER_PERSONA» inside, connecting them via their profile thread.
3. Place «AI_CHARACTER» inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
Strictly zero spoken dialogue or quote marks. No dialogue.
    Input: {scene_input}`,
      EPILOGUE: `You see everything. Close the scene. Evaluate unresolved threads and active agendas in thinking. Depict environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. Strictly zero spoken dialogue or quote marks. No dialogue.`,
      COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Weigh permanent loss in thinking. Depict aftermath and environmental scars without forcing player physical surrender or unearned closure. End on enduring sensory silence. Strictly zero spoken dialogue or quote marks. No dialogue.`,
      CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate through ambient physics, sensory textures, and environmental shifts in reaction to recent events. Never puppeteer «AI_CHARACTER» or «USER_PERSONA». End on one dominant hook (decisive statement, single action, or deliberate silence). Zero bracket labels.`,
    }),
  }),

  // ── 1.5 Shot 2B: Continuum Caretaker Consolidation Directives (continuum) ──
  CONTINUUM: Object.freeze({
    TARGET_FOCUS: `TARGET FOCUS: Consolidate state and extract relational vectors for {target_name}.
Analyze recent turns in «HISTORY». Synthesize memories, update physical appearance, record active state of mind, and log directed relational bonds.`,
    MANDATE: `EXECUTION MANDATE:
1. Memory Formation: Extract 1-3 anchored memories in past tense. Empty list if nothing noteworthy transpired.
2. Dynamic State: Update physical and non_physical condition.
3. Future Trajectory: Consolidate active standing agenda in future tense.
4. Relational Graph: Update directed relational brackets in present.non_physical: '[@TARGET: dynamic description | flags]'.`,
  }),

  // ── 1.6 Tool B: Profile Structuring & Ingestion Directives (sorting) ───────
  SORTING: Object.freeze({
    FOCUS_CHARACTER: "FOCUS: Extracting data for an individual CHARACTER. Re-contextualize or discard environmental/setting text.",
    FOCUS_FRACTAL: "FOCUS: Extracting data for a FRACTAL (scene/setting/environment). Re-contextualize or discard character-specific traits.",
    MACRO: "{macro_directive}",
    REDISTRIBUTE: `REDISTRIBUTE: The source profile may have content in the wrong field. Relocate each fact to its correct field (e.g., temporary states belong under 'present.non_physical', transient moods under 'present.physical'). For physical and temporal layers, structure traits into [KEY: value] bracket directives. Never move content into or out of 'description' (internal notes). Preserve factual truth; update only field locations and phrasing. Strip XML tags, markdown bolding, or headers from values—output clean bracket directives and prose.`,
    INGESTION: `SOURCE OF TRUTH & INGESTION RULES:
- Source text is absolute truth. Map details faithfully into schema fields.
- For physical and temporal layers, structure traits into canonical [KEY: value] bracket directives.
- For absent details (attire, motivations): synthesize lore-consistent defaults.
- Never emit null, undefined, or empty strings.`,
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
  const resolved = resolve_catalog_atom(TASK_LIBRARY, directive_key, values);
  return typeof resolved === "string" ? resolved : (resolved?.body ?? "");
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
  const directive_head = String(directive_key ?? "")
    .trim()
    .split(".")[0];
  if (directive_head === "REFLEX") return get_reflex_atom(directive_key, values);
  if (directive_head === "OPTICS") return get_sensory_atom(directive_key, values);
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

/**
 * Renders a turn-signal block — the ONE signal channel every mode uses. Every signal, from
 * any origin, is an `<INPUT>`; the `origin` attribute names the sender by its real entity id
 * (never a role token, so the attribute always matches the `<ENTITIES>` sheets) and `channel`
 * names the payload kind ("action" | "reply" | "content" | "intent" | "ingestion"). `round`
 * is the turn index when known. Blank attributes are omitted.
 *
 * @param {{ input?: string, input_origin?: string|null, input_round?: number|string|null, input_channel?: string|null }} [parameters]
 * @returns {string}
 */
export function render_task_input({ input = "", input_origin = null, input_round = null, input_channel = null } = {}) {
  if (!String(input || "").trim()) return "";
  const attributes = [];
  if (input_origin) attributes.push(`origin="${escape_xml(String(input_origin))}"`);
  if (input_round != null && String(input_round) !== "") attributes.push(`round="${escape_xml(String(input_round))}"`);
  if (input_channel) attributes.push(`channel="${escape_xml(String(input_channel))}"`);
  const attribute_string = attributes.length ? ` ${attributes.join(" ")}` : "";
  const content = prompt_escape(String(input).trim());
  return `<INPUT${attribute_string}>${inline_or_block(content, 2)}</INPUT>`;
}

/**
 * Renders the canonical <KEYWORD_DIRECTIVES> XML block for Director or Optics.
 * Takes raw keywords XML or a raw keyword string; the mode selects the directive.
 * @param {string} [content=""] - Raw <AVAILABLE_KEYWORDS> XML or escaped keyword string
 * @param {string} [mode="DIRECTOR"] - "DIRECTOR" | "OPTICS"
 * @returns {string} Formatted <KEYWORD_DIRECTIVES> block
 */
export function render_keyword_directives_xml(content = "", mode = "DIRECTOR") {
  const directive = mode === "OPTICS" ? TASK_LIBRARY.KEYWORD_DIRECTIVES.OPTICS : TASK_LIBRARY.KEYWORD_DIRECTIVES.DIRECTOR;

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
 * Every prose turn carries a base role-boundary directive; the NPC and first-contact cases layer extras on top.
 * @param {Object} [parameters]
 * @param {string} [parameters.speaker_name=""]
 * @param {boolean} [parameters.is_npc=false]
 * @param {boolean} [parameters.is_ghostwrite=false]
 * @param {boolean} [parameters.is_first_contact=false]
 * @returns {string}
 */
export function resolve_character_action_directive({ speaker_name = "", is_npc = false, is_ghostwrite = false, is_first_contact = false } = {}) {
  const situation = resolve_turn_state_plan({ is_first_contact });
  return compile_directive_tags(
    [
      is_ghostwrite ? "PROSE.GHOSTWRITE.BASE" : "PROSE.CHARACTER.BASE",
      ...(situation.first_contact ? ["REFLEX.TURN_STATE.FIRST_CONTACT"] : []),
      ...(is_npc ? ["PROSE.CHARACTER.NPC_BOUNDARY"] : []),
    ],
    { speaker_name },
  ).join("\n\n");
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
    return [
      render_task_input({ input: values.input, input_origin: user_origin, input_round: values.round, input_channel: "action" }),
      values.last_ai_text ? render_task_input({ input: values.last_ai_text, input_origin: ai_origin, input_channel: "reply" }) : "",
    ]
      .filter(Boolean)
      .join("\n");
  },

  action_signal: (values) =>
    render_task_input({ input: values.input, input_origin: values.input_origin, input_round: values.round, input_channel: "action" }),
  content_signal: (values) => render_task_input({ input: values.input, input_channel: "content" }),
  ingestion_signal: (values) => render_task_input({ input: values.input, input_channel: "ingestion" }),
  intent_signal: (values) => render_task_input({ input: values.input_intent, input_channel: "intent" }),

  prose_think: (values) => {
    const think_format = values.config?.think_format;
    if (think_format === "character") {
      const grounding = values.style_dna.grounding || TASK_LIBRARY.PROTOCOLS.THINK_GROUNDING_DEFAULT;
      return render_think_format(get_directive_atom("PROTOCOLS.THINK_CHARACTER", { grounding }));
    }
    if (think_format === "narrator") return render_think_format(TASK_LIBRARY.PROTOCOLS.THINK_NARRATOR);
    if (think_format === "enhancement") return render_think_format(TASK_LIBRARY.PROTOCOLS.THINK_ENHANCEMENT);
    return "";
  },
  optics_think: (values) => resolve_optics_think_slot(values),

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

  prose_posture: (values) => render_prose_reflex(values.snapshot, values.input, { has_input: values.has_input }),
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
    think_format: "prose_think",
    input: "content_signal",
    directives: "external_directives",
    output_format: "output_format",
  }),
  sorting: Object.freeze({ input: "ingestion_signal", directives: "manifest_directives", output_format: "output_format" }),
  optics: Object.freeze({
    think_format: "optics_think",
    input: "intent_signal",
    target: "optics_target",
    spatial_framing: "optics_spatial_framing",
    directives: "manifest_directives",
    output_format: "output_format",
  }),
  prose: Object.freeze({
    think_format: "prose_think",
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
function resolve_task_values(parameters, config) {
  const values = { ...parameters, config };
  values.mode = config?.task_state || parameters.task_state || "prose";
  values.has_input = Boolean(String(parameters.input ?? "").trim());
  values.has_environmental_hint = Boolean(render_environmental_hint(parameters.input));
  values.macro_directive = parameters.entity_type ? resolve_macro_directive(parameters.entity_type) : "";
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
 * Resolves turn parameters into a frozen, render-ready task plan. Mode fallback
 * (`"prose"`), manifest layer filtering, slot resolution, and child ordering all
 * happen here — the renderer maps plan children to the envelope without branching.
 * @param {Record<string, any>} [parameters={}]
 * @returns {Readonly<{ tag: string, mode: string, children: ReadonlyArray<string> }>}
 */
export function resolve_task_plan(parameters = {}) {
  const config = parameters.config || null;
  const mode_key = config?.task_state || parameters.task_state;
  const mode = mode_key && TASK_MODE_PLANS[mode_key] ? mode_key : "prose";
  const plan = TASK_MODE_PLANS[mode];
  const values = resolve_task_values(parameters, config);
  const allowed_layers = Array.isArray(parameters.layers) ? parameters.layers : null;

  const state = {};
  for (const [slot_key, resolver_key] of Object.entries(plan)) {
    if (allowed_layers && !allowed_layers.includes(slot_key)) continue;
    state[slot_key] = TASK_SLOT_RESOLVERS[resolver_key](values);
  }
  const children = TASK_LAYERS.filter((layer) => !allowed_layers || allowed_layers.includes(layer.key))
    .map((layer) => layer.emit(state))
    .filter(Boolean);
  return Object.freeze({ tag: "TASK", mode, children: Object.freeze(children) });
}

/**
 * Maps a task plan to the canonical `<TASK>` envelope. Every selection is already
 * plan data — this function only wraps.
 * @param {ReturnType<typeof resolve_task_plan>|null|undefined} plan
 * @returns {string}
 */
export function render_task_plan(plan) {
  if (!plan) return "";
  return plan.children.length ? render_xml_tag({ tag: "TASK", children: [...plan.children], indent: 0, child_indent: 2, separator: "\n" }) : "";
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
  return render_task_plan(resolve_task_plan(parameters));
}

/**
 * CHANGELOG
 * - 2026-10-07: Plan Omega for Task — Section 5 repatriated to reflex.js (STYLE_MOTIF_REGISTRY import dropped); REFLEX.* delegation moved from get_directive_atom (now pure TASK_LIBRARY) into compile_directive_tags; CINEMATOGRAPHY_RULES descriptor table replaces preset if/else; render_keyword_directives_xml collapsed to (content, mode); plan/render split (resolve_task_plan/render_task_plan, build_task_state retired) — prompt bytes byte-identical.
 * - 2026-10-04: Single has_input resolution (Plan A) — resolve_task_values owns values.has_input + values.turn_state; prose_posture threads the bag flag into the posture plan — prompt bytes byte-identical.
 * - 2026-10-04: Style-DNA parsed once per turn — resolve_task_values owns values.style_dna (style.js resolve_style_dna, from values.style ?? snapshot.style); prose_think/prose_currents/prose_posture read it, @data extract_style_dna import dropped — prompt bytes byte-identical.
 * - 2026-10-04: REFLEX.* directive keys delegate to reflex.js get_reflex_atom (catalog ownership moves to reflex.js; TASK_LIBRARY branch retired).
 * - 2026-10-04: Dropped the dead speaking_style values passthrough and prose_posture override (VOICE removed in reflex.js).
 * - 2026-10-04: Retired DIRECTOR.EVALUATION_INPUT/EVALUATION_SCENE/ROUND_ONE and PROSE.CHARACTER.FIRST_CONTACT (moved to reflex.js TURN_STATE); resolve_character_action_directive reads the turn-state plan.
 * - 2026-10-04: Collapsed json_output/prose_output/external_output into one `output_format` slot resolver over output.js plans (pre-routed body → schema → prose-mode fallback); all six mode plans point at it; OUTPUT_FORMATS import dropped.
 * - 2026-10-04: Removed all catalog aliases (P4) — TASK_LIBRARY drops PACING/RECENCY/VOICE, DIRECTOR.ENVIRONMENTAL_HINT, and FORMATS; REFLEX.* keys resolve against REFLEX_LIBRARY, output resolvers read OUTPUT_FORMATS directly.
 * - 2026-10-04: Moved pacing/reflex engine plus stability/truncation recovery (ex-recovery.js, deleted) into reflex.js; TASK_LIBRARY keeps live references so directive keys and prompt bytes are unchanged.
 * - 2026-10-04: Moved output contracts to output.js (emission formats, schema atoms, JSON composer, format router, `<OUTPUT_FORMAT>` envelope); task.js keeps turn assembly with FORMATS wired to OUTPUT_FORMATS.
 * - 2026-10-04: Retired TASK_LIBRARY.SORTING.POV_THIRD (sorting now resolves CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD through pov_protocol) and TASK_LIBRARY.TEMPORAL (replaced by per-layer PERSPECTIVE.LAYER_TENSE atoms); PROSE.BASE stays - bespoke ghostwrite text, not a POV duplicate.
 * - 2026-10-04: Added TASK_LIBRARY.TEMPORAL.TENSE (new 1.9 section) - one canonical temporal-tense paragraph for single-field and schema modes; per-field tense clauses removed from the profile layer directives.
 * - 2026-10-04: Moved the five output emission strings plus the JSON-return template into TASK_LIBRARY.FORMATS (new 1.8 section); retired format_json_return in favor of get_directive_atom with FORMATS.JSON_RETURN - byte-identical output, schema still interpolated verbatim; profile.test.js now reads TASK_LIBRARY.FORMATS.PROSE. No contract size change.
 * - 2026-10-01: Consolidated Layer 7 (OUTPUT_FORMAT, format.js) directly into task.js. Eliminated cross-sibling module import and unified turn execution with output schema definitions.
 * - 2026-10-01: Added THINK_ENHANCEMENT cognition beat protocol, wired enhancement think_format into TASK_SLOT_RESOLVERS and TASK_MODE_PLANS, and updated SORTING directives for bracket-first physical and temporal layers.
 * - 2026-09-26: Prompt hardening — `DIRECTOR.USER_PERSONA_LOCK`/`ROUTING` now state that a player-yield action is never valid and the player's turn opens automatically (so the model stops emitting `USER_PERSONA`); `OPTICS.SUBJECT_RULES.SIGNATURE_COLORS` now forbids recoloring/lengthening declared hair, deriving hair/eye color from the environment or lighting, or conflating accessories (silver jewelry) with hair, and requires the exact declared values.
 * - 2026-09-25: Full protocols.js-level refactor (phases 0–3) — `TASK_LIBRARY` is now pure data (strings + `{placeholder}` templates; every closure gone, conditional text split into distinct keys); the generic `compile_directive_tags`/`get_directive_atom` compiler (with `{ group }` paragraphs) replaces per-mode hand assembly; each mode's `<DIRECTIVES>` selection is declared in the manifest (`prompts.js` `directives`); and the five builders collapse into one `build_task_state` over `TASK_MODE_PLANS` + `TASK_SLOT_RESOLVERS`. `TASK_STATE_BUILDERS` is retired in favour of `TASK_MODE_PLANS`. Director task output is byte-identical.
 * - 2026-09-25: Director directive compiler (protocols.js pattern) — the Director's hand-rolled `<DIRECTIVES>` array is replaced by the declarative `DIRECTOR_DIRECTIVES` selection resolved through the new generic `compile_directive_tags` (a Layer-6 twin of `compile_protocol_tags`); the `TASK_LIBRARY.DIRECTOR` atoms are now pure strings or `(values) => string` templates (`EVALUATION` folds in the old evaluate/round-one/persona-lock trio, `ENVIRONMENTAL_HINT` self-gates), so `build_director_task_state` no longer owns directive ordering. Director task output is byte-identical.
 * - 2026-09-24: Entity-id origins + dead-slot prune — the Director's two `<INPUT>` blocks now carry the real sender ids (`origin="<USER id>"` / `origin="<AI id>"`, falling back to a name then a role token only when no entity is supplied), matching every prose mode; `build_director_task_state` reads the `entities` bag and `build_continuum_task_state` drops its never-emitted `inputs` slot.
 * - 2026-09-23: Prompt-grammar harmonization (phases 0–3) — `render_task_input` emits `<INPUT>` for every signal with a `channel` attribute (was `mode`) and no `tag` override (the Director's last turn is a second `<INPUT origin="AI_CHARACTER" channel="reply">`); the `input`/`last_turn` slots collapse into one `inputs` layer; the Director's dynamics calibration and the optics subject rules/tier framing move into `<DIRECTIVES>`; the think/prose wording is reconciled ("open with one internal <THINK> block", "after closing </THINK>, emit strictly plain prose").
 * - 2026-09-23: Pipeline consolidation (R6/R7) — extracted `build_continuum_task_state` so the generic `build_structured_task_state` loses its `if (mode === "continuum")` branch (and no longer ignores its own `directives`); `render_task` dispatches on `task_state` instead of a `mode` string, and `build_prose_task_state` reads the flattened `config.think_format`. `TASK_STATE_BUILDERS` is exported for the contract gate. Output bytes unchanged.
 * - 2026-09-23: Envelope harmonization — `render_task_input` emits the singular `mode` discriminator (was `kind`) and now renders the Director's last turn too (`tag` option), so `<INPUT …>` and `<AI_CHARACTER_LAST_TURN …>` share one shape; `<KEYWORD_DIRECTIVES>` nests inside `<DIRECTIVES>` (the `keyword_directives` task layer is retired); `render_task` no longer has a separate keyword slot.
 * - 2026-09-22: Recommendations 1/3/4/5 — `render_task` child indent lowered from 4 to 2 and it now walks only the manifest's declared `layers`; `render_task_input` emits the single `<INPUT origin|round|kind>` channel for every mode; the Director's `SPEAKER ROUTING RULES` + `CONVERGENCE` prose moved into the TASK `<DIRECTIVES>` (`TASK_LIBRARY.DIRECTOR.ROUTING`/`CONVERGENCE`), and interaction/ghostwrite gain a base `PROSE.CHARACTER.BASE` directive.
 * - 2026-09-21: Table-driven TASK envelope — introduced `TASK_LAYERS` (the single ordered layer grammar) walked by one `render_task` over a `TASK_STATE_BUILDERS` dispatch table; all mode instruction prose now flows through the one `<DIRECTIVES>` element (optics' `<MANDATE>` retired), cognition directives go through `render_think_format`, keyword directives emit at indent 0, and `TASK_LIBRARY.SORTING.POV_THIRD` replaced the manifest-derived sorting POV.
 * - 2026-09-20: Metasyntax ban — reserved element names referenced inside directive prose now render as guillemets («INPUT», «AGENDA», «TRAJECTORY», «AI_CHARACTER», «USER_PERSONA», «INPUT_HISTORY») instead of raw tags, so the emitted prompt contains no reserved-tag literals.
 * - 2026-09-19: Decomposed the `render_task` god-function (P5) — extracted the per-mode compilers `render_director_task`, `render_structured_task`, `render_optics_task`, and `render_prose_task` behind a thin `mode` dispatcher; `TASK_LIBRARY` remains the sole directive-text source.
 * - 2026-09-19: One XML emitter (P1) — `render_subtext_xml` composes its `<SUBTEXT>` envelope through `render_xml_tag` and returns the full block (no wrap→strip round-trip; `render_task_currents` consumes `subtext_xml` directly); `<TARGET>`, `<INPUT_INTENT>`, `<CINEMATOGRAPHY>`, `<CAMERA>`, and `<COMPOSITION>` now emit through `render_xml_tag`.
 * - 2026-09-19: Removed the dead resolve_context_directives resolver (no production caller); first-contact is single-sourced as TASK_LIBRARY.PROSE.CHARACTER.FIRST_CONTACT and emitted via resolve_character_action_directive.
 * - 2026-09-19: Added TASK_LIBRARY.SORTING.FOCUS(entity_type) — the profile-sorting focus directive plus macro rule, absorbed from builder.js.
 * - 2026-09-19: Optics now emits its <OUTPUT_FORMAT> via TASK_LIBRARY.JSON_RETURN(schema); TASK_LIBRARY.JSON_RETURN aliases format_json_return directly and pruned the format_optics_json_return import.
 * - 2026-09-19: Integrated optics cinematography presets, staging directive helper, and group/scene narrative context builders into TASK_LIBRARY.OPTICS.CINEMATOGRAPHY, refactoring resolve_optics_cinematography to consume them.
 * - 2026-09-19: Imported and utilized PROSE_FORMAT from format.js, eliminating hardcoded string literal duplication (Mega Report D3).
 * - 2026-09-19: Parameterized FIRST_SENTENCE_MANDATE by tier in TASK_LIBRARY.OPTICS (F3): story_scene mandates establishing terrain, architecture, and atmospheric perspective first, while character tiers prioritize main entities.
 * - 2026-09-19: Architecture purification: Absorbed `resolve_optics_cinematography` from `entities/sheets.js`, consolidating all dynamic camera staging, scale tokens, and group mandates into Layer 6 (<TASK>).
 * - 2026-09-18: Consolidated Keyword Directives — added `render_keyword_directives_xml` supporting DIRECTOR and OPTICS modes.
 * - 2026-09-18: Added TASK_LIBRARY.OPTICS directives and dedicated case optics in render_task assembling TARGET, INPUT_INTENT, and nested OUTPUT_FORMAT per scrobbles.md blueprint.
 * - 2026-09-18: Standardized Layer 7 <OUTPUT_FORMAT> emission across director, continuum, sorting, enhancement, and story prose inside <TASK>; injected voice registers into <DELIVERY_POSTURE>.
 * - 2026-09-17: Director Action Clarification — Strengthened `TASK_LIBRARY.DIRECTOR.USER_PERSONA_LOCK` to explicitly disallow player character names and enumerate valid target enums.
 * - 2026-09-16: Standardized Director input tag and `TASK_LIBRARY.DIRECTOR.EVALUATE` to canonical `<INPUT />`, achieving 100% universal input tag consistency across all prompt modes.
 * - 2026-09-16: Pruned legacy `GHOSTWRITE` directives from `TASK_LIBRARY.PROSE` and simplified `resolve_character_action_directive` — ghostwriting operates as a first-class symmetrical Shot-2A first-person character turn governed by `CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST` and `<DELIVERY_POSTURE><DRIVE>`.
 * - 2026-09-16: Pruned redundant `DEFAULTS` wrapper from `TASK_LIBRARY.PROTOCOLS` and encapsulated `emotional_grounding` fallback directly within `THINK_FORMAT`.
 * - 2026-09-16: Reconstructed kinetic momentum and role boundaries — consolidated DRIVE_ACTIVE and DRIVE_PASSIVE into a single dynamic DRIVE(has_input) inside TASK_LIBRARY.PROTOCOLS.RECENCY (rendered exclusively via <DELIVERY_POSTURE><DRIVE>); pruned redundant INITIATIVE and ADVANCE from TASK_LIBRARY.PROSE.CHARACTER; refactored resolve_character_action_directive to strictly emit role/epistemic boundaries without duplicate prose momentum.
 * - 2026-09-16: Merged duplicate `JSON_RETURN` directives into a single canonical `TASK_LIBRARY.JSON_RETURN` key, eliminating arbitrary character limit discrepancies ("under 400" vs "under 1200") and pruning redundant domain-specific keys under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Task Simplification & XML Harmonization:
 *   (1) Cut dead duplicate `TASK_LIBRARY.SPOTLIGHT` (repatriated to `entities.js`);
 *   (2) Standardized `render_prose_reflex`, `render_task_currents`, and prose `<TASK>` with `render_xml_tag`;
 *   (3) Simplified `render_keyword_directives_xml` by encapsulating static `TASK_LIBRARY.DIRECTOR.KEYWORD_DIRECTIVES`;
 *   (4) Repatriated action directive resolution from `builder.js` into `resolve_character_action_directive` and `resolve_scene_action_directive`.
 * - 2026-09-16: Task Nomenclature Standardization — Purged legacy "instructions" mode alias and parameter in render_task in favor of canonical `directives = []`; renamed think_instruction to think_directive; enforced strict P4 Zero Backwards Compatibility.
 * - 2026-09-16: Zero Backwards Compatibility (P4) Purge — Removed all legacy delegator export bridges (render_director_task, render_terse_director_task, render_continuum_task, render_enhancement_instructions, render_profile_sorting_instructions, build_recency_anchor) and refactored render_task to explicit switch(mode).
 * - 2026-09-16: Standardized, modularized, and simplified task module architecture:
 *   (1) Merged verb patterns into unified `ACTION_VERBS_PATTERN` and consolidated spatial tokens;
 *   (2) Reworked lines 166-216 into Section 2 Prose Reflex & Input Reaction Engine (`render_prose_reflex`, `build_pacing_directive`, `render_environmental_hint`);
 *   (3) Consolidated ALL 5 task renderers into 1 single universal `render_task` compiler with clean mode dispatching;
 *   (4) Preserved 100% test compatibility.
 * - 2026-09-16: Standardized Director system envelope with `round` in `<SYSTEM round="...">` and standardized input via `render_task_input`; co-located input classification regexes and `render_environmental_hint`; repatriated `render_scene_spotlight_xml` to `entities.js`; unified Continuum directives in `TASK_LIBRARY.CONTINUUM`.
 * - 2026-09-16: Consolidated all loose directive/rules constants into unified, frozen `TASK_LIBRARY` catalog (PROTOCOLS, DIRECTOR, SPOTLIGHT, PROSE, SORTING) mirroring PROTOCOL_LIBRARY in protocols.js. Pruned legacy individual exports under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Emphatically strengthened dialogue prohibition in SCENE_DIRECTIVES (PROLOGUE, EPILOGUE, COLLAPSE) with 'Strictly zero spoken dialogue or quote marks'.
 * - 2026-09-13: Token Optimization Pass — Streamlined TASK_PROTOCOLS (PACING, RECENCY, THINK_NARRATOR), DIRECTOR_TASK_RULES, SPOTLIGHT_RULES, CHARACTER_DIRECTIVES, SCENE_DIRECTIVES (notably CONTINUATION down to 41 words), GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES, cutting ~230 words (~300 tokens) of conversational padding per turn while preserving all test assertions; strictly obeyed zero new test file creation.
 * - 2026-09-13: Comprehensive architectural rebuild & symmetrical harmonization with `prompts.js`:
 *   (1) Reconstructed into 6 cleanly divided sections mirroring the Multi-Shot simulation cycle (Turn Foundations, Cognition, Shot 1 Director, Shot 2A Story Prose, Shot 2B Continuum, Section 6 Auxiliary Tooling);
 *   (2) Enforced Full-Name domain nomenclature across all identifiers (`character_count`, `word_count`, `style_dna`, `candidate_entity`, `summarize_cast_entity`, `ingestion_instruction`, `redistribute_instruction`, `output_rules_instruction`);
 *   (3) Eliminated sibling import of `format.js`, achieving 100% zero-sibling module purity;
 *   (4) Preserved 100% export interface parity.
 * - 2026-09-13: Absorbed `SPOTLIGHT_RULES` and `render_scene_spotlight_xml` from `entities.js`, consolidating Director turn choreography into `task.js`.
 * - 2026-09-12: Standardization pass — render_enhancement_instructions now composes through the shared `render_xml_tag` primitive; renamed render_memory_forge_task -> render_continuum_task to align with the prompts.js mode key.
 * - 2026-09-12: Relocated render_enhancement_instructions and render_profile_sorting_instructions to task.js from format.js. Uses OUTPUT_FORMATS.profile as default schema.
 * - 2026-09-12: Modularization pass — relocated schemas (DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA), contracts (TEMPORAL_CONTRACT), OUTPUT_FORMATS, and instruction renderers to modules/format.js. task.js now focuses exclusively on turn execution, pacing, somatic currents, input formatting, and action directives. Zero sibling imports.
 * - 2026-09-11: Purification pass — added TASK_SCHEMAS/TASK_CONTRACTS and resolve_task_schema/resolve_task_contract; collapsed the private _indent onto @utils indent_all; removed the duplicate MACRO_DIRECTIVES import and the test-only TEMPORAL_PROTOCOLS/PROFILE_PROTOCOLS bundles.
 * - 2026-09-11: Complete module purification: relocated OUTPUT_FORMATS, TEMPORAL_CONTRACT, TEMPORAL_PROTOCOLS, and PROFILE_PROTOCOLS to task.js; imported layout helpers from @utils; task.js now has zero sibling imports.
 * - 2026-09-11: Relocated CHARACTER_DIRECTIVES (NPC_BOUNDARY, INITIATIVE, ADVANCE) to task.js to unify all turn action directives under <TASK>.
 * - 2026-09-11: Added render_director_task, render_memory_forge_task, render_enhancement_instructions, and render_profile_sorting_instructions.
 * - 2026-09-11: Added DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA, DIRECTOR_TASK_RULES, render_terse_director_task, SCENE_DIRECTIVES, GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES.
 * - 2026-09-11: Initial creation of modular task.js extracting turn block formatting, pacing, and think formats.
 * - 2026-10-03: Prompt alignment & trauma severity grading — aligned USER_PERSONA_LOCK with ROUTING to explicitly authorize EPILOGUE_COLLAPSED and EPILOGUE_CONCLUDED next_actions without contradiction; graded EVALUATION_INPUT and EVALUATION_SCENE to distinguish definitively fatal terminal destruction from severe but survivable bodily trauma.
 * Modules Ground Refactor Phase 1 — get_directive_atom delegates to utils/catalog.js resolve_catalog_atom (REFLEX delegation stays in compile_directive_tags) — prompt bytes byte-identical.
 * - 2026-10-07: Modules Ground Refactor Phase 3 — optics domain re-cut to sensory.js (OPTICS catalog, framing rules and cinematography moved; OPTICS delegation in resolve_directive_entry; optics slots and subject delegate; render_think_format exported) — prompt bytes byte-identical.
 */
