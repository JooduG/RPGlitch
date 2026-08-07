/**
 * src/intelligence/prompts.js
 * 🧠 INTELLIGENCE KERNEL PROMPT SYNTHESIZER
 * Centralized assembly line for the Intelligence Kernel.
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */
import { ind, PROTOCOL_LIBRARY, prompt_escape, state_bridge } from "@utils";
import { NARRATIVE_STYLES } from "@data";
import { DYNAMICS_META } from "./dynamics.js";
import { build_signals_xml } from "./signals.js";
import { ENTITY_CATALOG, ENTITY_FRAGMENTS } from "./fragments.js";
import { clean_xml, collapse_history, escape_xml, safe_parse_pseudo_json, strip_cognition_blocks } from "./parser.js";
import { temporal_engine } from "./temporal.js";

// PROTOCOL_LIBRARY is now defined in @utils/protocols.js and re-exported here.
// This allows both @intelligence and @media to share the same catalog without
// cross-layer import violations.

// Re-export for backwards compatibility (tests, index.js, etc.)
export { PROTOCOL_LIBRARY };

/** @type {string | null} */
let cached_dynamics_legend = null;
/** @type {Map<string, string>} */
const protocols_cache = new Map();

// --- JSON Schema Templates ---

const DIRECTOR_JSON_SCHEMA = `{
  "_thought_process": "<step-by-step state evaluation>",
  "directive": "<Optional short stage direction for the AI_CHARACTER this turn: a subtle in-character cue that weaves the active PAST / FUTURE / ETERNAL threads (theirs, the user's, and the fractal's) into the character's behavior. Never reveal another entity's hidden agenda as fact — cue it through atmosphere, body language, and situation only. Empty string when no directive is warranted.>",
  "AI_CHARACTER": {
    "present_append": {
      "physical": "New physical changes (e.g. bleeding, or explicit clothing updates like [SHIRT: none] [CLOTHING: bare] [PANTS: unzipped/exposed]), or empty string.",
      "non_physical": "Immediate internal shifts or emotional reactions, or empty string."
    },
    "vector_append": [ { "content": "New goal, event, or prophecy", "type": "future", "emotional_weight": 5 } ],
    "vector_resolve": [ { "id": "<vector_id>", "resolution_summary": "Summary of resolution." } ],
    "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
  },
  "USER_PERSONA": {
    "present_append": { "physical": "New physical changes (e.g. [SHIRT: none] [CLOTHING: bare]), or empty string.", "non_physical": "" },
    "vector_append": [],
    "vector_resolve": []
  },
  "FRACTAL": {
    "present_append": { "physical": "", "non_physical": "" },
    "vector_append": [ { "content": "New environmental event, prophecy, or shift", "type": "future", "emotional_weight": 5 } ],
    "vector_resolve": [],
    "dynamics_deltas": { "entropy": 0, "velocity": 0 }
  },
  "trigger_image": "false | story_entities | story_character | solo_entity | story_scene"
}`;

const MEMORY_JSON_SCHEMA = `{
  "_thought_process": "<analysis of key shifts and emotional weight>",
  "AI_CHARACTER": {
    "eternal_consolidated": { "physical": "Permanent physical change or empty string", "non_physical": "Permanent psychological shift or empty string" },
    "present_consolidated": { "physical": "Clean updated physical state (discarding expired temporary states)", "non_physical": "Clean updated mental/emotional baseline" },
    "vector_append": [ { "content": "Historical anchor or forward impulse", "type": "past | future", "emotional_weight": 5 } ]
  },
  "USER_PERSONA": {
    "eternal_consolidated": { "physical": "", "non_physical": "" },
    "present_consolidated": { "physical": "", "non_physical": "" },
    "vector_append": [ { "content": "Historical anchor or forward impulse", "type": "past | future", "emotional_weight": 5 } ]
  },
  "FRACTAL": {
    "eternal_consolidated": { "physical": "", "non_physical": "" },
    "present_consolidated": { "physical": "", "non_physical": "" },
    "vector_append": [ { "content": "Historical anchor or environmental impulse", "type": "past | future", "emotional_weight": 5 } ]
  }
}`;

/**
 * Builds a dynamic rule guide explaining all simulation sliders to the LLM.
 * @returns {string}
 */
function build_dynamics_legend() {
  if (cached_dynamics_legend !== null) return cached_dynamics_legend;
  if (!DYNAMICS_META) return "";

  const definitions = Object.entries(DYNAMICS_META)
    .map(([key, meta]) => `    - ${key} (${meta.label}): ${meta.desc}`)
    .join("\n");

  cached_dynamics_legend = `
<DYNAMICS_LEGEND>
  Scale: 0 (minimum) to 100 (maximum)
  Axes:
${definitions}
  Laws:
  ${PROTOCOL_LIBRARY.DYNAMICS.LAWS}
</DYNAMICS_LEGEND>`.trim();

  return cached_dynamics_legend;
}

