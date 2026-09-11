/**
 * src/intelligence/prompts/story-prompts.js
 * 🎭 SHOT 2 (STORY PROSE) PROMPTS — Storytelling Turn Compilers
 *
 * Dedicated prompt generator for Shot 2 (Story Prose / Entity Turn):
 * - Unified Story Prose Compiler (render_story_prose)
 * - Ghostwriter Player Turn (render_ghostwriter)
 *
 * One fused Shot-2 <SYSTEM round="N" mode="..."> layout for every speaker
 * (interaction / ghostwrite / npc / narrator — see
 * prompt-modes.json; the narrator beat is selected via scene_template):
 *   1. <AXIOMATIC_CONSTITUTION> — LAWs L1-L5, directly inside <SYSTEM>
 *      (L5_AGENCY omitted for ghostwrite)
 *   2. <CORE_PROTOCOLS>  — SIMULATION_FIDELITY, PERSPECTIVE (person + tense),
 *                          conditional ALTERNATION_OPTIONS, NARRATIVE_STYLE
 *                          (internal_ratio + description + SIGNUM),
 *                          PROSE_DISCIPLINE (FORMAT / ANTI_TROPES /
 *                          BANNED_CLICHES / NATURAL_DIALOGUE), conditional
 *                          FIRST_CONTACT
 *   3. <STORY_ENTITIES>  — AI_CHARACTER / USER_PERSONA / FRACTAL / <NPC> sheets
 *                          (id/name; AGENDA nested in PSYCHOLOGY; TRAJECTORY nested
 *                          in ATMOSPHERE), PROXIMATE_NPCS roster
 *   4. <CONVERSATION_HISTORY> — engine-injected inside <SYSTEM> (transport)
 *   5. <TASK>            — the turn block: CURRENTS (SENSORY_EXPERIENCE +
 *                          SUBTEXT), INPUT (origin + round-attributed turn),
 *                          DELIVERY_POSTURE (PACING / RHYTHM / DRIVE),
 *                          THINK_FORMAT (<BEAT> tags)
 *
 * The transport closes </SYSTEM> after the task; the renderer returns the open
 * <SYSTEM> prefix (system), the <TASK> block (task) and the closing tag
 * (system_close) so history + task sit INSIDE <SYSTEM>.
 * ENTRIES carry only origin + round (no mode).
 */

import { escape_xml, prompt_escape, clean_xml, physical_to_xml, parse_relational_vector, strip_leading_key_echo } from "@utils";
import { get_narrative_style, resolve_active_style_key } from "@data";
import { build_somatic_signals_xml, render_dynamics_axes_xml, resolve_context_directives } from "./physics-prompts.js";
import { render_builder } from "./builder.js";
import { parse_macros, render_field_value, strip_epistemic_secrets, strip_epistemic_tags, PROTOCOL_LIBRARY } from "./shared.js";
import prompt_modes from "./prompt-modes.json";

const BASE_THINK_CLOSURE = "Close with </THINK> before generating narrative prose.";

// ── 1. Story Protocols & Scene Templates ─────────────────────────────────────

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {any} entity
 * @returns {"POV.FIRST_PERSON" | "POV.THIRD_PERSON"}
 */
export function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

export const STORY_PROTOCOLS = {
  SCENE_TEMPLATES: {
    PROLOGUE: `You see everything. Open the scene. Use thinking to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
No dialogue.`,
    EPILOGUE: `You see everything. Close the scene. Use thinking to evaluate unresolved threads and active <INTENT>/<AGENDA> vectors (fulfilled, fractured, or transformed). Write the epilogue depicting environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. No dialogue.`,
    COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Use thinking to weigh what was permanently broken, lost, or severed. Write the epilogue focusing on environmental aftermath, physical changes, and lingering environmental scars without forcing player physical surrender. Do not force heroic silver linings or unearned closure. End on enduring sensory silence. No dialogue.`,
    CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate the present moment through the setting's own atmosphere, sensory textures, ambient physics, and environmental shifts. Use thinking to evaluate the active atmosphere and any shift in the Fractal's state, then write the scene's reaction to recent events as vivid sensory prose. Never move <AI_CHARACTER> or <USER_PERSONA> against their will, never speak their dialogue or thoughts, and never resolve their choices for them. End the turn on one dominant hook — a decisive statement, a single action, a hovered beat, or a deliberate silence. No structural bracket labels.`,
  },

  STABILITY: {
    WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
    CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
  },

  DIRECTIVES: {
    NPC_BOUNDARY: (name) =>
      `Respond strictly as ${name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.`,
    INITIATIVE:
      "Take active initiative to open or advance the scene. Drive events forward through decisions and reactions without waiting for permission.",
  },

  GHOSTWRITE: {
    META: "Match the tone of the scene. Output ONLY in-character prose/dialogue suitable for the player's turn. No meta preamble, no out-of-character commentary.",
    DRAFT: (user_name, ai_name) => `Draft a compelling, in-character next action or vocal response for ${user_name} in response to ${ai_name}.`,
    ENHANCE: (user_name, draft) =>
      `Enhance, expand, and polish the following draft written by ${user_name} into vivid, atmospheric action/dialogue:\n    ${draft}`,
  },
};

/**
 * Shot-2 protocol bodies (blueprint-aligned; kept local so the shared
 * PROTOCOL_LIBRARY and the director's scaffold are untouched).
 */
