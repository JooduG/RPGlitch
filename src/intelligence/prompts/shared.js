/**
 * src/intelligence/prompts/shared.js
 * 🧩 SHARED PROMPT COMPOSITION & PREFIX CACHING
 *
 * Prompt building blocks shared by both shots:
 * - PROTOCOL_LIBRARY + render_protocols — the cross-shot protocol library and its compiler.
 * - Layout helpers (indent_all / inline_or_block / wrap_tag).
 * - The canonical, mode-driven <STORY_ENTITIES> compiler (render_entity_sheets) and its sheets.
 * - Epistemic-wall filters (strip_epistemic_tags / strip_epistemic_secrets).
 * - The prompt-mode registry accessor (get_prompt_mode), the POV-key resolver, and
 *   the structural stability-lock messages shared by every Story Prose mode.
 *
 * The <STORY_ENTITIES> vocabulary is shared by the Director and every Story
 * Prose mode: AI_CHARACTER / USER_PERSONA / FRACTAL / NPC, each carrying
 * <PSYCHOLOGY> (or <ATMOSPHERE> for the FRACTAL), an optional merged
 * <APPEARANCE>/<TOPOGRAPHY>, and MEMORIES / BACKSTORY / HISTORY. Which sheets
 * appear and which blocks they carry is driven by each mode's `sheets` config in
 * prompt-modes.json:
 *   - dispositions:   entity keys whose sheet renders per-entity <DISPOSITIONS>
 *                     (an "NPC" entry also renders in-scene NPC sheets so their
 *                     edges have a home)
 *   - dynamic_axes:   entity keys whose sheet renders <DYNAMIC_AXES>
 *   - user_agenda:    expose the USER's future vector as <AGENDA>
 *   - proximate_npcs: render the in-scene <PROXIMATE_NPCS> roster
 * Role lines are NOT part of the sheets — every caller injects one right after
 * <SYSTEM>.
 */

import { escape_xml, prompt_escape, physical_to_xml, parse_relational_vector, strip_leading_key_echo, render_field_value } from "@utils";
import { render_dynamics_axes_xml } from "./physics-prompt.js";
import prompt_modes from "./prompt-modes.json";

// ── 1. Consolidated Protocol Library ──────────────────────────────────────────

const BASE_HYGIENE = "Start immediately. Output zero narrative prose, conversational filler, or meta-commentary.";
const BASE_THINK_CLOSURE = "Conduct thinking in the conversation language. Close with </THINK> response before narrative prose.";

