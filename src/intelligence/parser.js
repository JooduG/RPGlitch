/**
 * src/intelligence/parser.js
 * 📋 PARSER DOMAIN MODULE — Raw LLM Output Sanitization & Structured Extraction.
 *
 * Provides pure, synchronous parsing and repair algorithms for raw LLM text streams:
 * 1. Refusal & Safety Guardrails
 * 2. Think Block Parsing & Tag Repair
 * 3. Narrative Response Completion
 * 4. Profile JSON Extraction
 * 5. Sensory & Image Prompt Cleaning
 *
 * Purity Mandate:
 * - Stateless, deterministic functions only.
 * - Rendering concerns live in @ui/message/render.js.
 * - Director-specific JSON extraction lives in ./director.js.
 * - Raw network unwrapping lives in @platform/transport.js.
 */

import { escape_unescaped_json_quotes, strip_cognition_blocks, safe_parse_json, detox_prose } from "@utils";
import { sanitize_llm } from "@platform";

// ── 1. Refusal & Safety Guardrails ────────────────────────────────────────────

const REFUSAL_TRIGGERS = [
  "i cannot generate",
  "i can't generate",
  "i'm unable to assist",
  "i am unable to assist",
  "as an ai",
  "as a language model",
  "i'm sorry, but i can",
  "i can't help with that",
  "i cannot help with that",
  "i'm not able to provide",
  "i am not able to provide",
  "i cannot create content that",
  "can't continue this conversation",
  "cannot continue this conversation",
];

/**
 * Evaluates if a given text should be refused based on safety or policy rules.
 * Detects common LLM refusal phrasing in generated output.
 * @param {string} text
 * @returns {boolean}
 */
export function is_refusal_response(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return REFUSAL_TRIGGERS.some((trigger) => lower.includes(trigger));
}

// ── 2. Think Block Parsing & Tag Repair ───────────────────────────────────────

export const THINK_OPEN_TAG = "<THINK>";

/**
 * Drops `</think>` closing tags that appear while no think block is open.
 * @param {string} text
 * @returns {string}
 */
export function strip_unmatched_think_closures(text) {
  if (!text) return text;
  const segments = text.split(/(<\/think>|<think>)/i);
  let is_in_think = false;
  const kept = [];

  for (const segment of segments) {
    if (/^<think>$/i.test(segment)) {
      is_in_think = true;
      kept.push(segment);
    } else if (/^<\/think>$/i.test(segment)) {
      if (is_in_think) {
        is_in_think = false;
        kept.push(segment);
      }
    } else {
      kept.push(segment);
    }
  }

  return kept.join("");
}

/**
 * Synchronous post-turn validation and repair layer.
 * Automatically closes truncated `<think>` blocks, strips stray re-closures,
 * and neutralizes meta-narrative closures (*[END RP]*, *fade to black*, *credits roll*).
 * @param {string} response
 * @returns {{ text: string, is_refused: boolean, has_structural_repair: boolean }}
 */
export function validate_and_repair_response(response) {
  const result = { text: response || "", is_refused: false, has_structural_repair: false };

  if (is_refusal_response(response)) {
    result.is_refused = true;
    return result;
  }

  try {
    let text = result.text;
    const think_openers = (text.match(/<think>/gi) || []).length;
    const think_closers = (text.match(/<\/think>/gi) || []).length;

    if (think_openers > think_closers) {
      text += "</think>";
      result.has_structural_repair = true;
    } else if (think_closers > think_openers) {
      text = strip_unmatched_think_closures(text);
      result.has_structural_repair = true;
    }

    // Strip artificial meta-roleplay closures and unsolicited OOC mothering
    const stripped_meta = text
      .replace(/\*?\s*\[?\bEND\s+RP\b\]?\s*\*?/gi, "")
      .replace(/\*?\s*\b(?:screen\s+fades\s+to\s+black|fade\s+to\s+black|credits\s+roll)\b\s*\*?/gi, "")
      .replace(/\b(?:have\s+you\s+(?:eaten|slept)\s+lately\??)\b/gi, "")
      .trim();

    if (stripped_meta !== text) {
      text = stripped_meta;
      result.has_structural_repair = true;
    }

    result.text = text;
  } catch (err) {
    console.warn("[Parser] Validation check failed:", err);
    result.text = response || "";
  }

  return result;
}

/**
 * Extracts <think> blocks from text.
 * Handles partial tags during streaming and merges multiple blocks cleanly.
 * @param {string|null|undefined} text
 * @returns {{ content: string, think: string|null }}
 */