/**
 * Helper to transform physical data to XML nodes.
 * @param {any} raw
 * @param {string} tagName
 * @returns {string}
 */
function physical_to_xml(raw, tagName) {
  if (!raw) return "";
  const parsed = safe_parse_pseudo_json(raw);
  if (parsed.__raw_prose__) {
    return `  <${tagName}>${prompt_escape(parsed.__raw_prose__)}</${tagName}>`;
  }
  const children = Object.entries(parsed)
    .map(([k, v]) => {
      const tag = k.replace(/\s+/g, "_");
      return `    <${tag}>${prompt_escape(String(v))}</${tag}>`;
    })
    .join("\n");
  return `  <${tagName}>\n${children}\n  </${tagName}>`;
}

/**
 * Safely evaluates, parses, and escapes an entity fragment value.
 * @param {any} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
const val = (text, owner, entities) => {
  if (!text) return "";
  return prompt_escape(prompt_builder.parse_macros(String(text).trim(), owner, entities));
};

/**
 * Resolves the active narrative style key from fractal or app settings.
 * Returns "" if no valid style is active.
 * @returns {string}
 */
function resolve_active_style_key() {
  const style_key =
    state_bridge.runtime?.active_fractal?.narrative_style && state_bridge.runtime?.active_fractal.narrative_style !== "default"
      ? state_bridge.runtime?.active_fractal.narrative_style
      : state_bridge.app?.settings?.narrative_style;
  if (!style_key || style_key === "default" || !NARRATIVE_STYLES[style_key]) return "";
  return style_key;
}

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {any} entity
 * @returns {"POV.FIRST_PERSON" | "POV.THIRD_PERSON"}
 */
function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

/**
 * Renders the active narrative style XML block.
 * @returns {string}
 */
function render_narrative_style_xml() {
  const style_key = resolve_active_style_key();
  if (!style_key) return "";

  const style_def = NARRATIVE_STYLES[style_key];
  const style_content = style_def.narrative_engine;
  if (!style_content) return "";

  const narrator_attr = `narrator="${escape_xml(style_key)}"`;

  let desc_xml = "";
  if (style_def.description) {
    desc_xml = `\n    <DESCRIPTION>${escape_xml(style_def.description)}</DESCRIPTION>`;
  }

  let themes_xml = "";
  if (style_def.tags && style_def.tags.length > 0) {
    themes_xml = `\n    <DEFINING_CHARACTERISTICS>${escape_xml(style_def.tags.join(", "))}</DEFINING_CHARACTERISTICS>`;
  }

  return `\n  <NARRATIVE_STYLE ${narrator_attr}>${desc_xml}${themes_xml}\n    ${ind(style_content, 4).trim()}\n  </NARRATIVE_STYLE>`;
}

/**
 * Derives a cognitive state signal from dynamics values.
 * Produces certainty (grounded/moderate/fragile) and regulation (stable/elevated/strained/depleted).
 * @param {Record<string, number>} [dynamics]
 * @returns {string} XML attributes string, e.g. ` certainty="grounded" regulation="stable"`
 */
function build_cognitive_state(dynamics) {
  const chaos = dynamics?.chaos ?? 50;
  const intensity = dynamics?.intensity ?? 50;
  const openness = dynamics?.openness ?? 50;

  const certainty = openness > 60 && chaos < 40 ? "grounded" : openness < 40 && chaos > 60 ? "fragile" : "moderate";

  const regulation = intensity > 70 && chaos > 60 ? "strained" : intensity > 70 && chaos < 40 ? "elevated" : intensity < 30 ? "depleted" : "stable";

  return ` certainty="${certainty}" regulation="${regulation}"`;
}

/**
 * Builds a response-length directive scaled by the AI's current pacing dynamics.
 * High intensity compresses prose into urgent beats; low intensity draws it out.
 * @param {Record<string, number>} [dynamics]
 * @returns {string}
 */
function build_length_directive(dynamics) {
  const intensity = dynamics?.intensity;
  if (typeof intensity === "number" && intensity > 70) {
    return "Aim for roughly 1\u20132 short, clipped paragraphs \u2014 high energy compresses prose into urgent beats.";
  }
  if (typeof intensity === "number" && intensity < 30) {
    return "Aim for up to 3 paragraphs, drawn out with heavy, deliberate detail.";
  }
  return "Aim for a length of roughly 2 paragraphs, adjusting as the context demands.";
}

