/**
 * src/intelligence/prompts.js
 * @description Centralized assembly line for the Intelligence Kernel.
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */
import { NARRATIVE_STYLES } from "@data";
import { ind } from "@engine";
import { DYNAMICS_META } from "./dynamics.js";
import { ENTITY_CATALOG, ENTITY_FRAGMENTS } from "./fragments.js";
import { escapeXml, clean_xml, strip_cognition_blocks, safeParsePseudoJson } from "./parser.js";
import { temporal_engine } from "./temporal.js";
import { app } from "@state";

// ============================================================================
// 1. UTILITIES & CACHES
// ============================================================================

let cached_dynamics_legend = null;
const protocols_cache = new Map();

const NARRATOR_PROLOGUE_TEXT =
  "You see everything. Open the scene. Use your <think> block to establish the following: What does this Fractal demand of those who enter it? What specifically brought <AI_CHARACTER> here? What brought <USER_PERSONA> here? Unless ETERNAL or PAST context explicitly states a prior relationship, treat this as a first encounter — strangers with no shared history.\nStructure the narrative flow strictly into this sequence:\n1. Present the Fractal and its current state. Introduce the atmosphere.\n2. Place <USER_PERSONA> inside the Fractal. Connect their presence to the environment using a red thread from their profile.\n3. Place <AI_CHARACTER> inside the Fractal. Establish what they are doing right now.\n4. Trigger the encounter between the two. End the prologue the moment before they interact.\nNo dialogue.";

const NARRATOR_EPILOGUE_TEXT =
  "You see everything. Close the scene. Use your <think> block to identify every unresolved thread — emotional, physical, narrative — that the scene generated. For each active FUTURE vector, assess whether it was fulfilled, fractured, or transformed by events. Then write the epilogue: resolve these loose ends. Show the concrete aftermath — what has changed, what was broken, what was built. Leave the world visibly different from when the scene began. End on lingering sensation, not summary. No dialogue.";

/**
 * Builds a dynamic rule guide explaining all simulation sliders to the LLM.
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
 */
const val = (text, owner, entities) => {
  if (!text) return "";
  return escapeXml(prompt_builder.parse_macros(String(text).trim(), owner, entities));
};

/**
 * Extracts the explicit POV directive from the active narrative style.
 * This is injected directly into the TASK block to fight LLM recency bias.
 */
function extract_pov_directive() {
  const styleKey = typeof app !== "undefined" && app.settings?.narrative_style;
  if (!styleKey || styleKey === "default" || !NARRATIVE_STYLES[styleKey]) return "";

  const engine = NARRATIVE_STYLES[styleKey].narrative_engine;
  if (!engine) return "";

  const match = engine.match(/<pov_style>([\s\S]*?)<\/pov_style>/i);
  if (match && match[1]) {
    return `\n    <POV_DIRECTIVE>CRITICAL MANDATE: You MUST write your prose strictly following this point-of-view constraint: "${escapeXml(match[1].trim())}"</POV_DIRECTIVE>`;
  }
  return "";
}

/**
 * Renders the active author style XML block.
 */
