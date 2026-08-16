/**
 * @file src/intelligence/parser.js
 * 📋 PARSER & TEXT UTILITIES — Parsing raw LLM output into structured UI data.
 * Handles: Think blocks, Image prompts, Pseudo-JSON, XML sanitization, and Markdown rendering.
 */

import { detox_prose, NARRATIVE_STYLES } from "@data";
import { sanitize } from "@platform";
import { AGGREGATE_KEYS, CLEAR_TOKENS, CLOTHING_KEYS, collapse_history, escape_xml, safe_parse_pseudo_json, strip_cognition_blocks } from "@utils";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

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
 * Stateful parser to wrap text inside double quotes with a `<span class="dialogue">` tag.
 * Preserves inner HTML tags (like `<em>`) by splitting the HTML and running quote replacement on text nodes.
 * @param {string} html
 * @returns {string}
 */
export function wrap_dialogue(html) {
  if (!html) return "";
  const parts = html.split(/(<[^>]+>)/);
  let in_quote = false;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("<")) {
      continue;
    }

    const text = parts[i].replace(/&quot;/g, '"');
    let new_text = "";
    let last_index = 0;

    for (let j = 0; j < text.length; j++) {
      if (text[j] === '"') {
        new_text += text.substring(last_index, j);
        if (!in_quote) {
          new_text += '<span class="dialogue">&ldquo;';
          in_quote = true;
        } else {
          new_text += "&rdquo;</span>";
          in_quote = false;
        }
        last_index = j + 1;
      }
    }
    new_text += text.substring(last_index);
    parts[i] = new_text;
  }

  let result = parts.join("");
  if (in_quote) {
    result += "</span>";
  }
  return result;
}

/**
 * Resolves the prose detox register based on entity and narrative style hierarchy.
 * Priority: Entity Voice Register > Narrative Style Voice Register > "plain" (default)
 * @param {object|null} [entity] - Active character/user entity
 * @param {string|object|null} [narrative_style] - Active narrative style ID or style object
 * @returns {"plain"|"ornate"|"raw"|"clinical"}
 */
export function resolve_voice_register(entity = null, narrative_style = null) {
  const valid_registers = ["plain", "ornate", "raw", "clinical"];

  if (entity?.voice_register && valid_registers.includes(entity.voice_register)) {
    return entity.voice_register;
  }

  const styleObj = typeof narrative_style === "string" ? NARRATIVE_STYLES[narrative_style] : narrative_style;

  if (styleObj?.voice_register && valid_registers.includes(styleObj.voice_register)) {
    return styleObj.voice_register;
  }

  return "plain";
}

/**
 * Master parser that runs all passes.
 * @param {string|null|undefined} rawText
 * @param {"plain"|"ornate"|"raw"|"clinical"} [register="plain"]
 * @returns {{ displayText: string, think: string|null }}
 */
