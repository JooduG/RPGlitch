/**
 * src/utils/styles.js
 * 🎨 STYLE ENGINE & PROSE DETOX LAYER
 * Cross-layer engine for resolving active styles (visual, narrative, speaking)
 * and intercepting/scrubbing clichéd AI tropes from streamed prose.
 */

import { match_case } from "./text.js";
import { stable_pick } from "./math.js";
import { state_bridge } from "./bridges.js";

// ── 1. Style Resolvers ────────────────────────────────────────────────────────

/**
 * Resolves an active style key across an explicit entity/fractal override and global app settings.
 * @param {string | undefined} explicit_style - Style from entity/fractal/card
 * @param {string} app_setting_key - Key in app.settings (e.g. "narrative_style" | "visual_style")
 * @param {Record<string, any>} registry - Registry dictionary (e.g. NARRATIVE_STYLES | VISUAL_STYLES)
 * @param {string} [fallback=""] - Fallback key when no style active
 * @returns {string}
 */
export function resolve_style(explicit_style, app_setting_key, registry, fallback = "") {
  if (explicit_style && explicit_style !== "default" && explicit_style !== "" && registry?.[explicit_style]) {
    return explicit_style;
  }
  const app_style = state_bridge.app?.settings?.[app_setting_key];
  if (app_style && app_style !== "default" && registry?.[app_style]) {
    return app_style;
  }
  return fallback;
}

const VALID_SPEAKING_STYLES = new Set(["casual", "lyrical", "primal", "clinical"]);

/**
 * Resolves the active speaking style based on entity and narrative style hierarchy.
 * Priority: Entity Speaking Style > Narrative Style Speaking Style > "casual" (default)
 *
 * @param {object|null} [entity] - Active character/user entity
 * @param {string|object|null} [narrative_style] - Active narrative style ID or style object
 * @returns {"casual"|"lyrical"|"primal"|"clinical"}
 */
export function resolve_speaking_style(entity = null, narrative_style = null) {
  const entity_style = entity?.speaking_style;
  if (entity_style && VALID_SPEAKING_STYLES.has(entity_style)) {
    return entity_style;
  }

  const style_style = typeof narrative_style === "object" && narrative_style !== null ? narrative_style.speaking_style : null;

  if (style_style && VALID_SPEAKING_STYLES.has(style_style)) {
    return style_style;
  }

  return "casual";
}

// ── 2. Replacement Picker Helper ──────────────────────────────────────────────

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

// ── 3. Main Prose Detox Engine ────────────────────────────────────────────────

/**
 * Intercepts and scrubs clichéd AI tropes from prose using speaking style vocabulary.
 * @param {string|null|undefined} raw_text
 * @param {"casual"|"lyrical"|"primal"|"clinical"} [speaking_style="casual"]
 * @param {Array<object>} [custom_rules] - Optional rule array override
 * @returns {string}
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

  // ── Structural Pattern Detox (Sentence-Level AI-isms) ─────────────────────────

  // 1. Denial-then-Affirmation Formula ("X didn't just Y, it Z'd" -> "X Z'd")
  clean_text = clean_text.replace(
    /\b(?:the\s+)?([A-Za-z0-9_-]+)\s+(?:didn't|did not|wasn't|was not)\s+just\s+([^,;.]+)[,;.]?\s*(?:it|he|she|they)?\s*(?:simply|instead|was|did|became)?\s+([^.!?]+)/gi,
    (match, subject, negated, affirmative) => {
      if (!subject || !affirmative) return match;
      return `${subject} ${affirmative.trim()}`;
    },
  );

  // 2. Self-Answering Dialogue ("Tomato? What's that, some sort of red fruit...?" -> "Tomato...")
  clean_text = clean_text.replace(
    /\b([A-Z][a-z0-9_-]+)\?\s*What(?:'s| is)\s+that,\s+some\s+sort\s+of\s+[^?]+\?\s*/gi,
    (match, word) => `${word}... `,
  );

  // 3. Binary Comparison Cliché ("felt less like a sanctuary and more like a cage" -> "felt like a cage")
  clean_text = clean_text.replace(
    /\b(felt|was|seemed)\s+less\s+like\s+([^,;.]+?)\s+and\s+more\s+like\s+([^,;.!?]+)/gi,
    (match, verb, first_noun, second_noun) => {
      if (!verb || !second_noun) return match;
      return `${verb} like ${second_noun.trim()}`;
    },
  );

  return clean_text;
}

/** @type {Array<object>|null} */
let _cached_speaking_rules = null;

/**
 * Registers default speaking style rules for detox_prose without hardcoding circular imports.
 * @param {Array<object>} rules
 */
export function register_speaking_rules(rules) {
  _cached_speaking_rules = rules;
}