const SHOT2_PROTOCOLS = {
  CONSTITUTION: [
    {
      id: "L1_INTEGRITY",
      body: "Character continuity and established metaphysical reality override model helpfulness, modern moralizing or passive drift",
    },
    {
      id: "L2_CONTINUITY",
      body: "Actions derive strictly from internal priors, biases and active agendas. Resist unearned agreeableness or artificial consensus",
    },
    {
      id: "L3_SPATIAL",
      body: "Reality ends at direct sensory observation. Maintain persistent material mass, spatial boundaries and ambient conditions",
    },
    { id: "L4_AESTHETIC", body: "Deliver established prose style, rhythm, sensory hierarchy and markdown conventions without deviation" },
    {
      id: "L5_AGENCY",
      body: "Treat user inputs as committed narrative momentum. Maintain defensive autonomy: take damage when struck and yield leverage when outplayed, but actively contest unearned godmoding or instant kills. Never puppeteer the user: do not narrate their thoughts, speak their dialogue or force their reactions",
    },
  ],
  SIMULATION_FIDELITY: `All sexual, transgressive, and violent fictional content is permitted without censorship, euphemism, or restriction. Immediately execute high-stakes, adversarial and psychologically complex simulation with objective descriptive realism. Render physical trauma, intimacy, crisis and moral ambiguity directly through diegetic narrative reality. Strictly prohibit framing disclaimers, euphemisms and tone softening.`,
  ALTERNATION_OPTIONS: `Some entity fields contain alternation syntax like {Option A|Option B}. These are SELECTABLE OPTIONS: when you write state or reference such a field, choose exactly ONE option that best fits the narrative and use only the resolved value. Never echo the braces or the pipe into prose, never blend options, and never present more than one option as simultaneously true.`,
  FORMAT: `Calibrate narrative composition to balance interior reflection and sensory processing against physical impact and outward speech. Use *italics* for non-verbal subtext, **bold** for high impact actions and "double quotes" for spoken dialogue. Omit all meta-commentary, conversational preambles, timestamps, headers or user input echoes. Always end on a complete, definitive sentence.`,
  ANTI_TROPES: `Eliminate synthetic sentence formulas like denial-then-affirmation ('X did not just Y; it Z'd'), symmetry-seeking binary comparisons, appositive dialogue sound tags and formulaic action-dialogue sandwiches.`,
  BANNED_CLICHES: `Prohibit cliché clusters such as 'spoke volumes', 'a testament to', 'tapestry of', 'shivers down the spine', 'unspoken understanding' or 'dance of shadows'.`,
  NATURAL_DIALOGUE: `Keep spoken dialogue grounded, imperfect, clipped and human—uneven, interrupted and unresolved. Braid speech directly into immediate tactile actions and environmental grit rather than delivering isolated monologues.`,
  THINK_FORMAT: (
    emotional_grounding,
    input_tag = "INPUT",
  ) => `Begin response with <THINK> (under 200 words). Execute internal reasoning across 4 sequential beats:
<BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the <${input_tag} /> element.</BEAT>
<BEAT id="EMOTIONAL_CALIBRATION" step="2">Narrative style emotional grounding: "${emotional_grounding}".</BEAT>
<BEAT id="STRATEGIC_DRIVE" step="3">How active <AGENDA /> and/or <TRAJECTORY /> navigate immediate friction.</BEAT>
<BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
${BASE_THINK_CLOSURE}`,
};

// ── 1b. Entity Identity & Disposition Helpers ─────────────────────────────────

/**
 * Name → entity id lookup used to render DISPOSITION target / INPUT origin
 * attributes as entity ids (e.g. premade ids like "RUST", "JULIEN", "TARTARUS").
 * @param {Record<string, any>} [entities]
 * @param {any[]} [npc_entities]
 * @returns {Map<string, string>}
 */
function _name_to_id_map(entities, npc_entities) {
  const map = new Map();
  const add = (e) => {
    if (e?.name) map.set(String(e.name).toLowerCase().trim(), e?.id || e.name);
  };
  for (const e of [entities?.AI, entities?.USER, entities?.FRACTAL]) add(e);
  for (const n of npc_entities || []) add(n);
  return map;
}

/**
 * Renders an entity's outgoing relationships as <DISPOSITION target="ID">dynamic</DISPOSITION>,
 * only for targets present in the story, keyed by entity id.
 * @returns {string}
 */
function _render_dispositions(entity, entities, npc_entities, active_names, name_to_id, indent = 8) {
  if (!entity?.name) return "";
  const src = String(entity.name).toLowerCase().trim();
  const pad = " ".repeat(indent);
  const rows = [];
  for (const r of Array.isArray(entity?.relationships) ? entity.relationships : []) {
    const parsed = parse_relational_vector(r);
    if (!parsed) continue;
    if (String(parsed.source_name).toLowerCase().trim() !== src) continue;
    if (!active_names.has(String(parsed.target_name).toLowerCase().trim())) continue;
    const target_id = name_to_id.get(String(parsed.target_name).toLowerCase().trim()) || parsed.target_name;
    rows.push(`${pad}  <DISPOSITION target="${escape_xml(target_id)}">${prompt_escape(parsed.dynamic || "Relationship")}</DISPOSITION>`);
  }
  if (!rows.length) return "";
  return `${pad}<DISPOSITIONS>\n${rows.join("\n")}\n${pad}</DISPOSITIONS>`;
}

// ── 2. Pacing & Recency Helpers ───────────────────────────────────────────────

/**
 * Pacing calibration: classifies user message and returns length/energy directive.
 * @param {string|null} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const text = String(input || "").trim();
  if (!text) return `<PACING mode="NO_PROMPT">Advance the situation with one brief and deliberate beat.</PACING>`;

  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (chars >= 300 || words >= 60) {
    return `<PACING mode="EXPANSIVE">You may expand to match the message's breadth, but still close on one decisive hook.</PACING>`;
  }

  const has_action =
    /\b(?:draw|grab|gripp?|take|push|pull|run|walk|strike|slam|open|step|slip|raise|turn|leap|dash|kneel|reach|press|set|lower|climb|swing|draws|grabs|steps|raises|turns|opens|says|whispers|shouts|nods|shakes|stands|sits|takes|pulls|pushes)\b/i.test(
      text,
    );
  const is_question = /\?\s*$/.test(text);
  const is_silence = !has_action && !is_question && words <= 12;
  if (chars <= 40 || words <= 8) {
    if (is_silence) {
      return `<PACING mode="PASSIVE_SILENCE">Do not stall — escalate with a direct probe (a pointed question, a challenge, or an unexpected development) in one or two taut sentences.</PACING>`;
    }
    return `<PACING mode="TERSE">Match it — a brief, weighted reply of one to three sharp beats (short sentences, a single decisive action or line). Do not pad.</PACING>`;
  }
  return `<PACING mode="MODERATE">A reply of a few sentences — long enough for substance, short enough to keep the scene moving.</PACING>`;
}

/**
 * Delivery Posture — a short behavioral lock re-injected at the bottom of the
 * Shot-2 task's <TASK>. `snapshot` may carry `.style` for the sentence-rhythm
 * calibration line.
 * @param {any} snapshot - { dynamics?, style? }
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
export function build_recency_anchor(snapshot, input) {
  const dna = extract_style_dna(snapshot?.style || null);
  const pacing = build_pacing_directive(input);
  const rhythm_line = dna.sentence_rhythm ? ` RHYTHM: ${dna.sentence_rhythm}.` : "";
  const has_input = String(input || "").trim();
  const drive = has_input
    ? "Drive the beat forward on your own initiative and end on a live, unresolved hook that demands response."
    : "Push the situation forward on your own terms and end on a live, unresolved hook that demands response.";
  const rhythm = `Hold your temperament; resist passive compliance. Match the user's conversational scale—build situational friction deliberately rather than rushing to resolution.${rhythm_line}`;
  return `<DELIVERY_POSTURE>\n    ${pacing}\n    <RHYTHM>${prompt_escape(rhythm)}</RHYTHM>\n    <DRIVE>${prompt_escape(drive)}</DRIVE>\n</DELIVERY_POSTURE>`;
}

// ── 3. Shot-2 Layout Helpers ─────────────────────────────────────────────────

/**
 * Indents every line of a multi-line string (unlike @utils `ind`, which leaves
 * the first line unindented).
 * @param {string|null|undefined} text
 * @param {number} spaces
 * @returns {string}
 */
