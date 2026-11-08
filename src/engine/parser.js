/**
 * src/engine/parser.js
 * ============================================================================
 * 📜 PURE STREAMING COGNITION PARSER
 * ============================================================================
 *
 * Handles LLM stream cognition extraction (<think>...</think> blocks).
 * All entity bracket tokenization and Epistemic Wall filtering live in `@storage/parser.js`.
 * ============================================================================
 */

/**
 * Extracts and strips <think>...</think> cognition blocks from streamed prose.
 *
 * @param {string} text
 * @returns {{ think: string, prose: string }}
 */
export function extract_think_block(text) {
  if (!text || typeof text !== "string") {
    return { think: "", prose: "" };
  }

  // Match closed <think>...</think> or unclosed <think>... at start/middle
  const think_match = /<think>([\s\S]*?)(?:<\/think>|$)/i.exec(text);

  if (!think_match) {
    return { think: "", prose: text.trim() };
  }

  const think = think_match[1].trim();
  const prose = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/i, "").trim();

  return { think, prose };
}
