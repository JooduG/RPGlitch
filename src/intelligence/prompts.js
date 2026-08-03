/**
 * src/intelligence/prompts.js
 * 🧠 INTELLIGENCE KERNEL PROMPT SYNTHESIZER
 * Centralized assembly line for the Intelligence Kernel.
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */
import { ind, PROTOCOL_LIBRARY, state_bridge } from "@utils";
import { NARRATIVE_STYLES } from "@data";
import { DYNAMICS_META } from "./dynamics.js";
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

// --- JSON Schema Templates (extracted for readability) ---

const DIRECTOR_JSON_SCHEMA = `{
  "_thought_process": "<step-by-step state evaluation>",
  "trigger_image": false,
  "mutations": {
    "AI_CHARACTER": {
      "present_append_physical": "New physical changes (e.g. bleeding, or explicit clothing updates like [SHIRT: none] [CLOTHING: bare] [PANTS: unzipped/exposed]), or empty string.",
      "present_append_non_physical": "Immediate internal shifts or emotional reactions, or empty string.",
      "resolve_vectors": [ { "id": "<vector_id>", "resolution_summary": "Summary of resolution." } ],
      "new_vectors": [ { "content": "New goal, event, or prophecy", "type": "future", "weight": 5 } ],
      "eternal_mutations": { "physical": "Permanent physical change or empty string", "non_physical": "Permanent psychological shift or empty string" },
      "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
    },
    "USER_PERSONA": {
      "present_append_physical": "New physical changes (e.g. [SHIRT: none] [CLOTHING: bare]), or empty string.",
      "present_append_non_physical": "",
      "resolve_vectors": [],
      "new_vectors": [],
      "eternal_mutations": { "physical": "", "non_physical": "" }
    },
    "FRACTAL": {
      "present_append_physical": "",
      "present_append_non_physical": "",
      "resolve_vectors": [],
      "new_vectors": [ { "content": "New environmental event, prophecy, or shift", "type": "future", "weight": 5 } ],
      "dynamics_deltas": { "entropy": 0, "velocity": 0 }
    }
  }
}`;

