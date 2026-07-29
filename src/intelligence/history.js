/**
 * src/ui/utils/history.js
 * 📜 HISTORY COLLAPSE UTILITY
 * Pure, stateless message history processing.
 * ZERO dependencies on any architectural layer.
 */

/**
 * Strips cognition blocks (<think>...</think>) from text.
 * Inlined to avoid cross-layer import from @intelligence.
 * @param {string|null|undefined} text
 * @returns {string}
 */
function _strip_cognition_blocks(text) {
  if (!text) return "";
  return text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "").trim();
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
    const lowerRole = (m.role || "").toLowerCase();
    const role = lowerRole === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lowerRole) ? "FRACTAL" : "AI_CHARACTER";
    const name = m.character_name || "";
    let content = _strip_cognition_blocks(m.content || m.text || "");
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
