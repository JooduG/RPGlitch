/**
 * src/intelligence/prompts.js
 * 🧠 INTELLIGENCE KERNEL PROMPT SYNTHESIZER
 * Centralized assembly line for the Intelligence Kernel.
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */
import { ind, prompt_escape, state_bridge, escape_xml, physical_to_xml } from "@utils";
import { NARRATIVE_STYLES, PROTOCOL_LIBRARY } from "@data";
import { DYNAMICS_META, build_signals_xml } from "./dynamics.js";
import { ENTITY_CATALOG, ENTITY_FRAGMENTS } from "../data/definitions/fragments.js";
import { clean_xml, collapse_history, strip_cognition_blocks } from "./parser.js";
import { temporal_engine, resolve_vector_pool } from "./temporal.js";

// PROTOCOL_LIBRARY is defined in @data/definitions/protocols.js and re-exported here
// so both @intelligence and @media share the same catalog without cross-layer
// import violations.
export { PROTOCOL_LIBRARY };

/** @type {string | null} */
let cached_dynamics_legend = null;
/** @type {Map<string, string>} */
const protocols_cache = new Map();

// --- JSON Schema Templates ---

const DIRECTOR_JSON_SCHEMA = `{
  "_thought_process": "<ONE short sentence: the key state change this turn>",
  "directive": "<Optional in-character stage direction for the AI_CHARACTER (under 30 words, or empty string). Never reveal hidden agendas as fact.>",
  "AI_CHARACTER": {
    "present_append": {
      "physical": "New physical changes (e.g. bleeding, or explicit clothing updates like [SHIRT: none]), or empty string.",
      "non_physical": "Immediate internal shifts or emotional reactions, or empty string."
    },
    "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
  },
  "USER_PERSONA": {
    "present_append": { "physical": "", "non_physical": "" }
  },
  "FRACTAL": {
    "present_append": { "physical": "", "non_physical": "" },
    "dynamics_deltas": { "entropy": 0, "velocity": 0 }
  },
  "trigger_image": "false"
}`;

const MEMORY_JSON_SCHEMA = `{
  "_thought_process": "<one short sentence>",
  "AI_CHARACTER": {
    "eternal_consolidated": { "physical": "Permanent physical change or empty string", "non_physical": "Permanent psychological shift or empty string" },
    "present_consolidated": { "physical": "Clean updated physical state (or empty if unchanged)", "non_physical": "Clean updated mental/emotional baseline (or empty if unchanged)" },
    "future_consolidated": "REQUIRED: the standing agenda rewritten from this history (intent, prophecy, looming threat, impulse) as 2-5 sentences of active future tense — must differ from the old agenda whenever events changed it; never echo it verbatim",
    "vector_append": [ { "content": "ONLY if a durable fact emerged worth keeping (EMPTY LIST otherwise; AT MOST 1 ITEM)", "type": "past", "emotional_weight": 5 } ]
  },
  "USER_PERSONA": {
    "eternal_consolidated": { "physical": "", "non_physical": "" },
    "present_consolidated": { "physical": "", "non_physical": "" },
    "future_consolidated": "REQUIRED: the standing agenda rewritten from this history (2-5 sentences, active future tense) — drop goals this history fulfilled, refresh the rest; never echo the old text verbatim",
    "vector_append": [ { "content": "ONLY if a durable fact emerged worth keeping (EMPTY LIST otherwise; AT MOST 1 ITEM)", "type": "past", "emotional_weight": 5 } ]
  },
  "FRACTAL": {
    "eternal_consolidated": { "physical": "", "non_physical": "" },
    "present_consolidated": { "physical": "", "non_physical": "" },
    "future_consolidated": "REQUIRED: the world standing agenda — environmental prophecy, looming threat, or impulse — rewritten from this history (2-5 sentences, active future tense). Resolved threats/prophecies MUST be dropped and replaced by their aftermath; never leave the world agenda unchanged and never echo the old text verbatim",
    "vector_append": [ { "content": "ONLY if a durable fact/environmental shift emerged (EMPTY LIST otherwise; AT MOST 1 ITEM)", "type": "past", "emotional_weight": 5 } ]
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
 * Safely evaluates, parses, and escapes an entity fragment value.
 * @param {any} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
const render_field_value = (text, owner, entities) => {
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
  let base;
  if (typeof intensity === "number" && intensity > 70) {
    base = "Aim for roughly 1\u20132 short, clipped paragraphs \u2014 high energy compresses prose into urgent beats.";
  } else if (typeof intensity === "number" && intensity < 30) {
    base = "Aim for up to 3 paragraphs, drawn out with heavy, deliberate detail.";
  } else {
    base = "Aim for a length of roughly 2 paragraphs, adjusting as the context demands.";
  }
  return `${base} Always end your response with a complete sentence — never stop mid-thought or mid-quote.`;
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
function render_director({ round, entities, input, render_accessors, compressed_snapshot, raw_messages }) {
  const protocols = ["FORMATS.JSON_ONLY", "AGENCY.FICTIONAL_LICENSE", "DIRECTOR.CONTINUITY", "DIRECTOR.PLOT_DRIVE", "DIRECTOR.IMAGE_TRIGGERS"]
    .filter(Boolean)
    .join(", ");
  const dynamics_legend = build_dynamics_legend();

  const system = clean_xml(`