const MEMORY_JSON_SCHEMA = `{
  "_thought_process": "<analysis of key shifts and emotional weight>",
  "memories": {
    "AI_CHARACTER": {
      "type": "past | future | present",
      "directive": "Memory summary written strictly from the AI character's own perspective",
      "emotional_weight": 5,
      "tags": ["keyword1", "keyword2"]
    },
    "USER_PERSONA": {
      "type": "past | future | present",
      "directive": "Memory summary written strictly from the user persona's own perspective",
      "emotional_weight": 5,
      "tags": ["keyword1", "keyword2"]
    },
    "FRACTAL": {
      "type": "past | future | present",
      "directive": "Memory summary written from the fractal's atmospheric/environmental perspective",
      "emotional_weight": 5,
      "tags": ["keyword1", "keyword2"]
    }
  },
  "present_summaries": {
    "AI_CHARACTER": { "physical": "Concise physical summary", "non_physical": "Concise mental summary" },
    "USER_PERSONA": { "physical": "Concise physical summary", "non_physical": "Concise mental summary" },
    "FRACTAL": { "physical": "Concise physical summary", "non_physical": "Concise mental summary" }
  },
  "eternal_mutations": {
    "AI_CHARACTER": { "physical": "Permanent physical change or empty string", "non_physical": "Permanent psychological shift or empty string" },
    "USER_PERSONA": { "physical": "Permanent physical change or empty string", "non_physical": "Permanent psychological shift or empty string" },
    "FRACTAL": { "physical": "Permanent environmental change or empty string", "non_physical": "Permanent atmospheric shift or empty string" }
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
    return `  <${tagName}>${escape_xml(parsed.__raw_prose__)}</${tagName}>`;
  }
  const children = Object.entries(parsed)
    .map(([k, v]) => `    <${k}>${escape_xml(String(v))}</${k}>`)
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
  return escape_xml(prompt_builder.parse_macros(String(text).trim(), owner, entities));
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
 * Renders the active author style XML block.
 * @returns {string}
 */
function render_narrative_style_xml() {
  const style_key = resolve_active_style_key();
  if (!style_key) return "";

  const style_def = NARRATIVE_STYLES[style_key];
  const author_style_content = style_def.narrative_engine;
  if (!author_style_content) return "";

  const author_attr = `author="${escape_xml(style_key)}"`;

  let desc_xml = "";
  if (style_def.description) {
    desc_xml = `\n    <DESCRIPTION>${escape_xml(style_def.description)}</DESCRIPTION>`;
  }

  let themes_xml = "";
  if (style_def.tags && style_def.tags.length > 0) {
    themes_xml = `\n    <DEFINING_CHARACTERISTICS>${escape_xml(style_def.tags.join(", "))}</DEFINING_CHARACTERISTICS>`;
  }

  return `\n  <NARRATIVE_STYLE ${author_attr}>${desc_xml}${themes_xml}\n    ${ind(author_style_content, 4).trim()}\n  </NARRATIVE_STYLE>`;
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
 * Builds a per-stat dynamics calibration block for the Character prompt.
 * Explains each axis's current value and its behavioral meaning in plain language.
 * @param {Record<string, number>} [dynamics]
 * @returns {string} XML block string, or empty if no dynamics
 */
function build_dynamics_calibration(dynamics) {
  if (!dynamics || typeof dynamics !== "object") return "";
  const character_axes = ["chaos", "intensity", "openness", "affinity"];
  const lines = character_axes
    .filter((k) => typeof dynamics[k] === "number")
    .map((k) => {
      const v = Math.round(dynamics[k]);
      const meta = DYNAMICS_META[k];
      const label = meta?.label || k;
      const desc = meta?.desc || "";
      return `      ${label}="${v}": ${desc}. ${v > 60 ? PROTOCOL_LIBRARY.DYNAMICS.CALIBRATION.HIGH : v < 40 ? PROTOCOL_LIBRARY.DYNAMICS.CALIBRATION.LOW : PROTOCOL_LIBRARY.DYNAMICS.CALIBRATION.BALANCED}`;
    });
  if (lines.length === 0) return "";
  return `    <DYNAMICS_CALIBRATION>\n${lines.join("\n")}\n    </DYNAMICS_CALIBRATION>`;
}

/**
 * Compiles dynamic system parameter keys into inline attributes.
 * @param {Record<string, number>} [dynObj]
 * @returns {string}
 */
function format_dynamics_attrs(dynObj) {
  if (!dynObj) return "";
  const attrs = Object.entries(dynObj)
    .map(([k, v]) => `${escape_xml(k)}="${Math.round(v)}"`)
    .join(" ");
  const cognitive = build_cognitive_state(dynObj);
  return attrs ? ` ${attrs}${cognitive}` : cognitive || "";
}

/**
 * Collapses conversation history into role-grouped entries.
 * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
 * @param {{separator?: string, stripBoldQuotes?: boolean}} [options]
 * @returns {Array<{role: string, name: string, content: string}>}
 */

// ============================================================================
// 2. PROMPT TEMPLATES
// ============================================================================

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
      <PRESENT_PHYSICAL>${ind(val(entities?.AI?.present?.physical, entities?.AI, entities), 8)}</PRESENT_PHYSICAL>
      <PRESENT_NON_PHYSICAL>${ind(val(entities?.AI?.present?.non_physical, entities?.AI, entities), 8)}</PRESENT_NON_PHYSICAL>
      <ETERNAL_PHYSICAL>${val(entities?.AI?.eternal?.physical, entities?.AI, entities)}</ETERNAL_PHYSICAL>
      <ETERNAL_NON_PHYSICAL>${val(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL_NON_PHYSICAL>
      <FUTURE>${ind(render_atom.future(entities?.AI, { vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PRESENT_PHYSICAL>${ind(val(entities?.USER?.present?.physical, entities?.USER, entities), 8)}</PRESENT_PHYSICAL>
      <PRESENT_NON_PHYSICAL>${ind(val(entities?.USER?.present?.non_physical, entities?.USER, entities), 8)}</PRESENT_NON_PHYSICAL>
      <ETERNAL_PHYSICAL>${val(entities?.USER?.eternal?.physical, entities?.USER, entities)}</ETERNAL_PHYSICAL>
      <ETERNAL_NON_PHYSICAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL_NON_PHYSICAL>
      <FUTURE>${ind(render_atom.future(entities?.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <PRESENT_PHYSICAL>${val(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</PRESENT_PHYSICAL>
    <PRESENT_NON_PHYSICAL>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT_NON_PHYSICAL>
    <ETERNAL_PHYSICAL>${val(entities.FRACTAL.eternal?.physical, entities.FRACTAL, entities)}</ETERNAL_PHYSICAL>
    <ETERNAL_NON_PHYSICAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL_NON_PHYSICAL>
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
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * AI Character (Actor) prompt compiler (Shot 2).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
/**
 * Builds the AI entity's future XML block (unified FUTURE tag).
 * @param {any} entity - AI entity with future vectors.
 * @param {string} [scoringContext] - Context for temporal RAG scoring.
 * @returns {string} XML string for the YOUR_IDENTITY block.
 */
function build_ai_future_xml(entity, scoringContext = "", entities = {}) {
  const futures = entity?.future || [];
  if (futures.length === 0) return "";
  const formatted = temporal_engine.format(futures, scoringContext, { max_chars: 1500, vector_text: true });
  if (!formatted?.trim()) return "";
  return `    <FUTURE>${ind(prompt_builder.parse_macros(formatted, entity, entities), 6)}</FUTURE>`;
}

function render_character({ round, entities, input, compressed_snapshot, meta, render_atom }) {
  const pov_protocol = resolve_pov_protocol(entities?.AI);

  const protocols = [
    "COGNITION.PHASES",
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE",
    "AGENCY.USER_BOUNDARIES",
    "AGENCY.YES_AND",
    "AGENCY.MOMENTUM",
    "HYGIENE.MARKDOWN",
    "AGENCY.INITIATIVE",
    "HYGIENE.CONCISENESS",
    "AGENCY.FICTIONAL_LICENSE",
    pov_protocol,
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
<FRACTAL_FEED>
  <YOUR_IDENTITY name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
${build_dynamics_calibration(compressed_snapshot?.ai?.dynamics)}
    <PRESENT>${ind(val(entities?.AI?.present?.non_physical, entities?.AI, entities), 6)}</PRESENT>
    <PAST>${ind(render_atom.past(entities?.AI, { vector_text: true }), 6)}</PAST>
${build_ai_future_xml(entities?.AI, render_atom._context, entities)}
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <PRESENT>${ind(val(entities?.USER?.present?.non_physical, entities?.USER, entities), 6)}</PRESENT>
    <PAST>${ind(render_atom.past(entities?.USER, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities?.USER, { vector_text: true }), 6)}</FUTURE>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <PRESENT>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT>
    <PAST>${ind(render_atom.past(entities.FRACTAL, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.FRACTAL, { vector_text: true }), 6)}</FUTURE>
  </FRACTAL>`.trim()
      : ""
  }
