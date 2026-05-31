import { mount, unmount } from "svelte";
import TypewriterRenderer from "./TypewriterRenderer.svelte";

/**
 * @file typewriter.svelte.js
 * 📝 COGNITIVE TEXT STREAMER ACTION
 * Safely types out sanitized HTML character-by-character.
 * Preserves structural markup layout frames while reactively processing text token buffers.
 */

/**
 * Svelte Action: Safely types out sanitized HTML character-by-character.
 * Preserves all HTML tags intact and only truncates text nodes reactively.
 *
 * @param {HTMLElement} node - The element anchor mapping the text insertion phase.
 * @param {string | null | undefined} content - The prospective raw HTML source input.
 * @returns {import('svelte/action').ActionReturn<string | null | undefined>}
 */
export function typewriter(node, content) {
  // Create state proxy wrapper to pass safely into the mounted compiler architecture
  const props = $state({ targetHtml: content ?? "" });

  // Mount the renderer component directly into the localized action shadow layer
  const component = mount(TypewriterRenderer, {
    target: node,
    props: props,
  });

  return {
    /**
     * Reactively streams updated text blocks down into the token buffer loop.
     * @param {string | null | undefined} new_content
     */
    update(new_content) {
      props.targetHtml = new_content ?? "";
    },

    /**
     * Unmounts rendering nodes and evicts tracking scopes to avoid memory leaks.
     */
    destroy() {
      unmount(component);
    },
  };
}
