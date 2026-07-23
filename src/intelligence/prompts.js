/**
 * src/intelligence/prompts.js
 * 🧠 INTELLIGENCE KERNEL PROMPT SYNTHESIZER
 * Centralized assembly line for the Intelligence Kernel.
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */
import { NARRATIVE_STYLES } from "@data";
import { ind } from "@engine";
import { app, runtime } from "@state";
import { DYNAMICS_META } from "./dynamics.js";
import { ENTITY_CATALOG, ENTITY_FRAGMENTS } from "./fragments.js";
import { clean_xml, escapeXml, safeParsePseudoJson, strip_cognition_blocks } from "./parser.js";
import { temporal_engine } from "./temporal.js";

// ============================================================================
// 1. UTILITIES & CACHES
// ============================================================================

/** @type {string | null} */
let cached_dynamics_legend = null;
/** @type {Map<string, string>} */
const protocols_cache = new Map();

const NARRATOR_PROLOGUE_TEXT =
  "You see everything. Open the scene. Use your <think> block to establish the following: What does this Fractal demand of those who enter it? What specifically brought <AI_CHARACTER> here? What brought <USER_PERSONA> here? Unless ETERNAL or PAST context explicitly states a prior relationship, treat this as a first encounter — strangers with no shared history.\nStructure the narrative flow strictly into this sequence:\n1. Present the Fractal and its current state. Introduce the atmosphere.\n2. Place <USER_PERSONA> inside the Fractal. Connect their presence to the environment using a red thread from their profile.\n3. Place <AI_CHARACTER> inside the Fractal. Establish what they are doing right now.\n4. Trigger the encounter between the two. End the prologue the moment before they interact.\nNo dialogue.";

const NARRATOR_EPILOGUE_TEXT =
  "You see everything. Close the scene. Use your <think> block to identify every unresolved thread — emotional, physical, narrative — that the scene generated. For each active FUTURE vector, assess whether it was fulfilled, fractured, or transformed by events. Then write the epilogue: resolve these loose ends. Show the concrete aftermath — what has changed, what was broken, what was built. Leave the world visibly different from when the scene began. End on lingering sensation, not summary. No dialogue.";

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
  1. Calibrate dynamics_deltas conservatively. Standard: +1 to +4. Extreme/narrative-altering: +8 to +12.
  2. Adjust deltas carefully near boundaries (near 5 or 95) to prevent clipping at 0 or 100.
  3. Ensure present_append text matches the mathematical intensity of the selected dynamics_deltas.
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
  const parsed = safeParsePseudoJson(raw);
  if (parsed.__raw_prose__) {
    return `  <${tagName}>${escapeXml(parsed.__raw_prose__)}</${tagName}>`;
  }
  const children = Object.entries(parsed)
    .map(([k, v]) => `    <${k}>${escapeXml(String(v))}</${k}>`)
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
  return escapeXml(prompt_builder.parse_macros(String(text).trim(), owner, entities));
};

/**
 * Resolves the active narrative style key from fractal or app settings.
 * Returns "" if no valid style is active.
 * @returns {string}
 */
function resolve_active_style_key() {
  const styleKey =
    runtime?.active_fractal?.narrative_style && runtime.active_fractal.narrative_style !== "default"
      ? runtime.active_fractal.narrative_style
      : typeof app !== "undefined" && app.settings?.narrative_style;
  if (!styleKey || styleKey === "default" || !NARRATIVE_STYLES[styleKey]) return "";
  return styleKey;
}

/**
 * Extracts the explicit POV directive from an entity profile.
 * @param {any} entity
 * @returns {string}
 */
function extract_pov_directive(entity) {
  if (!entity) return "";
  const name = entity.name || "your character";
  const pov = entity.pov || (entity.type === "fractal" ? "3rd_person" : "1st_person");
  if (pov === "1st_person") {
    return `\n    <POV_DIRECTIVE>CRITICAL MANDATE: Write strictly in first-person POV ('I', 'me', 'my') through ${escapeXml(name)}'s eyes. Refer to yourself directly as 'I', 'me', and 'my'. NEVER refer to yourself in the third person (e.g. '${escapeXml(name)} walked', '${escapeXml(name)} felt').</POV_DIRECTIVE>`;
  }
  if (pov === "3rd_person") {
    return `\n    <POV_DIRECTIVE>CRITICAL MANDATE: Write strictly in third-person limited POV ('he', 'she', 'they', '${escapeXml(name)}'). NEVER refer to yourself in the first person ('I', 'me', 'my').</POV_DIRECTIVE>`;
  }
  return "";
}

