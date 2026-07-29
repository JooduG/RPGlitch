/**
 * Safely parses basic markdown into an AST format for rendering without eval/innerHTML.
 * Currently supports strong (**) and emphasis (*).
 *
 * @param {string} text - The raw markdown text
 * @returns {any[][]} An array of paragraph blocks, each containing an array of inline tokens
 */
export function parse_markdown(text) {
  if (text === null || text === undefined || text === "") return [];
  const text_str = typeof text !== "string" ? String(text) : text;
  let paragraphs = text_str.split(/\n\s*\n/);
  return paragraphs.map((p) => {
    let normalized = p.replace(/\n/g, " ");
    /** @type {any[]} */
    let tokens = [];
    const regex = /\*\*\*([\s\S]+?)\*\*\*|\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|"([^"]+)"/g;
    let last_index = 0;
    let match;
    while ((match = regex.exec(normalized)) !== null) {
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
    if (last_index < normalized.length) {
      tokens.push({ type: "text", content: normalized.substring(last_index) });
    }
    return tokens;
  });
}
