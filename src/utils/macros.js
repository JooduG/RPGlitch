/**
 * src/utils/macros.js
 * 🪢 MACRO RESOLUTION & PROFILE-FIELD TEXT CODECS
 *
 * Entity-aware {{macro}} resolution for both LLM prompts and human-facing
 * display, plus the profile-field text normalizers shared by @ui, @media and
 * @intelligence:
 * - parse_macros / render_field_value — prompt-side resolution + escaping
 * - resolve_display_macro_segments / render_display_macros — UI display
 * - strip_profile_wrappers / unwrap_enhancement_text — enhancer output cleanup
 *
 * Pure and stateless: no upward imports — safe for ANY layer to import.
 */

import { prompt_escape } from "./xml.js";

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
 * Deep-clones `entity`, resolving every string field's {{...}} macros from that
 * entity's OWN perspective (see {@link parse_macros}). Callers use this before a
 * perspective swap so stored state never inverts {{char}}/{{user}} references,
 * and for any other case needing an entity with its macros pre-resolved.
 * @param {any} entity
 * @param {{ AI?: any, USER?: any, FRACTAL?: any }} [entities]
 * @returns {any}
 */
export function expand_entity_macros(entity, entities) {
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
 * Friendly label used when `{{you}}` / `{{user}}` appears in a readonly display
 * but no user persona exists to resolve it to, viewed from the AI character's
 * (or an unknown owner's) perspective — there "you" is the user persona. Muted
 * (frozen-colored) so it reads naturally without drawing attention. When the
 * owning profile is the user persona (or the fractal), "you" flips to the other
 * party — see {@link _resolve_you_target}.
 */
const UNRESOLVED_YOU_LABEL = "the user persona";

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
 * CHANGELOG
 * - 2026-09-11: Moved `MACRO_DIRECTIVES` to src/intelligence/modules/protocols.js where prompt protocols reside.
 * - 2026-09-10: Adopted `expand_entity_macros` from intelligence/prompts/story-prompt.js — the deep
 *   clone-and-resolve macro expander belongs beside `parse_macros`, its only dependency.
 * - 2026-09-10: Extracted from intelligence/prompts/shared.js — entity-aware
 *   macro resolution and profile-field text normalizers shared by @ui, @media,
 *   and @intelligence.
 */
