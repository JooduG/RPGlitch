import { sanitizeToFragment } from "@platform/security.js";
/**
 * Svelte Action: Safely injects sanitized HTML into a node.
 * @param {HTMLElement} node
 * @param {string | null | undefined} content
 */
export function safe_html(node, content) {
  /** @param {string | null | undefined} new_content */
  const update_content = (new_content) => {
    node.textContent = "";
    node.appendChild(sanitizeToFragment(new_content ?? ""));
  };
  update_content(content);
  return {
    update: update_content,
  };
}
