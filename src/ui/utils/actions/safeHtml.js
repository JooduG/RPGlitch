import { sanitize } from "@core/security.js"

/**
 * Svelte Action: Safely injects sanitized HTML into a node.
 */
export function safe_html(node, content) {
    node.innerHTML = sanitize(content ?? "")
    return {
        update(new_content) {
            node.innerHTML = sanitize(new_content ?? "")
        },
    }
}