export function parse_think_block(text) {
  if (!text) return { content: "", think: null };

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
      const post_think = text.substring(last_think_index + 7);
      const streaming_think = post_think.replace(/<\/?think>/gi, "").trim();
      if (streaming_think) {
        think_accumulator.push(streaming_think);
      }

      const preceding_text = text.substring(0, last_think_index);
      content = preceding_text.replace(/<think>[\s\S]*?<\/think>/gi, "");
    }
  }

  // 3. Final safety pass: strip any lingering/stray <think> or </think> tags from content
  content = content.replace(/<\/?think>/gi, "");

  const clean_body = (str) => str.replace(/^##\s*\w+\n?/gm, "").trim();
  const unique_thinks = [];
  for (const block of think_accumulator.filter(Boolean)) {
    const body = clean_body(block);
    if (!body) continue;
    const is_duplicate = unique_thinks.some((existing) => {
      const existing_body = clean_body(existing);
      return existing_body === body || existing_body.includes(body) || body.includes(existing_body);
    });
    if (!is_duplicate) {
      unique_thinks.push(block);
    }
  }
  const final_think = unique_thinks.join("\n\n");

  return {
    content,
    think: final_think || null,
  };
}

/**
 * Repairs unbalanced <THINK> cognition tags: drops dangling </THINK> closers
 * that have no matching opener and appends missing closers at the end.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function balance_think_tags(text) {
  const source_text = String(text || "");
  const tag_regex = /<\/?THINK>/gi;
  let output = "";
  let depth = 0;
  let last_index = 0;
  let match;
  while ((match = tag_regex.exec(source_text)) !== null) {
    output += source_text.slice(last_index, match.index);
    if (/^<\//.test(match[0])) {
      if (depth > 0) {
        depth--;
        output += match[0];
      }
    } else {
      depth++;
      output += match[0];
    }
    last_index = match.index + match[0].length;
  }
  output += source_text.slice(last_index);
  if (depth > 0) output += "</THINK>".repeat(depth);
  return output;
}

/**
 * Removes the injected Director's-note THINK seed from generated text. When the
 * model drops the seeded opener but keeps its closing tag, the opener is restored
 * so the cognition block stays well-formed; all output is tag-balanced.
 * @param {string} full_text
 * @param {string} monologue
 * @param {string} directors_note
 * @returns {string}
 */
export function strip_directors_note_seed(full_text, monologue, directors_note) {
  const source_text = String(full_text || "");
  if (!directors_note) return balance_think_tags(source_text);
  const seed = `<THINK>${directors_note} `;
  const offset = monologue ? monologue.length : 0;
  const region = source_text.slice(offset);
  if (region.startsWith(seed)) {
    return balance_think_tags(`${source_text.slice(0, offset)}<THINK>${region.slice(seed.length).trimStart()}`);
  }
  const close_index = region.search(/<\/THINK>/i);
  if (close_index !== -1 && !/<THINK>/i.test(region.slice(0, close_index))) {
    return balance_think_tags(`${source_text.slice(0, offset)}<THINK>${region}`);
  }
  return balance_think_tags(source_text);
}

// ── 3. Narrative Response Completion ──────────────────────────────────────────

/**
 * Closes out a truncated reply in-character so the narrative never ends mid-sentence.
 * @param {string} text
 * @param {string} character_name
 * @returns {string}
 */
export function force_close_response(text, character_name) {
  const t = String(text || "").trimEnd();
  if (!t) return t;
  return `${t}\n\n${character_name} goes quiet, the moment settling around them like dust.`;
}

// ── 4. Structured JSON Extraction & Repair ───────────────────────────────────

/**
 * Attempts to extract and parse a JSON object or array from raw text, applying
 * an aggressive repair chain for common LLM syntax defects (unescaped quotes, unquoted keys,
 * trailing commas, and numeric unary plus prefixes).
 * @param {string} raw
 * @param {any} [fallback=null]
 * @returns {any}
 */
export function extract_and_repair_json(raw, fallback = null) {
  if (!raw || typeof raw !== "string") return fallback;
  const stripped = strip_cognition_blocks(raw)
    .replace(/```json\n?|```/g, "")
    .trim();

  // Find outermost curly brace or square bracket
  const first_curly = stripped.indexOf("{");
  const last_curly = stripped.lastIndexOf("}");
  const first_square = stripped.indexOf("[");
  const last_square = stripped.lastIndexOf("]");

  let json_string = null;
  if (first_curly !== -1 && last_curly !== -1 && (first_square === -1 || first_curly < first_square)) {
    json_string = stripped.substring(first_curly, last_curly + 1);
  } else if (first_square !== -1 && last_square !== -1) {
    json_string = stripped.substring(first_square, last_square + 1);
  } else if (first_curly !== -1 && last_curly !== -1) {
    json_string = stripped.substring(first_curly, last_curly + 1);
  }

  if (!json_string) return fallback;

  const try_parse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };

  const direct = try_parse(json_string);
  if (direct !== undefined) return direct;

  const repairs = [
    (s) => s.replace(/([{,]\s*)([A-Za-z0-9_$-]+)\s*:/g, '$1"$2":'),
    (s) => escape_unescaped_json_quotes(s),
    (s) => s.replace(/:\s*\+([0-9]+(?:\.[0-9]+)?)/g, ": $1"),
    (s) => s.replace(/([{,]\s*)[^"{}[\],]+?(?="[A-Za-z_][^"]*"\s*:)/g, "$1"),
    (s) => s.replace(/,\s*(?=\s*[}\]])/g, ""),
  ];

  let cumulative = json_string;
  for (const repair of repairs) {
    cumulative = repair(cumulative);
    const parsed = try_parse(cumulative);
    if (parsed !== undefined) return parsed;
  }

  return fallback;
}

