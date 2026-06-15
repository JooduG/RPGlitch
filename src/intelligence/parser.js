/**
 * @file text_parser.js
 * @description Logic for parsing raw LLM output into structured UI data.
 * Handles: Think blocks, Image prompts, and Markdown.
 */
import MarkdownIt from "markdown-it";
import { sanitize } from "@platform";

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});
/**
 * Extracts <think> blocks from text.
 * Handles partial tags during streaming.
 * @param {string|null|undefined} text
 * @returns {{ content: string, think: string|null }}
 */
export function parse_think_block(text) {
  if (!text) return { content: "", think: null };

  // 1. Check for complete block
  const completeMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (completeMatch) {
    const think = completeMatch[1].trim();
    const content = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
    return { content, think };
  }

  // 2. Check for unclosed partial block (streaming)
  const partialMatch = text.match(/<think>([\s\S]*)$/i);
  if (partialMatch) {
    const think = partialMatch[1].trim();
    // During streaming think, there is no displayable content yet
    return { content: "", think };
  }

  return { content: text, think: null };
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

  // 3. Render Markdown
  let rendered = sanitize(md.render(text).trim());

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
