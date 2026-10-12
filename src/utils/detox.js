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

  // 9. Em-Dash & En-Dash Punctuation Normalizer
  // Replace conversational/pseudo-poetic em-dashes and en-dashes with clean commas or periods.
  clean_text = clean_text.replace(/\s*[—–]\s*/g, ", ");

  // 10. Throat-Clearing "Quietly [Verb]" Filter
  clean_text = clean_text.replace(/\bquietly\s+(stepped|walked|said|spoke|looked|watched|turned|reached|stood)\b/gi, "$1");

  // 11. Cliché Abstractions ("a testament to", "a symphony / tapestry / dance of")
  clean_text = clean_text.replace(/\ba\s+testament\s+to\s+/gi, "proof of ");
  clean_text = clean_text.replace(/\ba\s+(?:symphony|tapestry|dance)\s+of\s+/gi, "a mix of ");

  // 12. Tier 1 Constructions & Stock Syntactic Formulas (Track 3.2)
  // "not quite X, more like Y" -> "more like Y"
  clean_text = clean_text.replace(/\bnot\s+quite\s+[^.!?\n;]{1,44}?,\s*(?:more\s+like|more\s+a)\s+([^.!?]+)/gi, (match, target) => {
    if (!target) return match;
    return /^[A-Z]/.test(match) ? `More like ${target.trim()}` : `more like ${target.trim()}`;
  });

  // "not X; she/he/they Y" -> "she/he/they Y"
  clean_text = clean_text.replace(
    /\bnot\s+(?:a\s+|an\s+|the\s+|so\s+|too\s+)?[^.!?\n;]{1,44};\s*(she|he|they|it|that|this|there|I|you)\b/gi,
    (match, pronoun) => {
      return /^[A-Z]/.test(match) ? match_case(match, pronoun) : pronoun;
    },
  );

  // "she didn't X; she Y" -> "she Y"
  clean_text = clean_text.replace(
    /\b(?:she|he|they|I|you)\s+(?:didn'?t|doesn'?t|hadn'?t|wasn'?t|isn'?t|won'?t)\s+[^.!?\n;]{1,60};\s*(she|he|they|it|I|you)\b/gi,
    (match, pronoun) => {
      return /^[A-Z]/.test(match) ? match_case(match, pronoun) : pronoun;
    },
  );

  // "the air grew thick" -> "the air went quiet" / "the room was still"
  clean_text = clean_text.replace(/\bthe\s+air\s+(?:grew|went|turned|had\s+turned|was)\s+thick\b/gi, (match) =>
    match_case(match, "the room went quiet"),
  );
  clean_text = clean_text.replace(/\bair\s+(?:grew|went|turned|had\s+turned|was)\s+thick\b/gi, (match) => match_case(match, "room went quiet"));

  // Naming the subtext ("a gesture of ownership", "a display of dominance", etc.)
  clean_text = clean_text.replace(
    /,\s*(?:a\s+|an\s+)?(?:gesture|act|display|show|performance)\s+of\s+(?:ownership|dominance|possession|control)\b/gi,
    "",
  );

  // 13. Tier 1B Clarity Edits (Track 3.5)
  clean_text = clean_text.replace(/\butiliz(e|ed|es|ing)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "utilize") return match_case(match, "use");
    if (lower === "utilized") return match_case(match, "used");
    if (lower === "utilizes") return match_case(match, "uses");
    if (lower === "utilizing") return match_case(match, "using");
    return match_case(match, "use");
  });
  clean_text = clean_text.replace(/\bin\s+order\s+to\b/gi, (match) => match_case(match, "to"));
  clean_text = clean_text.replace(/\bdue\s+to\s+the\s+fact\s+that\b/gi, (match) => match_case(match, "because"));
  clean_text = clean_text.replace(/\bserves\s+as\b/gi, (match) => match_case(match, "is"));
  clean_text = clean_text.replace(/\bcommenc(e|ed|es|ing)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "commence") return match_case(match, "start");
    if (lower === "commenced") return match_case(match, "started");
    if (lower === "commences") return match_case(match, "starts");
    if (lower === "commencing") return match_case(match, "starting");
    return match_case(match, "start");
  });
  clean_text = clean_text.replace(/\bascertain(ed|s|ing)?\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "ascertain") return match_case(match, "find out");
    if (lower === "ascertained") return match_case(match, "found out");
    if (lower === "ascertains") return match_case(match, "finds out");
    if (lower === "ascertaining") return match_case(match, "finding out");
    return match_case(match, "find out");
  });
  clean_text = clean_text.replace(/\bendeavor(ed|s|ing)?\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "endeavor") return match_case(match, "attempt");
    if (lower === "endeavored") return match_case(match, "attempted");
    if (lower === "endeavors") return match_case(match, "attempts");
    if (lower === "endeavoring") return match_case(match, "attempting");
    return match_case(match, "attempt");
  });

  // 14. Tier 1A High-Frequency AI Vocabulary Replacements (Track 3.5)
  clean_text = clean_text.replace(/\bdelv(e|ed|es|ing)(?:\s+into)?\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower.startsWith("delving")) return match_case(match, "digging into");
    if (lower.startsWith("delved")) return match_case(match, "dug into");
    if (lower.startsWith("delves")) return match_case(match, "digs into");
    return match_case(match, "dig into");
  });
  clean_text = clean_text.replace(/\btapestr(y|ies)\b/gi, (match) => {
    return match.toLowerCase() === "tapestry" ? match_case(match, "weave") : match_case(match, "weaves");
  });
  clean_text = clean_text.replace(/\brealm(s)?\b/gi, (match) => {
    return match.toLowerCase() === "realm" ? match_case(match, "domain") : match_case(match, "domains");
  });
  clean_text = clean_text.replace(/\bparadigm(s)?\b/gi, (match) => {
    return match.toLowerCase() === "paradigm" ? match_case(match, "model") : match_case(match, "models");
  });
  clean_text = clean_text.replace(/\bembark(ed|s|ing)?\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "embark") return match_case(match, "start");
    if (lower === "embarked") return match_case(match, "started");
    if (lower === "embarks") return match_case(match, "starts");
    if (lower === "embarking") return match_case(match, "starting");
    return match_case(match, "start");
  });
  clean_text = clean_text.replace(/\bbeacon(s)?\b/gi, (match) => {
    return match.toLowerCase() === "beacon" ? match_case(match, "signal") : match_case(match, "signals");
  });
  clean_text = clean_text.replace(/\brobust\b/gi, (match) => match_case(match, "solid"));
  clean_text = clean_text.replace(/\bcomprehensive\b/gi, (match) => match_case(match, "thorough"));
  clean_text = clean_text.replace(/\ba\s+cutting-edge\b/gi, (match) => match_case(match, "an advanced"));
  clean_text = clean_text.replace(/\bcutting-edge\b/gi, (match) => match_case(match, "advanced"));
  clean_text = clean_text.replace(/\bleverag(e|ed|es|ing)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "leverage") return match_case(match, "use");
    if (lower === "leveraged") return match_case(match, "used");
    if (lower === "leverages") return match_case(match, "uses");
    if (lower === "leveraging") return match_case(match, "using");
    return match_case(match, "use");
  });
  clean_text = clean_text.replace(/\bpivotal\b/gi, (match) => match_case(match, "key"));
  clean_text = clean_text.replace(/\bseamless(ly)?\b/gi, (match) => {
    return match.toLowerCase() === "seamlessly" ? match_case(match, "smoothly") : match_case(match, "smooth");
  });
  clean_text = clean_text.replace(/\bgame-chang(er|ing)\b/gi, (match) => match_case(match, "turning point"));
  clean_text = clean_text.replace(/\bwatershed\s+moment\b/gi, (match) => match_case(match, "turning point"));
  clean_text = clean_text.replace(/\bdeep\s+dive\b/gi, (match) => match_case(match, "close look"));
  clean_text = clean_text.replace(/\bintricate\b/gi, (match) => match_case(match, "complex"));
  clean_text = clean_text.replace(/\bcomplexities\b/gi, (match) => match_case(match, "details"));
  clean_text = clean_text.replace(/\bintricacies\b/gi, (match) => match_case(match, "details"));
  clean_text = clean_text.replace(/\bactionable\b/gi, (match) => match_case(match, "practical"));
  clean_text = clean_text.replace(/\bholistic(ally)?\b/gi, (match) => {
    return match.toLowerCase() === "holistically" ? match_case(match, "completely") : match_case(match, "complete");
  });
  clean_text = clean_text.replace(/\s*\bat\s+its\s+core\b(?=\s*[,;.!?]|\s*$)/gi, "");
  clean_text = clean_text.replace(/\bat\s+its\s+core\b\s*/gi, "");

  return clean_text;
}

/**
 * CHANGELOG
 * - Track 3.2: Implemented fatal syntactic construction rewrites (not quite X more like Y, didn't X she Y, purple weather, naming subtext).
 * - Track 3.5: Implemented Tier 1A frequency markers and Tier 1B clarity rewrites (utilize -> use, in order to -> to, delve -> dig into, etc.).
 */
