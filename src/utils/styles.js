/**
 * src/utils/styles.js
 * 🎨 STYLE RESOLUTION & PROSE DETOXIFICATION ENGINE
 *
 * Core Responsibilities:
 * - Cross-layer resolution of active styles (visual, narrative, speaking) across entity overrides and app settings.
 * - Speaking Style Hierarchy Resolution: Entity Speaking Style > Narrative Style Preset > "casual" default.
 * - AI Prose Detoxification (`detox_prose`): Intercepts and scrubs purple prose clichés, overused sensory crutches,
 *   and formulaic LLM sentence structures (denial-then-affirmation, self-answering dialogue, binary comparisons).
 * - Verb Conjugation & Case Preservation: Maps matching grammatical suffixes (-ed, -ing, -s, -es, -ly) and matches source casing.
 * - Decoupled Registry Integration: Rules are registered dynamically via `register_speaking_rules` to prevent circular dependencies.
 *
 * Consumed by:
 * - `src/intelligence/story-pipeline.js` (Prose cleanup before log persistence and streaming).
 * - `src/ui/message/render.js` (Message rendering and display transformations).
 * - `src/media/visual.svelte.js` (Visual style resolution for image generation).
 */

import { match_case } from "./text.js";
import { stable_pick } from "./math.js";
import { state_bridge } from "./bridges.js";

// ============================================================================
// [SECTION 1: CONSTANTS & SPEAKING STYLES]
// ============================================================================

/**
 * Valid canonical speaking style identifiers.
 * @type {ReadonlySet<string>}
 */
export const VALID_SPEAKING_STYLES = Object.freeze(new Set(["casual", "lyrical", "primal", "clinical"]));

/**
 * @typedef {"casual" | "lyrical" | "primal" | "clinical"} SpeakingStyleId
 */

/**
 * @typedef {Object} DetoxRule
 * @property {RegExp} regex - Pattern to detect in prose.
 * @property {string | Record<string, any> | ((match: string, ...args: any[]) => string)} replace - Replacement pool, string, or handler.
 * @property {boolean} [keep_prefix] - Preserves captured prefix match.
 * @property {boolean} [keep_suffix] - Preserves captured suffix match.
 */

// ============================================================================
// [SECTION 2: STYLE HIERARCHY RESOLVERS]
// ============================================================================

/**
 * Resolves an active style key across an explicit entity override and global app settings.
 * @param {string | undefined} explicit_style - Explicit style key from entity/fractal.
 * @param {string} app_setting_key - Key in app settings (e.g. "narrative_style" | "visual_style").
 * @param {Record<string, any>} [registry={}] - Registry dictionary for validating key existence.
 * @param {string} [fallback=""] - Fallback key when no active style is found.
 * @returns {string} Resolved style identifier.
 */
export function resolve_style(explicit_style, app_setting_key, registry = {}, fallback = "") {
  if (explicit_style && explicit_style !== "default" && explicit_style !== "" && registry?.[explicit_style]) {
    return explicit_style;
  }

  const app_style = state_bridge.app?.settings?.[app_setting_key];
  if (app_style && app_style !== "default" && registry?.[app_style]) {
    return app_style;
  }

  return fallback;
}

/**
 * Resolves the active speaking style based on entity and narrative style hierarchy.
 * Priority: Entity Speaking Style > Narrative Style Preset > "casual" (default).
 * @param {Record<string, any> | null} [entity=null] - Active character or user entity.
 * @param {string | Record<string, any> | null} [narrative_style=null] - Active narrative style ID or style object.
 * @returns {SpeakingStyleId} Resolved speaking style identifier.
 */
export function resolve_speaking_style(entity = null, narrative_style = null) {
  const entity_style = entity?.speaking_style;
  if (entity_style && VALID_SPEAKING_STYLES.has(entity_style)) {
    return /** @type {SpeakingStyleId} */ (entity_style);
  }

  const style_speaking = typeof narrative_style === "object" && narrative_style !== null ? narrative_style.speaking_style : null;

  if (style_speaking && VALID_SPEAKING_STYLES.has(style_speaking)) {
    return /** @type {SpeakingStyleId} */ (style_speaking);
  }

  return "casual";
}

// ============================================================================
// [SECTION 3: REPLACEMENT PICKER ENGINE]
// ============================================================================

/**
 * Selects an appropriate replacement token matching voice, suffix conjugation, and casing.
 * @param {string} match - Original matched string.
 * @param {any} pool - Replacement pool (string, array, or voice/conjugation map).
 * @param {SpeakingStyleId} [exact_voice="casual"] - Primary speaking style.
 * @param {SpeakingStyleId} [fallback_voice="casual"] - Fallback speaking style.
 * @param {number} [offset=0] - Character offset in source text.
 * @param {string} [prefix=""] - Prefix to preserve.
 * @param {string} [suffix=""] - Suffix to preserve.
 * @param {string} [key_hint=""] - Optional conjugation hint key.
 * @returns {string} Processed replacement text.
 */
