import { mount, unmount } from "svelte";
import Typewriter from "./Typewriter.svelte";

/**
 * @file typewriter.svelte.js
 * 📝 COGNITIVE TEXT STREAMER ACTION
 * Interfaces element nodes with our consolidated Typewriter engine.
 */

/**
 * Svelte Action: Safely types out sanitized HTML character-by-character.
 * Preserves all HTML tags intact and only truncates text nodes reactively.
 *
 * @param {HTMLElement} node - The element anchor mapping the text insertion phase.
 * @param {string | null | undefined} initialHtml
 */
export function typewriter(node, initialHtml = "") {
  // We use Svelte's mount API to instanciate the renderer inside the node
  // The state proxy passes the active chunk down recursively
  const props = $state({ targetHtml: initialHtml || "" });

  const component = mount(Typewriter, {
    target: node,
    props: props,
  });

  return {
    /**
     * Reactively streams updated text blocks down into the token buffer loop.
     */
    update: function (/** @type {string | null | undefined} */ new_content) {
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