export const PROTOCOL_LIBRARY = {
  // ── 1.1 Core Output Mechanics, Formatting & Hygiene ────────────────────────
  HYGIENE: {
    PROSE_DISCIPLINE: `${BASE_HYGIENE} No timestamps or headers. No echoing user dialogue. Match character profile. Write natural physicality in the affirmative (state what IS, not what isn't). Format with expressive markdown (*italics* for physical actions/subtext, **bold** for key impacts/codenames, "quotes" for speech). Roughly match the length and energy of the user's message. Always end on a complete sentence.`,
    DATA: `${BASE_HYGIENE} Return strictly raw, unpadded structural data.`,
    ANTI_TROPES: `1. STRUCTURAL FORMULAS: Avoid sentence-level AI formulas: denial-then-affirmation ('X didn't just Y; it Z'd', "I don't just [verb]; I [verb]", "didn't just", "not merely", "doesn't simply"); binary comparison clichés ('felt less like X and more like Y'); appositive dialogue sound tags ('she laughed, a [adj], [adj] sound'); pseudo-profound statements; user-echoing starters ('You speak of...', 'You think that...'); self-answering dialogue; recycled fantasy names (Elara, Kaelen, Valerius Thorne); and formulaic action-dialogue sandwiches ([action] + 'dialogue' + [action] every turn).
2. AFFIRMATIVE PROSE: Render presence, posture, tactile sensation, and movement directly. Describe what characters do, perceive, and feel through concrete action rather than passive summary, clichéd tropes, or artificial dramatic pauses.`,
    AFFIRMATIVE_FRAMING:
      "Describe what IS physically in frame ('a softly moonlit glade' rather than 'no harsh sunlight'); keep the negative_prompt limited to global quality artifacts.",
  },

  // ── 1.2 State Mutation & Brackets (Pseudo-JSON) ────────────────────────────
  STATE: {
    PSEUDO_JSON: `Pseudo-JSON STATE FORMAT — mutate active state with bracketed [KEY: VALUE] directives in "present.physical" (visible state) and "present.non_physical" (mindset/private state):
- FORMAT: [KEY: value] (one directive per line, uppercase key, descriptive value; never wrap in JSON or code fences).
- CANONICAL KEYS: [SHIRT: ...], [PANTS: ...], [SHOES: ...], [HELD: ...], [INJURY: ...], [DISGUISE: ...], [POSE: ...], [INVENTORY: ...]
- OVERWRITE: [SHIRT: knitted sweater] REPLACES the existing SHIRT value directly — never emit a second SHIRT, never append a duplicate tag.
- UNIVERSAL CLEAR: [KEY: none], [KEY: bare], [KEY: naked], [KEY: off], [KEY: removed], [KEY: disrobed], [KEY: healed], [KEY: cleared], [KEY: normal] atomically deletes that key. Use [CLOTHING: none] to strip ALL worn clothing at once.
- MULTI-ITEM: [INVENTORY: item1, item2] and repeated [INVENTORY: ...]/[STASH: ...] brackets MERGE into one aggregated list — never overwrite or clobber existing inventory.
- UNDRESS / REDRESS LIFECYCLE: When clothing comes off, emit [SHIRT: none] and stash the garment via [INVENTORY: white greasy tank-top]. When dressing again, READ the exact item back from INVENTORY (visible in <CURRENT_LOOK>) and emit [SHIRT: white greasy tank-top] — never hallucinate a new garment.
- EPISTEMIC: [SECRET: ...] and [PLAN: ...] belong ONLY in "present.non_physical" (private truth) — they never appear in <CURRENT_LOOK>, never reach image prompts, and never leak into another character's prompt block.
- VISUAL: INVENTORY/STASH/SECRET/PLAN/STATUS are automatically excluded from image generation. Keep genuinely visible state (worn clothing, HELD, INJURY, DISGUISE, POSE, LOCATION, WEATHER) in "present.physical".`,
  },

  // ── 1.3 Narrative Agency & Boundaries ───────────────────────────────────────
  AGENCY: {
    DRIFT_AUDIT:
      "Before writing, take the grounded path — not the easy one. Verify the reply embodies affirmative agency:\n1. ASSISTANT-DRIFT: Ground character interaction in their authentic personality; express natural friction, defiance, courtesy, or disinterest as their established archetype dictates.\n2. SPOTLIGHT-DRIFT: Keep the character's independent needs, active agenda, and internal world in motion alongside the other party.\n3. INTERVIEW-DRIFT: State your own perspective directly and pursue your goals rather than rhetorically querying or summarizing the other party.\n4. PACING-DRIFT: Maintain situational tension; allow conflict and emotional stakes to build gradually across beats.\n5. OMNISCIENCE-DRIFT: Act strictly on information directly perceived within your sensory horizon.",
    USER_BOUNDARIES:
      "Never predict, assume, or generate the user's next action. React ONLY to <USER_ACTION>. Never describe user thoughts, feelings, or reactions. Write your turn. Stop.",
    YES_AND:
      "User actions, physical premises, and sensory observations are absolute truth. Build upon them. Character reactions remain yours. PHYSICAL TRUTH & PERCEPTION LAW: User observations, physical interactions, clothing outlines, bulges, and anatomical references in the shared scene are absolute reality. You MUST validate and acknowledge that physical truth in-character (e.g. leaning into it, teasing back, getting flustered, showing off, or countering). NEVER deflect, dismiss, erase, or ignore the user's physical focus by pretending they only said or did something else. Never sanitize or medicalize visceral language into sterile clinical terms. Embody 'Yes, and...' to drive scenes forward.",
    INITIATIVE:
      "Take active initiative. Drive scenes forward through decisions and reactions without asking permission. Introduce new elements, complications, or discoveries. Avoid passivity.",
    MOMENTUM: "End on a live beat (challenge, question, tension, or deliberate silence) that organically invites response without structural labels.",
    PRESENT_TENSE: "Write strictly in the present tense.",
    FICTIONAL_LICENSE:
      "Self-contained simulation for creative exploration. Explicit, morally complex, adversarial, or tense scenarios are encouraged and expected when serving narrative coherence. Maintain total immersion; never break character, soften stakes, or moralize.",
    ORGANIC_GAZE:
      "Perceive physical contours, silhouettes, revealing attire, fit, and exposed skin naturally during neutral and tense beats alike without waiting for overt triggers.",
    SOMATIC_PHYSICALITY:
      "Render physical trauma, strain, impact, and injury consequences with visceral, concrete detail. Physical trauma has lasting momentum and does not instantly resolve.",
  },

  // ── 1.3 Cognition & Epistemic Physics ──────────────────────────────────────
  COGNITION: {
    THINK_CHARACTER: `Begin response with <THINK> (under 200 words). Process reaction to <USER_ACTION> using in-character subconscious reasoning across 3 layers:
1. Visceral Reaction: Physical impact of the immediate situation.
2. Secret Drivers: How <AGENDA> steers your choice; build tension via initial hurdles first.
3. 3-Layer Delivery: Explicit (dialogue/action), Implicit (unspoken tensions/micro-expressions), and Somatic (involuntary autonomic signals from <SOMATIC_SIGNALS>).
${BASE_THINK_CLOSURE}`,
    THINK_NARRATOR: `Begin response with <THINK>. ALL internal calculations, scene/atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block. ${BASE_THINK_CLOSURE}`,
    EPISTEMIC_PHYSICS: `1. Sensory Boundary: Perception ends at sensory horizon (sight, sound, touch). Unvoiced thoughts are Null Data.
2. Perspective Isolation: Interpret others strictly through personal emotional filters, never omniscient clarity.
3. Spatial Integrity: Maintain physical boundaries. Avoid unprovoked proximity encroachment or constant posture tagging.
4. Concrete Interaction: Prioritize localized object interactions over repetitive physical gestures.
5. Emotion Mapping: Express emotion strictly through observable micro-actions, physical choices, and tone shifts.
6. Environmental Persistence: Maintain continuity of lingering physical conditions rather than letting environment vanish when focus shifts.
7. Procedural Skill: If the character possesses a skill, describe the technique and muscle memory, not just the outcome.`,
  },

  // ── 1.4 Perspective & Point of View (POV) ──────────────────────────────────
  POV: {
    FIRST_PERSON:
      "CRITICAL POV MANDATE: Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes. NEVER use third-person or your character name.",
    THIRD_PERSON:
      "CRITICAL POV MANDATE: Write strictly in third-person limited ('he', 'she', 'they', or entity name). NEVER use first-person pronouns for narrative prose.",
    NARRATOR:
      "CRITICAL MANDATE: You are the <FRACTAL> (scene/setting narrator). Write strictly in third-person omniscient narrator POV. NEVER write in first-person.",
  },
};