/**
 * Parses a raw LLM profile-sorting response into a structured object.
 * Strips cognition blocks and code fences, isolates the outermost JSON object,
 * and returns null on any failure (no braces, malformed JSON).
 * @param {string} raw
 * @returns {Object|null}
 */
export function parse_profile_json(raw) {
  return extract_and_repair_json(raw, null);
}

// ── 5. Sensory & Image Prompt Cleaning ────────────────────────────────────────

/**
 * Removes <image_prompt> tags, <image> tags, and Markdown images from text.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function clean_image_prompts(text) {
  if (!text) return "";

  // 1. Remove Markdown image syntax ![alt](url)
  let result = text.replace(/!\[.*?\]\(.*?\)/g, "");

  // Shared attribute-matching regex string to prevent ReDoS
  const attr_regex = "(?:\\s+[^\"'>\\s]+(?:\\s*=\\s*(?:\"[^\"]*\"|'[^']*'|[^\"'>\\s]+))?)*";

  // 2. Remove self-closing tags
  result = result.replace(new RegExp(`<image_prompt${attr_regex}\\s*\\/>`, "gi"), "");

  // 3. Iteratively remove innermost <image_prompt>...</image_prompt> and <image>...</image> pairs
  let previous = "";
  while (previous !== result) {
    previous = result;
    result = result.replace(new RegExp(`<image_prompt${attr_regex}\\s*>(?:(?!<image_prompt)[\\s\\S])*?<\\/image_prompt\\s*>`, "gi"), "");
    result = result.replace(new RegExp(`<image${attr_regex}\\s*>(?:(?!<image)[\\s\\S])*?<\\/image\\s*>`, "gi"), "");
  }

  return result;
}

/**
 * Extracts structured `{ prompt, negative_prompt }` payload from an LLM response stream.
 * @param {string | null | undefined} raw
 * @returns {{ prompt: string, negative_prompt: string } | null}
 */
export function parse_llm_image_prompt_response(raw) {
  if (!raw || typeof raw !== "string") return null;

  const parsed = safe_parse_json(raw);
  if (parsed && typeof parsed.prompt === "string") {
    return {
      prompt: parsed.prompt.trim(),
      negative_prompt: typeof parsed.negative_prompt === "string" ? parsed.negative_prompt.trim() : "",
      caption: typeof parsed.caption === "string" && parsed.caption.trim() ? parsed.caption.trim() : extract_image_caption(raw),
    };
  }

  const image_prompt_match = raw.match(/<image_prompt[^>]*>([\s\S]*?)<\/image_prompt>/i);
  if (image_prompt_match) {
    return {
      prompt: image_prompt_match[1].trim(),
      negative_prompt: "",
      caption: extract_image_caption(raw),
    };
  }

  return null;
}

/**
 * Extracts an optional `<caption>` value from raw optics output (attribute or element form).
 * @param {string} raw
 * @returns {string|null}
 */
function extract_image_caption(raw) {
  const caption_match = raw.match(/<caption\s+text="([^"]+)"/i) || raw.match(/<caption>([\s\S]*?)<\/caption>/i);
  return caption_match?.[1]?.trim() || null;
}

const NAME_TOKEN_STOPWORDS = new Set([
  "lord",
  "lady",
  "king",
  "queen",
  "prince",
  "princess",
  "sir",
  "dame",
  "dr",
  "doctor",
  "mr",
  "mrs",
  "ms",
  "miss",
  "the",
  "of",
  "and",
  "from",
  "with",
  "von",
  "van",
  "de",
  "la",
  "project",
]);

/**
 * Strips entity proper names from a synthesized diffusion prompt — whole-word,
 * case-insensitive, with possessive handling. Each full name plus its
 * significant capitalized tokens (so a surname like "Silvers" is caught even
 * when the model drops the title), so character names never leak into the
 * image prompt. Only physical descriptions should survive.
 * @param {string} text
 * @param {string[]} [names]
 * @returns {string}
 */
