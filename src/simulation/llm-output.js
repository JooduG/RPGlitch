/**
 * src/simulation/llm-output.js
 * ============================================================================
 * 🧠 LLM OUTPUT SANITIZATION & PROSE SCRUBBING (Rank 1, pure simulation)
 * ============================================================================
 *
 * Canonical home for everything that cleans raw model output into safe,
 * in-world prose: cognition stripping, transport normalization, JSON
 * recovery, unified think parsing, covert-directive stripping, AI-slop
 * detox, style resolution, and narrative linting.
 *
 * Phase 2 unification: merged from `src/utils/llm-sanitize.js`
 * (`strip_cognition_blocks`, `safe_parse_json`, `sanitize_llm`,
 * `strip_covert_directives`, `parse_think_block` unified with
 * `turns.js#extract_think_and_body`) + `src/utils/detox.js`
 * (`detox_prose` as `clean_generated_prose`) + `src/utils/styles.js`
 * (`resolve_style`, `resolve_speaking_style`, `lint_narrative_slop`,
 * `cap_somatic_markers`, `audit_macro_shape`) + `text.js#first_sentence`.
 *
 * Dead exports removed (zero callers): `extract_json_block`,
 * `escape_unescaped_json_quotes`, `looks_truncated`, `raw_to_text`,
 * `raw_stop_reason`, `parse_profile_json`.
 *
 * Pure, stateless, domain-agnostic. No Svelte runes, no IndexedDB, no DOM.
 * Imports only Rank 0 (`@config`, `@definitions`, `@utils`).
 * ============================================================================
 */

import { SPEAKING_STYLES } from "@config";
import { ANTI_AI_REPLACEMENTS, SPEAKING_STYLE_RULES, TIER_2_CLUSTER_WORDS } from "@definitions";
import { collapse_whitespace, match_case, stable_pick } from "@utils";

/**
 * Model artifact leading prefixes to strip from prose output.
 */
const MODEL_ARTIFACT_PATTERNS = [/^Mattis\b(?:\.\s*Archetypes:[^\n]*\n*|\.|:|\s)*/i];

// ============================================================================
// [COGNITION & SANITIZATION UTILITIES]
// ============================================================================

/**
 * Strips cognition blocks (`<thinking>...</thinking>`), leaked <DYNAMICS> state blocks,
 * and model artifacts from prose.
 * @param {string | null | undefined} text - Input text.
 * @returns {string} Cleaned prose without internal thoughts.
 */
export function strip_cognition_blocks(text) {
  if (!text) return "";
  let clean = text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
  clean = clean.replace(/<\/think\s*>/gi, "");
  clean = clean.replace(/<DYNAMICS\b[^>]*>[\s\S]*?(?:<\/DYNAMICS\s*>|$)\r?\n?/gi, "");
  clean = clean.replace(/<\/?DYNAMICS\s*>/gi, "");
  for (const pattern of MODEL_ARTIFACT_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
}

/**
 * Repairs raw control characters (literal newlines/tabs) inside JSON string
 * values so payloads with unescaped newlines (e.g. visualizer thought text)
 * still parse. Operates only inside double-quoted spans.
 * @param {string} json_text
 * @returns {string}
 */
function repair_unescaped_newlines(json_text) {
  let out = "";
  let in_string = false;
  let escaped = false;
  for (let i = 0; i < json_text.length; i++) {
    const ch = json_text[i];
    if (in_string) {
      if (escaped) {
        out += ch;
        escaped = false;
      } else if (ch === "\\") {
        out += ch;
        escaped = true;
      } else if (ch === '"') {
        out += ch;
        in_string = false;
      } else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (ch < " ") out += "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
      else out += ch;
    } else {
      out += ch;
      if (ch === '"') in_string = true;
    }
  }
  return out;
}

/**
 * Safely parses the first JSON object or array contained within raw text/prose.
 * If prefix is supplied (e.g. from startWith), it evaluates raw with and without prefix.
 * Falls back to unescaped-newline repair before giving up.
 * Returns the parsed payload or null if no valid JSON is found.
 * @param {string | null | undefined} raw - Input string potentially containing JSON.
 * @param {object} [options={}]
 * @param {string} [options.prefix=""] - Optional prefill string (e.g. startWith) to reattach if the model continued it.
 * @returns {any | null} Parsed object/array or null.
 */
export function safe_parse_json(raw, options = {}) {
  if (!raw || typeof raw !== "string") return null;

  const prefix = typeof options === "string" ? options : options?.prefix || "";
  const candidates = [raw];
  if (prefix) {
    candidates.push(prefix + raw);
  }

  for (const candidate of candidates) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      const sliced = candidate.slice(start, end + 1);
      try {
        return JSON.parse(sliced);
      } catch (_) {
        try {
          return JSON.parse(repair_unescaped_newlines(sliced));
        } catch (_) {
          // Continue to array check or next candidate
        }
      }
    }

    const arr_start = candidate.indexOf("[");
    const arr_end = candidate.lastIndexOf("]");
    if (arr_start !== -1 && arr_end !== -1 && arr_end > arr_start) {
      try {
        return JSON.parse(candidate.slice(arr_start, arr_end + 1));
      } catch (_) {
        // Continue to next candidate
      }
    }
  }

  return null;
}

