/**
 * @file src/intelligence/parser.js
 * 📋 PARSER & TEXT UTILITIES — Parsing raw LLM output into structured UI data.
 * Handles: Think blocks, Image prompts, Pseudo-JSON, XML sanitization, and Markdown rendering.
 */

import { detox_prose, NARRATIVE_STYLES } from "@data";
import { sanitize } from "@platform";
import { escape_xml, safe_parse_pseudo_json } from "@utils";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
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
 * Strips all <think> blocks and optional trailing newlines.
 * @param {string|null|undefined} text
 * @returns {string}
 */
const MODEL_ARTIFACT_PATTERNS = [
  // Certain model variants prepend an authorial tag like "Mattis. Archetypes: ..."
  // or "Mattis:" before actual content; strip the entire leading artifact.
  /^Mattis\b(?:\.\s*Archetypes:[^\n]*\n*|\.|:|\s)*/i,
];

export function strip_cognition_blocks(text) {
  if (!text) return "";
  let clean = text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
  for (const pattern of MODEL_ARTIFACT_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
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
 * @param {string|object|null} [narrativeStyle] - Active narrative style ID or style object
 * @returns {"plain"|"ornate"}
 */
export function resolve_voice_register(entity = null, narrativeStyle = null) {
  if (entity?.voice_register === "ornate" || entity?.voice_register === "plain") {
    return entity.voice_register;
  }
  const styleObj = typeof narrativeStyle === "string" ? NARRATIVE_STYLES[narrativeStyle] : narrativeStyle;
  if (styleObj?.voice_register === "ornate" || styleObj?.voice_register === "plain") {
    return styleObj.voice_register;
  }
  return "plain";
}

/**
 * Master parser that runs all passes.
 * @param {string|null|undefined} rawText
 * @param {"plain"|"ornate"} [register="plain"]
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
  const detoxed_text = text;

  // 4. Render Markdown
  let rendered = sanitize(md.render(text).trim());
  rendered = rendered.replace(/&quot;/g, '"').replace(/&apos;/g, "'");

  // 5. Wrap Dialogue Quotes
  rendered = wrap_dialogue(rendered);

  const rendered_think = think_result.think ? sanitize(md.render(think_result.think).trim()) : null;

  return {
    displayText: rendered,
    think: rendered_think,
    detoxedText: detoxed_text,
  };
}

/**
 * Escapes characters for safe use in XML.
 * Re-exported from @utils for backward compatibility.
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
 * Re-exported from @utils for backward compatibility.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export { safe_parse_pseudo_json };

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

  // Plain prose field
  if (!parsed || Object.keys(parsed).length === 0) {
    const existing = (current_field_value || "").trim();
    let result = !existing ? clean_new_prose : `${existing}\n${clean_new_prose}`;
    if (result.length > MAX_FIELD_CHARS) {
      result = result.substring(result.length - MAX_FIELD_CHARS);
    }
    return result;
  }

  // Pseudo-JSON parameter field
  if (parsed.CONDITION || parsed.condition) {
    const key = parsed.CONDITION ? "CONDITION" : "condition";
    parsed[key] = `${parsed[key]}, ${clean_new_prose}`;
  } else {
    parsed.CONDITION = clean_new_prose;
  }

  let lines = Object.entries(parsed)
    .map(([k, v]) => `[${k}: ${String(v).replace(/[[\]]/g, "")}]`)
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
 * Collapses conversation history into role-grouped entries.
 * Consecutive messages from the same character are merged into a single entry.
 * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
 * @param {{separator?: string, stripBoldQuotes?: boolean}} [options]
 * @returns {Array<{role: string, name: string, content: string}>}
 */
export function collapse_history(messages, options = {}) {
  const { separator = "\n", stripBoldQuotes = false } = options;
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const collapsed = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const lower_role = (m.role || "").toLowerCase();
    const role = lower_role === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lower_role) ? "FRACTAL" : "AI_CHARACTER";
    const name = m.character_name || "";
    let content = strip_cognition_blocks(m.content || m.text || "");
    if (stripBoldQuotes) {
      content = content.replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');
    }
    if (!content) continue;

    const last = collapsed[collapsed.length - 1];
    if (last && last.role === role && last.name === name) {
      last.content += `${separator}${content}`;
    } else {
      collapsed.push({ role, name, content });
    }
  }
  return collapsed;
}
