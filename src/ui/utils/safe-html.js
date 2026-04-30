import { sanitizeToFragment } from "@core/security.js";
/**
 * Svelte Action: Safely injects sanitized HTML into a node.
 */
export function safe_html(node, content) {
  const update_content = (new_content) => {
    node.textContent = "";
    node.appendChild(sanitizeToFragment(new_content ?? ""));
  };
  update_content(content);
  return {
    update: update_content,
  };
}