</FRACTAL_FEED>
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER}
    </THINK_FORMAT>
    ${stability_lock_content ? `<STABILITY_LOCK>${stability_lock_content}</STABILITY_LOCK>\n    ` : ""}
    <EPISTEMIC_PHYSICS>
      ${ind(PROTOCOL_LIBRARY.EPISTEMIC_PHYSICS.RULES, 6)}
    </EPISTEMIC_PHYSICS>
    <POV_DIRECTIVE>
      ${PROTOCOL_LIBRARY.POV[pov_protocol.split(".")[1] || "FIRST_PERSON"]}
    </POV_DIRECTIVE>
    ${input?.trim() ? "Execute your reaction against <USER_ACTION>." : "Continue the scene, reacting to the current situation."} Stay fully in character. Honor all active <PROTOCOLS>.
    Aim for a length of roughly 2 paragraphs, adjusting as the context demands.
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * Ghostwriter prompt compiler.
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
function render_ghostwriter({ entities, input = "" }) {
  const user_name = entities?.USER?.name || "User Persona";
  const ai_name = entities?.AI?.name || "AI Character";
  const fractal_name = entities?.FRACTAL?.name || "Environment";

  const system = clean_xml(`
<SYSTEM role="${escape_xml(user_name)}">
You are drafting on behalf of ${escape_xml(user_name)} in an active scene with ${escape_xml(ai_name)} inside ${escape_xml(fractal_name)}.
  <YOUR_IDENTITY name="${escape_xml(user_name)}">
    <ETERNAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(ai_name)}">
    <ETERNAL>${val(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL>
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
    ${ind(prompt_builder.render_protocols(`AGENCY.USER_BOUNDARIES, AGENCY.PRESENT_TENSE, HYGIENE.MARKDOWN, AGENCY.FICTIONAL_LICENSE, ${resolve_pov_protocol(entities?.USER)}`), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
<TASK>
${
  input?.trim()
    ? `Enhance, expand, and polish the following draft text for ${escape_xml(user_name)} into a vivid, atmospheric action/dialogue:\n\n${escape_xml(input)}`
    : `Draft a compelling, in-character next action or vocal response for ${escape_xml(user_name)} in response to ${escape_xml(ai_name)}.`
}
Write strictly from ${escape_xml(user_name)}'s perspective and voice. Do not write dialogue, actions, or thoughts for ${escape_xml(ai_name)}. Do not describe ${escape_xml(ai_name)}'s reactions. Output only the raw text response or action. No preamble, no meta-commentary, no XML wrappers.
</TASK>
  `).trim();

  return { system, task };
}

