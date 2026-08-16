/**
 * @file src/intelligence/parser.js
 * 📋 PARSER — Raw LLM output → structured data.
 * Handles: Think blocks, Image prompts, Pseudo-JSON, XML sanitization, and
 * Markdown-free text cleaning.
 *
 * Purity: only pure parsing lives here. Rendering concerns live in
 * @ui/message/render.js (parse_message/wrap_dialogue); Director JSON extraction
 * lives in ./director.js; raw transport unwrapping lives in @platform/transport.js;
 * prose field merging + register resolution live in @utils/text.js and @data.
 */

import { collapse_history, escape_xml, safe_parse_pseudo_json, strip_cognition_blocks } from "@utils";

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
 * Extracts the outermost JSON object from a raw LLM response.
 * Strips markdown code fences and isolates the substring between the first "{" and last "}".
 * @param {string} raw
 * @returns {string|null} The extracted JSON string, or null if no braces found.
 */
export function extract_json_block(raw) {
  if (!raw) return null;
  const stripped = raw.replace(/```json\n?|```/g, "").trim();
  const first_brace = stripped.indexOf("{");
  const last_brace = stripped.lastIndexOf("}");
  if (first_brace === -1 || last_brace === -1) return null;
  return stripped.substring(first_brace, last_brace + 1);
}

/**
 * Parses a raw LLM profile-sorting response into a structured object.
 * Strips cognition blocks and code fences, isolates the outermost JSON object,
 * and returns null on any failure (no braces, malformed JSON).
 * @param {string} raw
 * @returns {Object|null}
 */
export function parse_profile_json(raw) {
  const block = extract_json_block(strip_cognition_blocks(String(raw ?? "")));
  if (!block) return null;
  try {
    return JSON.parse(block);
  } catch (_e) {
    return null;
  }
}

/**
 * Removes <image_prompt> tags and Markdown images from text.
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
 * Escapes characters for safe use in XML.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export { escape_xml };

/**
 * Text sanitization for prompt safety.
 * Removes markdown-like characters and collapses whitespace.
 * @param {string|null|undefined} text
 * @param {number} [limit=500]
 * @returns {string}
 */
export function clean_text(text, limit = 500) {
  if (!text) return "";
  const clean = text
    .replace(/^#{1,6}\s/gm, "")
    .replace(/^[>-]\s/gm, "")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > limit ? clean.substring(0, limit) + "..." : clean;
}

/**
 * Recursively cleans empty XML tags from a string.
 * @param {string} str
 * @returns {string}
 */
export function clean_xml(str) {
  let prev;
  let curr = str;
  do {
    prev = curr;
    curr = curr.replace(/^[ \t]*<([A-Z_]+)(?: [^>]*)?>\s*<\/\1>[ \t]*\n/gm, "");
    curr = curr.replace(/<([A-Z_]+)(?: [^>]*)?>\s*<\/\1>/g, "");
  } while (prev !== curr);
  return curr.replace(/\n{3,}/g, "\n");
}

/**
 * High-fidelity parser that extracts pseudo-JSON configurations.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export { safe_parse_pseudo_json };

/**
 * Cognition-block stripper — canonical implementation lives in @utils/text.js
 * and is re-exported here so @intelligence consumers keep a stable import path.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export { strip_cognition_blocks };

/**
 * Conversation-history collapsing — canonical implementation lives in @utils/text.js
 * and is re-exported here so @intelligence consumers keep a stable import path.
 * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
 * @param {{separator?: string, stripBoldQuotes?: boolean}} [options]
 * @returns {Array<{role: string, name: string, content: string}>}
 */
export { collapse_history };
