import { mount, unmount } from "svelte";
import TypewriterRenderer from "./TypewriterRenderer.svelte";

/**
 * Svelte Action: Safely types out sanitized HTML character-by-character.
 * Preserves all HTML tags intact and only truncates text nodes reactively.
 *
 * @param {HTMLElement} node
 * @param {string | null | undefined} content
 * @returns {import('svelte/action').ActionReturn}
 */
export function typewriter(node, content) {
  // Create reactive state that will be passed as props
  const props = $state({ targetHtml: content ?? "" });

  const component = mount(TypewriterRenderer, {
    target: node,
    props: props,
  });

  return {
    update(new_content) {
      props.targetHtml = new_content ?? "";
    },
    destroy() {
      unmount(component);
    },
  };
}