/**
 * Compiles dynamic system parameter keys into inline attributes.
 * @param {Record<string, number>} [dynObj]
 * @returns {string}
 */
function format_dynamics_attrs(dynObj, options = {}) {
  if (!dynObj) return "";
  const { cognitive = true } = options;
  const attrs = Object.entries(dynObj)
    .map(([k, v]) => `${escape_xml(k)}="${Math.round(v)}"`)
    .join(" ");
  const cognitive_state = cognitive ? build_cognitive_state(dynObj) : "";
  return attrs ? ` ${attrs}${cognitive_state}` : cognitive_state || "";
}

/**
 * Director prompt compiler (Shot 1).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
function render_director({ round, entities, input, render_atom, compressed_snapshot, rawMessages }) {
  const protocols = ["FORMATS.JSON_ONLY", "AGENCY.FICTIONAL_LICENSE"].filter(Boolean).join(", ");
  const dynamics_legend = build_dynamics_legend();

  const system = clean_xml(`
<SYSTEM role="DIRECTOR">
  You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.
  
  ${ind(dynamics_legend, 2)}

  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <PRESENT>
        <PHYSICAL>${ind(val(entities?.AI?.present?.physical, entities?.AI, entities), 8)}</PHYSICAL>
        <NON_PHYSICAL>${ind(val(entities?.AI?.present?.non_physical, entities?.AI, entities), 8)}</NON_PHYSICAL>
      </PRESENT>
      <ETERNAL>
        <PHYSICAL>${val(entities?.AI?.eternal?.physical, entities?.AI, entities)}</PHYSICAL>
        <NON_PHYSICAL>${val(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</NON_PHYSICAL>
      </ETERNAL>
      <PAST>${ind(render_atom.past(entities?.AI, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom.future(entities?.AI, { vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PRESENT>
        <PHYSICAL>${ind(val(entities?.USER?.present?.physical, entities?.USER, entities), 8)}</PHYSICAL>
        <NON_PHYSICAL>${ind(val(entities?.USER?.present?.non_physical, entities?.USER, entities), 8)}</NON_PHYSICAL>
      </PRESENT>
      <ETERNAL>
        <PHYSICAL>${val(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PHYSICAL>
        <NON_PHYSICAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</NON_PHYSICAL>
      </ETERNAL>
      <PAST>${ind(render_atom.past(entities?.USER, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom.future(entities?.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics, { cognitive: false })}>
    <PRESENT>
      <PHYSICAL>${val(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</PHYSICAL>
      <NON_PHYSICAL>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</NON_PHYSICAL>
    </PRESENT>
    <ETERNAL>
      <PHYSICAL>${val(entities.FRACTAL.eternal?.physical, entities.FRACTAL, entities)}</PHYSICAL>
      <NON_PHYSICAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</NON_PHYSICAL>
    </ETERNAL>
    <PAST>${ind(render_atom.past(entities.FRACTAL, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.FRACTAL, { vector_text: true }), 6)}</FUTURE>
  </FRACTAL>`.trim()
      : ""
  }
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${(() => {
  const last_ai = (rawMessages || []).filter((m) => m.role === "model").slice(-1)[0];
  if (!last_ai) return "";
  const text = strip_cognition_blocks(last_ai.content || last_ai.text || "").trim();
  if (!text) return "";
  return `<AI_LAST_TURN>${ind(text, 2)}</AI_LAST_TURN>`;
})()}
<TASK>
    Evaluate state mutations caused by the ${input?.trim() ? "<USER_ACTION>" : "current situation"}. Record your reasoning inside the "_thought_process" key at the top of the object.
    Return a single valid JSON payload starting with { and ending with } following this exact schema:
    ${DIRECTOR_JSON_SCHEMA}
    IMAGE TRIGGER GUIDANCE (optional, use sparingly — reserved for key narrative beats):
      - Set "trigger_image" to false (or "false") unless the moment genuinely demands a visual.
      - Set "trigger_image" to one of the 4-tier target strings to request an automatic visual beat this round:
          "story_entities"  -> group shot of all active entities
          "story_character" -> single in-scene character focus
          "solo_entity"     -> isolated portrait
          "story_scene"     -> environment / general narrative moment
    STATE & CONTINUITY GUIDANCE:
      - A character's <FUTURE> block encodes private ambitions. Never state them overtly — weave them in indirectly: seed vector_append and present_append that move toward them so they materialize as the character's own actions.
      - A <USER_PERSONA> FUTURE is that player's secret agenda. The AI character must never learn it — never place it in the character's SYSTEM or SNAPSHOT, and never have the character narrate or act on it as known fact. Reveal it through the environment only: seed its traces into atmosphere, NPCs, obstacles, and the user's own choices, so it unfolds as discovery rather than exposition.
      - Compose the "directive" key as your narrative voice into the AI character's turn: weave the active <PAST>, <FUTURE>, and <ETERNAL> threads across the AI character, user persona, and fractal into a short, subtle in-character cue. Keep it deniable and atmospheric — never state hidden agendas as fact, never deliver exposition the character could not have inferred. Empty string when nothing is warranted.
      - If a physical field contains Perchance alternation syntax '{Option A|Option B}', write exactly ONE resolved option into your mutations; never preserve the braces or pipe.
  </TASK>
  `).trim();

  return { system, task };
}

function resolve_vector_pool(entity) {
  if (!entity || typeof entity !== "object") return [];
  const normalize_item = (v, type) => (v && typeof v === "object" ? { ...v, type, content: v.content || v.directive || v.text || "" } : v);
  if (Array.isArray(entity.vectors) && entity.vectors.length > 0) {
    return entity.vectors.map((v) => normalize_item(v, v?.type === "future" ? "future" : "past"));
  }
  const pool = [];
  if (Array.isArray(entity.past)) {
    for (const v of entity.past) pool.push(normalize_item(v, v?.type === "future" ? "future" : "past"));
  }
  if (Array.isArray(entity.future)) {
    for (const v of entity.future) pool.push(normalize_item(v, v?.type === "past" ? "past" : "future"));
  }
  return pool;
}

function build_ai_future_xml(entity, scoringContext = "", entities = {}) {
  const futures = resolve_vector_pool(entity).filter((v) => v?.type === "future");
  if (futures.length === 0) return "";
  const formatted = temporal_engine.format(futures, scoringContext, { max_chars: 1500, vector_text: true });
  if (!formatted?.trim()) return "";
  return `    <FUTURE>${ind(prompt_builder.parse_macros(formatted, entity, entities), 6)}</FUTURE>`;
}

function render_character({ round, entities, input, compressed_snapshot, meta, render_atom, ghostwrite = false, director_data }) {
  const pov_protocol = resolve_pov_protocol(entities?.AI);
  const has_user_action = !!input?.trim();

  const director_note = director_data?.directive?.trim()
    ? `<DIRECTOR_NOTE>
      ${ind(escape_xml(director_data.directive.trim()), 6)}
      Treat this as an unseen stage direction: weave it into your behavior subtly and in character. Never mention the note, never break the scene, and never present another entity's hidden agenda as known fact.
    </DIRECTOR_NOTE>
    `
    : "";

  const protocols = [
    "COGNITION.PHASES",
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "HYGIENE.MARKDOWN",
    "AGENCY.INITIATIVE",
    "HYGIENE.CONCISENESS",
    "AGENCY.FICTIONAL_LICENSE",
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"))
      ? "AGENCY.FIRST_CONTACT"
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const stability_lock_content =
    meta?.structural_errors >= 3 ? PROTOCOL_LIBRARY.STABILITY.CRITICAL : meta?.structural_errors >= 1 ? PROTOCOL_LIBRARY.STABILITY.WARNING : "";

  const system = clean_xml(`
<SYSTEM role="${escape_xml(entities?.AI?.name || "AI")}">${render_narrative_style_xml()}
You are ${escape_xml(entities?.AI?.name || "AI")} in an active scene with ${escape_xml(entities?.USER?.name || "User")} inside ${escape_xml(entities?.FRACTAL?.name || "the environment")}.
  ${ind(build_dynamics_legend(), 2)}
  <YOUR_IDENTITY name="${escape_xml(entities?.AI?.name || "AI")}">
    <ETERNAL>${val(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <ETERNAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}">
    <ETERNAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL>
  </FRACTAL>`.trim()
      : ""
  }
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
<SNAPSHOT>
  <YOUR_IDENTITY name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    <PRESENT>${ind(val(entities?.AI?.present?.non_physical, entities?.AI, entities), 6)}</PRESENT>
    <PAST>${ind(render_atom.past(entities?.AI, { vector_text: true }), 6)}</PAST>
${build_ai_future_xml(entities?.AI, render_atom._context, entities)}
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <PRESENT>${ind(val(entities?.USER?.present?.non_physical, entities?.USER, entities), 6)}</PRESENT>
    <PAST>${ind(render_atom.past(entities?.USER, { vector_text: true }), 6)}</PAST>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics, { cognitive: false })}>
    <PRESENT>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT>
    <PAST>${ind(render_atom.past(entities.FRACTAL, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.FRACTAL, { vector_text: true }), 6)}</FUTURE>
  </FRACTAL>`.trim()
      : ""
  }
</SNAPSHOT>
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    ${director_note}
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER}
    </THINK_FORMAT>
    ${stability_lock_content ? `<STABILITY_LOCK>${stability_lock_content}</STABILITY_LOCK>\n    ` : ""}
    <EPISTEMIC_PHYSICS>
      ${ind(PROTOCOL_LIBRARY.EPISTEMIC_PHYSICS.RULES, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(compressed_snapshot?.ai?.dynamics, compressed_snapshot?.fractal?.dynamics)}
    <POV_DIRECTIVE>
      ${PROTOCOL_LIBRARY.POV[pov_protocol.split(".")[1] || "FIRST_PERSON"]}
    </POV_DIRECTIVE>
    ${
      ghostwrite
        ? "Follow the <GHOSTWRITE> directive below to complete your turn."
        : has_user_action
          ? "Execute your reaction against <USER_ACTION>."
          : "Continue the scene, reacting to the current situation."
    } Stay fully in character. Honor all active <PROTOCOLS>.
    ${build_length_directive(compressed_snapshot?.ai?.dynamics)}
  </TASK>
  `).trim();

  return { system, task };
}

function render_ghostwriter({ entities, input = "" }) {
  const user_name = entities?.USER?.name || "User Persona";
  const ai_name = entities?.AI?.name || "AI Character";

  const swapped = {
    ...(entities || {}),
    AI: entities?.USER ? entities.USER : { name: user_name, present: {}, eternal: {}, vectors: [] },
    USER: entities?.AI ? entities.AI : { name: ai_name, present: {}, eternal: {}, vectors: [] },
  };

  const render_atom = data_processors.create_render_atom(swapped, input || "", []);
  const rendered = render_character({
    round: null,
    entities: swapped,
    input,
    compressed_snapshot: {
      ai: { dynamics: entities?.USER?.dynamics || {} },
      fractal: { dynamics: entities?.FRACTAL?.dynamics || {} },
      flags: [],
    },
    meta: {},
    render_atom,
    ghostwrite: true,
  });

  const draft_directive = input?.trim()
    ? `Enhance, expand, and polish the following draft written by ${escape_xml(user_name)} into vivid, atmospheric action/dialogue:\n    ${escape_xml(input.trim())}`
    : `Draft a compelling, in-character next action or vocal response for ${escape_xml(user_name)} in response to ${escape_xml(ai_name)}.`;

  rendered.task += clean_xml(`
<GHOSTWRITE>
    ${draft_directive}
    Write strictly from ${escape_xml(user_name)}'s perspective and voice. Do not write dialogue, actions, or thoughts for ${escape_xml(ai_name)}. Do not describe ${escape_xml(ai_name)}'s reactions. Output only the raw text — no preamble, no meta-commentary, no XML wrappers.
</GHOSTWRITE>
  `);

  return rendered;
}

function render_narrator(mode, { entities, render_atom, compressed_snapshot, round = null, input = null }) {
  const task_text =
    mode === "prologue"
      ? `${PROTOCOL_LIBRARY.SCENE.PROLOGUE}\n    Input: ${escape_xml(input?.trim() || "The scene begins.")}`
      : PROTOCOL_LIBRARY.SCENE.EPILOGUE;
  const fractal_name = entities?.FRACTAL?.name || "Environment";

  const system = clean_xml(`
<SYSTEM role="${escape_xml(fractal_name)}" mode="${mode.toUpperCase()}">${render_narrative_style_xml()}
  ${ind(build_dynamics_legend(), 2)}
  <YOUR_IDENTITY name="${escape_xml(fractal_name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics, { cognitive: false })}>
    <ANCHOR>Resolve all state inferences strictly from this identity block.</ANCHOR>
    <PRESENT>${val(entities?.FRACTAL?.present?.non_physical, entities?.FRACTAL, entities)}</PRESENT>
    <ETERNAL>${val(entities?.FRACTAL?.eternal?.non_physical, entities?.FRACTAL, entities)}</ETERNAL>
    <PAST>${ind(render_atom?.past(entities?.FRACTAL, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom?.future(entities?.FRACTAL, { vector_text: true }), 6)}</FUTURE>
  </YOUR_IDENTITY>
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <PRESENT>${val(entities?.AI?.present?.non_physical, entities?.AI, entities)}</PRESENT>
      <ETERNAL>${val(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL>
      <PAST>${ind(render_atom?.past(entities?.AI, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom?.future(entities?.AI, { vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PRESENT>${val(entities?.USER?.present?.non_physical, entities?.USER, entities)}</PRESENT>
      <ETERNAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
      <PAST>${ind(render_atom?.past(entities?.USER, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom?.future(entities?.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("COGNITION.PHASES, AGENCY.PRESENT_TENSE, HYGIENE.PROSE, AGENCY.MOMENTUM, HYGIENE.MARKDOWN, AGENCY.FICTIONAL_LICENSE"), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
${round != null ? `<ROUND>${escape_xml(String(round))}</ROUND>\n` : ""}${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>\n` : ""}
<TASK>
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_NARRATOR}
    </THINK_FORMAT>
    ${task_text}
    ${build_signals_xml({}, compressed_snapshot?.fractal?.dynamics, { domains: ["fractal"] })}
    <POV_DIRECTIVE>${PROTOCOL_LIBRARY.POV.NARRATOR}</POV_DIRECTIVE>
  </TASK>
  `).trim();

  return { system, task };
}

function render_entity_memory_context(key, entity) {
  if (!entity) return "";
  const name = escape_xml(entity?.name || key);
  return clean_xml(`
  <${key} name="${name}">
    <NAME>${name}</NAME>
    <ETERNAL>
      <PHYSICAL>
        ${ind(
          physical_to_xml(entity?.eternal?.physical, "PHYSICAL")
            .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
            .trim(),
          8,
        )}
      </PHYSICAL>
      <NON_PHYSICAL>${escape_xml(entity?.eternal?.non_physical || "")}</NON_PHYSICAL>
    </ETERNAL>
    <PRESENT>
      <PHYSICAL>
        ${ind(
          physical_to_xml(entity?.present?.physical, "PHYSICAL")
            .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
            .trim(),
          8,
        )}
      </PHYSICAL>
      <NON_PHYSICAL>${escape_xml(entity?.present?.non_physical || "")}</NON_PHYSICAL>
    </PRESENT>
  </${key}>
  `).trim();
}

function render_memory({ entities, history }) {
  const entity_blocks = ["AI_CHARACTER", "USER_PERSONA", "FRACTAL"]
    .filter((key) => entities?.[key])
    .map((key) => render_entity_memory_context(key, entities[key]))
    .join("\n");

  return clean_xml(`
<SYSTEM role="MEMORY_FORGE">
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("HYGIENE.DATA, HYGIENE.AFFIRMATIVE, AGENCY.PRESENT_TENSE"), 4)}
  </PROTOCOLS>
  <ENTITY_CONTEXT>
${entity_blocks}
  </ENTITY_CONTEXT>
  <INPUT_HISTORY>
    ${JSON.stringify(history, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
  </INPUT_HISTORY>
  <TASK>
    Compress this history into structured state updates and temporal vectors. Record internal evaluation inside "_thought_process" at the top of the JSON object.
    For each active entity (AI_CHARACTER, USER_PERSONA, FRACTAL):
      - "eternal_consolidated": Record permanent identity, psychological, or physical changes to baseline form (or empty string).
      - "present_consolidated": Rewrite a clean, updated physical and non-physical state, discarding expired temporary deltas.
      - "vector_append": Add temporal vectors written strictly from that entity's own perspective:
          "past"   = a settled historical anchor (memory).
          "future" = a prophecy, intent, or goal to carry forward.
    Output strict JSON matching this schema:
    ${MEMORY_JSON_SCHEMA}
  </TASK>
</SYSTEM>
  `).trim();
}

function render_enhancement_field_context(entity, field_id, content = "") {
  if (!entity) return "";
  const [section, sub] = String(field_id || "").split(".");

  if (section && sub && ["eternal", "present"].includes(section)) {
    const layer = section.toUpperCase();
    const sub_key = sub.toUpperCase();
    const raw = entity?.[section]?.[sub];
    const value =
      sub === "physical"
        ? physical_to_xml(raw, "PHYSICAL")
            .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
            .trim()
        : escape_xml(String(raw ?? ""));
    return clean_xml(`
  <ENTITY_CONTEXT>
    <${layer}>
      <${sub_key}>
        ${ind(value, 8)}
      </${sub_key}>
    </${layer}>
  </ENTITY_CONTEXT>
  `).trim();
  }

  if (field_id === "past" || field_id === "future") {
    const type = field_id;
    const vectors = Array.isArray(entity?.vectors)
      ? entity.vectors.filter((v) => (type === "future" ? v?.type === "future" : v?.type !== "future"))
      : [];
    const text = vectors.length ? temporal_engine.format(vectors, content || "", { max_chars: 1500 }) : "";
    return clean_xml(`
  <ENTITY_CONTEXT>
    <${type.toUpperCase()}>
      ${ind(escape_xml(text), 6)}
    </${type.toUpperCase()}>
  </ENTITY_CONTEXT>
  `).trim();
  }

  return "";
}

function render_enhancement({
  label,
  directive,
  enhancer,
  content,
  is_image_field = false,
  is_array_field = false,
  _field_id = "",
  entity = null,
  entity_type = "character",
}) {
  const protocols = ["HYGIENE.DATA", "HYGIENE.AFFIRMATIVE"].filter(Boolean).join(", ");
  const format_instruction = is_image_field
    ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_IMAGE
    : is_array_field
      ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_ARRAY
      : PROTOCOL_LIBRARY.FORMATS.ENHANCE_PROSE;
  const macro_instruction = !is_image_field
    ? entity_type === "fractal"
      ? PROTOCOL_LIBRARY.PROFILE.MACROS.FRACTAL
      : PROTOCOL_LIBRARY.PROFILE.MACROS.CHARACTER
    : "";

  return clean_xml(`
<SYSTEM role="${escape_xml(enhancer || "GENERAL")}" enhancing="${escape_xml(label || "")}">
  <INSTRUCTIONS>
    ${ind(escape_xml(directive), 4)}

    ${ind(format_instruction, 4)}
    ${macro_instruction ? `${ind(macro_instruction, 4)}\n` : ""}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
  ${render_enhancement_field_context(entity, _field_id, content) || ""}
  <INPUT_CONTENT>
    ${ind(escape_xml(content), 4)}
  </INPUT_CONTENT>
</SYSTEM>
  `).trim();
}

function render_profile_sorting(entity_type = "character") {
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
  const protocols = ["HYGIENE.DATA", "HYGIENE.AFFIRMATIVE", "FORMATS.JSON_ONLY"].filter(Boolean).join(", ");
  const sorting_instruction = resolved_type === "fractal" ? PROTOCOL_LIBRARY.PROFILE.SORT_FRACTAL : PROTOCOL_LIBRARY.PROFILE.SORT_CHARACTER;

  return clean_xml(`
<SYSTEM role="${ENTITY_FRAGMENTS.profile[resolved_type]?.enhancer || "ENHANCER"}" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escape_xml(PROTOCOL_LIBRARY.PROFILE.SCHEMA), 4)}

    Write in third-person POV.

    ${ind(sorting_instruction, 4)}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();
}

const data_processors = {
  create_render_atom(entities = {}, input = "", raw_messages = []) {
    const resolve = (ref) => (typeof ref === "string" ? entities[ref] || entities.AI || {} : ref || {});
    const scoring_context = `${input || ""} ${(Array.isArray(raw_messages) ? raw_messages : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ")}`.trim();

    return {
      _context: scoring_context,
      past: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(
          resolve_vector_pool(entity).filter((v) => v?.type !== "future"),
          scoring_context,
          {
            offset: 0,
            max_chars: 1500,
            ...options,
          },
        );
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      future: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(
          resolve_vector_pool(entity).filter((v) => v?.type === "future"),
          scoring_context,
          {
            offset: 0,
            max_chars: 1500,
            ...options,
          },
        );
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      simulation_log: (limit = 10, offset = 0) => prompt_builder.render_history(raw_messages, limit, offset),
    };
  },
  render_history(simulation_log, count = 10, offset = 0) {
    if (!simulation_log || typeof simulation_log === "string") return simulation_log || "";
    const collapsed = collapse_history(simulation_log, { separator: "\n", stripBoldQuotes: true });
    const start = Math.max(0, collapsed.length - (count + offset));
    const end = Math.max(0, collapsed.length - offset);
    return collapsed
      .slice(start, end)
      .map((c) => `    <entry role="${c.role}"${c.name ? ` name="${escape_xml(c.name)}"` : ""}>${prompt_escape(c.content)}</entry>`)
      .join("\n");
  },
};

export const prompt_builder = {
  parse_macros(text, owner, entities = {}) {
    if (!text || !entities) return text || "";
    const ai_name = entities.AI?.name || "AI";
    const user_name = entities.USER?.name || "User";
    const fractal_name = entities.FRACTAL?.name || "Fractal";

    return text.replace(/\{\{(.*?)\}\}/g, (match, macro) => {
      const token = macro.toLowerCase().trim();
      if (owner === entities.AI) {
        const map = { me: ai_name, char: ai_name, you: user_name, user: user_name, fractal: fractal_name };
        return map[token] ?? match;
      }
      if (owner === entities.USER) {
        const map = { me: user_name, user: user_name, you: ai_name, char: ai_name, fractal: fractal_name };
        return map[token] ?? match;
      }
      if (owner === entities.FRACTAL) {
        const map = { fractal: fractal_name, me: fractal_name, you: `${ai_name} and ${user_name}`, char: ai_name, user: user_name };
        return map[token] ?? match;
      }
      return match;
    });
  },
  build_director_prompt(payload, snapshot) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    const rendered = render_director({
      ...payload,
      render_atom,
      compressed_snapshot: snapshot,
    });
    return {
      system: prompt_builder.clean(rendered.system),
      task: prompt_builder.clean(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
      },
    };
  },
  build_character_prompt(payload, snapshot, director_data) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    const rendered = render_character({
      ...payload,
      render_atom,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean(rendered.system),
      task: prompt_builder.clean(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        vectors: temporal_engine.score(payload.entities?.AI?.vectors || [], render_atom._context).slice(0, 5),
      },
    };
  },
  synthesize(payload, snapshot) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    if (payload.type === "prologue") {
      const rendered = render_narrator("prologue", {
        ...payload,
        render_atom,
        compressed_snapshot: snapshot,
      });
      return {
        system: prompt_builder.clean(rendered.system),
        task: prompt_builder.clean(rendered.task),
        meta: {},
      };
    }
    return prompt_builder.build_character_prompt(payload, snapshot, {});
  },
  create_render_atom: data_processors.create_render_atom,
  render_history: data_processors.render_history,
  build_scoring_context(input = "", simulation_log = []) {
    const recent = (Array.isArray(simulation_log) ? simulation_log : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ");
    return `${input || ""} ${recent}`.trim();
  },
  render_protocols(selection) {
    if (!selection) return "";
    if (protocols_cache.has(selection)) {
      return protocols_cache.get(selection);
    }
    const rendered = selection
      .split(",")
      .map((k) => {
        const key = k.trim().toUpperCase();
        const parts = key.split(".");
        let rule = PROTOCOL_LIBRARY;
        for (const part of parts) {
          rule = rule?.[part];
          if (!rule) break;
        }
        if (!rule || typeof rule !== "string") return "";
        const tag = parts[parts.length - 1];
        if (rule.includes("\n")) {
          return `<${tag}>\n${rule}\n</${tag}>`;
        }
        return `<${tag}>${rule}</${tag}>`;
      })
      .filter(Boolean)
      .join("\n");
    protocols_cache.set(selection, rendered);
    return rendered;
  },
  clean(str) {
    return typeof str === "string"
      ? str
          .replace(/[ \t]+$/gm, "")
          .replace(/\n{3,}/g, "\n")
          .trim()
      : "";
  },
  build_epilogue(entities, dynamics, recent_history = []) {
    const safe_entities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };
    const rendered = render_narrator("epilogue", {
      entities: safe_entities,
      render_atom: prompt_builder.create_render_atom(safe_entities, "", recent_history),
      compressed_snapshot: {
        ai: { dynamics: dynamics?.ai },
        fractal: { dynamics: dynamics?.fractal },
      },
    });
    return {
      system: prompt_builder.clean(rendered.system),
      task: prompt_builder.clean(rendered.task),
      messages: [],
    };
  },
  build_memory_prompt(entities, history) {
    return {
      system: render_memory({ entities, history }),
      messages: [],
    };
  },
  build_enhancement(field_id, content, entity_name = "", entity_type = "character", is_image_field = false, entity = null) {
    const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
    const meta = ENTITY_CATALOG[`${resolved_type}.${field_id}`] ||
      ENTITY_CATALOG[field_id] || {
        directive: "Expand and enrich the fragment.",
        enhancer: "GENERAL",
      };
    const is_array_field = meta.type === "array";
    return {
      system: render_enhancement({
        content,
        label: entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
        is_image_field: is_image_field || field_id.endsWith(".physical"),
        is_array_field,
        _field_id: field_id,
        entity,
        entity_type: resolved_type,
      }),
      messages: [],
    };
  },
  build_profile_sorting_prompt(inputData, entity_type = "character") {
    return {
      system: render_profile_sorting(entity_type),
      messages: [
        {
          role: "user",
          text: typeof inputData === "string" ? inputData : JSON.stringify(inputData, null, 2),
        },
      ],
    };
  },
  build_ghostwriter(entities, input = "") {
    return render_ghostwriter({ entities, input });
  },
};

export {
  build_ai_future_xml,
  build_cognitive_state,
  build_dynamics_legend,
  build_length_directive,
  render_character,
  render_director,
  render_enhancement,
  render_ghostwriter,
  render_narrator,
  render_profile_sorting,
};