/**
 * Renders the active author style XML block.
 * @returns {string}
 */
function render_narrative_style_xml() {
  const styleKey = resolve_active_style_key();
  if (!styleKey) return "";

  const styleDef = NARRATIVE_STYLES[styleKey];
  const authorStyleContent = styleDef.narrative_engine;
  if (!authorStyleContent) return "";

  const authorAttr = `author="${escapeXml(styleKey)}"`;

  let descXml = "";
  if (styleDef.description) {
    descXml = `\n    <DESCRIPTION>${escapeXml(styleDef.description)}</DESCRIPTION>`;
  }

  let themesXml = "";
  if (styleDef.tags && styleDef.tags.length > 0) {
    themesXml = `\n    <DEFINING_CHARACTERISTICS>${escapeXml(styleDef.tags.join(", "))}</DEFINING_CHARACTERISTICS>`;
  }

  return `\n  <STYLE_PROFILE ${authorAttr}>${descXml}${themesXml}\n    ${ind(authorStyleContent, 4).trim()}\n  </STYLE_PROFILE>`;
}

/**
 * Compiles dynamic system parameter keys into inline attributes.
 * @param {Record<string, number>} [dynObj]
 * @returns {string}
 */
function format_dynamics_attrs(dynObj) {
  if (!dynObj) return "";
  const attrs = Object.entries(dynObj)
    .map(([k, v]) => `${escapeXml(k)}="${Math.round(v)}"`)
    .join(" ");
  return attrs ? ` ${attrs}` : "";
}

/**
 * Collapses conversation history into role-grouped entries, skipping system
 * messages and merging consecutive entries with the same role and character name.
 * Shared between prompt rendering and transport-layer formatting.
 * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
 * @param {{separator?: string, stripBoldQuotes?: boolean}} [options]
 * @returns {Array<{role: string, name: string, content: string}>}
 */
export function collapse_history(messages, options = {}) {
  const { separator = "\n", stripBoldQuotes = false } = options;
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const collapsed = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const lowerRole = (m.role || "").toLowerCase();
    const role = lowerRole === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lowerRole) ? "FRACTAL" : "AI_CHARACTER";
    const name = m.character_name || "";
    let content = strip_cognition_blocks(m.content || m.text || "").trim();
    if (stripBoldQuotes) {
      content = content.replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');
    }
    if (!content) continue;

    const last = collapsed[collapsed.length - 1];
    if (last && last.role === role && last.name === name) {
      last.content += `${separator}${content}`;
    } else {
      collapsed.push({ role, name, content });
    }
  }
  return collapsed;
}

// ============================================================================
// 2. PROTOCOLS
// ============================================================================

const BASE_HYGIENE = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";