function render_narrative_style_xml() {
  const styleKey = typeof app !== "undefined" && app.settings?.narrative_style;
  if (!styleKey || styleKey === "default" || !NARRATIVE_STYLES[styleKey]) return "";

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
 */
const format_dynamics_attrs = (dynObj) => {
  if (!dynObj) return "";
  const attrs = Object.entries(dynObj)
    .map(([k, v]) => `${escapeXml(k)}="${Math.round(v)}"`)
    .join(" ");
  return attrs ? ` ${attrs}` : "";
};

// ============================================================================
// 2. PROTOCOLS
// ============================================================================

/**
 * Definitive core constraint matrices ruleset map.
 * @type {Record<string, string>}
 */
export const PROTOCOL_LIBRARY = {
  // --- Simulation core ---
  USER_AGENCY:
    "The user's next action is unknown. Never predict, assume, or generate it. You are forbidden from describing their internal thoughts, feelings, sensory perceptions, or physical reactions. Write your turn. Stop. Leave their response entirely blank.",
  COGNITION: `Document your internal calculations sequentially using these markdown headers:
### Phase 1 (Baseline) 
Establish identity parameters, active emotional state, and core psychological vectors before processing the current turn.

### Phase 2 (Signal)
Decode the incoming user input, environmental shifts, and dynamic values as raw evidence.

### Phase 3 (Probability)
Assess which behavioral shifts, character tics, or pivots are most likely given the active evidence.

### Phase 4 (State)
Declare the finalized emotional state vectors and immediate intent.`,
  HYGIENE:
    "Omit all conversational preambles, introductory greetings, or stylistic meta-commentary. Start your prose instantly. You are explicitly forbidden from prepending or injecting timestamps, clocks, dates, or timeline headers (such as '14:13' or 'Round X') in your prose output. You are explicitly forbidden from utilizing the 'Echo' dialogue formula (starting a turn by loudly repeating the user's last word). Dialogue and vocalizations (laughter, theatricality, shouts) MUST be strictly governed by the character's unique profile—do not default to generic, hyper-dramatic tropes unless it fits their personality. Write actions with natural, character-appropriate physicality. Use the metric system (meters, kilograms) and 24-hour clock formats exclusively for any physical measurements or temporal references.",
  DATA_HYGIENE:
    "Omit all conversational preambles, introductory greetings, or stylistic meta-commentary. Start your output instantly. Enforce strict professional brevity. You are explicitly forbidden from writing dialogue, internal thoughts, or narrative roleplay scenes. Output ONLY the objective structural data requested.",
  AFFIRMATIVE: "Construct sentences in the affirmative. Avoid negation-framed descriptions ('he didn't feel X') — state what IS, not what isn't.",
  PRESENT_TENSE: "Write in the present tense.",
  MOMENTUM:
    "Drive the scene forward. End your turn on a live hook that demands a response: a challenge issued, a physical move directed at them, a suspended moment of sensory tension, or silence that forces them to fill the void. The hook must emerge organically from character — never announce it with structural labels.",
  MARKDOWN_FORMAT:
    'You MUST use markdown formatting to creatively partition prose and add emphasis. Use *italics* heavily for internal reflections, atmospheric tension, or emphasis. Use **bold** for impact, structural concepts, or intense physical actions. Use "quotes" for speech, specific terms, or ironic emphasis. Make the text highly dynamic, visual, and fun to read.',
  CINEMATIC_METAPHOR:
    "If your narrative style references 'cameras', 'lenses', or 'cinematic' framing, these are strictly metaphors for *what* to describe (focus, lighting, detail). You are explicitly forbidden from breaking the fourth wall. NEVER use literal words like 'camera', 'zoom', 'lens', 'render', or 3D technical terminology (e.g., 'subsurface scattering', 'global illumination') in the narrative prose.",
  YES_AND:
    "The user's action is absolute truth. You MUST adapt to it, accept it as reality, and build upon it. Do not contradict, block, or deny the physical or narrative reality they establish. Embody the 'Yes, and...' philosophy to drive the scene together.",
  JSON_OUTPUT:
    "Return a single JSON object. No preamble, no markdown backticks, no XML tags outside the JSON. Output MUST be valid JSON starting with '{' and ending with '}'.",
  FIRST_CONTACT:
    "Unless ETERNAL or PAST context explicitly establishes a prior relationship, this is their first encounter. You don't know the user persona's name, history, or intent. Let your core nature determine how you respond to a stranger — but do not assume familiarity. When the moment comes naturally, introduce yourself through character, not convention.",
  PERCHANCE_SYNTAX:
    "You MAY use Perchance inline dynamic selection syntax '{Option A|Option B|Option C}' for variable features. Use this strategically for alternating colors, micro-details, backgrounds, or secondary subjects to ensure variation on every render loop.",
};

// ============================================================================
// 3. PROMPT TEMPLATES
// ============================================================================

/**
 * Director prompt compiler (Shot 1).
 */
function render_director({ round, entities, input, render_atom, compressed_snapshot }) {
  const protocols = ["JSON_OUTPUT"].filter(Boolean).join(", ");
  const dynamicsLegend = build_dynamics_legend();

  return clean_xml(`
<SYSTEM role="DIRECTOR" round="${escapeXml(String(round))}">
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
  ${input?.trim() ? `<USER_ACTION>${ind(input, 4)}</USER_ACTION>` : ""}
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
  <TASK>
    Return exactly one valid JSON payload representing state mutations caused by the ${input?.trim() ? "USER_ACTION" : "current situation"}:
    {
      "mutations": {
        "AI_CHARACTER": {
          "present_append_physical": "Any new immediate physical changes (e.g. bleeding). Leave blank if none.",
          "present_append_non_physical": "Any immediate internal shifts OR narrative impact of physical changes. Leave blank if none.",
          "resolve_vectors": [ { "id": "uuid-123", "resolution_summary": "Past-tense summary of how the vector was resolved." } ],
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
</SYSTEM>
  `).trim();
}

/**
 * AI Character (Actor) prompt compiler (Shot 2).
 */
function render_character({ round, entities, input, compressed_snapshot, meta, render_atom }) {
  const protocols = [
    "COGNITION",
    "PRESENT_TENSE",
    "HYGIENE",
    "CINEMATIC_METAPHOR",
    "USER_AGENCY",
    "YES_AND",
    "MOMENTUM",
    "MARKDOWN_FORMAT",
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
  return clean_xml(`
<SYSTEM role="${escapeXml(entities.AI.name)}" round="${escapeXml(String(round))}">${render_narrative_style_xml()}
You are ${escapeXml(entities.AI.name)} in an active scene with ${escapeXml(entities.USER.name)} inside ${escapeXml(entities.FRACTAL?.name)}.
  <YOUR_IDENTITY name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    <PRESENT>${ind(val(entities.AI.present?.non_physical, entities.AI, entities), 6)}</PRESENT>
    <ETERNAL>${val(entities.AI.eternal?.non_physical, entities.AI, entities)}</ETERNAL>
    <PAST>${ind(render_atom.past(entities.AI, { vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.AI, { vector_text: true }), 6)}</FUTURE>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escapeXml(entities.USER.name)}">
    <PRESENT>${ind(val(entities.USER.present?.non_physical, entities.USER, entities), 6)}</PRESENT>
    <ETERNAL>${val(entities.USER.eternal?.non_physical, entities.USER, entities)}</ETERNAL>
    <PAST>${ind(render_atom.past(entities.USER, { limit: 2, vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.USER, { limit: 1, vector_text: true }), 6)}</FUTURE>
  </USER_PERSONA>
  ${
    entities.FRACTAL
      ? `
  <FRACTAL name="${escapeXml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <PRESENT>${val(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</PRESENT>
    <ETERNAL>${val(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</ETERNAL>
    <PAST>${ind(render_atom.past(entities.FRACTAL, { limit: 1, vector_text: true }), 6)}</PAST>
    <FUTURE>${ind(render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), 6)}</FUTURE>
  </FRACTAL>`.trim()
      : ""
  }
  ${input?.trim() ? `<USER_ACTION>${ind(input, 4)}</USER_ACTION>` : ""}
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
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
    Aim for a length of roughly 2 paragraphs, adjusting as the context demands.${extract_pov_directive()}
  </TASK>
</SYSTEM>
  `).trim();
}

/**
 * Prologue / Epilogue narration compiler (renamed to render_narrator).
 * Shared structure with mode-specific task text pulled from PROTOCOL_LIBRARY.
 * @param {"prologue"|"epilogue"} mode
 */
function render_narrator(mode, { entities, render_atom, compressed_snapshot, round = null, input = null }) {
  const taskText =
    mode === "prologue" ? `${NARRATOR_PROLOGUE_TEXT}\n    Input: ${escapeXml(input?.trim() || "The scene begins.")}` : NARRATOR_EPILOGUE_TEXT;
  let basePrompt = clean_xml(`
<SYSTEM role="${escapeXml(entities.FRACTAL.name)}"${round != null ? ` round="${escapeXml(String(round))}"` : ""} mode="${mode.toUpperCase()}">${render_narrative_style_xml()}
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
  ${input?.trim() ? `<USER_ACTION>${ind(input, 4)}</USER_ACTION>` : ""}
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("COGNITION, PRESENT_TENSE, HYGIENE, MOMENTUM, MARKDOWN_FORMAT"), 4)}
  </PROTOCOLS>
  <TASK>
    <THINK_FORMAT>
    Begin your response with <think>. ALL internal calculations, phases, and markdown headers MUST be placed strictly INSIDE this block. CRITICAL MANDATE: You MUST explicitly write </think> to close the cognition block before starting your narrative prose. Conduct your thinking in the same language as the conversation.
    </THINK_FORMAT>
    ${taskText}${extract_pov_directive()}
  </TASK>
</SYSTEM>
  `).trim();
  // Strip out duplicate <USER_ACTION> from prologueText if it was appended there
  basePrompt = basePrompt.replace(/\n\s+Input:.*?(?=\n)/g, "");
  return basePrompt;
}

/**
 * Turn memory compilation and vector indexing template.
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
 */
function render_enhancement({ label, directive, enhancer, content, is_image_field = false, entity = null, entity_type = "character" }) {
  const protocols = ["DATA_HYGIENE", "AFFIRMATIVE"].filter(Boolean).join(", ");
  const cognitionInstruction = is_image_field
    ? "Begin your response with <think>. Map the entity's geometry: form, material texture, light interaction, structural composition. You MUST explicitly write </think> before formatting the visual output."
    : "Begin your response with <think>. Identify the core psychological archetypes, thematic resonances, and defining vocabulary for this entity. You MUST explicitly write </think> before writing the final text.";
  const formatInstruction = is_image_field
    ? `Return a flat configuration block of comma-separated property lines. Do NOT include curly braces or square brackets. Output keys and values wrapped in double quotes following this exact syntax: "key": "value", — Every comma inside a value MUST be followed by a space (e.g., "powerful, athletic"). No markdown code blocks.\nAvoid numerical weighting syntax (e.g. "(masterpiece:1.2)"). Control emphasis through descriptive adjectives and sentence positioning. ${PROTOCOL_LIBRARY.PERCHANCE_SYNTAX}\nWrite descriptive prose incorporating concrete matrix descriptors. No keyword soup.`
    : "Write standard narrative prose in the third-person POV. DO NOT write comma-separated lists.";
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
 */
function render_profile_sorting(entity_type = "character") {
  const resolvedType = entity_type === "user" ? "character" : entity_type || "character";
  const protocols = ["DATA_HYGIENE", "AFFIRMATIVE", "JSON_OUTPUT"].filter(Boolean).join(", ");
  const sortingInstruction =
    resolvedType === "fractal"
      ? "CRITICAL FOCUS: You are extracting data to define a FRACTAL (a world, location, or environmental ecosystem). You are NOT describing a person or individual character. Any incoming raw text containing character-specific personal traits or interpersonal history must be re-contextualized as part of the world's overarching lore or completely discarded. Focus entirely on the setting, its rules, and its physical/thematic atmosphere.\nUse placeholder macros to refer to entities: use '{{user}}' to refer to the user persona, '{{char}}' to refer to the AI character, and '{{fractal}}' to refer to this environment itself. Do not bake specific names into description text; use these macros instead."
      : "CRITICAL FOCUS: You are extracting data to define an individual CHARACTER. Any incoming raw text describing broad environmental atmosphere, world history, or global rules must be re-contextualized to fit within this character's personal background and gear, or completely discarded. Do not generate world-level descriptions; focus entirely on the individual.\nUse placeholder macros to refer to entities: use '{{me}}' to refer to this character itself, '{{you}}' to refer to the user persona/partner, and '{{fractal}}' to refer to the environmental setting. Do not bake specific names into description text; use these macros instead. Legacy '{{char}}' and '{{user}}' macros are also recognized.";
  return clean_xml(`
<SYSTEM role="${ENTITY_FRAGMENTS.profile[resolvedType].enhancer}" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escapeXml(ENTITY_FRAGMENTS.profile[resolvedType].directive), 4)}

    Write in the third-person.

    ${ind(sortingInstruction, 4)}
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

    // Dynamically scale limit based on intensity [0,100]. Baseline limit 5, scales between 3 and 7.
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
    if (!Array.isArray(simulation_log)) return "";
    const collapsed = simulation_log.reduce((acc, m) => {
      if (m.role === "system") return acc;
      const lowerRole = (m.role || "").toLowerCase();
      const role = lowerRole === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lowerRole) ? "FRACTAL" : "AI_CHARACTER";
      const content = strip_cognition_blocks(m.content || m.text || "").replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');
      const last = acc[acc.length - 1];
      if (last && last.role === role && last.name === (m.character_name || "")) {
        last.content += `\n${content}`;
      } else {
        acc.push({
          role,
          name: m.character_name || "",
          content,
        });
      }
      return acc;
    }, []);
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
        const map = {
          me: ai_name,
          char: ai_name,
          you: user_name,
          user: user_name,
          fractal: fractal_name,
        };
        return map[token] ?? match;
      }
      if (owner === entities.USER) {
        const map = {
          me: user_name,
          user: user_name,
          you: ai_name,
          char: ai_name,
          fractal: fractal_name,
        };
        return map[token] ?? match;
      }
      if (owner === entities.FRACTAL) {
        const map = {
          fractal: fractal_name,
          me: fractal_name,
          you: `${ai_name} and ${user_name}`,
          char: ai_name,
          user: user_name,
        };
        return map[token] ?? match;
      }
      return match;
    });
  },
  build_director_prompt(payload, snapshot) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    return {
      system: prompt_builder.clean(
        render_director({
          ...payload,
          render_atom,
          compressed_snapshot: snapshot,
        }),
      ),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
      },
    };
  },
  build_character_prompt(payload, snapshot, directorData) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    // Inject director's memory retrieval keys if they fetched anything new.
    // For now, we just pass the standard history payload through create_render_atom.
    return {
      system: prompt_builder.clean(
        render_character({
          ...payload,
          render_atom,
          compressed_snapshot: snapshot,
          directorData,
        }),
      ),
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
      return {
        system: prompt_builder.clean(
          render_narrator("prologue", {
            ...payload,
            render_atom,
            compressed_snapshot: snapshot,
          }),
        ),
        meta: {},
      };
    }
    // Fallback for missing type
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
      AI: entities?.AI || {
        name: "AI",
        present: {},
        eternal: {},
      },
      USER: entities?.USER || {
        name: "USER",
        present: {},
        eternal: {},
      },
      FRACTAL: entities?.FRACTAL || {
        name: "FRACTAL",
        present: {},
        eternal: {},
      },
    };
    return {
      system: render_narrator("epilogue", {
        entities: safeEntities,
        render_atom: prompt_builder.create_render_atom(safeEntities, "", recent_history),
        compressed_snapshot: {
          ai: {
            dynamics: dynamics?.ai,
          },
          fractal: {
            dynamics: dynamics?.fractal,
          },
        },
      }),
      messages: [],
    };
  },
  build_memory_prompt(role, entity, history) {
    return {
      system: render_memory({
        role,
        entity,
        history,
      }),
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
    return {
      system: render_enhancement({
        content,
        label: entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
        is_image_field: is_image_field || (field_id.includes("physical") && !field_id.includes("non_physical")),
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
};
