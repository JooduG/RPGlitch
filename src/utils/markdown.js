/**
 * @file src/utils/markdown.js
 * Pure inline Markdown AST tokenizer without HTML evaluation.
 */

const INLINE_TOKEN_REGEX = /\*\*\*([\s\S]+?)\*\*\*|\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|"([^"]+)"/g;

/**
 * @typedef {"text" | "strong" | "em" | "strong-em" | "quote"} MarkdownTokenType
 */

/**
 * @typedef {Object} MarkdownToken
 * @property {MarkdownTokenType} type
 * @property {string} content
 */

/**
 * @typedef {MarkdownToken[]} MarkdownParagraph
 */

/**
 * Parses lightweight inline markdown prose into structured paragraph token arrays.
 * @param {string | unknown} text
 * @returns {MarkdownParagraph[]}
 */
export function parse_markdown(text) {
  if (text === null || text === undefined || text === "") return [];

  const raw_str = typeof text !== "string" ? String(text) : text;
  if (!raw_str.trim()) return [];

  return raw_str.split(/\n\s*\n/).map((paragraph) => {
    const normalized = paragraph.replace(/\n/g, " ");
    /** @type {MarkdownToken[]} */
    const tokens = [];
    let last_index = 0;
    let match;

    INLINE_TOKEN_REGEX.lastIndex = 0;

    while ((match = INLINE_TOKEN_REGEX.exec(normalized)) !== null) {
      if (match.index > last_index) {
        tokens.push({ type: "text", content: normalized.substring(last_index, match.index) });
      }

      if (match[1] !== undefined) {
        tokens.push({ type: "strong-em", content: match[1] });
      } else if (match[2] !== undefined) {
        tokens.push({ type: "strong", content: match[2] });
      } else if (match[3] !== undefined) {
        tokens.push({ type: "em", content: match[3] });
      } else if (match[4] !== undefined) {
        tokens.push({ type: "quote", content: match[4] });
      }

      last_index = match.index + match[0].length;
    }

    if (last_index < normalized.length) {
      tokens.push({ type: "text", content: normalized.substring(last_index) });
    }

    return tokens;
  });
}