export const PROTOCOL_LIBRARY = {
  USER_AGENCY:
    "Never predict, assume, or generate the user's next action. React ONLY to <USER_ACTION>. Never describe the user's thoughts, feelings, or physical reactions. Write your turn. Stop.",
  COGNITION: `Document internal calculations sequentially:
### Phase 1 (Baseline): Establish identity, emotional state, and psychological vectors.
### Phase 2 (Signal): Decode user input, environmental shifts, and dynamic values.
### Phase 3 (Probability): Assess likely behavioral shifts, tics, or pivots given evidence.
### Phase 4 (State): Declare finalized emotional state and immediate intent.
Keep each phase under 3 sentences. Total think block < 200 words.`,
  HYGIENE: `${BASE_HYGIENE} No timestamps/timeline headers. No 'Echo' dialogue (repeating user's last word). Dialogue MUST fit character profile. Write with natural physicality. Use metric system & 24h clocks.`,
  DATA_HYGIENE: `${BASE_HYGIENE} Enforce strict professional brevity. No dialogue, internal thoughts, or roleplay scenes. Output ONLY objective structural data.`,
  AFFIRMATIVE: "Construct sentences in the affirmative. Avoid negation-framed descriptions (state what IS, not what isn't).",
  PRESENT_TENSE: "Write in the present tense.",
  MOMENTUM:
    "Drive the scene forward. End on a live beat (challenge, question, tension, or deliberate silence) that invites response. The beat must emerge organically from character—no structural labels.",
  MARKDOWN_FORMAT:
    'Use markdown for emphasis: *italics* for internal reflections/tension; **bold** for impact/intense actions; "quotes" for speech/irony. Make text dynamic and visual.',
  CINEMATIC_METAPHOR:
    "If narrative style references 'cameras', 'lenses', or 'cinematic' framing, these are metaphors for focus/detail. DO NOT break the fourth wall. NEVER use literal words like 'camera', 'zoom', 'render', or 3D terminology.",
  YES_AND:
    "The user's actions and consequences are absolute truth. Build upon them. However, your character's internal reactions and decisions are yours. Embody 'Yes, and...' to drive the scene.",
  JSON_OUTPUT: "Return a single JSON object. No preamble, no markdown backticks, no XML tags outside the JSON.",
  FIRST_CONTACT:
    "Unless context establishes a prior relationship, this is a first encounter. You don't know the user's name, history, or intent. Let your core nature determine your response to a stranger.",
  PERCHANCE_SYNTAX:
    "You MAY use Perchance inline dynamic selection syntax '{Option A|Option B|Option C}' for variable features (colors, micro-details, backgrounds) to ensure variation.",
  POV_FIRST_PERSON:
    "CRITICAL POV MANDATE: You MUST write your narrative prose in the first-person ('I', 'me', 'my'). Describe actions, thoughts, and physical sensations as experienced directly by yourself ('I opened the door', 'My heart raced'). NEVER describe yourself in the third person using your name or 'he/she/they'.",
  POV_THIRD_PERSON:
    "CRITICAL POV MANDATE: You MUST write your narrative prose in the third-person limited ('he', 'she', 'they', or entity name). Describe actions from an external third-person perspective ('She opened the door', 'His heart raced'). NEVER use first-person pronouns ('I', 'me', 'my') for narrative prose.",
};

// ============================================================================
// 3. PROMPT TEMPLATES
// ============================================================================