/**
 * Strips code fences, stray outer quotes, and conversational filler prefixes from LLM output.
 * Preserves `<think>` blocks for DevMode telemetry and database persistence.
 * @param {string} text
 * @returns {string}
 */
export function sanitize_llm(text) {
  if (!text) return "";

  // 1. Strip conversational filler and code fences
  let out = text
    .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "")
    .replace(/^\s*```.*?[\r\n]/gm, "")
    .replace(/```\s*$/gm, "")
    .trim();

  // 2. Outer-quote cleanup: strip leading unmatched quote without destroying trailing dialogue quotes
  if (out.length > 1) {
    const first = out[0];
    if ((first === '"' || first === "'") && out[out.length - 1] !== first) {
      out = out.slice(1).trim();
    }
  }

  return out;
}

/**
 * Strips private directive brackets across entity boundaries.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_covert_directives(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\[(?:covert|secret|private|hidden)\s*:[^\]]*\]/gi, "")
    .replace(/«(?:covert|secret|private|hidden)(?::[^»]*)?»/gi, "")
    .replace(/[ \t]{2,}/g, " ");
}

/**
 * Extracts `<think>` blocks from text, reconciling an optional startWith
 * prefill first (unified with the old `extract_think_and_body`).
 * Handles partial tags during streaming and merges multiple blocks cleanly.
 *
 * @param {string|null|undefined} raw - Raw model output
 * @param {string} [start_with=""] - The startWith prefix sent to transport
 * @returns {{ think: string, prose: string, content: string }} `content` aliases `prose`.
 */