export function parse_message(rawText, register = "plain") {
  // 1. Remove Image Prompts (Artifacts)
  let text = clean_image_prompts(rawText || "");

  // 2. Extract Think Block
  const think_result = parse_think_block(text);
  text = think_result.content;

  // 3. Anti-Cliche Layer
  text = detox_prose(text, register);
  const detoxed_think = think_result.think ? detox_prose(think_result.think, register) : null;
  const detoxed_text = text;

  // 4. Render Markdown
  let rendered = sanitize(markdown.render(text).trim());
  rendered = rendered.replace(/&quot;/g, '"').replace(/&apos;/g, "'");

  // 5. Wrap Dialogue Quotes
  rendered = wrap_dialogue(rendered);

  const rendered_think = detoxed_think ? sanitize(markdown.render(detoxed_think).trim()) : null;

  return {
    displayText: rendered,
    think: rendered_think,
    detoxedText: detoxed_text,
  };
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

/**
 * Merges raw prose into an existing field (either pseudo-JSON or plain text)
 * and reserializes it securely without destructive appends.
 * @param {string} current_field_value
 * @param {string} new_prose
 * @returns {string}
 */
export const merge_prose_into_field = (current_field_value, new_prose) => {
  if (!new_prose || !new_prose.trim()) return current_field_value || "";

  const MAX_FIELD_CHARS = 2000;
  const parsed = safe_parse_pseudo_json(current_field_value);
  const clean_new_prose = new_prose.trim();

  // Plain prose field (no structured keys, or raw-prose sentinel from safe_parse_pseudo_json)
  if (!parsed || parsed.__raw_prose__ || Object.keys(parsed).length === 0) {
    const existing = (current_field_value || "").trim();
    let result = !existing ? clean_new_prose : `${existing}\n${clean_new_prose}`;
    if (result.length > MAX_FIELD_CHARS) {
      result = result.substring(result.length - MAX_FIELD_CHARS);
    }
    return result;
  }

  // 1. Extract bracketed [KEY: Value] directives first
  const bracketed_regex = /\[([A-Z_ ]{3,25}):\s*([\s\S]*?)\]/g;
  let remaining_prose = clean_new_prose;
  let match;
  const key_updates = [];

  while ((match = bracketed_regex.exec(clean_new_prose)) !== null) {
    const full_match = match[0];
    const raw_key = match[1].toUpperCase().replace(/\s+/g, "_");
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
      remaining_prose = remaining_prose.replace(full_match, "").trim();
    }
  }

  // 2. Extract unbracketed KEY: Value segments if any
  const unbracketed_regex = /(?:^|,\s*|\s*)([A-Z_]{3,15}):\s*([^,[\]]+(?:\s+[^,[\]]+)*)/g;
  while ((match = unbracketed_regex.exec(remaining_prose)) !== null) {
    const full_match = match[0];
    const raw_key = match[1].toUpperCase();
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
      remaining_prose = remaining_prose.replace(full_match, "").trim();
    }
  }

  remaining_prose = remaining_prose
    .replace(/^[\s,;[\]]+|[\s,;[\]]+$/g, "")
    .replace(/,\s*,+/g, ",")
    .trim();

  // Apply structured key updates in sequence to respect hierarchy
  for (const { key, val } of key_updates) {
    let target_key = key;
    const is_clear_token = CLEAR_TOKENS.has(val.toLowerCase());

    // Wildcard purge: [CLOTHING: none] strips every clothing key at once.
    if (key === "CLOTHING" && is_clear_token) {
      for (const ck of CLOTHING_KEYS) delete parsed[ck];
      continue;
    }

    if (CLOTHING_KEYS.includes(key) && is_clear_token) {
      delete parsed[key];
      continue;
    }

    // Universal atomic clearing: [KEY: none/bare/naked/off/removed/disrobed/
    // healed/cleared/normal] deletes the key, preventing stale clutter.
    if (is_clear_token) {
      delete parsed[key];
      continue;
    }

    // Multi-item aggregation: repeated INVENTORY/STASH directives merge into a
    // single normalized list instead of clobbering the existing collection.
    if (AGGREGATE_KEYS.has(key)) {
      const incoming = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const existing = parsed[key];
      const list = Array.isArray(existing)
        ? existing
        : existing
          ? String(existing)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      for (const item of incoming) {
        if (item && !list.includes(item)) list.push(item);
      }
      parsed[key] = list;
      continue;
    }

    if (key === "CLOTHING" && parsed.SHIRT) target_key = "SHIRT";
    if (key === "SHIRT" && parsed.CLOTHING) target_key = "CLOTHING";
    parsed[target_key] = val;
  }

  // Append any remaining unstructured prose to CONDITION
  if (remaining_prose) {
    const cond_key = parsed.CONDITION ? "CONDITION" : parsed.condition ? "condition" : "CONDITION";
    if (parsed[cond_key]) {
      const clean_existing = parsed[cond_key].replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,+/g, ", ");
      parsed[cond_key] = `${clean_existing}, ${remaining_prose}`;
    } else {
      parsed[cond_key] = remaining_prose;
    }
  }

  // Clean up double commas inside all values of parsed
  for (const k in parsed) {
    if (typeof parsed[k] === "string") {
      parsed[k] = parsed[k].replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,+/g, ", ");
    }
  }

  let lines = Object.entries(parsed)
    .map(([k, v]) => `[${k}: ${String(Array.isArray(v) ? v.join(", ") : v).replace(/[[\]]/g, "")}]`)
    .join(" ");

  if (lines.length > MAX_FIELD_CHARS) {
    lines = lines.substring(lines.length - MAX_FIELD_CHARS);
  }

  return lines;
};

/**
 * Replaces unescaped interior double-quotes with backslashed equivalents (\")
 * inside JSON string values.
 * @param {string} json_string
 * @returns {string}
 */
export function escape_unescaped_json_quotes(json_string) {
  if (typeof json_string !== "string") return json_string;
  return json_string.replace(/:\s*"([\s\S]*?)"(?=,\s*"[^"]+"\s*:|\s*\}|\s*\]|$)/g, (match, value) => {
    const escaped_value = value.replace(/(?<!\\)"/g, '\\"');
    return `: "${escaped_value}"`;
  });
}

/**
 * Normalizes an llm_service raw result (primitive string or String object with
 * `.text`/`.generatedText`/`.stopReason`) into plain text.
 * @param {any} raw
 * @returns {string}
 */
export function raw_to_text(raw) {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    return String(raw.generatedText ?? raw.text ?? "").trim();
  }
  return String(raw ?? "").trim();
}

/**
 * Returns the Director's reason for a truncated/failed output, if the transport
 * surfaced one (server stop reason attached to the raw String object).
 * @param {any} raw
 * @returns {string}
 */
export function raw_stop_reason(raw) {
  if (raw && typeof raw === "object" && !(raw instanceof String)) return "";
  return raw && typeof raw === "object" && raw.stopReason ? String(raw.stopReason) : "";
}