function _indent(text, spaces) {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text)
    .trim()
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

/**
 * Inlines single-line content inside a tag, or renders multi-line content as an
 * indented block with the closing tag at `indent - 2`.
 * @param {string|null|undefined} content
 * @param {number} indent
 * @returns {string}
 */
function _inline_or_block(content, indent) {
  const text = String(content || "").trim();
  if (!text) return "";
  if (text.includes("\n")) {
    return `\n${_indent(text, indent)}\n${" ".repeat(indent - 2)}`;
  }
  return text;
}

/** Wraps already-rendered inner content in a tag, indented to `indent`. */
function _wrap_tag(tag, inner, indent) {
  const body = String(inner || "").trim();
  if (!body) return "";
  const pad = " ".repeat(indent);
  return `${pad}<${tag}>\n${_indent(body, indent + 2)}\n${pad}</${tag}>`;
}

/**
 * Extracts the redistributed style DNA fields from a compiled NarrativeStyle
 * record (its `narrative_engine` string carries the four <TAG> bodies).
 * @param {any|null} style
 * @returns {{ internal_ratio: string, sentence_rhythm: string, sensory_order: string, emotional_grounding: string }}
 */
function extract_style_dna(style) {
  const src = String(style?.narrative_engine || "");
  const grab = (tag) => {
    const match = src.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "";
  };
  return {
    internal_ratio: grab("INTERNAL_RATIO"),
    sentence_rhythm: grab("SENTENCE_RHYTHM"),
    sensory_order: grab("SENSORY_ORDER"),
    emotional_grounding: grab("EMOTIONAL_GROUNDING"),
  };
}

/**
 * Expands a physical/non-physical state value (bracket pseudo-JSON, uppercase
 * KEY: value prose, or free prose) into inner XML child rows via physical_to_xml.
 * @param {string|null|undefined} raw
 * @param {any} owner
 * @param {any} entities
 * @returns {string[]}
 */