export function parse_think_block(raw, start_with = "") {
  if (!raw || typeof raw !== "string") {
    return { think: "", prose: "", content: "" };
  }

  let text = raw;

  // Reconcile startWith prefill if stripped by transport or echoed by the model.
  if (start_with && !text.includes("<think>")) {
    // If the mock/model returned raw output without any <think> tags, check if it's pure prose/body.
    // Only prepend start_with if the output already looks like it was continuing mid-stream, or close the think tag.
    if (text.includes("</think>")) {
      text = `${start_with}${text}`;
    } else {
      text = `${start_with}</think>\n${text}`;
    }
  } else if (start_with && !text.trimStart().startsWith("<think>")) {
    text = `${start_with}${text}`;
  }

  const think_accumulator = [];

  // 1. Match and extract closed <think>...</think> blocks
  const closed_think_regex = /<think>([\s\S]*?)<\/think>/gi;
  let match;
  while ((match = closed_think_regex.exec(text)) !== null) {
    const raw_block = match[1].replace(/<\/?think>/gi, "").trim();
    if (raw_block) {
      think_accumulator.push(raw_block);
    }
  }

  // Clean closed <think>...</think> blocks from content
  let content = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. Check for an unclosed partial block (streaming)
  const think_openers = (text.match(/<think>/gi) || []).length;
  const think_closers = (text.match(/<\/think>/gi) || []).length;

  if (think_openers > think_closers) {
    const lower_text = text.toLowerCase();
    const last_think_index = lower_text.lastIndexOf("<think>");
    if (last_think_index !== -1) {
      const partial_think = text
        .slice(last_think_index)
        .replace(/<\/?think>/gi, "")
        .trim();
      if (partial_think) {
        think_accumulator.push(partial_think);
      }
      content = text.slice(0, last_think_index);
    }
  }

  const think_string = think_accumulator.length > 0 ? think_accumulator.join("\n\n") : "";
  const cleaned_content = content.trim();

  return { think: think_string || "", prose: cleaned_content, content: cleaned_content };
}

/**
 * Extracts a single short sentence (<= max_len chars) from a blob of text.
 * Strips think blocks, markdown fences, and excessive whitespace.
 * @param {string | null | undefined} text
 * @param {number} [max_len=160]
 * @returns {string}
 */
