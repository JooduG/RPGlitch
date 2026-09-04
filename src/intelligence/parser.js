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

import { escape_unescaped_json_quotes, strip_cognition_blocks } from "@utils";

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
 * Automatically closes truncated `<think>` blocks or strips stray re-closures.
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
 * CHANGELOG
 * - 2026-08-28: Ground-up deconstruct & refactor: structured into 5 pure domain sections, verified streaming think tag parsing, JSDoc coverage, and purged backwards-compatible re-exports.
 */