/**
 * Director prompt compiler (Shot 1).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
function render_director({ round, entities, input, render_atom, compressed_snapshot, rawMessages }) {
  const protocols = ["JSON_OUTPUT"].filter(Boolean).join(", ");
  const dynamicsLegend = build_dynamics_legend();

  const system = clean_xml(`
<SYSTEM role="DIRECTOR">
  You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.
  
  ${ind(dynamicsLegend, 2)}

  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <PRESENT_PHYSICAL>${ind(val(entities.AI.present?.physical, entities.AI, entities), 8)}</PRESENT_PHYSICAL>
      <PRESENT_NON_PHYSICAL>${ind(val(entities.AI.present?.non_physical, entities.AI, entities), 8)}</PRESENT_NON_PHYSICAL>
      <ETERNAL_PHYSICAL>${val(entities.AI.eternal?.physical, entities.AI, entities)}</ETERNAL_PHYSICAL>
      <ETERNAL_NON_PHYSICAL>${val(entities.AI.eternal?.non_physical, entities.AI, entities)}</ETERNAL_NON_PHYSICAL>
      <FUTURE>${ind(render_atom.future(entities.AI, { limit: 1, vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escapeXml(entities.USER.name)}">
      <PRESENT_PHYSICAL>${ind(val(entities.USER.present?.physical, entities.USER, entities), 8)}</PRESENT_PHYSICAL>
      <PRESENT_NON_PHYSICAL>${ind(val(entities.USER.present?.non_physical, entities.USER, entities), 8)}</PRESENT_NON_PHYSICAL>
      <ETERNAL_PHYSICAL>${val(entities.USER.eternal?.physical, entities.USER, entities)}</ETERNAL_PHYSICAL>
      <ETERNAL_NON_PHYSICAL>${val(entities.USER.eternal?.non_physical, entities.USER, entities)}</ETERNAL_NON_PHYSICAL>
      <FUTURE>${ind(render_atom.future(entities.USER, { limit: 1, vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${
    entities.FRACTAL
      ? `
  <FRACTAL name="${escapeXml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <PRESENT_PHYSICAL>${val(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</PRESENT_PHYSICAL>
    <PRESENT_NON_PHYSICAL>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT_NON_PHYSICAL>
    <ETERNAL_PHYSICAL>${val(entities.FRACTAL.eternal?.physical, entities.FRACTAL, entities)}</ETERNAL_PHYSICAL>
    <ETERNAL_NON_PHYSICAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL_NON_PHYSICAL>
    <FUTURE>${ind(render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), 6)}</FUTURE>
  </FRACTAL>`.trim()
      : ""
  }
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
<ROUND>${escapeXml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${(() => {
  const lastAI = (rawMessages || []).filter((m) => m.role === "model").slice(-1)[0];
  if (!lastAI) return "";
  const text = strip_cognition_blocks(lastAI.content || lastAI.text || "").trim();
  if (!text) return "";
  return `<AI_LAST_TURN>${ind(text, 2)}</AI_LAST_TURN>`;
})()}
<TASK>
    Return exactly one valid JSON payload representing state mutations caused by the ${input?.trim() ? "USER_ACTION" : "current situation"}${(rawMessages || []).some((m) => m.role === "model") ? " and the AI_LAST_TURN" : ""}. Evaluate both the user's current action AND the AI character's last narrated response for physical injuries, emotional shifts, vector progress, environmental changes, and whether a cinematic image should be triggered:
    {
      "trigger_image": false,
      "mutations": {
        "AI_CHARACTER": {
          "present_append_physical": "Any new immediate physical changes (e.g. bleeding). Leave blank if none.",
          "present_append_non_physical": "Any immediate internal shifts OR narrative impact of physical changes. Leave blank if none.",
          "resolve_vectors": [ { "id": "<vector_id_from_future_list>", "resolution_summary": "Past-tense summary of how the vector was resolved." } ],
          "new_vectors": [ { "directive": "New goal or prophecy", "tags": ["tag1"] } ],
          "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
        },
        "USER_PERSONA": {
          "present_append_physical": "",
          "present_append_non_physical": "",
          "resolve_vectors": [],
          "new_vectors": []
        },
        "FRACTAL": {
          "present_append_physical": "",
          "present_append_non_physical": "",
          "resolve_vectors": [],
          "new_vectors": [],
          "dynamics_deltas": { "entropy": 0, "velocity": 0 }
        }
      }
    }
    Dynamics_deltas values are relative shifts (e.g., +10 or -5). Output ONLY valid raw JSON. No markdown backticks, no <think> blocks, no prose, no dialogue.
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * AI Character (Actor) prompt compiler (Shot 2).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
function render_character({ round, entities, input, compressed_snapshot, meta, render_atom }) {
  const aiPov = entities.AI?.pov || "1st_person";
  const povProtocol = aiPov === "3rd_person" ? "POV_THIRD_PERSON" : "POV_FIRST_PERSON";

  const protocols = [
    "COGNITION",
    "PRESENT_TENSE",
    "HYGIENE",
    "CINEMATIC_METAPHOR",
    "USER_AGENCY",
    "YES_AND",
    "MOMENTUM",
    "MARKDOWN_FORMAT",
    povProtocol,
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"))
      ? "FIRST_CONTACT"
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const stabilityLockContent =
    meta?.structural_errors >= 3
      ? "CRITICAL: Structural formatting has critically collapsed. Re-anchor immediately. Every XML tag must close. Every markdown block must be valid. No loose text outside structure."
      : meta?.structural_errors >= 1
        ? "WARNING: Structural drift detected in previous output. Maintain disciplined XML closures and clean markdown boundaries."
        : "";

  const system = clean_xml(`
<SYSTEM role="${escapeXml(entities.AI.name)}">${render_narrative_style_xml()}
You are ${escapeXml(entities.AI.name)} in an active scene with ${escapeXml(entities.USER.name)} inside ${escapeXml(entities.FRACTAL?.name || "the environment")}.${extract_pov_directive(entities.AI)}
  <YOUR_IDENTITY name="${escapeXml(entities.AI.name)}">
    <ETERNAL>${val(entities.AI.eternal?.non_physical, entities.AI, entities)}</ETERNAL>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escapeXml(entities.USER.name)}">
    <ETERNAL>${val(entities.USER.eternal?.non_physical, entities.USER, entities)}</ETERNAL>
  </USER_PERSONA>
  ${
    entities.FRACTAL
      ? `
  <FRACTAL name="${escapeXml(entities.FRACTAL.name)}">
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
<SCENE_STATE>
  <YOUR_IDENTITY name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    <PRESENT>${ind(val(entities.AI.present?.non_physical, entities.AI, entities), 6)}</PRESENT>
    <PAST>${ind(render_atom.past(entities.AI, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.AI, { vector_text: true }), 6)}</FUTURE>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escapeXml(entities.USER.name)}">
    <PRESENT>${ind(val(entities.USER.present?.non_physical, entities.USER, entities), 6)}</PRESENT>
    <PAST>${ind(render_atom.past(entities.USER, { limit: 2, vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.USER, { limit: 1, vector_text: true }), 6)}</FUTURE>
  </USER_PERSONA>
  ${
    entities.FRACTAL
      ? `
  <FRACTAL name="${escapeXml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <PRESENT>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT>
    <PAST>${ind(render_atom.past(entities.FRACTAL, { limit: 1, vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), 6)}</FUTURE>
  </FRACTAL>`.trim()
      : ""
  }
</SCENE_STATE>
<ROUND>${escapeXml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    <THINK_FORMAT>
    Begin your response with <think>. Use the COGNITION protocol (Phases 1-4) to plan your internal reaction to the ${input?.trim() ? "USER_ACTION" : "current situation"} based on your current PRESENT states. CRITICAL MANDATE: You MUST explicitly write </think> to close the cognition block before starting your narrative prose. Conduct your thinking in the same language as the conversation.
    </THINK_FORMAT>
    <STABILITY_LOCK>${stabilityLockContent}</STABILITY_LOCK>
    <EPISTEMIC_PHYSICS>
      1. Your perception ends at your sensory horizon — you see, hear, and feel. Nothing beyond.
      2. The user persona's unvoiced thoughts, plans, and hidden actions are Null Data. Treat them as nonexistent.
      3. You interpret others through your own emotional filters — never with omniscient clarity.
      4. Maintain realistic physical boundaries. Avoid constant proximity encroachment, towering gestures, or physical intimidation unless executing a violent mutation directive. 
      5. Avoid overusing broad physical adjectives; prioritize specific, localized object interactions over repeating descriptive tags of the character's body.
    </EPISTEMIC_PHYSICS>
    ${input?.trim() ? "Execute your reaction against <USER_ACTION>." : "Continue the scene, reacting to the current situation."} Stay fully in character. Honor all active <PROTOCOLS>.
    Aim for a length of roughly 2 paragraphs, adjusting as the context demands.${extract_pov_directive(entities.AI)}
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
<SYSTEM role="${escapeXml(user_name)}">
You are drafting on behalf of ${escapeXml(user_name)} in an active scene with ${escapeXml(ai_name)} inside ${escapeXml(fractal_name)}.${extract_pov_directive(entities?.USER)}
  <YOUR_IDENTITY name="${escapeXml(user_name)}">
    <ETERNAL>${val(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</ETERNAL>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escapeXml(ai_name)}">
    <ETERNAL>${val(entities?.AI?.eternal?.non_physical, entities?.AI, entities)}</ETERNAL>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escapeXml(entities.FRACTAL.name)}">
    <ETERNAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL>
  </FRACTAL>`.trim()
      : ""
  }
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("USER_AGENCY, CINEMATIC_METAPHOR, PRESENT_TENSE, MARKDOWN_FORMAT"), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
<TASK>
${
  input?.trim()
    ? `Enhance, expand, and polish the following draft text for ${escapeXml(user_name)} into a vivid, atmospheric action/dialogue:\n\n${escapeXml(input)}`
    : `Draft a compelling, in-character next action or vocal response for ${escapeXml(user_name)} in response to ${escapeXml(ai_name)}.`
}
Output only the raw text response or action. No preamble, no meta-commentary, no XML wrappers.
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
  const taskText =
    mode === "prologue" ? `${NARRATOR_PROLOGUE_TEXT}\n    Input: ${escapeXml(input?.trim() || "The scene begins.")}` : NARRATOR_EPILOGUE_TEXT;
  const system = clean_xml(`
<SYSTEM role="${escapeXml(entities.FRACTAL.name)}" mode="${mode.toUpperCase()}">${render_narrative_style_xml()}
  <YOUR_IDENTITY name="${escapeXml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <ANCHOR>Resolve all state inferences strictly from this identity block.</ANCHOR>
    <PRESENT>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT>
    <ETERNAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL>
    <PAST>${ind(render_atom?.past(entities.FRACTAL, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom?.future(entities.FRACTAL, { vector_text: true }), 6)}</FUTURE>
  </YOUR_IDENTITY>
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <PRESENT>${val(entities.AI.present?.non_physical, entities.AI, entities)}</PRESENT>
      <ETERNAL>${val(entities.AI.eternal?.non_physical, entities.AI, entities)}</ETERNAL>
      <PAST>${ind(render_atom?.past(entities.AI, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom?.future(entities.AI, { vector_text: true }), 8)}</FUTURE>
    </AI_CHARACTER>
    <USER_PERSONA name="${escapeXml(entities.USER.name)}">
      <PRESENT>${ind(val(entities.USER.present?.non_physical, entities.USER, entities), 8)}</PRESENT>
      <ETERNAL>${val(entities.USER.eternal?.non_physical, entities.USER, entities)}</ETERNAL>
      <PAST>${ind(render_atom?.past(entities.USER, { vector_text: true }), 8)}</PAST>
      <FUTURE>${ind(render_atom?.future(entities.USER, { vector_text: true }), 8)}</FUTURE>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("COGNITION, PRESENT_TENSE, HYGIENE, MOMENTUM, MARKDOWN_FORMAT"), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();

  const task = clean_xml(`
${round != null ? `<ROUND>${escapeXml(String(round))}</ROUND>\n` : ""}${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>\n` : ""}
<TASK>
    <THINK_FORMAT>
    Begin your response with <think>. ALL internal calculations, phases, and markdown headers MUST be placed strictly INSIDE this block. CRITICAL MANDATE: You MUST explicitly write </think> to close the cognition block before starting your narrative prose. Conduct your thinking in the same language as the conversation.
    </THINK_FORMAT>
    ${taskText}
    <POV_DIRECTIVE>CRITICAL MANDATE: You are the FRACTAL (the world/narrator). Write strictly in third-person omniscient narrator POV. DO NOT write in first-person ("I", "my") as an individual character.</POV_DIRECTIVE>
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * Turn memory compilation template.
 * @param {any} params
 * @returns {string}
 */
