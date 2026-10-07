import { match_case } from "./text.js";
import { stable_pick } from "./math.js";

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

  // 4. Syntactical Antithesis Formulas ("It wasn't fear. It was exhaustion." -> "It was exhaustion.")
  clean_text = clean_text.replace(
    /\b(?:it|this|that)\s+(?:wasn't|was not|isn't|is not)\s+([^,;.]+)[,;.]\s*(?:it|this|that)\s+(?:was|is)\s+([^.!?]+)/gi,
    (match, _negated, affirmative) => {
      if (!affirmative) return match;
      return `It was ${affirmative.trim()}`;
    },
  );

  // 5. Categorical/Superlative Corrections ("That's not just a wound, that's an infection" -> "That's an infection")
  clean_text = clean_text.replace(
    /\b(?:that's|that is|it's|it is)\s+not\s+(?:just\s+)?(?:a|an\s+)?([^,;.]+)[,;]\s*(?:that's|it's|that is|it is)\s+/gi,
    "That is ",
  );

  // 6. Parenthetical / Clause Antithesis ("not a desire, I tell myself, but a professional appreciation" -> "a professional appreciation")
  clean_text = clean_text.replace(
    /\bnot\s+(?:a\s+|an\s+)?([a-z0-9_-]+)[,;]\s*(?:(?:I|he|she|we|they)\s+(?:tell|tells|told|remind|reminds|reminded|say|says|said)\s+(?:myself|himself|herself|themselves)[,;]\s*)?but\s+(?:a\s+|an\s+)?/gi,
    (match) => {
      // Preserve leading capitalization if original matched sentence start
      return /^[A-Z]/.test(match) ? "A " : "a ";
    },
  );

  // 7. Dangling Significance Participial Clause (", underscoring/highlighting/cementing/serving as ...")
  clean_text = clean_text.replace(/,\s*(?:highlighting|underscoring|cementing|signaling|exemplifying|reflecting)\s+[^.!?]+([.!?])/gi, "$1");

  // 8. Rhetorical False Contrast ("It's not just a tool — it's a movement" -> "It is a movement.")
  clean_text = clean_text.replace(
    /\b(?:it's|it is)\s+not\s+just\s+(?:a\s+|an\s+)?[^,;.—–]+\s*[,;.—–]\s*(?:it's|it is)\s+(?:a\s+|an\s+)?([^.!?]+)/gi,
    "It is a $1",
  );

  return clean_text;
}
