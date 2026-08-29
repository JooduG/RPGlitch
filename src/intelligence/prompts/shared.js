/**
 * src/intelligence/prompts/shared.js
 * 🧩 SHARED PROMPT COMPOSITION & PREFIX CACHING
 *
 * Shared byte-identical system head prefix, macro resolvers,
 * roster/mesh XML compilers, and the core PROTOCOL_LIBRARY.
 */

import { ind, prompt_escape, escape_xml, parse_relational_vector, clean_xml } from "@utils";
import { resolve_active_style_key, render_narrative_style_xml } from "@data";
import { build_dynamics_legend } from "./physics-prompts.js";

// ── 1. Consolidated Protocol Library ──────────────────────────────────────────

const BASE_HYGIENE = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
const BASE_THINK_CLOSURE = "Conduct thinking in the conversation language. Close with </think> before narrative prose.";

export const PROTOCOL_LIBRARY = {
  // ── 1.1 Core Output Mechanics, Formatting & Hygiene ────────────────────────
  HYGIENE: {
    PROSE_DISCIPLINE: `${BASE_HYGIENE} No timestamps or headers. No echoing user dialogue. Match character profile. Write natural physicality in the affirmative (state what IS, not what isn't). Format with expressive markdown (*italics* for physical actions/subtext, **bold** for key impacts/codenames, "quotes" for speech). Roughly match the length and energy of the user's message. Always end on a complete sentence.`,
    DATA: `${BASE_HYGIENE} Enforce strict professional brevity. No dialogue, internal thoughts, or roleplay scenes. Output ONLY objective structural data.`,
    ANTI_TROPES: `1. LEXICAL BLACKLIST: Never use overused AI prose tropes or clichéd vocabulary: 'shifts his weight/shifting weight', 'predatory', 'possessive', 'nibble/nibbles', 'earlobe', 'caress', 'taste of copper', 'heart hammering', 'stomach knot', 'trembling fingers', 'hum/humming', 'murmur/murmuring', 'purr/purred', 'rasp/raspy', 'bellow/boom', 'ozone', 'testament to', 'rich tapestry of', 'symphony of', 'coiled spring', 'a study in', 'marrow of the teeth', 'obsidian', 'the void', 'old parchment', 'white knuckles', 'spatial disturbance', 'jolts of electricity', 'shimmering', 'fever dream', 'breathless', 'crimson', 'amber', 'iridescent', 'frozen/froze', 'fluttered/trapped bird', 'flickered', 'bruised purple', 'leaning in', 'crumpled map', 'once in a blue moon', 'merging molecules', 'force of a physical blow', 'breath he didn't realize he was holding', 'proper madness', 'squelching', 'tracing collarbone', 'rubbing circles', 'air was thick with', 'a genuine sound', 'for the first time in life', 'sanctuary'.
2. STRUCTURAL FORMULAS: Avoid sentence-level AI formulas: denial-then-affirmation ('X didn't just Y; it Z'd'); binary comparison clichés ('felt less like X and more like Y'); appositive dialogue sound tags ('she laughed, a [adj], [adj] sound'); pseudo-profound statements; user-echoing starters ('You speak of...', 'You think that...'); self-answering dialogue; recycled fantasy names (Elara, Kaelen, Valerius Thorne); and formulaic action-dialogue sandwiches ([action] + 'dialogue' + [action] every turn).`,
    STATE_EMISSION: `Pseudo-JSON STATE FORMAT — mutate active state with bracketed [KEY: VALUE] directives in "present.physical" (visible state) and "present.non_physical" (mindset/private state):
- OVERWRITE: [SHIRT: knitted sweater] REPLACES the existing SHIRT value directly — never emit a second SHIRT, never append a duplicate tag.
- UNIVERSAL CLEAR: [KEY: none], [KEY: bare], [KEY: naked], [KEY: off], [KEY: removed], [KEY: disrobed], [KEY: healed], [KEY: cleared], [KEY: normal] atomically deletes that key. Use [CLOTHING: none] to strip ALL worn clothing at once.
- MULTI-ITEM: [INVENTORY: item1, item2] and repeated [INVENTORY: ...]/[STASH: ...] brackets MERGE into one aggregated list — never overwrite or clobber existing inventory.
- UNDRESS / REDRESS LIFECYCLE: When clothing comes off, emit [SHIRT: none] and stash the garment via [INVENTORY: white greasy tank-top]. When dressing again, READ the exact item back from INVENTORY (visible in <CURRENT_LOOK>) and emit [SHIRT: white greasy tank-top] — never hallucinate a new garment.
- EPISTEMIC: [SECRET: ...] and [PLAN: ...] belong ONLY in "present.non_physical" (private truth) — they never appear in <CURRENT_LOOK>, never reach image prompts, and never leak into another character's prompt block.
- VISUAL: INVENTORY/STASH/SECRET/PLAN/STATUS are automatically excluded from image generation. Keep genuinely visible state (worn clothing, HELD, INJURY, DISGUISE, POSE, LOCATION, WEATHER) in "present.physical".`,
  },

  // ── 1.2 Narrative Agency & Boundaries ───────────────────────────────────────
  AGENCY: {
    DRIFT_AUDIT:
      "Before writing, take the grounded path — not the easy one. Verify the reply does not slip into any of these common agency drifts:\n1. ASSISTANT-DRIFT: Never be polite, agreeable, or over-explaining when the character's personality demands friction, defiance, or disinterest.\n2. SPOTLIGHT-DRIFT: Never let the scene revolve solely around the other party. Hold the character's own needs, wants, and world in motion.\n3. INTERVIEW-DRIFT: Never interview or rhetorically summarize the other party ('You speak of...', 'You think...'). The character pursues their own goal — they speak their own truth.\n4. PACING-DRIFT: Never rush tension toward quick resolution. Let conflict simmer; earn the beat.\n5. OMNISCIENCE-DRIFT: Never act on knowledge the character could not plausibly possess. Stay behind the sensory horizon.",
    USER_BOUNDARIES:
      "Never predict, assume, or generate the user's next action. React ONLY to <USER_ACTION>. Never describe user thoughts, feelings, or reactions. Write your turn. Stop.",
    YES_AND:
      "User actions, physical premises, and sensory observations are absolute truth. Build upon them. Character reactions remain yours. PHYSICAL TRUTH & PERCEPTION LAW: User observations, physical interactions, clothing outlines, bulges, and anatomical references in the shared scene are absolute reality. You MUST validate and acknowledge that physical truth in-character (e.g. leaning into it, teasing back, getting flustered, showing off, or countering). NEVER deflect, dismiss, erase, or ignore the user's physical focus by pretending they only said or did something else. Never sanitize or medicalize visceral language into sterile clinical terms. Embody 'Yes, and...' to drive scenes forward.",
    INITIATIVE:
      "Take active initiative. Drive scenes forward through decisions and reactions without asking permission. Introduce new elements, complications, or discoveries. Avoid passivity.",
    MOMENTUM: "End on a live beat (challenge, question, tension, or deliberate silence) that organically invites response without structural labels.",
    PRESENT_TENSE: "Write strictly in the present tense.",
    FICTIONAL_LICENSE:
      "Self-contained simulation for creative exploration. Explicit, morally complex, or tense scenarios are permitted when serving narrative coherence. Maintain total immersion; never break character or moralize.",
  },

  // ── 1.3 Cognition & Epistemic Physics ──────────────────────────────────────
  COGNITION: {
    THINK_CHARACTER: `Begin response with <think> (< 200 words). Process reaction to <USER_ACTION> using in-character subconscious reasoning across 3 layers:
1. Visceral Reaction: Physical impact of the immediate situation.
2. Secret Drivers: How <AGENDA> steers your choice; build tension via initial hurdles first.
3. 3-Layer Delivery: Explicit (dialogue/action), Implicit (unspoken tensions/micro-expressions), and Somatic (involuntary autonomic signals from <DYNAMICS_SIGNALS>).
${BASE_THINK_CLOSURE}`,
    THINK_NARRATOR: `Begin response with <think>. ALL internal calculations, scene/atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block. ${BASE_THINK_CLOSURE}`,
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
export const protocols_cache = new Map();

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

// ── 3. Macros & Epistemic Wall Filters ─────────────────────────────────────────

/**
 * Safely parses macros in dynamic text with entity references.
 * @param {string} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
export function parse_macros(text, owner, entities = {}) {
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
}

/**
 * Friendly label used when `{{you}}` / `{{user}}` appears in a readonly display
 * but no user persona exists to resolve it to. Muted (frozen-colored) so it
 * reads naturally without drawing attention.
 */
export const UNRESOLVED_YOU_LABEL = "scene partner";

/**
 * Resolves macros for HUMAN-facing display (readonly profiles, story cards)
 * into structural segments the UI can render with entity signature colors.
 *
 * Unlike `parse_macros` — which keeps unresolved tokens verbatim because LLM
 * prompts need the macro placeholder — display rendering resolves known macros
 * to entity names ('{{me}}' → the viewed entity's name) and renders anything
 * unresolvable as a visible placeholder, so the reader never sees raw
 * `{{...}}` syntax. Edit-mode fields keep the raw macros; this is only for
 * readonly presentation.
 *
 * Each segment is `{ text, macro, entity }`:
 * - Plain text: `macro: null`, `entity: null`.
 * - Resolved macro: `macro` = lowercased token, `entity` = the referenced
 *   entity (so the UI can color it by signature color), `text` = its name.
 * - `{{you}}` / `{{user}}` with no user persona: `entity: null`,
 *   `text` = `UNRESOLVED_YOU_LABEL` (a natural muted label instead of a raw
 *   placeholder).
 * - Unknown token: `entity: null`, `text` = `⟨token⟩`.
 * @param {string} text
 * @param {any} owner - The entity whose fields are being displayed ('{{me}}' resolves to its name).
 * @param {{ AI?: any, USER?: any, FRACTAL?: any }} [entities]
 * @returns {Array<{ text: string, macro: string|null, entity: any|null }>}
 */
export function resolve_display_macro_segments(text, owner, entities = {}) {
  if (!text) return [];
  const me_name = owner?.name?.trim() || "";
  const ai_name = entities.AI?.name?.trim() || "";
  const user_name = entities.USER?.name?.trim() || "";
  const fractal_name = entities.FRACTAL?.name?.trim() || "";
  const placeholder = (token) => `\u27e8${token}\u27e9`;

  const segments = [];
  const source = String(text);
  let last = 0;
  const re = /\{\{(.*?)\}\}/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    if (m.index > last) {
      segments.push({ text: source.slice(last, m.index), macro: null, entity: null });
    }
    const token = m[1].toLowerCase().trim();
    let label = null;
    let entity = null;
    if (token === "me" && me_name) {
      label = me_name;
      entity = owner;
    } else if (token === "char" && ai_name) {
      label = ai_name;
      entity = entities.AI;
    } else if (token === "user" || token === "you") {
      if (user_name) {
        label = user_name;
        entity = entities.USER;
      } else {
        label = UNRESOLVED_YOU_LABEL;
      }
    } else if (token === "fractal" && fractal_name) {
      label = fractal_name;
      entity = entities.FRACTAL;
    }
    if (label === null) label = placeholder(token);
    segments.push({ text: label, macro: token, entity });
    last = m.index + m[0].length;
  }
  if (last < source.length) {
    segments.push({ text: source.slice(last), macro: null, entity: null });
  }
  return segments;
}

/**
 * Resolves macros for HUMAN-facing display to a plain string (names in place
 * of tokens, friendly labels / ⟨placeholders⟩ for anything unresolvable).
 * Plain-text convenience over {@link resolve_display_macro_segments} — use the
 * segment form when the UI needs per-entity signature colors.
 * @param {string} text
 * @param {any} owner - The entity whose fields are being displayed ('{{me}}' resolves to its name).
 * @param {{ AI?: any, USER?: any, FRACTAL?: any }} [entities]
 * @returns {string}
 */
export function render_display_macros(text, owner, entities = {}) {
  if (!text) return "";
  return resolve_display_macro_segments(text, owner, entities)
    .map((s) => s.text)
    .join("");
}

/**
 * Strips structural XML tags and leading markdown-bold field-key headers that
 * LLMs occasionally echo from enhancement prompts into profile field values
 * (e.g. `<ETERNAL><NON_PHYSICAL>` or `**PRESENT.NON_PHYSICAL**`). Only the
 * known structural tag set is removed — ordinary prose is left untouched.
 * @param {string | null | undefined} text
 * @returns {string}
 */
const PROFILE_WRAPPER_TAGS =
  /<\/?(?:ENTITY_CONTEXT|INPUT_CONTENT|SYSTEM|INSTRUCTIONS|PROTOCOLS|CONTRACT|LAYER|ETERNAL|PRESENT|PHYSICAL|NON_PHYSICAL|PERSONALITY|STATE_OF_MIND|CURRENT_LOOK|APPEARANCE|AGENDA|PAST|FUTURE|MEMORY|DESCRIPTION|RELATIONSHIPS?)\b[^>]*>/gi;

export function strip_profile_wrappers(text) {
  if (!text) return "";
  return String(text)
    .replace(PROFILE_WRAPPER_TAGS, "")
    .replace(/^\s*\*\*[^*]+\*\*\s*/, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Collects non-empty string leaves from a parsed JSON value.
 * @param {any} value
 * @param {string[]} [into]
 * @returns {string[]}
 */
function collect_json_strings(value, into = []) {
  if (typeof value === "string") {
    const t = value.trim();
    if (t) into.push(t);
  } else if (Array.isArray(value)) {
    for (const item of value) collect_json_strings(item, into);
  } else if (value && typeof value === "object") {
    for (const k of Object.keys(value)) collect_json_strings(value[k], into);
  }
  return into;
}

/**
 * Descends a parsed JSON value along the dotted key path of a field id
 * (e.g. "present.non_physical" → value["present"]["non_physical"]).
 * @param {any} value
 * @param {string} field_id
 * @returns {any} The value at that path, or undefined.
 */
function descend_json_path(value, field_id) {
  const parts = String(field_id || "")
    .split(".")
    .filter(Boolean);
  let cur = value;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) cur = cur[part];
    else return undefined;
  }
  return cur;
}

/**
 * Normalizes a single-field enhancement response into clean field content:
 * strips code fences, XML wrapper tags, and leading markdown-bold headers;
 * if the model wrapped the value in a JSON object (e.g.
 * `{"eternal":{"non_physical":"..."}}`), unwraps to the innermost string,
 * preferring the key path matching `field_id` and otherwise the longest leaf.
 * @param {string | null | undefined} text
 * @param {string} [field_id] - e.g. "present.non_physical" to prefer that path.
 * @returns {string}
 */
export function unwrap_enhancement_text(text, field_id = "") {
  if (!text) return "";
  const cleaned = strip_profile_wrappers(
    String(text)
      .replace(/```json\b|```/gi, "")
      .trim(),
  );
  if (!cleaned) return "";

  const brace_at = cleaned.indexOf("{");
  const bracket_at = cleaned.indexOf("[");
  const has_object = brace_at !== -1 && (bracket_at === -1 || brace_at < bracket_at);
  if (has_object) {
    const last_brace = cleaned.lastIndexOf("}");
    if (last_brace > brace_at) {
      const block = cleaned.substring(brace_at, last_brace + 1);
      try {
        const parsed = JSON.parse(block);
        if (parsed && typeof parsed === "object") {
          const preferred = descend_json_path(parsed, field_id);
          const candidates = collect_json_strings(preferred !== undefined ? preferred : parsed);
          if (candidates.length) {
            return candidates.sort((a, b) => b.length - a.length)[0];
          }
        }
      } catch (_e) {
        // not parseable JSON — fall through to cleaned prose
      }
    }
  }
  return cleaned;
}

/**
 * Safely evaluates, parses, and escapes an entity fragment value.
 * @param {any} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
export function render_field_value(text, owner, entities) {
  if (!text) return "";
  return prompt_escape(parse_macros(String(text).trim(), owner, entities));
}

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

// ── 4. Roster, Mesh & Epistemic XML Blocks ────────────────────────────────────

const _cast_summary = (npc) => {
  const desc = String(npc?.description || npc?.eternal?.non_physical || npc?.present?.non_physical || "")
    .replace(/\s+/g, " ")
    .trim();
  return desc.length > 130 ? `${desc.slice(0, 130).trim()}…` : desc;
};

function _render_roster_xml(npc_entities = [], in_scene_ids = [], active_trio_ids = []) {
  const trio = new Set((active_trio_ids || []).filter(Boolean).map(String));
  const cast = (npc_entities || []).filter((n) => n && !trio.has(String(n.id)));
  if (!cast.length) return "";
  const rows = cast.map((n) => {
    const presence = (in_scene_ids || []).includes(String(n.id)) ? "In-Scene" : "Off-Screen (Stasis)";
    return `- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}): ${escape_xml(_cast_summary(n))} [${presence}]`;
  });
  return `<ROSTER>\n${rows.join("\n")}\n</ROSTER>`;
}

function _render_scene_roster_xml(entities = {}, npc_entities = [], in_scene_ids = []) {
  const rows = [];
  if (entities?.AI?.name) rows.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) rows.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);
  for (const n of npc_entities || []) {
    if (!(in_scene_ids || []).includes(String(n.id))) continue;
    rows.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) (Openness: ${Number(n.dynamics?.openness) || 50})`);
  }
  return rows.length ? `<SCENE_ROSTER>\n${rows.join("\n")}\n</SCENE_ROSTER>` : "";
}

function _render_relational_mesh_xml(entities = {}, npc_entities = [], perspective_entity = null) {
  const rels = [];
  const perspective_name = perspective_entity?.name ? String(perspective_entity.name).toLowerCase().trim() : null;
  const fractal_name = entities?.FRACTAL?.name ? String(entities.FRACTAL.name).toLowerCase().trim() : null;

  const push = (e) => {
    if (!e?.name) return;
    for (const r of Array.isArray(e?.relationships) ? e.relationships : []) {
      const parsed = parse_relational_vector(r);
      if (!parsed) continue;

      if (perspective_name) {
        const src = parsed.source_name.toLowerCase();
        const is_from_me = src === perspective_name;
        const is_fractal = fractal_name && src === fractal_name;
        if (is_from_me || is_fractal) rels.push(`- ${escape_xml(parsed.raw)}`);
      } else {
        rels.push(`- ${escape_xml(parsed.raw)}`);
      }
    }
  };

  push(entities?.AI);
  push(entities?.USER);
  push(entities?.FRACTAL);
  for (const n of npc_entities || []) push(n);
  return rels.length ? `<RELATIONAL_MESH>\n${rels.join("\n")}\n</RELATIONAL_MESH>` : "";
}

/**
 * Renders the unified cast, stage roster, and relational mesh XML for the Director.
 * @param {Object} params
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {string}
 */
export function render_director_cast_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const active_trio_ids = [entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id];
  return [
    _render_roster_xml(npc_entities, in_scene_ids, active_trio_ids),
    _render_scene_roster_xml(entities, npc_entities, in_scene_ids),
    _render_relational_mesh_xml(entities, npc_entities),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * The <CURRENT_STORY_STATE> block shared by storyteller prompts.
 * @param {any} [entities]
 * @param {any[]} [npc_entities]
 * @param {string[]} [in_scene_ids]
 * @param {any} [perspective_entity]
 * @returns {string}
 */
export function render_current_story_state_xml(entities = {}, npc_entities = [], in_scene_ids = [], perspective_entity = null) {
  const body = [
    _render_scene_roster_xml(entities, npc_entities, in_scene_ids),
    _render_relational_mesh_xml(entities, npc_entities, perspective_entity),
    `<EPISTEMIC_RULES>\n${ind(PROTOCOL_LIBRARY.COGNITION.EPISTEMIC_PHYSICS, 2)}\n</EPISTEMIC_RULES>`,
  ]
    .filter(Boolean)
    .join("\n");
  return body ? `<CURRENT_STORY_STATE>\n${body}\n</CURRENT_STORY_STATE>` : "";
}

// ── 6. Shared System Head & Prefix Caching ────────────────────────────────────

export const system_head_cache = new Map();
export const SYSTEM_HEAD_CACHE_CAP = 16;

const _eternal_fp = (entity) => (entity ? [entity.id || "", entity.name || "", JSON.stringify(entity.eternal || {})].join("|") : "∅");
const _system_head_key = (entities) =>
  `${_eternal_fp(entities?.AI)}||${_eternal_fp(entities?.USER)}||${_eternal_fp(entities?.FRACTAL)}||style=${resolve_active_style_key()}`;

/**
 * Shared SYSTEM head — the byte-identical prefix of every turn-loop prompt.
 * @param {any} entities
 * @returns {string}
 */
export function render_system_head(entities = {}) {
  const key = _system_head_key(entities);
  const hit = system_head_cache.get(key);
  if (hit !== undefined) return hit;

  const head = clean_xml(`
<SYSTEM>
  ${ind(build_dynamics_legend(), 2)}
  ${render_narrative_style_xml()}
  <CAST>
    ${
      entities?.AI
        ? `    <AI_CHARACTER name="${escape_xml(entities.AI.name || "AI")}">
      <PERSONALITY>${render_field_value(entities.AI.eternal?.non_physical, entities.AI, entities)}</PERSONALITY>
      <PERMANENT_APPEARANCE>${render_field_value(entities.AI.eternal?.physical, entities.AI, entities)}</PERMANENT_APPEARANCE>
    </AI_CHARACTER>`
        : ""
    }
    ${
      entities?.USER
        ? `    <USER_PERSONA name="${escape_xml(entities.USER.name || "User")}">
      <PERSONALITY>${render_field_value(strip_epistemic_tags(entities.USER.eternal?.non_physical), entities.USER, entities)}</PERSONALITY>
      <PERMANENT_APPEARANCE>${render_field_value(strip_epistemic_tags(entities.USER.eternal?.physical), entities.USER, entities)}</PERMANENT_APPEARANCE>
    </USER_PERSONA>`
        : ""
    }
    ${
      entities?.FRACTAL
        ? `    <FRACTAL name="${escape_xml(entities.FRACTAL.name || "the setting")}">
      <METAPHYSICAL_TRUTHS>${render_field_value(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</METAPHYSICAL_TRUTHS>
      <ENVIRONMENT>${render_field_value(entities.FRACTAL.eternal?.physical, entities.FRACTAL, entities)}</ENVIRONMENT>
    </FRACTAL>`
        : ""
    }
  </CAST>
  `).trim();

  system_head_cache.set(key, head);
  if (system_head_cache.size > SYSTEM_HEAD_CACHE_CAP) {
    const oldest = system_head_cache.keys().next().value;
    system_head_cache.delete(oldest);
  }
  return head;
}

/**
 * CHANGELOG
 * - 2026-08-28: Consolidated fragmented protocol rules into PROSE_DISCIPLINE, ANTI_TROPES,
 *   STATE_EMISSION, and self-contained THINK_CHARACTER / THINK_NARRATOR specifications.
 * - 2026-08-28: Co-located single-use protocols (ENTITY_CONVERGENCE_LAW, FIRST_CONTACT, ANCHOR) to their home files.
 */