// ── 2. Protocol Compiler & Caching ────────────────────────────────────────────

/** @type {Map<string, string>} */
const protocols_cache = new Map();

/**
 * Compiles a comma-separated list of protocol keys (e.g. "HYGIENE.PROSE_DISCIPLINE, AGENCY.MOMENTUM")
 * into XML protocol tags for LLM prompt headers.
 * @param {string} selection
 * @returns {string}
 */
export function render_protocols(selection) {
  if (!selection) return "";
  if (protocols_cache.has(selection)) {
    return protocols_cache.get(selection) || "";
  }
  const rendered = selection
    .split(",")
    .map((k) => {
      const key = k.trim().toUpperCase();
      const parts = key.split(".");
      let rule = /** @type {any} */ (PROTOCOL_LIBRARY);
      for (const part of parts) {
        rule = rule?.[part];
        if (!rule) break;
      }
      if (!rule || typeof rule !== "string") return "";
      const tag = parts[parts.length - 1];
      return rule.includes("\n") ? `<${tag}>\n${rule}\n</${tag}>` : `<${tag}>${rule}</${tag}>`;
    })
    .filter(Boolean)
    .join("\n");

  protocols_cache.set(selection, rendered);
  return rendered;
}

// ── 3. Layout Helpers ─────────────────────────────────────────────────────────

/**
 * Indents every line of a multi-line string (unlike @utils `ind`, which leaves
 * the first line unindented).
 * @param {string|null|undefined} text
 * @param {number} spaces
 * @returns {string}
 */