/**
 * Prologue / Epilogue narration compiler.
 * @param {"prologue"|"epilogue"} mode
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
function render_narrator(mode, { entities, render_atom, compressed_snapshot, round = null, input = null }) {
  const task_text =
    mode === "prologue"
      ? `${PROTOCOL_LIBRARY.SCENE.PROLOGUE}\n    Input: ${escape_xml(input?.trim() || "The scene begins.")}`
      : PROTOCOL_LIBRARY.SCENE.EPILOGUE;
  const fractal_name = entities?.FRACTAL?.name || "Environment";

  const system = clean_xml(`
<SYSTEM role="${escape_xml(fractal_name)}" mode="${mode.toUpperCase()}">${render_narrative_style_xml()}
  <YOUR_IDENTITY name="${escape_xml(fractal_name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
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
      <PRESENT>${ind(val(entities?.USER?.present?.non_physical, entities?.USER, entities), 8)}</PRESENT>
      <ETERNAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
      <PAST>${ind(render_atom?.past(entities?.USER, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom?.future(entities?.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("COGNITION.PHASES, AGENCY.PRESENT_TENSE, HYGIENE.PROSE, AGENCY.MOMENTUM, HYGIENE.MARKDOWN, AGENCY.FICTIONAL_LICENSE, POV.THIRD_PERSON"), 4)}
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
    <POV_DIRECTIVE>${PROTOCOL_LIBRARY.POV.NARRATOR}</POV_DIRECTIVE>
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * Renders a single entity's memory-forge context block (eternal + present state).
 * @param {string} key
 * @param {any} entity
 * @returns {string}
 */
function render_entity_memory_context(key, entity) {
  if (!entity) return "";
  const name = escape_xml(entity?.name || key);
  return clean_xml(`
  <${key} name="${name}">
    <NAME>${name}</NAME>
    <ETERNAL_PHYSICAL>
      ${ind(
        physical_to_xml(entity?.eternal?.physical, "ETERNAL_PHYSICAL")
          .replace(/<ETERNAL_PHYSICAL>|<\/ETERNAL_PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </ETERNAL_PHYSICAL>
    <ETERNAL_NON_PHYSICAL>${escape_xml(entity?.eternal?.non_physical || "")}</ETERNAL_NON_PHYSICAL>
    <PRESENT_PHYSICAL>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PRESENT_PHYSICAL")
          .replace(/<PRESENT_PHYSICAL>|<\/PRESENT_PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </PRESENT_PHYSICAL>
    <PRESENT_NON_PHYSICAL>${escape_xml(entity?.present?.non_physical || "")}</PRESENT_NON_PHYSICAL>
  </${key}>
  `).trim();
}