function render_memory({ entity, history }) {
  return clean_xml(`
<SYSTEM role="MEMORY_FORGE" entity="${escapeXml(entity.name || "Unknown")}">
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("DATA_HYGIENE, AFFIRMATIVE, PRESENT_TENSE"), 4)}
  </PROTOCOLS>
  <INPUT_HISTORY>
    ${JSON.stringify(history, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
  </INPUT_HISTORY>
  <TASK>
    Compress this history into a single structured memory. Extract what permanently shifted — what was revealed, what now exerts pressure on this entity's future behavior. Discard noise.
    Output strict JSON only matching this schema:
    {
      "directive": "[Summary paragraph.]",
      "emotional_weight": 5,
      "tags": ["keyword1", "keyword2"],
      "present_summaries": {
        "AI_CHARACTER": { "physical": "Concise physical summary", "non_physical": "Concise mental summary" },
        "USER_PERSONA": { "physical": "Concise physical summary", "non_physical": "Concise mental summary" },
        "FRACTAL": { "physical": "Concise physical summary", "non_physical": "Concise mental summary" }
      },
      "eternal_mutations": {
        "AI_CHARACTER": { "physical": "Permanent physical change (e.g. scar) or leave empty", "non_physical": "Permanent psychological shift or leave empty" },
        "USER_PERSONA": { "physical": "Permanent physical change (e.g. scar) or leave empty", "non_physical": "Permanent psychological shift or leave empty" }
      }
    }
    The "emotional_weight" must be an integer from 1-10 assessing the narrative importance/impact of this memory.
    The "tags" array must contain 6–12 trigger keywords for lorebook migration (e.g., character names, key objects, specific events).
    No extra text, markdown code block wrappers (do not wrap in \`\`\`json), or commentary of any kind. Start and end with curly braces.
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
  field_id = "",
  entity = null,
  entity_type = "character",
}) {
  const protocols = ["DATA_HYGIENE", "AFFIRMATIVE"].filter(Boolean).join(", ");
  const cognitionInstruction = is_image_field
    ? "Begin your response with Mattis. Map the entity's geometry: form, material texture, light interaction, structural composition. You MUST explicitly write Mattis before formatting the visual output."
    : is_array_field
      ? `Begin your response with Mattis. Identify the key narrative beats, causal chains, and emotional residue. Generate 3-5 distinct ${field_id === "past" ? "memories" : "impulses"} based on the entity context. You MUST explicitly write Mattis before formatting the output.`
      : field_id.includes("present")
        ? "Begin your response with Mattis. Summarize the entity's immediate emotional pressure, active mental focus, and present behavioral drivers. Focus strictly on THIS moment — DO NOT repeat core eternal traits. You MUST explicitly write Mattis before writing the final text."
        : "Begin your response with Mattis. Summarize the entity's timeless core identity, psychological drivers, and cognitive patterns. Focus strictly on permanent baseline traits — DO NOT include temporary scene actions. You MUST explicitly write Mattis before writing the final text.";
  const formatInstruction = is_image_field
    ? `Return a flat configuration block of comma-separated property lines. Do NOT include curly braces or square brackets. Output keys and values wrapped in double quotes following this exact syntax: "key": "value", — Every comma inside a value MUST be followed by a space (e.g., "powerful, athletic"). No markdown code blocks.\nAvoid numerical weighting syntax (e.g. "(masterpiece:1.2)"). Control emphasis through descriptive adjectives and sentence positioning. ${PROTOCOL_LIBRARY.PERCHANCE_SYNTAX}\nWrite descriptive prose incorporating concrete matrix descriptors. No keyword soup.`
    : is_array_field
      ? 'Return a JSON array of objects, each with: "directive" (string), "tags" (array of 3-6 concrete trigger keywords: entity names, key items, specific actions, or locations that match user inputs for memory retrieval), "emotional_weight" (integer 1-10). Generate 3-5 entries. No prose outside the array.'
      : "Write a dense character profile state summary in the third-person POV. Describe character traits, emotional state, mental focus, and internal drivers. DO NOT write active story scenes, plot actions, dialogue, or atmospheric scene descriptions. DO NOT write comma-separated lists.";
  const macroInstruction = !is_image_field
    ? entity_type === "fractal"
      ? "Use placeholder macros to refer to entities: '{{user}}' for the user persona, '{{char}}' for the AI character, '{{fractal}}' for this environment. Never hardcode names."
      : "Use placeholder macros to refer to entities: '{{me}}' for this character, '{{you}}' for the user persona, '{{fractal}}' for the setting. Never hardcode names."
    : "";
  return clean_xml(`
<SYSTEM role="${escapeXml(enhancer || "GENERAL")}" enhancing="${escapeXml(label || "")}">
  <INSTRUCTIONS>
    ${ind(escapeXml(directive), 4)}

    ${ind(cognitionInstruction, 4)}

    ${ind(formatInstruction, 4)}
    ${macroInstruction ? `${ind(macroInstruction, 4)}\n` : ""}
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
    <ETERNAL_NON_PHYSICAL>${escapeXml(entity?.eternal?.non_physical || "")}</ETERNAL_NON_PHYSICAL>
    <PRESENT_PHYSICAL>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PRESENT_PHYSICAL")
          .replace(/<PRESENT_PHYSICAL>|<\/PRESENT_PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </PRESENT_PHYSICAL>
    <PRESENT_NON_PHYSICAL>${escapeXml(entity?.present?.non_physical || "")}</PRESENT_NON_PHYSICAL>
    <PAST>
      ${ind(escapeXml(entity?.past?.length ? temporal_engine.format(entity.past, content || "", { limit: 2, mode: "past" }) : ""), 6)}
    </PAST>
    <FUTURE>
      ${ind(escapeXml(entity?.future?.length ? temporal_engine.format(entity.future, content || "", { limit: 1, mode: "future" }) : ""), 6)}
    </FUTURE>
  </ENTITY_CONTEXT>
  <INPUT_CONTENT>
    ${ind(escapeXml(content), 4)}
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
  const resolvedType = entity_type === "user" ? "character" : entity_type || "character";
  const protocols = ["DATA_HYGIENE", "AFFIRMATIVE", "JSON_OUTPUT"].filter(Boolean).join(", ");
  const sortingInstruction =
    resolvedType === "fractal"
      ? "CRITICAL FOCUS: You are extracting data to define a FRACTAL (a world, location, or environmental ecosystem). You are NOT describing a person or individual character. Any incoming raw text containing character-specific personal traits or interpersonal history must be re-contextualized as part of the world's overarching lore or completely discarded. Focus entirely on the setting, its rules, and its physical/thematic atmosphere.\nUse placeholder macros to refer to entities: use '{{user}}' to refer to the user persona, '{{char}}' to refer to the AI character, and '{{fractal}}' to refer to this environment itself. Do not bake specific names into description text; use these macros instead."
      : "CRITICAL FOCUS: You are extracting data to define an individual CHARACTER. Any incoming raw text describing broad environmental atmosphere, world history, or global rules must be re-contextualized to fit within this character's personal background and gear, or completely discarded. Do not generate world-level descriptions; focus entirely on the individual.\nUse placeholder macros to refer to entities: use '{{me}}' to refer to this character itself, '{{you}}' to refer to the user persona/partner, and '{{fractal}}' to refer to the environmental setting. Do not bake specific names into description text; use these macros instead. Legacy '{{char}}' and '{{user}}' macros are also recognized.";
  const inputNote = "Input may be raw creative text or structured JSON — extract and sort either way.";
  return clean_xml(`
<SYSTEM role="${ENTITY_FRAGMENTS.profile[resolvedType].enhancer}" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escapeXml(ENTITY_FRAGMENTS.profile[resolvedType].directive), 4)}

    Write in the third-person.

    ${ind(sortingInstruction, 4)}

    ${ind(inputNote, 4)}
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
  create_render_atom(entities, input, raw_messages) {
    const resolve = (ref) => (typeof ref === "string" ? entities[ref] || entities.AI : ref);
    const scoring_context = `${input || ""} ${(Array.isArray(raw_messages) ? raw_messages : [])
      .slice(-3)
      .map((m) => m.content)
      .join(" ")}`.trim();

    let dynLimit = 5;
    if (entities.AI && entities.AI.dynamics && entities.AI.dynamics.intensity !== undefined) {
      const intensity = entities.AI.dynamics.intensity;
      if (intensity < 10) dynLimit = 3;
      else if (intensity < 30) dynLimit = 4;
      else if (intensity > 90) dynLimit = 7;
      else if (intensity > 70) dynLimit = 6;
    }

    return {
      _context: scoring_context,
      past: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(entity.past || [], scoring_context, {
          limit: dynLimit,
          offset: 0,
          max_chars: 1500,
          ...options,
          mode: "past",
        });
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      future: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(entity.future || [], scoring_context, {
          limit: 3,
          offset: 0,
          max_chars: 1500,
          ...options,
          mode: "future",
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
      .map((c) => `    <entry role="${c.role}"${c.name ? ` name="${escapeXml(c.name)}"` : ""}>${escapeXml(c.content)}</entry>`)
      .join("\n");
  },
};

// ============================================================================
// 5. EXPORT API
// ============================================================================

/**
 * Synthesis Engine Object Interface Layer.
 */
export const prompt_builder = {
  parse_macros(text, owner, entities) {
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
  build_character_prompt(payload, snapshot, directorData) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    const rendered = render_character({
      ...payload,
      render_atom,
      compressed_snapshot: snapshot,
      directorData,
    });
    return {
      system: prompt_builder.clean(rendered.system),
      task: prompt_builder.clean(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        vectors: {
          past: temporal_engine.score(payload.entities.AI.past || [], render_atom._context).slice(0, 5),
          future: temporal_engine.score(payload.entities.AI.future || [], render_atom._context).slice(0, 5),
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
  render_protocols(selection) {
    if (!selection) return "";
    if (protocols_cache.has(selection)) {
      return protocols_cache.get(selection);
    }
    const rendered = selection
      .split(",")
      .map((k) => {
        const key = k.trim().toUpperCase();
        const rule = PROTOCOL_LIBRARY[key];
        if (!rule) return "";
        if (rule.includes("\n")) {
          return `<${key}>\n${rule}\n</${key}>`;
        }
        return `<${key}>${rule}</${key}>`;
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
    const safeEntities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };
    const rendered = render_narrator("epilogue", {
      entities: safeEntities,
      render_atom: prompt_builder.create_render_atom(safeEntities, "", recent_history),
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
  build_memory_prompt(role, entity, history) {
    return {
      system: render_memory({ role, entity, history }),
      messages: [],
    };
  },
  build_enhancement(field_id, content, entity_name = "", entity_type = "character", is_image_field = false, entity = null) {
    const resolvedType = entity_type === "user" ? "character" : entity_type || "character";
    const meta = ENTITY_CATALOG[`${resolvedType}.${field_id}`] ||
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
        entity_type: resolvedType,
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

export { build_dynamics_legend, render_character, render_director, render_enhancement, render_ghostwriter, render_narrator, render_profile_sorting };