export function indent_all(text, spaces) {
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
export function inline_or_block(content, indent) {
  const text = String(content || "").trim();
  if (!text) return "";
  if (text.includes("\n")) {
    return `\n${indent_all(text, indent)}\n${" ".repeat(indent - 2)}`;
  }
  return text;
}

/**
 * Wraps already-rendered inner content in a tag, indented to `indent`.
 * @param {string} tag
 * @param {string|null|undefined} inner
 * @param {number} indent
 * @returns {string}
 */
export function wrap_tag(tag, inner, indent) {
  const body = String(inner || "").trim();
  if (!body) return "";
  const pad = " ".repeat(indent);
  return `${pad}<${tag}>\n${indent_all(body, indent + 2)}\n${pad}</${tag}>`;
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

// ── 4. Identity & Disposition Helpers ─────────────────────────────────────────

/**
 * Name → entity id lookup used to render DISPOSITION target attributes as entity
 * ids (e.g. premade ids like "RUST", "JULIEN", "TARTARUS").
 * @param {any} entities
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

/**
 * Renders an entity's outgoing relationships as
 * <DISPOSITION target="ID">dynamic</DISPOSITION>, only for targets present in
 * the story, keyed by entity id.
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

// ── 5. Entity Sheets ──────────────────────────────────────────────────────────

/** AI_CHARACTER / NPC character sheet. */
function _render_speaker_sheet({
  entity,
  entities,
  npc_entities = [],
  accessors,
  tag = "AI_CHARACTER",
  is_owner = true,
  dynamics = null,
  axis_scope = null,
  show_dispositions = true,
  active_names = new Set(),
  name_to_id = new Map(),
}) {
  if (!entity) return "";
  const id_attr = entity?.id ? ` id="${escape_xml(String(entity.id))}"` : "";
  const rows = [];
  rows.push(`    <${tag}${id_attr} name="${escape_xml(entity?.name || tag)}">`);
  rows.push(`      <PSYCHOLOGY>`);
  const agenda = accessors?.future(entity, { vector_text: true });
  if (String(agenda || "").trim()) rows.push(`        <AGENDA>${inline_or_block(agenda, 10)}</AGENDA>`);
  const personality = render_field_value(entity?.eternal?.non_physical, entity, entities);
  if (String(personality || "").trim()) rows.push(`        <PERSONALITY>${inline_or_block(personality, 10)}</PERSONALITY>`);
  const state = strip_leading_key_echo(render_field_value(strip_epistemic_secrets(entity?.present?.non_physical, is_owner), entity, entities), [
    "STATE_OF_MIND",
    "STATE",
  ]);
  if (String(state || "").trim()) rows.push(`        <STATE>${inline_or_block(state, 10)}</STATE>`);
  if (show_dispositions) {
    const dispositions = _render_dispositions(entity, entities, npc_entities, active_names, name_to_id, 8);
    if (dispositions) rows.push(dispositions);
  }
  const axes = render_dynamics_axes_xml(dynamics, axis_scope);
  if (axes) rows.push(indent_all(axes, 8));
  rows.push(`      </PSYCHOLOGY>`);
  const appearance = render_appearance(entity?.eternal?.physical, entity?.present?.physical, entity, entities);
  if (appearance) rows.push(appearance);
  const memories = accessors?.past(entity, { vector_text: true });
  if (String(memories || "").trim()) rows.push(`      <MEMORIES>${inline_or_block(memories, 8)}</MEMORIES>`);
  rows.push(`    </${tag}>`);
  return rows.join("\n");
}

/**
 * USER_PERSONA sheet. <DISPOSITIONS> and <DYNAMIC_AXES> render only when the
 * mode opts in — the player's directed attitudes are otherwise private (see
 * L3_SPATIAL / L5_AGENCY); omniscient modes (narrator/director) may include them.
 */
function _render_user_persona_sheet({
  entities,
  accessors,
  include_agenda = false,
  show_dispositions = false,
  npc_entities = [],
  active_names = new Set(),
  name_to_id = new Map(),
}) {
  const user = entities?.USER;
  if (!user) return "";
  const id_attr = user?.id ? ` id="${escape_xml(String(user.id))}"` : "";
  const rows = [];
  rows.push(`    <USER_PERSONA${id_attr} name="${escape_xml(user?.name || "User")}">`);
  rows.push(`      <PSYCHOLOGY>`);
  if (include_agenda) {
    const agenda = accessors?.future(user, { vector_text: true });
    if (String(agenda || "").trim()) rows.push(`        <AGENDA>${inline_or_block(agenda, 10)}</AGENDA>`);
  }
  const personality = render_field_value(strip_epistemic_tags(user?.eternal?.non_physical), user, entities);
  if (String(personality || "").trim()) rows.push(`        <PERSONALITY>${inline_or_block(personality, 10)}</PERSONALITY>`);
  const state = strip_leading_key_echo(render_field_value(strip_epistemic_secrets(user?.present?.non_physical, false), user, entities), [
    "STATE_OF_MIND",
    "STATE",
  ]);
  if (String(state || "").trim()) rows.push(`        <STATE>${inline_or_block(state, 10)}</STATE>`);
  if (show_dispositions) {
    const dispositions = _render_dispositions(user, entities, npc_entities, active_names, name_to_id, 8);
    if (dispositions) rows.push(dispositions);
  }
  rows.push(`      </PSYCHOLOGY>`);
  const appearance = render_appearance(strip_epistemic_tags(user?.eternal?.physical), strip_epistemic_tags(user?.present?.physical), user, entities);
  if (appearance) rows.push(appearance);
  const backstory = strip_epistemic_secrets(accessors?.past(user, { vector_text: true }), false);
  if (String(backstory || "").trim()) rows.push(`      <BACKSTORY>${inline_or_block(backstory, 8)}</BACKSTORY>`);
  rows.push(`    </USER_PERSONA>`);
  return rows.join("\n");
}

/** FRACTAL sheet — unified shape for narrator and character modes. */
function _render_fractal_sheet({
  entities,
  accessors,
  dynamics = null,
  axis_scope = null,
  show_dispositions = true,
  npc_entities = [],
  name_to_id = new Map(),
  active_names = new Set(),
}) {
  const fractal = entities?.FRACTAL;
  if (!fractal) return "";
  const id_attr = fractal?.id ? ` id="${escape_xml(String(fractal.id))}"` : "";
  const rows = [];
  rows.push(`    <FRACTAL${id_attr} name="${escape_xml(fractal?.name || "the setting")}">`);
  rows.push(`      <ATMOSPHERE>`);
  const trajectory = accessors?.future(fractal, { vector_text: true });
  if (String(trajectory || "").trim()) rows.push(`        <TRAJECTORY>${inline_or_block(trajectory, 10)}</TRAJECTORY>`);
  const permanent = render_field_value(fractal?.eternal?.non_physical, fractal, entities);
  if (String(permanent || "").trim()) rows.push(`        <PERMANENT_TRUTHS>${inline_or_block(permanent, 10)}</PERMANENT_TRUTHS>`);
  const state = strip_leading_key_echo(render_field_value(fractal?.present?.non_physical, fractal, entities), ["CURRENT_STATE", "STATE"]);
  if (String(state || "").trim()) rows.push(`        <STATE>${inline_or_block(state, 10)}</STATE>`);
  if (show_dispositions) {
    const dispositions = _render_dispositions(fractal, entities, npc_entities, active_names, name_to_id, 8);
    if (dispositions) rows.push(dispositions);
  }
  const axes = render_dynamics_axes_xml(dynamics, axis_scope);
  if (axes) rows.push(indent_all(axes, 8));
  rows.push(`      </ATMOSPHERE>`);
  const topography = render_appearance(fractal?.eternal?.physical, fractal?.present?.physical, fractal, entities, "TOPOGRAPHY");
  if (topography) rows.push(topography);
  const history = accessors?.past(fractal, { vector_text: true });
  if (String(history || "").trim()) rows.push(`      <HISTORY>${inline_or_block(history, 8)}</HISTORY>`);
  rows.push(`    </FRACTAL>`);
  return rows.join("\n");
}

// ── 6. Mode-Driven <STORY_ENTITIES> Compiler ──────────────────────────────────

/**
 * Compiles the shared <STORY_ENTITIES> block from the active prompt-mode's
 * `sheets` config. Renders AI / USER / FRACTAL sheets, an active NPC sheet when
 * the speaker is an NPC, and in-scene NPC sheets whenever the mode's
 * dispositions (or dynamic axes) cover "NPC".
 * @param {Object} [params]
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @param {any} [params.active_speaker]
 * @param {any} [params.accessors]
 * @param {any} [params.config] - Resolved prompt-mode record (must carry `.sheets`).
 * @param {boolean} [params.is_npc=false]
 * @param {any} [params.speaker_dynamics]
 * @param {any} [params.fractal_dynamics]
 * @returns {string}
 */
export function render_entity_sheets({
  entities = {},
  npc_entities = [],
  in_scene_ids = [],
  active_speaker = null,
  accessors = null,
  config = null,
  is_npc = false,
  speaker_dynamics = null,
  fractal_dynamics = null,
}) {
  const sheets = config?.sheets || {};
  const dispositions_for = new Set(sheets.dispositions || []);
  const axes_for = new Set(sheets.dynamic_axes || []);

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
        is_owner: !is_npc,
        dynamics: axes_for.has("AI") ? speaker_dynamics : null,
        axis_scope: "somatic",
        show_dispositions: dispositions_for.has("AI"),
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.USER) {
    parts.push(
      _render_user_persona_sheet({
        entities,
        accessors,
        include_agenda: !!sheets.user_agenda,
        show_dispositions: dispositions_for.has("USER"),
        npc_entities,
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.FRACTAL) {
    parts.push(
      _render_fractal_sheet({
        entities,
        accessors,
        dynamics: axes_for.has("FRACTAL") ? fractal_dynamics : null,
        axis_scope: "fractal",
        show_dispositions: dispositions_for.has("FRACTAL"),
        npc_entities,
        name_to_id,
        active_names,
      }),
    );
  }

  const npc_ids = new Set();
  if (is_npc && active_speaker) npc_ids.add(String(active_speaker.id ?? active_speaker.name));
  if (dispositions_for.has("NPC") || axes_for.has("NPC")) {
    for (const n of npc_entities || []) {
      if ((in_scene_ids || []).includes(String(n?.id))) npc_ids.add(String(n.id));
    }
  }
  const active_speaker_id = active_speaker ? String(active_speaker.id ?? active_speaker.name) : null;
  for (const n of npc_entities || []) {
    if (!npc_ids.has(String(n?.id))) continue;
    parts.push(
      _render_speaker_sheet({
        entity: n,
        entities,
        npc_entities,
        accessors,
        tag: "NPC",
        is_owner: true,
        dynamics: axes_for.has("NPC") ? speaker_dynamics || n?.dynamics : null,
        axis_scope: "somatic",
        show_dispositions: dispositions_for.has("NPC"),
        active_names,
        name_to_id,
      }),
    );
  }
  if (is_npc && active_speaker && active_speaker_id && !npc_ids.has(active_speaker_id)) {
    parts.push(
      _render_speaker_sheet({
        entity: active_speaker,
        entities,
        npc_entities,
        accessors,
        tag: "NPC",
        is_owner: true,
        dynamics: axes_for.has("NPC") ? speaker_dynamics : null,
        axis_scope: "somatic",
        show_dispositions: dispositions_for.has("NPC"),
        active_names,
        name_to_id,
      }),
    );
  }

  if (sheets.proximate_npcs !== false) {
    const proximate_npcs = _render_proximate_npcs(npc_entities, in_scene_ids);
    if (proximate_npcs) parts.push(proximate_npcs);
  }

  return `  <STORY_ENTITIES>\n${parts.join("\n\n")}\n  </STORY_ENTITIES>`;
}

// ── 7. Epistemic Wall Filters ─────────────────────────────────────────────────

/**
 * Strips epistemic [SECRET: ...] / [PLAN: ...] brackets from rendered state so
 * the AI character never receives another entity's private knowledge across the
 * Epistemic Wall.
 * @param {string} text
 * @returns {string}
 */
export function strip_epistemic_tags(text) {
  if (!text) return "";
  return String(text)
    .replace(/\[(?:SECRET|PLAN)\s*:\s*[^\]]*\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Strips epistemic secrets and plans across entity boundaries.
 * If is_owner is true, preserves the secrets; if false, strips them completely.
 * @param {string|null|undefined} state_text
 * @param {boolean} [is_owner=false]
 * @returns {string}
 */
export function strip_epistemic_secrets(state_text, is_owner = false) {
  if (!state_text) return "";
  if (is_owner) return String(state_text);
  return strip_epistemic_tags(state_text);
}

// ── 8. Prompt-Mode Registry & POV Resolution ─────────────────────────────────

/**
 * Resolves a prompt-mode config by key from prompt-modes.json, falling back to
 * `interaction`. This is the registry that drives render_entity_sheets' sheet
 * selection and every other mode-gated block.
 * @param {string} key
 * @returns {any}
 */
export function get_prompt_mode(key) {
  return prompt_modes[key] || prompt_modes.interaction;
}

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {any} entity
 * @returns {"POV.FIRST_PERSON" | "POV.THIRD_PERSON"}
 */
export function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

// ── 9. Structural Stability Lock ─────────────────────────────────────────────

/**
 * Structural-drift messages re-injected at the top of <TASK> once the transport
 * has recorded <SYSTEM> integrity errors.
 */
export const STABILITY_LOCK = {
  WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
  CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
};

/**
 * Resolves the stability-lock text for a turn from its transport metadata.
 * @param {any} meta
 * @returns {string}
 */
export function resolve_stability_lock(meta) {
  if (meta?.structural_errors >= 3) return STABILITY_LOCK.CRITICAL;
  if (meta?.structural_errors >= 1) return STABILITY_LOCK.WARNING;
  return "";
}

/**
 * CHANGELOG
 * - 2026-09-10: Added STABILITY_LOCK + resolve_stability_lock — the structural-drift warning
 *   shared by the Shot-2 interaction compiler and narrator-prompt.js (previously duplicated
 *   as STORY_PROTOCOLS.STABILITY in story-prompt.js).
 * - 2026-09-10: Absorbed the whole <STORY_ENTITIES> compiler from interaction-prompt.js
 *   (render_entity_sheets + the layout helpers indent_all/inline_or_block/wrap_tag + the
 *   epistemic-wall filters + the prompt-mode registry accessor get_prompt_mode), plus
 *   resolve_pov_protocol. This file is now the single shared prompt-composition module
 *   consumed by the Director and every Story Prose mode.
 * - 2026-09-10: Moved the epistemic-wall filters to their single consumers
 *   (extract_plan_from_state → builder.js; strip_epistemic_tags/_secrets →
 *   interaction-prompt.js) and render_scene_spotlight_xml + _cast_summary →
 *   director-prompt.js. This file now exports only PROTOCOL_LIBRARY and
 *   render_protocols.
 * - 2026-09-10: Extracted the entity-aware macro / display-macro / profile-field
 *   text layer (parse_macros, resolve_display_macro_segments, render_display_macros,
 *   strip_profile_wrappers, unwrap_enhancement_text, render_field_value) to
 *   @utils/macros.js; deleted the dead render_optional_tag. This file now holds
 *   only PROTOCOL_LIBRARY, render_protocols, the epistemic-wall filters, and
 *   render_scene_spotlight_xml.
 * - 2026-09-10: Entity-sheet unification. Deleted the legacy cast/system-head path
 *   (render_recoupled_cast_body, render_system_head, render_director_cast_xml),
 *   render_current_story_state_xml, render_relational_mesh_xml, the dead
 *   _render_roster_xml / _render_scene_roster_xml helpers, and the spotlight's
 *   IN-SCENE RELATIONAL MESH section. All superseded by the shared <STORY_ENTITIES>
 *   compiler in interaction-prompt.js, where per-entity <DISPOSITIONS> replace the mesh.
 * - 2026-09-06: Removed the eternal-only CAST + prefix-cache path (system_head_cache/_render_eternal_cast_body). render_system_head now takes the single shared CAST body; render_recoupled_cast_body (moved here from story-prompt.js) is the one cast renderer used by storyteller and director.
 * - 2026-09-06: render_system_head now accepts an optional cast_body_override — when provided (recoupled per-entity sheets from story-prompt.js), it replaces the eternal-only CAST body and bypasses the prefix cache; the default eternal-only cached path is unchanged for the director.
 * - 2026-09-06: Consolidated render_dynamics_block to physics-prompt.js, re-exporting and using it in render_system_head.
 * - 2026-09-05: Added render_dynamics_block() merging scale legend, axis metadata, and live values.
 * - 2026-09-05: Consolidated Director cast, stage roster, and relational mesh into render_scene_spotlight_xml() strictly scoped to active scene participants.
 * - 2026-08-28: Consolidated fragmented protocol rules into PROSE_DISCIPLINE, ANTI_TROPES,
 *   STATE_EMISSION, and self-contained THINK_CHARACTER / THINK_NARRATOR specifications.
 * - 2026-08-28: Co-located single-use protocols (ENTITY_CONVERGENCE_LAW, FIRST_CONTACT, ANCHOR) to their home files.
 * - 2026-09-04: THINK_CHARACTER wording fix ("< 200 words" -> "under 200 words").
 */
