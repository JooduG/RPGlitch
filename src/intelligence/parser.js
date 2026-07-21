/**
 * @file text_parser.js
 * @description Logic for parsing raw LLM output into structured UI data.
 * Handles: Think blocks, Image prompts, and Markdown.
 */
import MarkdownIt from "markdown-it";
import { sanitize } from "@platform";
import { detox_prose } from "@data";

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});
/**
 * Extracts <think> blocks from text.
 * Handles partial tags during streaming and merges multiple blocks.
 * @param {string|null|undefined} text
 * @returns {{ content: string, think: string|null }}
 */
export function parse_think_block(text) {
  if (!text) return { content: "", think: null };

  // 1. Match all closed blocks
  const matches = [...text.matchAll(/<think>([\s\S]*?)<\/think>/gi)];
  let closedThink = matches
    .map((m) => m[1].trim())
    .filter(Boolean)
    .join("\n\n");
  let content = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. Check for an unclosed partial block (streaming)
  // If there is a <think> tag that has not been closed, it will be the last one
  const lowerText = text.toLowerCase();
  const lastThinkIndex = lowerText.lastIndexOf("<think>");
  if (lastThinkIndex !== -1) {
    const postThink = text.substring(lastThinkIndex + 7);
    if (!postThink.toLowerCase().includes("</think>")) {
      // It's unclosed. The preceding text might have closed think blocks.
      const streamingThink = postThink.trim();
      const finalThink = [closedThink, streamingThink].filter(Boolean).join("\n\n");

      // Clean content by removing everything from the unclosed <think> onwards
      const precedingText = text.substring(0, lastThinkIndex);
      content = precedingText.replace(/<think>[\s\S]*?<\/think>/gi, "");

      return { content, think: finalThink || null };
    }
  }

  return { content, think: closedThink || null };
}
/**
 * Strips all <think> blocks and optional trailing newlines.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_cognition_blocks(text) {
  if (!text) return "";
  return text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
}
/**
 * Extracts the outermost JSON object from a raw LLM response.
 * Strips markdown code fences and isolates the substring between
 * the first "{" and last "}".
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
 * Removes <image_prompt> tags from text.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function clean_image_prompts(text) {
  if (!text) return "";

  // 1. Remove Markdown image syntax ![alt](url)
  let result = text.replace(/!\[.*?\]\(.*?\)/g, "");

  // Shared attribute-matching regex string to prevent ReDoS (linear scanning)
  const attrRegex = "(?:\\s+[^\"'>\\s]+(?:\\s*=\\s*(?:\"[^\"]*\"|'[^']*'|[^\"'>\\s]+))?)*";

  // 2. Remove self-closing tags with potential quoted '>' in attributes
  // Matches <tag ... /> where attributes can have quoted strings
  // We handle image_prompt specifically to avoid over-matching other tags
  // Note: Standard JS regex doesn't support atomic groups (++) or possessive quantifiers (*+) in all environments
  result = result.replace(new RegExp(`<image_prompt${attrRegex}\\s*\\/>`, "gi"), "");

  // 3. Iteratively remove the innermost <image_prompt>...</image_prompt> and <image>...</image> pairs
  let previous = "";
  while (previous !== result) {
    previous = result;
    // Handle <image_prompt>...</image_prompt>
    result = result.replace(new RegExp(`<image_prompt${attrRegex}\\s*>(?:(?!<image_prompt)[\\s\\S])*?<\\/image_prompt\\s*>`, "gi"), "");
    // Handle <image>...</image>
    result = result.replace(new RegExp(`<image${attrRegex}\\s*>(?:(?!<image)[\\s\\S])*?<\\/image\\s*>`, "gi"), "");
  }

  return result;
}
/**
 * Stateful parser to wrap text inside double quotes with a `<span class="dialogue">` tag.
 * Preserves inner HTML tags (like `<em>`) by splitting the HTML and only running quote
 * replacement on text nodes. Converts straight quotes to curly smart quotes.
 * @param {string} html
 * @returns {string}
 */
export function wrap_dialogue(html) {
  if (!html) return "";
  const parts = html.split(/(<[^>]+>)/);
  let inQuote = false;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("<")) {
      continue;
    }

    // Normalize escaped double quotes inside text nodes
    const text = parts[i].replace(/&quot;/g, '"');
    let newText = "";
    let lastIndex = 0;

    for (let j = 0; j < text.length; j++) {
      if (text[j] === '"') {
        newText += text.substring(lastIndex, j);
        if (!inQuote) {
          newText += '<span class="dialogue">&ldquo;';
          inQuote = true;
        } else {
          newText += "&rdquo;</span>";
          inQuote = false;
        }
        lastIndex = j + 1;
      }
    }
    newText += text.substring(lastIndex);
    parts[i] = newText;
  }

  let result = parts.join("");
  if (inQuote) {
    result += "</span>";
  }
  return result;
}