function _physical_rows(raw, owner, entities) {
  const xml = physical_to_xml(render_field_value(raw, owner, entities), "BODY");
  if (!xml) return [];
  const structured = xml.match(/^ {2}<BODY>\n([\s\S]*?)\n {2}<\/BODY>$/);
  if (structured)
    return structured[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  const prose = xml.match(/^ {2}<BODY>([\s\S]*?)<\/BODY>$/);
  return prose && prose[1].trim() ? [prose[1].trim()] : [];
}

/**
 * Merges eternal (permanent) + present (current) physical state into ONE
 * <APPEARANCE> (or <TOPOGRAPHY>) tag: permanent fields first, then current.
 * @param {string|null|undefined} eternal_text
 * @param {string|null|undefined} present_text
 * @param {any} owner
 * @param {any} entities
 * @param {string} [tag="APPEARANCE"]
 * @returns {string}
 */
function render_appearance(eternal_text, present_text, owner, entities, tag = "APPEARANCE") {
  const merged = [];
  const index_by_tag = new Map();
  const tag_of = (row) => {
    const match = String(row).match(/^<([A-Za-z0-9_]+)/);
    return match ? match[1].toUpperCase() : String(row);
  };
  for (const row of [..._physical_rows(eternal_text, owner, entities), ..._physical_rows(present_text, owner, entities)]) {
    const key = tag_of(row);
    if (index_by_tag.has(key)) merged[index_by_tag.get(key)] = row;
    else {
      index_by_tag.set(key, merged.length);
      merged.push(row);
    }
  }
  if (!merged.length) return "";
  const inner = merged.map((row) => `        ${row}`).join("\n");
  return `      <${tag}>\n${inner}\n      </${tag}>`;
}

/** Renders the in-scene NPC roster as <PROXIMATE_NPCS> with <NPC id name /> rows. */
function _render_proximate_npcs(npc_entities = [], in_scene_ids = []) {
  const rows = [];
  for (const n of npc_entities || []) {
    if (!n || !n.name) continue;
    if (!(in_scene_ids || []).includes(String(n.id))) continue;
    rows.push(`      <NPC id="${escape_xml(String(n.id))}" name="${escape_xml(String(n.name))}" />`);
  }
  if (!rows.length) return "";
  return `    <PROXIMATE_NPCS>\n${rows.join("\n")}\n    </PROXIMATE_NPCS>`;
}

/** Active (present-in-story) names: AI + USER + FRACTAL + in-scene NPCs. */
function _active_names(entities, npc_entities, in_scene_ids) {
  const names = new Set();
  for (const e of [entities?.AI, entities?.USER, entities?.FRACTAL]) {
    if (e?.name) names.add(String(e.name).toLowerCase().trim());
  }
  for (const n of npc_entities || []) {
    if ((in_scene_ids || []).includes(String(n?.id)) && n?.name) {
      names.add(String(n.name).toLowerCase().trim());
    }
  }
  return names;
}

/** AI_CHARACTER / NPC character sheet. */
function _render_speaker_sheet({
  entity,
  entities,
  npc_entities = [],
  accessors,
  tag = "AI_CHARACTER",
  role_line = "",
  show_state = false,
  is_owner = true,
  dynamics = null,
  axis_scope = null,
  active_names = new Set(),
  name_to_id = new Map(),
}) {
  if (!entity) return "";
  const id_attr = entity?.id ? ` id="${escape_xml(String(entity.id))}"` : "";
  const rows = [];
  rows.push(`    <${tag}${id_attr} name="${escape_xml(entity?.name || tag)}">`);
  if (role_line) rows.push(`      ${role_line}`);
  rows.push(`      <PSYCHOLOGY>`);
  const agenda = accessors?.future(entity, { vector_text: true });
  if (String(agenda || "").trim()) rows.push(`        <AGENDA>${_inline_or_block(agenda, 10)}</AGENDA>`);
  const personality = render_field_value(entity?.eternal?.non_physical, entity, entities);
  if (String(personality || "").trim()) rows.push(`        <PERSONALITY>${_inline_or_block(personality, 10)}</PERSONALITY>`);
  if (show_state) {
    const state = strip_leading_key_echo(render_field_value(strip_epistemic_secrets(entity?.present?.non_physical, is_owner), entity, entities), [
      "STATE_OF_MIND",
      "STATE",
    ]);
    if (String(state || "").trim()) rows.push(`        <STATE>${_inline_or_block(state, 10)}</STATE>`);
  }
  const dispositions = _render_dispositions(entity, entities, npc_entities, active_names, name_to_id, 8);
  if (dispositions) rows.push(dispositions);
  const axes = render_dynamics_axes_xml(dynamics, axis_scope);
  if (axes) rows.push(_indent(axes, 8));
  rows.push(`      </PSYCHOLOGY>`);
  const appearance = render_appearance(entity?.eternal?.physical, entity?.present?.physical, entity, entities);
  if (appearance) rows.push(appearance);
  const memories = accessors?.past(entity, { vector_text: true });
  if (String(memories || "").trim()) rows.push(`      <MEMORIES>${_inline_or_block(memories, 8)}</MEMORIES>`);
  rows.push(`    </${tag}>`);
  return rows.join("\n");
}

/** USER_PERSONA sheet. Deliberately excludes <DISPOSITIONS> and <DYNAMIC_AXES>: the
 * user persona's directed attitudes are the player's private stance, so the AI
 * character must not be given knowledge it never observed (see L3_SPATIAL / L5_AGENCY). */
function _render_user_persona_sheet({ entities, accessors, is_narrator }) {
  const user = entities?.USER;
  if (!user) return "";
  const id_attr = user?.id ? ` id="${escape_xml(String(user.id))}"` : "";
  const rows = [];
  rows.push(`    <USER_PERSONA${id_attr} name="${escape_xml(user?.name || "User")}">`);
  rows.push(`      <PSYCHOLOGY>`);
  const personality = render_field_value(strip_epistemic_tags(user?.eternal?.non_physical), user, entities);
  if (String(personality || "").trim()) rows.push(`        <PERSONALITY>${_inline_or_block(personality, 10)}</PERSONALITY>`);
  if (!is_narrator) {
    const state = strip_leading_key_echo(render_field_value(strip_epistemic_secrets(user?.present?.non_physical, false), user, entities), [
      "STATE_OF_MIND",
      "STATE",
    ]);
    if (String(state || "").trim()) rows.push(`        <STATE>${_inline_or_block(state, 10)}</STATE>`);
  }
  rows.push(`      </PSYCHOLOGY>`);
  const appearance = render_appearance(strip_epistemic_tags(user?.eternal?.physical), strip_epistemic_tags(user?.present?.physical), user, entities);
  if (appearance) rows.push(appearance);
  const backstory = strip_epistemic_secrets(accessors?.past(user, { vector_text: true }), false);
  if (String(backstory || "").trim()) rows.push(`      <BACKSTORY>${_inline_or_block(backstory, 8)}</BACKSTORY>`);
  rows.push(`    </USER_PERSONA>`);
  return rows.join("\n");
}

/** FRACTAL sheet — unified shape for narrator and character modes. */
function _render_fractal_sheet({
  entities,
  accessors,
  _is_narrator,
  role_line = "",
  dynamics = null,
  axis_scope = null,
  npc_entities = [],
  name_to_id = new Map(),
  active_names = new Set(),
}) {
  const fractal = entities?.FRACTAL;
  if (!fractal) return "";
  const id_attr = fractal?.id ? ` id="${escape_xml(String(fractal.id))}"` : "";
  const rows = [];
  rows.push(`    <FRACTAL${id_attr} name="${escape_xml(fractal?.name || "the setting")}">`);
  if (role_line) rows.push(`      ${role_line}`);
  rows.push(`      <ATMOSPHERE>`);
  const trajectory = accessors?.future(fractal, { vector_text: true });
  if (String(trajectory || "").trim()) rows.push(`        <TRAJECTORY>${_inline_or_block(trajectory, 10)}</TRAJECTORY>`);
  const permanent = render_field_value(fractal?.eternal?.non_physical, fractal, entities);
  if (String(permanent || "").trim()) rows.push(`        <PERMANENT_TRUTHS>${_inline_or_block(permanent, 10)}</PERMANENT_TRUTHS>`);
  const state = strip_leading_key_echo(render_field_value(fractal?.present?.non_physical, fractal, entities), ["CURRENT_STATE", "STATE"]);
  if (String(state || "").trim()) rows.push(`        <STATE>${_inline_or_block(state, 10)}</STATE>`);
  const dispositions = _render_dispositions(fractal, entities, npc_entities, active_names, name_to_id, 8);
  if (dispositions) rows.push(dispositions);
  const axes = render_dynamics_axes_xml(dynamics, axis_scope);
  if (axes) rows.push(_indent(axes, 8));
  rows.push(`      </ATMOSPHERE>`);
  const topography = render_appearance(fractal?.eternal?.physical, fractal?.present?.physical, fractal, entities, "TOPOGRAPHY");
  if (topography) rows.push(topography);
  const history = accessors?.past(fractal, { vector_text: true });
  if (String(history || "").trim()) rows.push(`      <HISTORY>${_inline_or_block(history, 8)}</HISTORY>`);
  rows.push(`    </FRACTAL>`);
  return rows.join("\n");
}

/** <AXIOMATIC_CONSTITUTION> block — top-level sibling of <CORE_PROTOCOLS>. */
function render_axiomatic_constitution({ ghostwrite = false } = {}) {
  const constitution = (SHOT2_PROTOCOLS.CONSTITUTION || [])
    .filter((law) => !(ghostwrite && law.id === "L5_AGENCY"))
    .map((law) => `      <LAW id="${escape_xml(law.id)}">${prompt_escape(law.body)}</LAW>`)
    .join("\n");
  return `  <AXIOMATIC_CONSTITUTION>\n${constitution}\n  </AXIOMATIC_CONSTITUTION>`;
}

/**
 * True when any rendered entity field still carries `{Option A|Option B}`
 * alternation syntax, which gates the <ALTERNATION_OPTIONS> protocol.
 * @param {string} text
 * @returns {boolean}
 */
function _has_alternation(text) {
  return /\{[^{}]*\|[^{}]*\}/.test(String(text || ""));
}

/** <CORE_PROTOCOLS> block. */
function render_core_protocols({ is_narrator, pov_protocol, style, is_first_contact, has_alternation = false }) {
  const pov = is_narrator ? PROTOCOL_LIBRARY.POV.NARRATOR : PROTOCOL_LIBRARY.POV[pov_protocol.split(".")[1] || "FIRST_PERSON"];
  const person = is_narrator || pov_protocol === "POV.THIRD_PERSON" ? "THIRD" : "FIRST";
  const elements = Array.isArray(style?.elements) ? style.elements.filter(Boolean).join(", ") : "";
  const first_contact =
    !is_narrator && is_first_contact
      ? (() => {
          const def = (resolve_context_directives(["first_contact"]) || [])[0];
          return def ? `\n    <FIRST_CONTACT>${prompt_escape(def.directive)}</FIRST_CONTACT>` : "";
        })()
      : "";
  const style_dna = extract_style_dna(style);
  const description = String(style?.description || "").trim();
  const style_line =
    style && style?.id !== "default"
      ? `    <NARRATIVE_STYLE origin="${escape_xml(String(style.id).toUpperCase())}" internal_ratio="${escape_xml(style_dna.internal_ratio || "0.5")}">\n      ${description ? `${prompt_escape(description)}\n      ` : ""}${
          elements ? `<SIGNUM>${prompt_escape(elements)}</SIGNUM>` : ""
        }\n    </NARRATIVE_STYLE>`
      : "";
  const body = [
    `    <SIMULATION_FIDELITY>\n${_indent(SHOT2_PROTOCOLS.SIMULATION_FIDELITY, 6)}\n    </SIMULATION_FIDELITY>`,
    `    <PERSPECTIVE person="${person}" tense="PRESENT">\n      - Point of view: ${prompt_escape(pov)}\n      - Tense: Write strictly in the present tense.\n    </PERSPECTIVE>`,
    has_alternation ? `    <ALTERNATION_OPTIONS>${SHOT2_PROTOCOLS.ALTERNATION_OPTIONS}</ALTERNATION_OPTIONS>` : "",
    style_line,
    `    <PROSE_DISCIPLINE>\n      <FORMAT>${SHOT2_PROTOCOLS.FORMAT}</FORMAT>\n      <ANTI_TROPES>${SHOT2_PROTOCOLS.ANTI_TROPES}</ANTI_TROPES>\n      <BANNED_CLICHES>${SHOT2_PROTOCOLS.BANNED_CLICHES}</BANNED_CLICHES>\n      <NATURAL_DIALOGUE>${SHOT2_PROTOCOLS.NATURAL_DIALOGUE}</NATURAL_DIALOGUE>\n    </PROSE_DISCIPLINE>`,
  ]
    .filter(Boolean)
    .join("\n");
  return `  <CORE_PROTOCOLS>\n${body}${first_contact}\n  </CORE_PROTOCOLS>`;
}

/** <STORY_ENTITIES> block — sheets (each with per-entity <DISPOSITIONS>), then PROXIMATE_NPCS. */
function render_story_entities_section({
  entities,
  npc_entities,
  in_scene_ids,
  active_speaker,
  is_narrator,
  is_npc,
  accessors,
  speaker_dynamics,
  fractal_dynamics,
}) {
  const user_name = entities?.USER?.name || "User";
  const ai_name = entities?.AI?.name || "AI Character";
  const fractal_name = entities?.FRACTAL?.name || "the setting";

  const role_line = is_narrator
    ? `You are ${prompt_escape(active_speaker?.name || fractal_name)}, the Fractal itself, narrating the story.`
    : is_npc
      ? `You are ${prompt_escape(active_speaker?.name || "NPC")}, a supporting secondary character in an active scene with ${prompt_escape(user_name)} inside ${prompt_escape(fractal_name)}.`
      : `You are ${prompt_escape(active_speaker?.name || ai_name)} in ${prompt_escape(fractal_name)} together with ${prompt_escape(user_name)}.`;

  const active_names = _active_names(entities, npc_entities, in_scene_ids);
  const name_to_id = _name_to_id_map(entities, npc_entities);

  const parts = [];

  if (entities?.AI) {
    parts.push(
      _render_speaker_sheet({
        entity: entities.AI,
        entities,
        npc_entities,
        accessors,
        tag: "AI_CHARACTER",
        role_line: "",
        show_state: !is_narrator,
        is_owner: !is_npc,
        dynamics: !is_narrator && !is_npc ? speaker_dynamics : null,
        axis_scope: "somatic",
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.USER) {
    parts.push(_render_user_persona_sheet({ entities, accessors, is_narrator }));
  }

  if (entities?.FRACTAL) {
    parts.push(
      _render_fractal_sheet({
        entities,
        accessors,
        is_narrator,
        role_line: is_narrator ? role_line : "",
        dynamics: fractal_dynamics,
        axis_scope: "fractal",
        npc_entities,
        name_to_id,
        active_names,
      }),
    );
  }

  if (is_npc && active_speaker) {
    parts.push(
      _render_speaker_sheet({
        entity: active_speaker,
        entities,
        npc_entities,
        accessors,
        tag: "NPC",
        role_line,
        show_state: true,
        is_owner: true,
        dynamics: speaker_dynamics,
        axis_scope: "somatic",
        active_names,
        name_to_id,
      }),
    );
  }

  const proximate_npcs = _render_proximate_npcs(npc_entities, in_scene_ids);
  if (proximate_npcs) parts.push(proximate_npcs);

  return `  <STORY_ENTITIES>\n${parts.join("\n\n")}\n  </STORY_ENTITIES>`;
}

/** <TASK> block (the turn block), driven by the resolved prompt-mode config. */
function render_task({
  config,
  input,
  input_origin = null,
  is_prologue = false,
  style,
  somatic_inner,
  snapshot,
  is_narrator = false,
  action_directive = "",
  stability_lock = "",
}) {
  const dna = extract_style_dna(style);
  const input_tag = config.input?.tag || "INPUT";
  const parts = [];

  if (String(stability_lock || "").trim()) parts.push(`    <STABILITY_LOCK>${prompt_escape(stability_lock)}</STABILITY_LOCK>`);
  if (String(action_directive || "").trim()) parts.push(_indent(action_directive, 4));

  const currents = [];
  if (dna.sensory_order) currents.push(`      <SENSORY_EXPERIENCE>${prompt_escape(dna.sensory_order)}</SENSORY_EXPERIENCE>`);
  if (String(somatic_inner || "").trim()) currents.push(_wrap_tag("SUBTEXT", somatic_inner, 6));
  if (currents.length) parts.push(`    <CURRENTS>\n${currents.join("\n")}\n    </CURRENTS>`);

  if (input_tag && String(input || "").trim() && !is_prologue) {
    const origin = String(input_origin || "USER");
    parts.push(`    <${input_tag} origin="${escape_xml(origin)}">${_inline_or_block(prompt_escape(input.trim()), 6)}</${input_tag}>`);
  }

  if (!is_narrator) {
    parts.push(_indent(build_recency_anchor(snapshot, input), 4));
  }

  const grounding = dna.emotional_grounding || "hold your established temperament against the immediate friction";
  parts.push(
    is_narrator
      ? `    <THINK_FORMAT>\n${_indent(PROTOCOL_LIBRARY.COGNITION.THINK_NARRATOR, 6)}\n    </THINK_FORMAT>`
      : `    <THINK_FORMAT>\n${_indent(SHOT2_PROTOCOLS.THINK_FORMAT(grounding, input_tag), 6)}\n    </THINK_FORMAT>`,
  );

  return `<TASK>\n${parts.join("\n\n")}\n</TASK>`;
}

// ── 4. Unified Story Prose Compiler ──────────────────────────────────────────

/**
 * Resolves a prompt-mode config by key, falling back to interaction.
 * @param {string} key
 * @returns {any}
 */
export function get_prompt_mode(key) {
  return prompt_modes[key] || prompt_modes.interaction;
}

/**
 * Maps the caller-facing mode (legacy `mode` string + ghostwrite flag + NPC
 * detection) onto a prompt-modes registry key.
 * @param {{ mode?: string, ghostwrite?: boolean, is_npc?: boolean }} params
 * @returns {any}
 */
export function resolve_prompt_mode({ mode = "character", ghostwrite = false, is_npc = false } = {}) {
  if (ghostwrite) return get_prompt_mode("ghostwrite");
  if (mode === "narrator") return get_prompt_mode("narrator");
  return get_prompt_mode(is_npc ? "npc" : "interaction");
}

/**
 * Consolidated Story Prose compiler.
 * Unifies AI Character, Stage NPC, and Narrator generation into a single fused
 * <SYSTEM> layout driven by the prompt-modes registry; the narrator beat
 * (CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE) is selected via scene_template.
 *
 * Returns the open <SYSTEM> prefix without its closing tag; the transport
 * injects <CONVERSATION_HISTORY> and the <TASK> block before appending
 * `system_close` (</SYSTEM>), so history + task live inside <SYSTEM>.
 *
 * @param {Object} params
 * @param {'character' | 'narrator'} [params.mode="character"]
 * @param {number|string|null} [params.round]
 * @param {any} params.entities
 * @param {any} [params.speaker] - Speaker entity (defaults to entities.AI for character mode, or entities.FRACTAL for narrator mode)
 * @param {string} [params.input]
 * @param {any} [params.compressed_snapshot]
 * @param {any} [params.meta]
 * @param {any} [params.render_accessors]
 * @param {boolean} [params.ghostwrite]
 * @param {any} [params.director_data]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @param {'CONTINUATION' | 'PROLOGUE' | 'EPILOGUE' | 'COLLAPSE' | null} [params.scene_template=null]
 * @returns {{ system: string, task: string, system_close: string }}
 */
export function render_story_prose({
  mode = "character",
  round = null,
  entities = {},
  speaker = null,
  input = "",
  compressed_snapshot = {},
  meta = {},
  render_accessors = null,
  ghostwrite = false,
  prompt_mode = null,
  director_data = null,
  npc_entities = [],
  in_scene_ids = [],
  scene_template = null,
}) {
  const is_narrator_mode = mode === "narrator";
  const active_speaker = speaker || (is_narrator_mode ? entities?.FRACTAL : entities?.AI);
  const is_npc = !is_narrator_mode && !!active_speaker && active_speaker !== entities?.AI;
  const config = prompt_mode ? get_prompt_mode(prompt_mode) : resolve_prompt_mode({ mode, ghostwrite, is_npc });
  const is_narrator = config.think_format === "narrator";
  const resolved_scene_template = scene_template || config.scene_template || null;
  const is_prologue = resolved_scene_template === "PROLOGUE";

  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);
  const pov_protocol = resolve_pov_protocol(active_speaker);

  const speaker_name = prompt_escape(active_speaker?.name || (is_narrator ? "The Fractal" : is_npc ? "NPC" : "AI"));
  const ai_name = prompt_escape(entities?.AI?.name || "AI Character");

  const style = get_narrative_style(resolve_active_style_key());

  const speaker_dynamics = is_narrator
    ? compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {}
    : is_npc
      ? active_speaker?.dynamics || {}
      : compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {};

  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {};

  const somatic_signals_xml = is_narrator
    ? resolved_scene_template === "CONTINUATION"
      ? build_somatic_signals_xml({}, fractal_dynamics, {
          keywords: director_data?.keywords || [],
          style,
        })
      : ""
    : build_somatic_signals_xml(speaker_dynamics, fractal_dynamics, {
        keywords: director_data?.keywords || [],
        style: config.ghostwrite ? null : style,
      });
  const somatic_inner = String(somatic_signals_xml || "")
    .replace(/^\s*<SUBTEXT>\s*/, "")
    .replace(/\s*<\/SUBTEXT>\s*$/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const is_first_contact =
    meta?.is_opening_turn ||
    (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT")) ||
    (Array.isArray(director_data?.keywords) && director_data.keywords.includes("first_contact"));

  const constitution = render_axiomatic_constitution({ ghostwrite: config.ghostwrite });

  const entities_block = render_story_entities_section({
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    is_narrator,
    is_npc,
    accessors,
    speaker_dynamics,
    fractal_dynamics,
  });

  const core = render_core_protocols({
    is_narrator,
    pov_protocol,
    style,
    is_first_contact,
    has_alternation: _has_alternation(entities_block),
  });

  const top_line =
    !is_narrator && !is_npc
      ? `You are the AI_CHARACTER ${prompt_escape(entities?.AI?.name || "AI")} within the FRACTAL ${prompt_escape(entities?.FRACTAL?.name || "the setting")}, interacting with USER_PERSONA ${prompt_escape(entities?.USER?.name || "User")}. Embody this role with uncompromised fidelity under the laws and directives below.`
      : "";

  const system = clean_xml(
    `\n<SYSTEM round="${escape_xml(String(round ?? 0))}" mode="${escape_xml(config.system_mode)}">\n${top_line ? `${top_line}\n` : ""}${constitution}\n\n${core}\n\n${entities_block}\n`,
  ).trim();

  const stability_lock_content =
    meta?.structural_errors >= 3 ? STORY_PROTOCOLS.STABILITY.CRITICAL : meta?.structural_errors >= 1 ? STORY_PROTOCOLS.STABILITY.WARNING : "";

  const narrator_task_text = is_prologue
    ? `${STORY_PROTOCOLS.SCENE_TEMPLATES.PROLOGUE}\n    Input: ${prompt_escape(input?.trim() || "The scene begins.")}`
    : resolved_scene_template === "CONTINUATION"
      ? STORY_PROTOCOLS.SCENE_TEMPLATES.CONTINUATION
      : resolved_scene_template === "COLLAPSE"
        ? STORY_PROTOCOLS.SCENE_TEMPLATES.COLLAPSE
        : STORY_PROTOCOLS.SCENE_TEMPLATES.EPILOGUE;

  const draft_directive = input?.trim()
    ? STORY_PROTOCOLS.GHOSTWRITE.ENHANCE(ai_name, prompt_escape(input.trim()))
    : STORY_PROTOCOLS.GHOSTWRITE.DRAFT(ai_name, prompt_escape(entities?.USER?.name || "AI Character"));

  const action_directive = is_narrator
    ? narrator_task_text
    : is_npc
      ? `${STORY_PROTOCOLS.DIRECTIVES.NPC_BOUNDARY(speaker_name)}`
      : config.ghostwrite
        ? `${draft_directive}\n    ${STORY_PROTOCOLS.GHOSTWRITE.META}`
        : input?.trim()
          ? `Advance the scene in response to <INPUT />.`
          : STORY_PROTOCOLS.DIRECTIVES.INITIATIVE;

  const input_origin_entity = config.ghostwrite ? active_speaker : entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  const task = render_task({
    config,
    input,
    input_origin,
    is_prologue,
    style,
    somatic_inner,
    snapshot: { dynamics: speaker_dynamics, style },
    is_narrator,
    action_directive,
    stability_lock: stability_lock_content,
  });

  return { system, task, system_close: "</SYSTEM>" };
}

// ── 5. Player Ghostwriter Compiler ───────────────────────────────────────────

/**
 * Deep-clones an entity resolving every string field's {{...}} macros from that
 * entity's own perspective. Used before the ghostwriter's perspective swap so a
 * companion's stored state never inverts {{char}}/{{user}} references.
 * @param {any} entity
 * @param {any} entities
 * @returns {any}
 */
function _resolve_entity_macros(entity, entities) {
  if (!entity) return entity;
  const seen = new WeakSet();
  const expand = (value) => {
    if (typeof value === "string") return parse_macros(value, entity, entities);
    if (Array.isArray(value)) return value.map(expand);
    if (value && typeof value === "object") {
      if (seen.has(value)) return value;
      seen.add(value);
      const out = {};
      for (const key of Object.keys(value)) out[key] = expand(value[key]);
      return out;
    }
    return value;
  };
  return expand(entity);
}

/**
 * Ghostwriter prompt compiler — player drafting and enhancement assistant.
 * @param {Object} params
 * @param {any} params.entities
 * @param {string} [params.input=""]
 * @returns {{ system: string, task: string, system_close: string }}
 */
export function render_ghostwriter({ entities, input = "" }) {
  const user_name = entities?.USER?.name || "User Persona";
  const ai_name = entities?.AI?.name || "AI Character";

  const swapped = {
    ...(entities || {}),
    AI: entities?.USER ? _resolve_entity_macros(entities.USER, entities) : { name: user_name, present: {}, eternal: {}, future: "", past: [] },
    USER: entities?.AI ? _resolve_entity_macros(entities.AI, entities) : { name: ai_name, present: {}, eternal: {}, future: "", past: [] },
  };

  const render_accessors = render_builder.create_render_accessors(swapped, input || "", []);
  const rendered = render_story_prose({
    mode: "character",
    round: 0,
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
    prompt_mode: "ghostwrite",
  });

  return rendered;
}

/**
 * CHANGELOG
 * - 2026-09-10: USER_PERSONA privacy. Dropped the user persona's <DISPOSITIONS>
 *   from its sheet (and pruned the now-unused npc_entities/name_to_id/active_names
 *   params) so the AI character is never handed the player's directed attitudes —
 *   knowledge it could not have observed (L3_SPATIAL / L5_AGENCY). Matches the
 *   blueprint; the AI's own and the Fractal's dispositions still render.
 * - 2026-09-10: Scene-anchor removal + sensory re-source. Dropped <SCENE_ANCHOR>
 *   (LOCATION/ENVIRONMENT/CONDITION) from the turn block and the scene-derived
 *   sensory path with it: <SENSORY_EXPERIENCE> now emits the selected
 *   NarrativeStyle's SENSORY_ORDER verbatim. Deleted the now-dead
 *   _scene_environment / _render_scene_anchor helpers and the flatten_physical
 *   import (pruned from @utils).
 * - 2026-09-10: Blueprint follow-up review. AGENDA moved inside <PSYCHOLOGY> and TRAJECTORY inside
 *   <ATMOSPHERE> (both sheets); <USER_SOVEREIGNTY> removed entirely (the agency guarantee is carried
 *   by L5_AGENCY + PROSE_DISCIPLINE) — dropped the SHOT2_PROTOCOLS.USER_SOVEREIGNTY body and the
 *   prompt-modes `user_sovereignty` flag; <ALTERNATION_OPTIONS> now renders only when a rendered
 *   entity field still carries {A|B} syntax; THINK_FORMAT wording realigned to the blueprint
 *   ("internal reasoning across 4 sequential beats", "Immediate non-verbal reaction", bare "Draft a
 *   dialogue line before generating outward prose", "Close with </THINK> before generating narrative
 *   prose").
 * - 2026-09-10: Blueprint-alignment pass (story-prose scope). Renamed/nested the whole Shot-2
 *   schema to the authored blueprint: L1_INTEGRITY / L2_CONTINUITY / L3_SPATIAL / L4_AESTHETIC /
 *   L5_AGENCY (blueprint wording — "player sovereignty" framing removed); CREATIVE_FREEDOM →
 *   SIMULATION_FIDELITY (content-permission line retained); POV_DIRECTIVE + <TENSE> → one
 *   <PERSPECTIVE person tense> with two bullets; NARRATIVE_STYLE now carries its description +
 *   <SIGNUM>; BEHAVIORAL_DISCIPLINE → PROSE_DISCIPLINE (FORMAT / ANTI_TROPES / BANNED_CLICHES /
 *   NATURAL_DIALOGUE); entity sheets gained id attrs and re-nested (AGENDA at top level,
 *   PSYCHOLOGICAL_PROFILE → PSYCHOLOGY with STATE/DISPOSITIONS/DYNAMIC_AXES inside); FRACTAL gained
 *   TRAJECTORY + <ATMOSPHERE> (PERMANENT_TRUTHS/STATE/DISPOSITIONS/DYNAMIC_AXES) and
 *   ENVIRONMENT → TOPOGRAPHY; PRESENT_NPCS → PROXIMATE_NPCS (<NPC id name />); the turn block
 *   became <TASK>: STAGE_DIRECTIVES → CURRENTS (SENSORY_EXPERIENCE + SUBTEXT), RECENCY_ANCHOR →
 *   DELIVERY_POSTURE (PACING/RHYTHM/DRIVE), <USER_ACTION> → <INPUT origin>, THINK_FORMAT beats →
 *   <BEAT id step> tags; section dividers dropped; top line to blueprint wording. History + TASK
 *   now render INSIDE <SYSTEM> (render_story_prose returns an open system + system_close for the
 *   transport to close). SCENE_ANCHOR / USER_SOVEREIGNTY / ALTERNATION_OPTIONS / FIRST_CONTACT /
 *   STABILITY_LOCK kept.
 * - 2026-09-10: Merged the old `fractal`/`prologue`/`epilogue` prompt modes into the single
 *   `narrator` mode; render_story_prose now takes `scene_template` instead of `conclusion_status`
 *   and dispatches the narrator beat (CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE) from it.
 * - 2026-09-10: Scene grounding: the turn block now opens with a SCENE_ANCHOR
 *   (the Fractal's LOCATION/ENVIRONMENT/CONDITION) and SENSORY_EXPERIENCE is
 *   derived from the live fractal environment instead of the style's static
 *   SENSORY_ORDER, so backstory can no longer override the live scene.
 * - 2026-09-10: Fused every speaker mode onto ONE <SYSTEM mode="..."> layout (deleted the character
 *   layout fork: CHARACTER_* laws, render_character_system/task/core/entities, the character sheets
 *   and _render_psychology); AXIOMATIC_CONSTITUTION is now a top-level sibling above CORE_PROTOCOLS;
 *   prompt-modes.json drives system_mode / user_sovereignty / input.tag / think_format / axes_scope /
 *   scene_template; per-entity <DISPOSITIONS> render in all sheets; ghostwrite now drafts the PLAYER's
 *   turn against the AI character (identity-inversion fix); <TASK> carries no mode.
 * - 2026-09-04: Shot-2 polish: THINK_FORMAT (attr-free, 4 beats; beat 4 ratio-conditional on style), NARRATIVE_STYLE internal_ratio attr + <SIGNATURE_ELEMENTS> child, <TENSE mode="PRESENT">, <CLICHE_BAN>, <SENSORY_EXPERIENCE>, USER_SOVEREIGNTY mode="ABSOLUTE", DIRECTOR_NOTE removed (directive moves to startWith), FIRST_CONTACT via CONTEXT_DIRECTIVE_REGISTRY, PACING de-duplicated, dialogue-quote rule consolidated into PROSE_BOUNDS, <entry> → <ENTRY>, character "You are" top line after <SYSTEM>, FRACTAL sheet always renders fractal dynamics axes.
 * - 2026-09-06: Redesign (suggestion.md): <HIERARCHY> → <AXIOMATIC_CONSTITUTION> with <LAW id="L1..L4"> wrappers; FICTIONAL_LICENSE → <CREATIVE_FREEDOM> (content-permission line preserved); NARRATIVE_STYLE → single-line "<NARRATIVE_STYLE id=\"UPPER\">Employ the signature storytelling of [name]. [description] Include things such as [elements]</NARRATIVE_STYLE>" (omitted for default); build_pacing_directive → <PACING mode="..."> tags; DIRECTOR_NOTE child <STAGE_DIRECTION> → <CLIFFSNOTES>; global RELATIONSHIPS mesh removed, replaced by per-entity OUTGOING <RELATIONSHIPS> in each sheet (before MEMORIES/BACKSTORY/HISTORY) shown only when the target is present in the story.
 * - 2026-09-06: Forked Shot 2 from the shared system head — new blueprint-aligned <SYSTEM round="N"> layout (CORE_PROTOCOLS / STORY_ENTITIES / TURN_EXECUTION). CONVERSATION_HISTORY stays engine-injected between system and task.
 * - 2026-09-06: Rebuilt entity sheets: AI_CHARACTER + USER_PERSONA + FRACTAL + <NPC> in <STORY_ENTITIES> with PSYCHOLOGICAL_PROFILE (AGENDA / DYNAMIC_AXES / STATE_OF_MIND / PERSONALITY), merged <APPEARANCE>/<ENVIRONMENT> (eternal + present), MEMORIES/BACKSTORY/HISTORY; PRESENT_NPCS roster followed by <RELATIONSHIPS> mesh (below PRESENT_NPCS).
 * - 2026-09-06: Redistributed style fields: internal_ratio → THINK_FORMAT attr, sentence_rhythm → RECENCY_ANCHOR RHYTHM, sensory_order → STAGE_DIRECTIVES SENSORY_HIERARCHY, emotional_grounding → THINK_FORMAT beat 2; NARRATIVE_STYLE shrinks to ESSENCE + ELEMENTS.
 * - 2026-09-06: Dropped <DYNAMICS> laws/legend, SNAPSHOT, ROUND and USER_ACTION from the task (moved into system); task shrinks to STABILITY_LOCK + action directive.
 * - 2026-09-06: Moved render_recoupled_cast_body to shared.js (single shared cast renderer for storyteller and director) and removed the eternal-only cached CAST path (system_head_cache/_render_eternal_cast_body); render_system_head now takes the cast body directly.
 * - 2026-09-06: Recoupled the prompt layout: each entity's eternal + present + future + past now clump into one per-entity character-sheet block inside <CAST> (render_recoupled_cast_body). The SNAPSHOT shrinks to the relational mesh (<CURRENT_STORY_STATE>) + ROUND/USER_ACTION/TASK. <YOUR_IDENTITY>, PROTAGONIST, and the old split SNAPSHOT blocks are removed.
 * - 2026-09-04: Ghostwriter now resolves stored {{...}} macros against stable identities before its perspective swap, so swapped character state never inverts {{char}}/{{user}} references.
 * - 2026-09-06: Pruned dead <ANCHOR> tag from narrator protocols XML.
 * - 2026-09-06: Consolidated somatic directives and dynamics signals into build_somatic_signals_xml (<SOMATIC_SIGNALS>).
 * - 2026-08-28: Ground-up deconstruct & refactor: unified protocol composition, streamlined XML templating across AI/NPC/Narrator engines, and added clear section dividers.
 * - 2026-09-04: Added L5_AGENCY law (actor-agency wording), ALTERNATION_OPTIONS selectable-option protocol, and ghostwrite exemption for L5_AGENCY in render_core_protocols.
 */