export function first_sentence(text, max_len = 160) {
  const clean = collapse_whitespace(strip_cognition_blocks(text).replace(/```/g, ""));
  if (!clean) return "";
  const regex = new RegExp(`^[^.!?]{1,${max_len}}[.!?:;]?`);
  const m = clean.match(regex);
  const sentence = (m ? m[0] : clean.slice(0, max_len)).trim();
  return sentence;
}

// ============================================================================
// [PROSE DETOX ENGINE]
// ============================================================================

/**
 * @typedef {"casual" | "lyrical" | "primal" | "clinical"} SpeakingStyleId
 */

/**
 * Selects an appropriate replacement token matching voice, suffix conjugation, and casing.
 */
function pick_replacement(match, pool, exact_voice = "casual", fallback_voice = "casual", offset = 0, prefix = "", suffix = "", key_hint = "") {
  if (!pool) return match;

  if (typeof pool === "string") {
    const rep = match_case(match, pool);
    return (
      prefix ? `${prefix} ${rep}`
      : suffix ? `${rep} ${suffix}`
      : rep
    );
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
  const active_list =
    is_array_pool ? target_pool : (
      target_pool[exact_voice] || target_pool[fallback_voice] || target_pool.casual || target_pool.lyrical || target_pool.primal || target_pool.clinical || []
    );

  if (!active_list.length) return match;

  const rep = match_case(match, stable_pick(active_list, match, offset));
  return (
    prefix ? `${prefix} ${rep}`
    : suffix ? `${rep} ${suffix}`
    : rep
  );
}

/**
 * Intercepts and scrubs clichéd AI tropes and purple prose from text using speaking style vocabulary.
 * Canonical prose-cleaning entry point (formerly `detox_prose`).
 * @param {string | null | undefined} raw_text - Raw incoming narrative prose.
 * @param {SpeakingStyleId} [speaking_style="casual"] - Speaking voice tone to resolve replacements for.
 * @param {Array<any> | null} [custom_rules=null] - Optional override rule set.
 * @returns {string} Cleaned prose.
 */
export function clean_generated_prose(raw_text, speaking_style = "casual", custom_rules = null) {
  if (!raw_text || typeof raw_text !== "string") return "";

  const exact_voice = SPEAKING_STYLES.includes(speaking_style) ? speaking_style : "casual";
  const fallback_voice = exact_voice === "lyrical" ? "lyrical" : "casual";

  const rules_to_run = custom_rules || SPEAKING_STYLE_RULES;

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
  clean_text = clean_text.replace(/\b([A-Z][a-z0-9_-]+)\?\s*What(?:'s| is)\s+that,\s+some\s+sort\s+of\s+[^?]+\?\s*/gi, (_match, word) => `${word}... `);

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
    /\b(?:it|this|that)\s+(?:wasn't|was not|is not|isn't)\s+([^,;.]+)[,;]\s*(?:it|this|that)\s+(?:was|is)\s+([^.!?]+)/gi,
    (match, _negated, affirmative) => {
      if (!affirmative) return match;
      return `It was ${affirmative.trim()}`;
    },
  );

  // 5. Categorical/Superlative Corrections ("That's not just a wound, that's an infection" -> "That's an infection")
  clean_text = clean_text.replace(
    /\b(?:that's|that is|it's|it is)\s+not\s+(?:just\s+)?(?:a\s+|an\s+)?([^,;.]+)[,;]\s*(?:that's|it's|that is|it is)\s+/gi,
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

  // 8. Rhetorical False Contrast ("It's not just a tool - it's a movement" -> "It is a movement.")
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

  // 12. Tier 1 Constructions & Stock Syntactic Formulas
  // "not quite X, more like Y" -> "more like Y"
  clean_text = clean_text.replace(/\bnot\s+quite\s+[^.!?\n;]{1,44}?,\s*(?:more\s+like|more\s+a)\s+([^.!?]+)/gi, (match, target) => {
    if (!target) return match;
    return /^[A-Z]/.test(match) ? `More like ${target.trim()}` : `more like ${target.trim()}`;
  });

  // "not X; she Y" -> "she Y"
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

  // "the air grew thick" -> "the room went quiet" / "the room was still"
  clean_text = clean_text.replace(/\bthe\s+air\s+(?:grew|went|turned|had\s+turned|was)\s+thick\b/gi, (match) => match_case(match, "the room went quiet"));
  clean_text = clean_text.replace(/\bair\s+(?:grew|went|turned|had\s+turned|was)\s+thick\b/gi, (match) => match_case(match, "room went quiet"));

  // Naming the subtext ("a gesture of ownership", "a display of dominance", etc.)
  clean_text = clean_text.replace(/,\s*(?:a\s+|an\s+)?(?:gesture|act|display|show|performance)\s+of\s+(?:ownership|dominance|possession|control)\b/gi, "");

  // 13. Dynamic Anti-AI Replacements (Tier 1A & Tier 1B Dictionary Rules from @definitions)
  const anti_ai_rules = ANTI_AI_REPLACEMENTS || [];
  for (const rule of anti_ai_rules) {
    clean_text = clean_text.replace(rule.pattern, rule.replace);
  }

  return clean_text;
}

// ============================================================================
// [NARRATIVE SLOP LINTER]
// ============================================================================

/**
 * Frozen slop catalog: repetitive narrative clichés the detox pass does not
 * structurally rewrite, plus the cliché somatic-marker set capped at one
 * occurrence per reply. Data-only - detection and enforcement below walk it.
 */
export const SLOP_PATTERNS = Object.freeze({
  CLICHES: Object.freeze([
    /\bagainst better judgment\b/i,
    /\bfor what felt like an eternity\b/i,
    /\btime (seemed|felt) to (slow|stop|stand still)\b/i,
    /\ba shiver (ran|went|crawled) down\b/i,
    /\bher word(s)? (hung|lingered) in the air\b/i,
    /\bhis word(s)? (hung|lingered) in the air\b/i,
    /\bwords? (hung|lingered) in the air\b/i,
    /\bcould cut the tension with a knife\b/i,
    /\bdeafening silence\b/i,
    /\bpregnant (pause|silence)\b/i,
  ]),
  SOMATIC_MARKERS: Object.freeze([
    /\bheart (pounded|hammered|raced|fluttered|thudded)\b/i,
    /\bbreath (hitched|caught|hitched in|caught in|stuttered)\b/i,
    /\bheld (his|her|their) breath\b/i,
    /\bstomach (dropped|twisted|churned|lurched)\b/i,
    /\bblood ran cold\b/i,
    /\bskin (prickled|crawled)\b/i,
    /\bknees (went weak|buckled)\b/i,
    /\bhands? (trembled|shook)\b/i,
    /\bpulse (quickened|roared|pounded)\b/i,
    /\bthroat (went dry|tightened|closed)\b/i,
    /\bghost of a (smirk|smile)\b/i,
    /\bbarely above a whisper\b/i,
    /\beyes (darkened|flashed|narrowed|hardened)\b/i,
    /\b(jaw|mouth) (tight|tightened|set|clenched|locked)\b/i,
    /\bfists? (clenched|tightened)\b/i,
    /\bran a hand through (his|her|their) hair\b/i,
    /\btime seemed to (stop|slow)\b/i,
  ]),
});

/** Maximum physical cliché reaction markers permitted per turn before stripping */
const SOMATIC_MARKER_CAP = 1;

/**
 * Lints a prose reply for narrative slop: cliché hits plus cliché somatic
 * markers over the per-reply cap.
 * @param {string|null|undefined} text
 * @returns {Readonly<{ violations: ReadonlyArray<Readonly<{ kind: string, match: string }>>, somatic_count: number, over_cap: boolean }>}
 */
// ignore-next-line: parked in ROADMAP.md (Narrative Slop & Macro-Shape Post-Processing)
export function lint_narrative_slop(text) {
  const source = String(text || "");
  const violations = [];
  for (const pattern of SLOP_PATTERNS.CLICHES) {
    const hit = source.match(pattern);
    if (hit) violations.push(Object.freeze({ kind: "cliche", match: hit[0] }));
  }
  let somatic_count = 0;
  for (const pattern of SLOP_PATTERNS.SOMATIC_MARKERS) {
    const hits = source.match(new RegExp(pattern.source, "gi")) || [];
    for (const hit of hits) {
      somatic_count += 1;
      violations.push(Object.freeze({ kind: "somatic_marker", match: hit }));
    }
  }
  return Object.freeze({ violations: Object.freeze(violations), somatic_count, over_cap: somatic_count > SOMATIC_MARKER_CAP });
}

/**
 * Enforces the somatic-marker cap: keeps the first marker occurrence intact and
 * strips the matched marker phrase from every later occurrence, collapsing the
 * leftover whitespace. Pure text surgery - sentence structure is preserved.
 * @param {string|null|undefined} text
 * @returns {string}
 */
// ignore-next-line: parked in ROADMAP.md (Narrative Slop & Macro-Shape Post-Processing)
export function cap_somatic_markers(text) {
  const source = String(text || "");
  if (!source) return "";
  const hits = [];
  for (const pattern of SLOP_PATTERNS.SOMATIC_MARKERS) {
    for (const match of source.matchAll(new RegExp(pattern.source, "gi"))) {
      hits.push({ index: match.index ?? 0, length: match[0].length });
    }
  }
  if (hits.length <= SOMATIC_MARKER_CAP) return source;
  hits.sort((left, right) => left.index - right.index);
  const doomed = hits.slice(SOMATIC_MARKER_CAP).sort((left, right) => right.index - left.index);
  let output = source;
  for (const hit of doomed) output = output.slice(0, hit.index) + output.slice(hit.index + hit.length);
  return output.replace(/[ \t]{2,}/g, " ").replace(/\s+([,;.!?])/g, "$1");
}

// ============================================================================
// [STYLE HIERARCHY RESOLVERS]
// ============================================================================

/**
 * Resolves the active speaking style based on entity and narrative style hierarchy.
 * Priority: Entity Speaking Style > Narrative Style Preset > "casual" (default).
 * @param {Record<string, any> | null} [entity=null] - Active character or user entity.
 * @param {string | Record<string, any> | null} [narrative_style=null] - Active narrative style ID or style object.
 * @returns {SpeakingStyleId} Resolved speaking style identifier.
 */
export function resolve_speaking_style(entity = null, narrative_style = null) {
  const entity_style = entity?.speaking_style;
  if (entity_style && SPEAKING_STYLES.includes(entity_style)) {
    return /** @type {SpeakingStyleId} */ (entity_style);
  }

  const style_speaking = typeof narrative_style === "object" && narrative_style !== null ? narrative_style.speaking_style : null;

  if (style_speaking && SPEAKING_STYLES.includes(style_speaking)) {
    return /** @type {SpeakingStyleId} */ (style_speaking);
  }

  return "casual";
}

// ============================================================================
// [MACRO SHAPE AUDITOR]
// ============================================================================

/**
 * Audits macro shape of narrative prose:
 * - as_if_overuse: `as if` / `as though` > 2 in one reply
 * - every_para_question: every paragraph in a multi-paragraph reply ends in ?
 * - familiar_closer: final paragraph opens with Meanwhile / Then / Suddenly
 * - door_slam_closer: closing sentence ends on a door slam/shut beat
 *
 * @param {string|null|undefined} text
 */
// ignore-next-line: parked in ROADMAP.md (Narrative Slop & Macro-Shape Post-Processing)
export function audit_macro_shape(text) {
  const source = String(text || "").trim();
  if (!source) {
    return Object.freeze({
      as_if_count: 0,
      as_if_overuse: false,
      every_para_question: false,
      familiar_closer: false,
      door_slam_closer: false,
      cluster_hit_count: 0,
      vocabulary_cluster: false,
      violations: Object.freeze([]),
    });
  }

  const violations = [];

  // 1. as if overuse (> 2)
  const as_if_matches = source.match(/\bas\s+(?:if|though)\b/gi) || [];
  const as_if_count = as_if_matches.length;
  const as_if_overuse = as_if_count > 2;
  if (as_if_overuse) violations.push("as-if-overuse");

  // 2. every paragraph ends in a question
  const paragraphs = source
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const every_para_question = paragraphs.length >= 2 && paragraphs.every((p) => /\?["'”’]?$/.test(p));
  if (every_para_question) violations.push("every-para-question");

  // 3. familiar closer (final paragraph opens with Meanwhile / Then / Suddenly)
  const last_para = paragraphs[paragraphs.length - 1] || "";
  const familiar_closer = /^(?:meanwhile|then|suddenly)\b/i.test(last_para);
  if (familiar_closer) violations.push("familiar-closer");

  // 4. door slam closer
  const sentences = (source.match(/[^.!?…\n]+[.!?…]*/g) || []).map((s) => s.trim()).filter(Boolean);
  const last_sentence = sentences[sentences.length - 1] || "";
  const door_slam_closer = /\b(?:the\s+)?door\s+(?:slammed|slams|slam|shut|clicked)\b/i.test(last_sentence);
  if (door_slam_closer) violations.push("door-slam-closer");

  // 5. Tier 2 vocabulary cluster (>= 2 cluster words in single response)
  const cluster_words = TIER_2_CLUSTER_WORDS || [];
  let cluster_hit_count = 0;
  for (const word of cluster_words) {
    const word_regex = new RegExp(`\\b${word}(?:s|ed|ing|ly)?\\b`, "i");
    if (word_regex.test(source)) {
      cluster_hit_count += 1;
    }
  }
  const vocabulary_cluster = cluster_hit_count >= 2;
  if (vocabulary_cluster) violations.push("vocabulary-cluster");

  return Object.freeze({
    as_if_count,
    as_if_overuse,
    every_para_question,
    familiar_closer,
    door_slam_closer,
    cluster_hit_count,
    vocabulary_cluster,
    violations: Object.freeze(violations),
  });
}