/**
 * Turn memory compilation template.
 * @param {any} params
 * @returns {string}
 */
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
    Compress this history into structured memories. Record internal evaluation inside "_thought_process" at the top of the JSON object.
    Forge ONE memory per entity (AI_CHARACTER, USER_PERSONA, FRACTAL), each written strictly from that entity's own perspective — the directive must capture the entity's subjective take on the events, not a shared summary.
    For each memory choose a "type":
      "past"    = a settled historical anchor (default).
      "future"  = a prophecy, intent, or goal the entity is carrying forward, to be resolved later.
      "present" = an immediate directive describing the entity's current state, to be enacted now.
    Output strict JSON matching this schema:
    ${MEMORY_JSON_SCHEMA}
  </TASK>
</SYSTEM>
  `).trim();
}

/**
 * Text field enhancement instructions builder.
 * @param {any} params
 * @returns {string}
 */
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
  <ENTITY_CONTEXT>
    <ETERNAL_PHYSICAL>
      ${ind(
        physical_to_xml(entity?.eternal?.physical, "ETERNAL_PHYSICAL")
          .replace(/<ETERNAL_PHYSICAL>|<\/ETERNAL_PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </ETERNAL_PHYSICAL>
    <ETERNAL_NON_PHYSICAL>${escape_xml(entity?.eternal?.non_physical || "")}</ETERNAL_NON_PHYSICAL>
    <PRESENT_PHYSICAL>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PRESENT_PHYSICAL")
          .replace(/<PRESENT_PHYSICAL>|<\/PRESENT_PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </PRESENT_PHYSICAL>
    <PRESENT_NON_PHYSICAL>${escape_xml(entity?.present?.non_physical || "")}</PRESENT_NON_PHYSICAL>
    <PAST>
      ${ind(escape_xml(entity?.past?.length ? temporal_engine.format(entity.past, content || "", { max_chars: 800 }) : ""), 6)}
    </PAST>
    <FUTURE>
      ${ind(escape_xml(entity?.future?.length ? temporal_engine.format(entity.future, content || "", { max_chars: 800 }) : ""), 6)}
    </FUTURE>
  </ENTITY_CONTEXT>
  <INPUT_CONTENT>
    ${ind(escape_xml(content), 4)}
  </INPUT_CONTENT>
</SYSTEM>
  `).trim();
}

/**
 * Profile Sorting extraction instructions builder.
 * @param {string} [entity_type]
 * @returns {string}
 */
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

// ============================================================================
// 4. DATA PROCESSORS
// ============================================================================

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
        const formatted = temporal_engine.format(entity.past || [], scoring_context, {
          offset: 0,
          max_chars: 1500,
          ...options,
        });
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      future: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(entity.future || [], scoring_context, {
          offset: 0,
          max_chars: 1500,
          ...options,
        });
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
      .map((c) => `    <entry role="${c.role}"${c.name ? ` name="${escape_xml(c.name)}"` : ""}>${escape_xml(c.content)}</entry>`)
      .join("\n");
  },
};

// ============================================================================
// 5. EXPORT API
// ============================================================================

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
        vectors: {
          past: temporal_engine.score(payload.entities?.AI?.past || [], render_atom._context).slice(0, 5),
          future: temporal_engine.score(payload.entities?.AI?.future || [], render_atom._context).slice(0, 5),
        },
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
        field_id,
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
  build_dynamics_calibration,
  build_dynamics_legend,
  render_character,
  render_director,
  render_enhancement,
  render_ghostwriter,
  render_narrator,
  render_profile_sorting,
};
