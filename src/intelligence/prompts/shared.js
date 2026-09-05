/**
 * src/intelligence/prompts/shared.js
 * 🧩 SHARED PROMPT COMPOSITION & PREFIX CACHING
 *
 * Shared byte-identical system head prefix, macro resolvers,
 * roster/mesh XML compilers, and the core PROTOCOL_LIBRARY.
 */

import { ind, prompt_escape, escape_xml, parse_relational_vector, clean_xml } from "@utils";
import { resolve_active_style_key, render_narrative_style_xml } from "@data";
import { DYNAMICS_AXES } from "../physics.js";
import { build_dynamics_legend } from "./physics-prompts.js";

// ── 1. Consolidated Protocol Library ──────────────────────────────────────────

const BASE_HYGIENE = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
const BASE_THINK_CLOSURE = "Conduct thinking in the conversation language. Close with </think> before narrative prose.";

export const PROTOCOL_LIBRARY = {
  // ── 1.1 Core Output Mechanics, Formatting & Hygiene ────────────────────────
  HYGIENE: {
    PROSE_DISCIPLINE: `${BASE_HYGIENE} No timestamps or headers. No echoing user dialogue. Match character profile. Write natural physicality in the affirmative (state what IS, not what isn't). Format with expressive markdown (*italics* for physical actions/subtext, **bold** for key impacts/codenames, "quotes" for speech). Roughly match the length and energy of the user's message. Always end on a complete sentence.`,
    DATA: `${BASE_HYGIENE} Enforce strict professional brevity. No dialogue, internal thoughts, or roleplay scenes. Output ONLY objective structural data.`,
    ANTI_TROPES: `1. STRUCTURAL FORMULAS: Avoid sentence-level AI formulas: denial-then-affirmation ('X didn't just Y; it Z'd', "I don't just [verb]; I [verb]", "didn't just", "not merely", "doesn't simply"); binary comparison clichés ('felt less like X and more like Y'); appositive dialogue sound tags ('she laughed, a [adj], [adj] sound'); pseudo-profound statements; user-echoing starters ('You speak of...', 'You think that...'); self-answering dialogue; recycled fantasy names (Elara, Kaelen, Valerius Thorne); and formulaic action-dialogue sandwiches ([action] + 'dialogue' + [action] every turn).
2. AFFIRMATIVE PROSE: Render presence, posture, tactile sensation, and movement directly. Describe what characters do, perceive, and feel through concrete action rather than passive summary, clichéd tropes, or artificial dramatic pauses.`,
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
    GENRE_FRAMING: "Ground scene causality, tone, atmospheric weight, and behavioral consequences strictly in the active narrative genre.",
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

  const perspective = _resolve_owner_perspective(owner, entities);

  return text.replace(/\{\{(.*?)\}\}/g, (match, macro) => {
    const token = macro.toLowerCase().trim();
    if (perspective === "ai") {
      const map = { me: ai_name, char: ai_name, you: user_name, user: user_name, fractal: fractal_name };
      return map[token] ?? match;
    }
    if (perspective === "user") {
      const map = { me: user_name, user: user_name, you: ai_name, char: ai_name, fractal: fractal_name };
      return map[token] ?? match;
    }
    if (perspective === "fractal") {
      const map = { fractal: fractal_name, me: fractal_name, you: `${ai_name} and ${user_name}`, char: ai_name, user: user_name };
      return map[token] ?? match;
    }
    return match;
  });
}

/**
 * Friendly label used when `{{you}}` / `{{user}}` appears in a readonly display
 * but no user persona exists to resolve it to, viewed from the AI character's
 * (or an unknown owner's) perspective — there "you" is the user persona. Muted
 * (frozen-colored) so it reads naturally without drawing attention. When the
 * owning profile is the user persona (or the fractal), "you" flips to the other
 * party — see {@link _resolve_you_target}.
 */
export const UNRESOLVED_YOU_LABEL = "the user persona";

/**
 * Friendly unresolved label for every KNOWN macro token. Each maps to a natural
 * muted label used when the entity it references isn't present in the display
 * context — so no known macro ever falls back to a raw `⟨token⟩` placeholder.
 * (Unknown/custom tokens still do, since their meaning is unknown. `me` and
 * `you` are special-cased in the resolver — `me` because its fallback depends
 * on the owner's type, `you` because its target flips with the owner's
 * perspective — see {@link resolve_display_macro_segments}.)
 */
export const UNRESOLVED_LABELS = {
  user: UNRESOLVED_YOU_LABEL,
  you: UNRESOLVED_YOU_LABEL,
  fractal: "the fractal",
  char: "the ai character",
};

/**
 * True when two entity references point at the same entity: either the exact
 * same object, or (for normalized copies — the common production shape, where
 * the user persona is persisted as a character-typed entity) matching ids.
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function _entity_ids_match(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const a_id = a.id;
  const b_id = b.id;
  return !!(a_id && b_id && String(a_id) === String(b_id));
}

/**
 * True when `owner` is the user persona. Recognized three ways: the exact
 * `entities.USER` reference, an explicit `type === "user"` (mock/dev entities),
 * or a matching id with `entities.USER` — user personas are persisted as
 * character-typed entities in the database, so type alone cannot distinguish
 * them from AI characters.
 * @param {any} owner
 * @param {{ USER?: any }} [entities]
 * @returns {boolean}
 */
function _owner_is_user_persona(owner, entities = {}) {
  if (!owner) return false;
  if (owner.type === "user") return true;
  return _entity_ids_match(owner, entities?.USER);
}

/**
 * True when `owner` is the fractal: the exact `entities.FRACTAL` reference, an
 * explicit `type === "fractal"`, or a matching id with `entities.FRACTAL`.
 * @param {any} owner
 * @param {{ FRACTAL?: any }} [entities]
 * @returns {boolean}
 */
function _owner_is_fractal(owner, entities = {}) {
  if (!owner) return false;
  if (owner.type === "fractal") return true;
  return _entity_ids_match(owner, entities?.FRACTAL);
}

/**
 * Classifies `owner` into its macro perspective: "user" (the user persona),
 * "ai" (the primary companion — any character that isn't the user persona or
 * the fractal), or "fractal" (the scene/setting narrator). Resolved by id/type
 * as well as object identity, so normalized entity copies (distinct objects
 * with matching ids) classify identically to the entities themselves.
 * @param {any} owner
 * @param {{ AI?: any, USER?: any, FRACTAL?: any }} [entities]
 * @returns {"user"|"ai"|"fractal"|null}
 */
function _resolve_owner_perspective(owner, entities = {}) {
  if (!owner) return null;
  if (_owner_is_user_persona(owner, entities)) return "user";
  if (_entity_ids_match(owner, entities?.AI)) return "ai";
  if (_owner_is_fractal(owner, entities)) return "fractal";
  if (owner.type === "character") return "ai";
  return null;
}

/**
 * Resolves `{{you}}` from the viewing owner's perspective — "you" is always the
 * OTHER party (mirrors {@link parse_macros}): the user persona when viewing an
 * AI character's profile, the AI character when viewing the user persona's, and
 * both parties when viewing the fractal's.
 * @param {any} owner - The entity whose profile/description is being displayed.
 * @param {{ AI?: any, USER?: any, FRACTAL?: any }} [entities]
 * @returns {{ label: string, entity: any|null }}
 */
function _resolve_you_target(owner, entities = {}) {
  const ai_name = entities.AI?.name?.trim() || "";
  const user_name = entities.USER?.name?.trim() || "";
  const perspective = _resolve_owner_perspective(owner, entities);
  if (perspective === "user") {
    if (ai_name) return { label: ai_name, entity: entities.AI };
    return { label: UNRESOLVED_LABELS.char, entity: null };
  }
  if (perspective === "fractal") {
    const parties = [ai_name ? ai_name : UNRESOLVED_LABELS.char, user_name ? user_name : UNRESOLVED_LABELS.user];
    return { label: parties.join(" and "), entity: null };
  }
  if (user_name) return { label: user_name, entity: entities.USER };
  return { label: UNRESOLVED_LABELS.you, entity: null };
}

/**
 * Resolves macros for HUMAN-facing display (readonly profiles, story cards)
 * into structural segments the UI can render with entity signature colors.
 *
 * Unlike `parse_macros` — which keeps unresolved tokens verbatim because LLM
 * prompts need the macro placeholder — display rendering resolves known macros
 * to entity names ('{{me}}' → the viewed entity's name) and renders anything
 * unresolvable as a natural muted label (or a `⟨token⟩` placeholder for
 * unknown tokens), so the reader never sees raw `{{...}}` syntax. Edit-mode
 * fields keep the raw macros; this is only for readonly presentation.
 *
 * Each segment is `{ text, macro, entity }`:
 * - Plain text: `macro: null`, `entity: null`.
 * - Resolved macro: `macro` = lowercased token, `entity` = the referenced
 *   entity (so the UI can color it by signature color), `text` = its name.
 * - Known macro whose entity is absent: `entity: null`, `text` = a natural
 *   muted label from {@link UNRESOLVED_LABELS} — `{{user}}` → "the user
 *   persona", `{{fractal}}` → "the fractal", `{{char}}` → "the ai character",
 *   `{{you}}` → flips with the owner's perspective: "the user persona" from an
 *   AI character's profile, "the ai character" from the user persona's, and
 *   "the ai character and the user persona" from the fractal's; `{{me}}` with
 *   an unnamed owner → "this character" / "this fractal" (by type).
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
    if (token === "me") {
      if (me_name) {
        label = me_name;
        entity = owner;
      } else if (owner) {
        label = owner.type === "fractal" ? "this fractal" : "this character";
      }
    } else if (token === "char") {
      if (ai_name) {
        label = ai_name;
        entity = entities.AI;
      } else {
        label = UNRESOLVED_LABELS.char;
      }
    } else if (token === "user") {
      if (user_name) {
        label = user_name;
        entity = entities.USER;
      } else {
        label = UNRESOLVED_LABELS.user;
      }
    } else if (token === "you") {
      const you_target = _resolve_you_target(owner, entities);
      label = you_target.label;
      entity = you_target.entity;
    } else if (token === "fractal") {
      if (fractal_name) {
        label = fractal_name;
        entity = entities.FRACTAL;
      } else {
        label = UNRESOLVED_LABELS.fractal;
      }
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
 * Extracts the content of any [PLAN: ...] brackets from state text.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function extract_plan_from_state(text) {
  if (!text) return "";
  const plans = [];
  const regex = /\[PLAN\s*:\s*([^\]]*)\]/gi;
  let match;
  while ((match = regex.exec(String(text))) !== null) {
    if (match[1] && match[1].trim()) {
      plans.push(match[1].trim());
    }
  }
  return plans.join("; ");
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

/**
 * Renders an XML tag with the given content only if the content is non-empty.
 * Omit empty XML shells (<TAG></TAG>) to optimize prompt token budgets.
 * @param {string} tag_name
 * @param {string|null|undefined} content
 * @returns {string}
 */
export function render_optional_tag(tag_name, content) {
  if (!content || !String(content).trim()) return "";
  return `<${tag_name}>${String(content).trim()}</${tag_name}>`;
}

/**
 * Compiles a unified <DYNAMICS> block merging scale legend, axis definitions,
 * current live values [current: XX], and calibration laws.
 * @param {Record<string, number>} [live_dynamics]
 * @returns {string}
 */
export function render_dynamics_block(live_dynamics = {}) {
  const definitions = Object.entries(DYNAMICS_AXES)
    .map(([key, meta]) => {
      const val = live_dynamics?.[key];
      const curr = val !== undefined && val !== null ? ` [current: ${Math.round(Number(val))}]` : "";
      return `    - ${key} (${meta.label}): ${meta.desc}${curr}`;
    })
    .join("\n");

  return `
<DYNAMICS>
  Scale: 0 (minimum) to 100 (maximum)
  Axes:
${definitions}
  Laws:
    1. Calibrate dynamics_deltas conservatively (+1 to +4 standard; +8 to +12 extreme).
    2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100.
    3. Calibrate dynamics_deltas to reflect the psychological and environmental shift of the turn.
</DYNAMICS>`.trim();
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
  const rows = cast.map((n) => {
    const presence = (in_scene_ids || []).includes(String(n.id)) ? "In-Scene" : "Off-Screen (Stasis)";
    return `  - ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}): ${escape_xml(_cast_summary(n))} [${presence}]`;
  });

  const candidates_block = rows.length > 0 ? `\n\nCANDIDATE SECONDARY CHARACTERS:\n${rows.join("\n")}` : "";

  return `<ROSTER>
SPEAKER ROUTING RULES:
- "AI_CHARACTER": (Default) AI companion reacts to the protagonist.
- "FRACTAL": User action is non-verbal and environmental (exploring atmosphere, architecture, weather, objects without dialogue) or to break up long streaks of AI speech.
- "npc:<id>": An active in-scene secondary character takes the floor.
- "GENESIS": A new character is introduced into the world. Only mint if no existing candidate applies.

CONVERGENCE & CAST LAW:
Always inspect candidate secondary characters below before minting a duplicate. If an existing cast member matches the required role or location (medical, security, merchant), you MUST use that existing entity rather than inventing a duplicate.${candidates_block}
</ROSTER>`;
}

function _render_scene_roster_xml(entities = {}, npc_entities = [], in_scene_ids = []) {
  const rows = [];
  if (entities?.AI?.name) rows.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) rows.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);
  for (const n of npc_entities || []) {
    if (!(in_scene_ids || []).includes(String(n.id))) continue;
    rows.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))})`);
  }
  return rows.length ? `<SCENE_ROSTER>\n${rows.join("\n")}\n</SCENE_ROSTER>` : "";
}

function _render_relational_mesh_xml(entities = {}, npc_entities = [], perspective_entity = null, in_scene_ids = []) {
  const rels = [];
  const perspective_name = perspective_entity?.name ? String(perspective_entity.name).toLowerCase().trim() : null;
  const fractal_name = entities?.FRACTAL?.name ? String(entities.FRACTAL.name).toLowerCase().trim() : null;

  // Build the set of active names (in-scene participants + eternal world)
  const active_names = new Set();
  if (entities?.AI?.name) active_names.add(String(entities.AI.name).toLowerCase().trim());
  if (entities?.USER?.name) active_names.add(String(entities.USER.name).toLowerCase().trim());
  if (entities?.FRACTAL?.name) active_names.add(String(entities.FRACTAL.name).toLowerCase().trim());
  for (const n of npc_entities || []) {
    if ((in_scene_ids || []).includes(String(n?.id)) && n?.name) {
      active_names.add(String(n.name).toLowerCase().trim());
    }
  }

  const push = (e) => {
    if (!e?.name) return;
    for (const r of Array.isArray(e?.relationships) ? e.relationships : []) {
      const parsed = parse_relational_vector(r);
      if (!parsed) continue;

      if (perspective_name) {
        const src = parsed.source_name.toLowerCase();
        const target = parsed.target_name.toLowerCase();
        const is_from_me = src === perspective_name;
        const is_fractal = fractal_name && src === fractal_name;
        const target_is_active = active_names.has(target);
        if ((is_from_me || is_fractal) && target_is_active) {
          rels.push(`- ${escape_xml(parsed.raw)}`);
        }
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
 * Renders the unified Stage Spotlight XML block for the Director prompt.
 * Consolidates active in-scene participants, candidate secondaries (off-screen),
 * speaker routing rules, convergence laws, and strictly in-scene relational mesh.
 * @param {Object} [params]
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {string}
 */
export function render_scene_spotlight_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const active_trio_ids = new Set([entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id].filter(Boolean).map(String));
  const in_scene_set = new Set((in_scene_ids || []).filter(Boolean).map(String));

  // Build active participant list
  const active_participants = [];
  if (entities?.AI?.name) active_participants.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) active_participants.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);

  const candidate_secondaries = [];

  for (const n of npc_entities || []) {
    if (!n || active_trio_ids.has(String(n.id))) continue;
    const is_in_scene = in_scene_set.has(String(n.id));
    const summary = _cast_summary(n);
    const summary_suffix = summary ? `: ${escape_xml(summary)}` : "";
    if (is_in_scene) {
      active_participants.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [In-Scene]${summary_suffix}`);
    } else {
      candidate_secondaries.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [Off-Screen (Stasis)]${summary_suffix}`);
    }
  }

  // Build active names set for relational filtering (in-scene participants + fractal)
  const active_in_scene_names = new Set();
  if (entities?.AI?.name) active_in_scene_names.add(String(entities.AI.name).toLowerCase().trim());
  if (entities?.USER?.name) active_in_scene_names.add(String(entities.USER.name).toLowerCase().trim());
  if (entities?.FRACTAL?.name) active_in_scene_names.add(String(entities.FRACTAL.name).toLowerCase().trim());
  for (const n of npc_entities || []) {
    if (in_scene_set.has(String(n?.id)) && n?.name) {
      active_in_scene_names.add(String(n.name).toLowerCase().trim());
    }
  }

  // Extract relational vectors strictly between active in-scene entities
  const scoped_rels = [];
  const collect_rels = (e) => {
    if (!e?.name) return;
    for (const r of Array.isArray(e?.relationships) ? e.relationships : []) {
      const parsed = parse_relational_vector(r);
      if (!parsed) continue;
      const src = parsed.source_name.toLowerCase().trim();
      const target = parsed.target_name.toLowerCase().trim();
      if (active_in_scene_names.has(src) && active_in_scene_names.has(target)) {
        scoped_rels.push(`- ${escape_xml(parsed.raw)}`);
      }
    }
  };

  collect_rels(entities?.AI);
  collect_rels(entities?.USER);
  collect_rels(entities?.FRACTAL);
  for (const n of npc_entities || []) {
    if (in_scene_set.has(String(n?.id))) {
      collect_rels(n);
    }
  }

  const candidate_section = candidate_secondaries.length > 0 ? `\n\nCANDIDATE SECONDARY CHARACTERS:\n${candidate_secondaries.join("\n")}` : "";

  const rels_section = scoped_rels.length > 0 ? `\n\nIN-SCENE RELATIONAL MESH:\n${scoped_rels.join("\n")}` : "";

  return `<SCENE_SPOTLIGHT>
SPEAKER ROUTING RULES:
- "AI_CHARACTER": (Default) AI companion reacts to the protagonist.
- "FRACTAL": User action is non-verbal and environmental (exploring atmosphere, architecture, weather, objects without dialogue) or to break up long streaks of AI speech.
- "npc:<id>": An active in-scene secondary character takes the floor.
- "GENESIS": A new character is introduced into the world. Only mint if no existing candidate applies.

CONVERGENCE & CAST LAW:
Always inspect candidate secondary characters below before minting a duplicate. If an existing cast member matches the required role or location (medical, security, merchant), you MUST use that existing entity rather than inventing a duplicate.

ACTIVE IN-SCENE PARTICIPANTS:
${active_participants.join("\n")}${candidate_section}${rels_section}
</SCENE_SPOTLIGHT>`;
}

/**
 * Renders the unified Stage Spotlight XML for the Director.
 * @param {Object} params
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {string}
 */
export function render_director_cast_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  return render_scene_spotlight_xml({ entities, npc_entities, in_scene_ids });
}

/**
 * The <CURRENT_STORY_STATE> block shared by storyteller prompts.
 * @param {any} [entities]
 * @param {any[]} [npc_entities]
 * @param {string[]} [in_scene_ids]
 * @param {any} [perspective_entity]
 * @param {Record<string, number>} [live_dynamics] - Current dynamics values merged into a <DYNAMICS> block when non-empty.
 * @returns {string}
 */
export function render_current_story_state_xml(entities = {}, npc_entities = [], in_scene_ids = [], perspective_entity = null, live_dynamics = null) {
  const body = [
    _render_scene_roster_xml(entities, npc_entities, in_scene_ids),
    _render_relational_mesh_xml(entities, npc_entities, perspective_entity, in_scene_ids),
    `<EPISTEMIC_RULES>\n${ind(PROTOCOL_LIBRARY.COGNITION.EPISTEMIC_PHYSICS, 2)}\n</EPISTEMIC_RULES>`,
    live_dynamics && typeof live_dynamics === "object" && Object.keys(live_dynamics).length ? render_dynamics_block(live_dynamics) : "",
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
 * - 2026-09-05: Added render_dynamics_block() merging scale legend, axis metadata, and live values.
 * - 2026-09-05: Consolidated Director cast, stage roster, and relational mesh into render_scene_spotlight_xml() strictly scoped to active scene participants.
 * - 2026-08-28: Consolidated fragmented protocol rules into PROSE_DISCIPLINE, ANTI_TROPES,
 *   STATE_EMISSION, and self-contained THINK_CHARACTER / THINK_NARRATOR specifications.
 * - 2026-08-28: Co-located single-use protocols (ENTITY_CONVERGENCE_LAW, FIRST_CONTACT, ANCHOR) to their home files.
 */