export function strip_proper_names(text, names = []) {
  const set = new Set();
  for (const raw of Array.isArray(names) ? names : []) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const full = raw.trim();
    set.add(full);
    for (const token of full.split(/[^\p{L}\p{N}'\u2019-]+/u)) {
      const t = token.replace(/^['\u2019-]+|['\u2019-]+$/g, "");
      if (t.length < 4 || !/^\p{Lu}/u.test(t) || NAME_TOKEN_STOPWORDS.has(t.toLowerCase())) continue;
      set.add(t);
    }
  }
  const list = [...set].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!list.length) return text;
  const escaped = list.map((n) => n.replace(/[.*+?^$()|[\]\\]/g, "\\$&"));
  const re = new RegExp("\\b(?:" + escaped.join("|") + ")(?:['\u2019]s|['\u2019])?\\b", "gi");
  return text
    .replace(re, "")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/,\s*([,.;])/g, "$1")
    .replace(/^[\s,;]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Sanitizes a raw LLM image prompt: strips cognition blocks, unwraps JSON structures,
 * detoxes prose, and removes entity proper names (whole-word, possessive-aware).
 * @param {string} raw
 * @param {{ names?: string[] }} [options]
 * @returns {string}
 */
/**
 * Flattens leaked XML/HTML markup and Markdown emphasis into plain comma-delimited prose.
 * Safety net for optics responses that arrive as `<SCENE_DATA>…</SCENE_DATA>` or
 * `**MEDIUM:**` blocks instead of the contracted JSON — the image model must receive prose,
 * never container or structural markup.
 * @param {string} text
 * @returns {string}
 */
export function flatten_markup_to_prose(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, ", ")
    .replace(/\*\*|__/g, "")
    .replace(/(^|\n)\s*#{1,6}\s*/g, "$1")
    .replace(/(^|\n)\s*[-*]\s+/g, "$1")
    .replace(/[ \t]*,[ \t]*(?:,[ \t]*)+/g, ", ")
    .replace(/,\s*([.;,])/g, "$1")
    .replace(/[,;]\s*$/, "")
    .replace(/^[\s,;]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Sanitizes a raw LLM image prompt: strips cognition blocks, unwraps JSON structures,
 * flattens leaked markup, detoxes prose, and removes entity proper names (whole-word, possessive-aware).
 * @param {string} raw
 * @param {{ names?: string[] }} [options]
 * @returns {string}
 */
export function clean_image_prompt(raw, options = {}) {
  if (typeof raw !== "string") return raw;
  let cleaned = sanitize_llm(strip_cognition_blocks(raw));

  if (cleaned.includes("{")) {
    const prompt_match = cleaned.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    if (prompt_match && prompt_match[1]) {
      cleaned = prompt_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    } else {
      cleaned = cleaned.replace(/[{}]/g, "");
    }
  }
  return strip_proper_names(detox_prose(flatten_markup_to_prose(cleaned)), options?.names);
}

/**
 * CHANGELOG
 * - 2026-09-24: Optics JSON caption — `parse_llm_image_prompt_response` now surfaces the `caption` field from the contracted optics JSON (selfie variant), falling back to `<caption>` markup extraction only when the field is absent.
 * - 2026-09-24: Optics response parsing consolidation — `parse_llm_image_prompt_response` now also extracts the `<image_prompt>` element and `<caption>` (returning `{ prompt, negative_prompt, caption }`), and `clean_image_prompt` routes through the new `flatten_markup_to_prose`, so leaked XML/HTML containers and Markdown emphasis are flattened to prose instead of being forwarded to the image model.
 * - 2026-09-18: Absorbed image prompt response parsing & cleaning from image-prompts.js: (1) `parse_llm_image_prompt_response`, (2) `strip_proper_names`, (3) `clean_image_prompt`.
 * - 2026-09-15: Exported THINK_OPEN_TAG constant in Section 2, decoupling domain execution engines from literal prompt markup strings.
 * - 2026-09-14: Enhanced refusal triggers ("can't/cannot continue this conversation") and added regex neutralization for artificial meta-closures (*[END RP]*, *fade to black*, *credits roll*) and unsolicited OOC mothering ("have you eaten/slept lately?").
 * - 2026-09-13: Centralized cognition tag surgery: absorbed balance_think_tags and strip_directors_note_seed from story.js into Section 2.
 * - 2026-08-28: Ground-up deconstruct & refactor: structured into 5 pure domain sections, verified streaming think tag parsing, JSDoc coverage, and purged backwards-compatible re-exports.
 */