/**
 * Master parser that runs all passes.
 * @param {string|null|undefined} rawText
 * @returns {{ displayText: string, think: string|null, sceneData: object|null }}
 */
export function parse_message(rawText) {
  // 1. Remove Image Prompts (Artifacts)
  let text = clean_image_prompts(rawText || "");

  // 2. Extract Think Block
  const thinkResult = parse_think_block(text);
  text = thinkResult.content;

  // 🧪 ANTI-CLICHÉ LAYER: Intercept and clean text right here to keep thoughts pure
  text = detox_prose(text);

  // 3. Render Markdown
  let rendered = sanitize(md.render(text).trim());

  // Dedicated sanitization pass to strip out leaking historical XML formatting tokens
  rendered = rendered.replace(/&quot;/g, '"').replace(/&apos;/g, "'");

  // 4. Wrap Dialogue Quotes
  rendered = wrap_dialogue(rendered);

  let rendered_think = thinkResult.think ? sanitize(md.render(thinkResult.think).trim()) : null;

  return {
    displayText: rendered,
    think: rendered_think,
  };
}

/**
 * Escapes characters for safe use in XML.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function escapeXml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;") // Optional: hardening against internal tagging
    .replace(/\]/g, "&#93;");
}

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
 * High-fidelity parser that safely extracts configurations from fields.
 * Gracefully processes rigid JSON, loose unquoted key-value configurations,
 * and automatically falls back to raw text blocks if no clear parameters are detected.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export const safeParsePseudoJson = (raw) => {
  if (!raw) return {};
  const cleanRaw = strip_cognition_blocks(raw).trim();
  if (!cleanRaw) return {};

  // Tier 1: Try parsing standard JSON or braced setups
  try {
    let standardFormat = cleanRaw;
    if (!standardFormat.startsWith("{") && standardFormat.includes(":")) {
      standardFormat = `{ ${standardFormat.replace(/,\s*$/, "")} }`;
    }
    if (standardFormat.startsWith("{")) {
      const parsed = JSON.parse(standardFormat);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (_e) {
    /* Structure is unbraced or fractured */
  }

  // Tier 2: Process line-by-line configuration if colons exist
  if (cleanRaw.includes(":")) {
    const extracted = {};
    const lines = cleanRaw.split(/[\n,]+/);
    const propertyRegex = /"([^"]+)"\s*:\s*"([^"]*)"/;
    const looseRegex = /([^:]+)\s*:\s*([^,]+)/;

    lines.forEach((line) => {
      let match = line.match(propertyRegex);
      if (match && match[1]) {
        extracted[match[1]] = match[2].trim();
      } else {
        match = line.match(looseRegex);
        if (match && match[1]) {
          const k = match[1].replace(/["']/g, "").trim();
          const v = match[2].replace(/["']/g, "").trim();
          if (k && v) extracted[k] = v;
        }
      }
    });
    if (Object.keys(extracted).length > 0) return extracted;
  }

  // Tier 3: Complete Fallback — Field holds raw text prose description sentence!
  return { __raw_prose__: cleanRaw };
};

/**
 * Merges raw prose into an existing field (either pseudo-JSON or plain text)
 * and reserializes it securely without destructive appends.
 * @param {string} current_field_value - The existing data in the field (e.g. from entity.present.physical)
 * @param {string} new_prose - The new prose or text to merge in
 * @returns {string} - The updated field content serialized
 */
export const merge_prose_into_field = (current_field_value, new_prose) => {
  if (!new_prose || !new_prose.trim()) return current_field_value || "";

  const MAX_FIELD_CHARS = 2000;
  const parsed = safeParsePseudoJson(current_field_value);
  const clean_new_prose = new_prose.trim();

  if (parsed.__raw_prose__) {
    // If it was already just prose, append it cleanly
    const existing = parsed.__raw_prose__.trim();
    let result = !existing ? clean_new_prose : `${existing}\n${clean_new_prose}`;
    if (result.length > MAX_FIELD_CHARS) {
      result = result.substring(result.length - MAX_FIELD_CHARS);
    }
    return result;
  }

  // It's an object / pseudo-JSON. Inject the new prose.
  if (parsed.condition) {
    parsed.condition = `${parsed.condition}, ${clean_new_prose}`;
  } else {
    parsed.condition = clean_new_prose;
  }

  // Reserialize to clean unbracketed format to maintain the pseudo-JSON style
  let lines = Object.entries(parsed)
    .map(([k, v]) => `"${k}": "${String(v).replace(/"/g, '\\"')}"`)
    .join(",\n");

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
    const escapedValue = value.replace(/(?<!\\)"/g, '\\"');
    return `: "${escapedValue}"`;
  });
}