<SYSTEM role="DIRECTOR">
  You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.
  
  ${ind(dynamics_legend, 2)}

  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <PRESENT>
        <PHYSICAL>${ind(render_field_value(entities?.AI?.present?.physical, entities?.AI, entities), 8)}</PHYSICAL>
        <NON_PHYSICAL>${ind(render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities), 8)}</NON_PHYSICAL>
      </PRESENT>
      <ETERNAL>
        <PHYSICAL>${render_field_value(entities?.AI?.eternal?.physical, entities?.AI, entities)}</PHYSICAL>
        <NON_PHYSICAL>${render_field_value(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</NON_PHYSICAL>
      </ETERNAL>
      <PAST>${ind(render_accessors.past(entities?.AI, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_accessors.future(entities?.AI, { vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PRESENT>
        <PHYSICAL>${ind(render_field_value(entities?.USER?.present?.physical, entities?.USER, entities), 8)}</PHYSICAL>
        <NON_PHYSICAL>${ind(render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities), 8)}</NON_PHYSICAL>
      </PRESENT>
      <ETERNAL>
        <PHYSICAL>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PHYSICAL>
        <NON_PHYSICAL>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</NON_PHYSICAL>
      </ETERNAL>
      <PAST>${ind(render_accessors.past(entities?.USER, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_accessors.future(entities?.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics, { cognitive: false })}>
    <PRESENT>
      <PHYSICAL>${render_field_value(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</PHYSICAL>
      <NON_PHYSICAL>${render_field_value(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</NON_PHYSICAL>
    </PRESENT>
    <ETERNAL>
      <PHYSICAL>${render_field_value(entities.FRACTAL.eternal?.physical, entities.FRACTAL, entities)}</PHYSICAL>
      <NON_PHYSICAL>${render_field_value(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</NON_PHYSICAL>
    </ETERNAL>
    <PAST>${ind(render_accessors.past(entities.FRACTAL, { vector_text: true }), 6)}</PAST>
    <STANDING_OBJECTIVE>${ind(render_accessors.future(entities.FRACTAL, { vector_text: true }), 6)}</STANDING_OBJECTIVE>
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
  const last_ai = (raw_messages || []).filter((m) => m.role === "model").slice(-1)[0];
  if (!last_ai) return "";
  const text = strip_cognition_blocks(last_ai.content || last_ai.text || "").trim();
  if (!text) return "";
  return `<AI_LAST_TURN>${ind(text, 2)}</AI_LAST_TURN>`;
})()}
<TASK>
    Evaluate state mutations caused by ${input?.trim() ? "<USER_ACTION>" : "the current situation"}.
    Record your reasoning inside "_thought_process" and return a single valid JSON object following this exact schema:
    ${DIRECTOR_JSON_SCHEMA}
    Obey all active <PROTOCOLS>. Keep output under 800 characters and return strictly JSON.
</TASK>
  `).trim();

  return { system, task };
}

function build_ai_future_xml(entity, _scoring_context = "", entities = {}) {
  const text = String(entity?.future || "").trim();
  if (!text) return "";
  return `    <FUTURE>${ind(prompt_builder.parse_macros(text, entity, entities), 6)}</FUTURE>`;
}

function render_character({ round, entities, input, compressed_snapshot, meta, render_accessors, ghostwrite = false, director_data }) {
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
    "HYGIENE.BANNED_TROPES",
    "HYGIENE.PROSE_STRUCTURE",
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
    <ETERNAL>${render_field_value(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <ETERNAL>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}">
    <ETERNAL>${render_field_value(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL>
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
    <PRESENT>${ind(render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities), 6)}</PRESENT>
    ${entities?.AI?.immediate_intent ? `<IMMEDIATE_INTENT>${ind(escape_xml(entities.AI.immediate_intent), 6)}</IMMEDIATE_INTENT>\n    ` : ""}<PAST>${ind(render_accessors.past(entities?.AI, { vector_text: true }), 6)}</PAST>
${build_ai_future_xml(entities?.AI, render_accessors._context, entities)}
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <PRESENT>${ind(render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities), 6)}</PRESENT>
    <PAST>${ind(render_accessors.past(entities?.USER, { vector_text: true }), 6)}</PAST>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics, { cognitive: false })}>
    <PRESENT>${render_field_value(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT>
    <PAST>${ind(render_accessors.past(entities.FRACTAL, { vector_text: true }), 6)}</PAST>
    <STANDING_OBJECTIVE>${ind(render_accessors.future(entities.FRACTAL, { vector_text: true }), 6)}</STANDING_OBJECTIVE>
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
    AI: entities?.USER ? entities.USER : { name: user_name, present: {}, eternal: {}, future: "", past: [] },
    USER: entities?.AI ? entities.AI : { name: ai_name, present: {}, eternal: {}, future: "", past: [] },
  };

  const render_accessors = render_builder.create_render_accessors(swapped, input || "", []);
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
    render_accessors,
    ghostwrite: true,
  });

  const draft_directive = input?.trim()
    ? `Enhance, expand, and polish the following draft written by ${escape_xml(user_name)} into vivid, atmospheric action/dialogue:\n    ${escape_xml(input.trim())}`
    : `Draft a compelling, in-character next action or vocal response for ${escape_xml(user_name)} in response to ${escape_xml(ai_name)}.`;

  rendered.task += clean_xml(`
<GHOSTWRITE>
    ${draft_directive}
    Write strictly from ${escape_xml(user_name)}'s perspective and voice: only their physical actions, dialogue, sensations, and internal states.
    Do not write dialogue, actions, or thoughts for ${escape_xml(ai_name)}. Also do not write their body language, expressions, or reactions — never narrate how the other character looks or feels in response to you.
    Output only the raw text — no preamble, no meta-commentary, no XML wrappers.
</GHOSTWRITE>
  `);

  return rendered;
}

function build_narrator(mode, { entities, render_accessors, compressed_snapshot, round = null, input = null }) {
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
    <PRESENT>${render_field_value(entities?.FRACTAL?.present?.non_physical, entities?.FRACTAL, entities)}</PRESENT>
    <ETERNAL>${render_field_value(entities?.FRACTAL?.eternal?.non_physical, entities?.FRACTAL, entities)}</ETERNAL>
    <PAST>${ind(render_accessors?.past(entities?.FRACTAL, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_accessors?.future(entities?.FRACTAL, { vector_text: true }), 6)}</FUTURE>
  </YOUR_IDENTITY>
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <PRESENT>${render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities)}</PRESENT>
      <ETERNAL>${render_field_value(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL>
      <PAST>${ind(render_accessors?.past(entities?.AI, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_accessors?.future(entities?.AI, { vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PRESENT>${render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities)}</PRESENT>
      <ETERNAL>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
      <PAST>${ind(render_accessors?.past(entities?.USER, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_accessors?.future(entities?.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("COGNITION.PHASES, AGENCY.PRESENT_TENSE, HYGIENE.PROSE, AGENCY.MOMENTUM, HYGIENE.MARKDOWN, HYGIENE.BANNED_TROPES, HYGIENE.PROSE_STRUCTURE, AGENCY.FICTIONAL_LICENSE"), 4)}
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
    <FUTURE>${escape_xml(String(entity?.future || "").trim())}</FUTURE>
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
    ${(() => {
      // Downsample the slice so the model has room to emit a complete (untruncated)
      // consolidation JSON: keep the last 6 entries, each trimmed to ~400 chars.
      const rows = Array.isArray(history) ? history.slice(-6) : [];
      const compact = rows.map((m) => ({
        role: m?.role || "",
        character_name: m?.character_name || "",
        text: String(m?.text ?? m?.content ?? "").slice(0, 400),
      }));
      return JSON.stringify(compact, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    })()}
  </INPUT_HISTORY>
  <TASK>
    Compress this history into structured state updates and temporal vectors. Record internal evaluation inside "_thought_process" at the top of the JSON object.
    For each active entity (AI_CHARACTER, USER_PERSONA, FRACTAL):
      - "eternal_consolidated": Record permanent identity, psychological, or physical changes to baseline form (or empty string).
      - "present_consolidated": Rewrite a clean, updated physical and non-physical state, discarding expired temporary deltas. MANDATORY FOR PHYSICAL STATE: You MUST retain physical attire/clothing (e.g. [CLOTHING: flight suit], [SHIRT: cargo jacket]) and active equipment/implants/containers (e.g. [EQUIPMENT: scrap-tech arm, bio-tank]) unless explicitly destroyed or disrobed.
      - "future_consolidated": Rewrite the entity's standing agenda as ONE clean block of 2-5 sentences (active future tense). Read the entity's current <FUTURE> text above; CRITICAL STALE GOAL EVICTION LAW: If a goal or standing agenda objective was FULFILLED, COMPLETED, or ELAPSED in recent turns, you MUST DROP IT completely (and record what actually happened as a "past" vector instead), sharpen whatever still matters, and fold in at most one genuinely new intent. NEVER retain a fulfilled goal in "future_consolidated". This field is REQUIRED for every active entity this batch — never omit it. For FRACTAL entities, you MUST rewrite the standing agenda so world events and environmental prophecies advance; do not leave the world agenda unchanged. When an event resolves a prophecy or threat, that agenda item must be dropped and REPLACED by its aftermath — a resolved "eclipse in 3 days" must become the post-eclipse state, never remain verbatim.
      - "vector_append": Add settled historical anchors (memories) written strictly from that entity's own perspective — a "past" vector is a concrete event or fact that already happened and must be remembered. No future items: the agenda lives in "future_consolidated". HIGH THRESHOLD FOR FRACTAL: For FRACTAL entities, vector_append is strictly restricted to MAJOR structural shifts or cataclysmic chapter transitions (e.g. facility destruction). Do NOT record minor room breaches, vent entries, or security alarms as past vectors for the Fractal — leave vector_append as an EMPTY LIST [] for standard turns.
    FACT RETENTION (mandatory — facts outrank feelings):
      - Concrete facts MUST survive: proper nouns (names, places, organizations, facilities, rooms), numbers (years, counts, floor levels, prices), named objects (files, devices, blueprints, vats), cause/effect chains, and promises or agreements.
      - Encode settled facts as "past" vectors even when they carry no emotion — a dry, factual anchor beats an eloquent omission. The current emotional color is secondary and may be dropped; the facts may not.
      - Shared mission facts (contract terms, meeting codes, agreed meeting places, deadlines, and the plan the AI character is part of) must ALSO be encoded as AI_CHARACTER "past" vectors — the character remembers the job, not just the feelings.
      - When in doubt about whether a fact will matter later, retain it. Missing facts corrupt long-form continuity.
    CRITICAL OUTPUT CONSTRAINT (failure to obey will corrupt memory):
      - Output ONLY the JSON object. No code fences, no prose, no trailing commas.
      - Keep the ENTIRE JSON under 1800 characters. Omit any truly unchanged optional field; "_thought_process" must be one short clause. Never omit "future_consolidated" for an active entity — if you must cut something to fit, cut eternal_consolidated or vector_append extras first.
      - Never truncate — a complete smaller JSON beats a large cut-off one. If you run out of room, drop vector_append before dropping the closing brace.
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

  if (field_id === "past") {
    const vectors = resolve_vector_pool(entity).filter((v) => v?.type !== "future");
    const text = vectors.length ? temporal_engine.format(vectors, content || "", { max_chars: 1500 }) : "";
    return clean_xml(`
  <ENTITY_CONTEXT>
    <PAST>
      ${ind(escape_xml(text), 6)}
    </PAST>
  </ENTITY_CONTEXT>
  `).trim();
  }

  if (field_id === "future") {
    const text = String(entity?.future || "").trim();
    return clean_xml(`
  <ENTITY_CONTEXT>
    <FUTURE>
      ${ind(escape_xml(text), 6)}
    </FUTURE>
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

const render_builder = {
  create_render_accessors(entities = {}, input = "", raw_messages = []) {
    const resolve = (ref) => (typeof ref === "string" ? entities[ref] || entities.AI || {} : ref || {});
    const scoring_context = `${input || ""} ${(Array.isArray(raw_messages) ? raw_messages : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ")}`.trim();

    const vector_pool = (entity) => (Array.isArray(entity?.memories) && entity.memories.length ? entity.memories : resolve_vector_pool(entity));

    return {
      _context: scoring_context,
      past: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(
          vector_pool(entity).filter((v) => v?.type !== "future"),
          scoring_context,
          {
            offset: 0,
            max_chars: 1500,
            ...options,
          },
        );
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      future: (ref) => {
        const entity = resolve(ref);
        // FUTURE is a single consolidated prose field, rendered verbatim.
        return prompt_builder.parse_macros(String(entity?.future || "").trim(), entity, entities);
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
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = render_director({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
      },
    };
  },
  build_character_prompt(payload, snapshot, director_data) {
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = render_character({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        memories: temporal_engine.score(payload.entities?.AI?.memories || [], render_accessors._context).slice(0, 5),
      },
    };
  },
  build_prologue(payload, snapshot) {
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    if (payload.type === "prologue") {
      const rendered = build_narrator("prologue", {
        ...payload,
        render_accessors,
        compressed_snapshot: snapshot,
      });
      return {
        system: prompt_builder.clean_prompt_text(rendered.system),
        task: prompt_builder.clean_prompt_text(rendered.task),
        meta: {},
      };
    }
    return prompt_builder.build_character_prompt(payload, snapshot, {});
  },
  create_render_accessors: render_builder.create_render_accessors,
  render_history: render_builder.render_history,
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
  clean_prompt_text(str) {
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
    const rendered = build_narrator("epilogue", {
      entities: safe_entities,
      render_accessors: prompt_builder.create_render_accessors(safe_entities, "", recent_history),
      compressed_snapshot: {
        ai: { dynamics: dynamics?.ai },
        fractal: { dynamics: dynamics?.fractal },
      },
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
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
  build_narrator,
  render_profile_sorting,
};

if (typeof window !== "undefined") {
  window.prompt_builder = prompt_builder;
}