function pick_replacement(match, pool, exact_voice = "casual", fallback_voice = "casual", offset = 0, prefix = "", suffix = "", key_hint = "") {
  if (!pool) return match;

  if (typeof pool === "string") {
    const rep = match_case(match, pool);
    return prefix ? `${prefix} ${rep}` : suffix ? `${rep} ${suffix}` : rep;
  }

  let target_pool = pool;
  const has_conjugations =
    pool.ed !== undefined ||
    pool.ing !== undefined ||
    pool.s !== undefined ||
    pool.es !== undefined ||
    pool.med !== undefined ||
    pool.ming !== undefined ||
    pool.ly !== undefined ||
    pool[""] !== undefined;

  if (has_conjugations) {
    const hint = key_hint ? key_hint.toLowerCase() : "";
    if (hint && pool[hint] !== undefined) {
      target_pool = pool[hint];
    } else {
      const suffix_match = match.match(/(med|ming|ing|ed|es|ly|s)$/i);
      const suffix_key = (suffix_match ? suffix_match[0] : "").toLowerCase();
      target_pool = pool[suffix_key] || pool[""] || pool;
    }
  }

  const is_array_pool = Array.isArray(target_pool);
  const active_list = is_array_pool
    ? target_pool
    : target_pool[exact_voice] ||
      target_pool[fallback_voice] ||
      target_pool.casual ||
      target_pool.lyrical ||
      target_pool.primal ||
      target_pool.clinical ||
      [];

  if (!active_list.length) return match;

  const rep = match_case(match, stable_pick(active_list, match, offset));
  return prefix ? `${prefix} ${rep}` : suffix ? `${rep} ${suffix}` : rep;
}

// ============================================================================
// [SECTION 4: PROSE DETOX ENGINE & RULE REGISTRATION]
// ============================================================================

/** @type {Array<DetoxRule> | null} */
let _cached_speaking_rules = null;

/**
 * Registers default speaking style rules for detox_prose without hardcoding circular dependencies.
 * @param {Array<DetoxRule>} rules
 */
export function register_speaking_rules(rules) {
  _cached_speaking_rules = rules;
}

/**
 * Intercepts and scrubs clichéd AI tropes and purple prose from text using speaking style vocabulary.
 * @param {string | null | undefined} raw_text - Raw incoming narrative prose.
 * @param {SpeakingStyleId} [speaking_style="casual"] - Speaking voice tone to resolve replacements for.
 * @param {Array<DetoxRule> | null} [custom_rules=null] - Optional override rule set.
 * @returns {string} Detoxified clean prose.
 */
export function detox_prose(raw_text, speaking_style = "casual", custom_rules = null) {
  if (!raw_text || typeof raw_text !== "string") return "";

  const exact_voice = VALID_SPEAKING_STYLES.has(speaking_style) ? speaking_style : "casual";
  const fallback_voice = exact_voice === "lyrical" ? "lyrical" : "casual";

  const rules_to_run = custom_rules || _cached_speaking_rules || [];

  let clean_text = raw_text;

  for (const rule_item of rules_to_run) {
    clean_text = clean_text.replace(rule_item.regex, (match, p1, ...args) => {
      const offset = args[args.length - 2];
      if (typeof rule_item.replace === "function") {
        return rule_item.replace(match, p1, ...args);
      }
      const prefix = rule_item.keep_prefix ? p1 : "";
      const suffix = rule_item.keep_suffix ? p1 : "";
      const key_hint = typeof p1 === "string" ? p1 : "";
      return pick_replacement(match, rule_item.replace, exact_voice, fallback_voice, offset, prefix, suffix, key_hint);
    });
  }

  // --------------------------------------------------------------------------
  // Structural Pattern Detox (Sentence-Level AI Formulas)
  // --------------------------------------------------------------------------

  // 1. Denial-then-Affirmation Formula ("X didn't just Y, it Z'd" -> "X Z'd")
  clean_text = clean_text.replace(
    /\b(?:the\s+)?([A-Za-z0-9_-]+)\s+(?:didn't|did not|wasn't|was not)\s+just\s+([^,;.]+)[,;.]?\s*(?:it|he|she|they)?\s*(?:simply|instead|was|did|became)?\s+([^.!?]+)/gi,
    (match, subject, _negated, affirmative) => {
      if (!subject || !affirmative) return match;
      return `${subject} ${affirmative.trim()}`;
    },
  );

  // 2. Self-Answering Dialogue ("Tomato? What's that, some sort of red fruit...?" -> "Tomato...")
  clean_text = clean_text.replace(
    /\b([A-Z][a-z0-9_-]+)\?\s*What(?:'s| is)\s+that,\s+some\s+sort\s+of\s+[^?]+\?\s*/gi,
    (_match, word) => `${word}... `,
  );

  // 3. Binary Comparison Cliché ("felt less like a sanctuary and more like a cage" -> "felt like a cage")
  clean_text = clean_text.replace(
    /\b(felt|was|seemed)\s+less\s+like\s+([^,;.]+?)\s+and\s+more\s+like\s+([^,;.!?]+)/gi,
    (match, verb, _first_noun, second_noun) => {
      if (!verb || !second_noun) return match;
      return `${verb} like ${second_noun.trim()}`;
    },
  );

  return clean_text;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported frozen VALID_SPEAKING_STYLES collection, added JSDoc
 *   schemas for DetoxRule and SpeakingStyleId, and verified 100% test pass.
 * - 2026-06-15: Initial prose detoxification engine with structural formula scrubbers and conjugation maps.
 */
