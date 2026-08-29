/**
 * src/utils/markdown.js
 * 📝 LIGHTWEIGHT SAFE MARKDOWN AST PARSER
 *
 * Core Responsibilities:
 * - Safely tokenizes lightweight markdown prose into an AST format without evaluating HTML or using innerHTML.
 * - Parses paragraph blocks separated by double-newlines.
 * - Extracts inline tokens:
 *   - `***bold-italic***` -> `strong-em`
 *   - `**bold**` -> `strong`
 *   - `*italic*` -> `em`
 *   - `"quoted text"` -> `quote`
 *   - Raw interstitial text -> `text`
 * - Guarantees 100% XSS safety by emitting structured token objects for direct Svelte template binding.
 *
 * Consumed by:
 * - `src/ui/primitives/TextField.svelte` for rich reactive text display in read-only and expanded views.
 */

// ============================================================================
// [SECTION 1: CONSTANTS & TOKEN PATTERNS]
// ============================================================================

/**
 * Regex for matching inline markdown markers and dialogue quotes in order of precedence:
 * 1. `***strong-em***`
 * 2. `**strong**`
 * 3. `*em*`
 * 4. `"quote"`
 */
const INLINE_TOKEN_REGEX = /\*\*\*([\s\S]+?)\*\*\*|\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|"([^"]+)"/g;

/**
 * @typedef {"text" | "strong" | "em" | "strong-em" | "quote"} MarkdownTokenType
 */

/**
 * @typedef {Object} MarkdownToken
 * @property {MarkdownTokenType} type - Semantic token type for template rendering.
 * @property {string} content - Inner string content of the token.
 */

/**
 * @typedef {MarkdownToken[]} MarkdownParagraph
 */

// ============================================================================
// [SECTION 2: MARKDOWN AST PARSER ENGINE]
// ============================================================================

/**
 * Safely parses markdown prose into structured paragraph token arrays.
 * @param {string | unknown} text - Raw input markdown string.
 * @returns {MarkdownParagraph[]} Array of paragraphs, each containing an array of inline tokens.
 */
export function parse_markdown(text) {
  if (text === null || text === undefined || text === "") {
    return [];
  }

  const raw_str = typeof text !== "string" ? String(text) : text;
  if (!raw_str.trim()) {
    return [];
  }

  const paragraphs = raw_str.split(/\n\s*\n/);

  return paragraphs.map((paragraph) => {
    const normalized = paragraph.replace(/\n/g, " ");
    /** @type {MarkdownToken[]} */
    const tokens = [];

    let last_index = 0;
    let match;

    // Reset global regex cursor
    INLINE_TOKEN_REGEX.lastIndex = 0;

    while ((match = INLINE_TOKEN_REGEX.exec(normalized)) !== null) {
      // Push any interstitial text before the match
      if (match.index > last_index) {
        tokens.push({
          type: "text",
          content: normalized.substring(last_index, match.index),
        });
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

    // Push any trailing text after the last match
    if (last_index < normalized.length) {
      tokens.push({
        type: "text",
        content: normalized.substring(last_index),
      });
    }

    return tokens;
  });
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined MarkdownToken/Paragraph JSDoc schemas, ensured regex cursor
 *   resetting across calls, added whitespace-only string early exit, and added unit test suite.
 * - 2026-06-15: Initial lightweight AST parser implementation for TextField.svelte.
 */
