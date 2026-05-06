/**
 * Safely parses basic markdown into an AST format for rendering without eval/innerHTML.
 * Currently supports strong (**) and emphasis (*).
 *
 * @param {string} text - The raw markdown text
 * @returns {Array} An array of paragraph blocks, each containing an array of inline tokens
 */
export function parse_markdown(text) {
  if (!text) return [];
  let paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((p) => {
    let normalized = p.replace(/\n/g, " ");
    let tokens = [];
    const regex = /\*\*\*([\s\S]+?)\*\*\*|\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(normalized)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: "text",
          content: normalized.substring(lastIndex, match.index),
        });
      }
      if (match[1] !== undefined) {
        tokens.push({ type: "strong-em", content: match[1] });
      } else if (match[2] !== undefined) {
        tokens.push({ type: "strong", content: match[2] });
      } else if (match[3] !== undefined) {
        tokens.push({ type: "em", content: match[3] });
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < normalized.length) {
      tokens.push({ type: "text", content: normalized.substring(lastIndex) });
    }
    return tokens;
  });
}
