/**
 * @file auto-resize.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 * Optimized to prevent layout thrashing by batching DOM reads and writes.
 */

import { resolve_px } from "@utils";

/**
 * Auto-resizes an element based on its content
 * @param {HTMLElement} node
 * @param {Object} options
 * @returns {Object} Action return object
 */
export function auto_resize(node, options = {}) {
  /**
   * @type {number}
   */
  let frame;
  let last_width = 0;
  let last_scroll_height = 0;

  const update = () => {
    if (frame) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      // 0. Load tokens dynamically (Red Thread)
      const buffer = resolve_px("--spacing-pixel", 2, node);

      // Skip if no change in content or width
      if (node.clientWidth === last_width && node.scrollHeight === last_scroll_height) {
        return;
      }

      const sync_id = /** @type {any} */ (options).sync_id;
      const scope = sync_id ? node.closest(".storymode-grid, .modal-content, body") || document.body : null;
      // @ts-ignore
      const siblings = sync_id ? scope.querySelectorAll(`[data-sync-id="${sync_id}"]`) : [node];

      // 1. PHASE: BATCH WRITE (Reset)
      siblings.forEach((s) => {
        if (s instanceof HTMLElement) s.style.height = "auto";
      });

      // 2. PHASE: BATCH READ (Measure)
      let max_scroll_height = 0;
      /** @type {any[]} */
      const metrics = [];

      siblings.forEach((s) => {
        if (s instanceof HTMLElement) {
          const s_style = getComputedStyle(s);
          const s_is_border_box = s_style.boxSizing === "border-box";
          const s_border_offset = s_is_border_box ? parseFloat(s_style.borderTopWidth) + parseFloat(s_style.borderBottomWidth) : 0;

          const s_scroll_height = s.scrollHeight;
          max_scroll_height = Math.max(max_scroll_height, s_scroll_height);

          metrics.push({ el: s, borderOffset: s_border_offset });
        }
      });

      // 3. PHASE: BATCH WRITE (Apply)
      metrics.forEach((m) => {
        m.el.style.height = max_scroll_height + m.borderOffset + buffer + "px";
      });

      last_width = node.clientWidth;
      last_scroll_height = node.scrollHeight;
    });
  };

  node.addEventListener("input", update);
  const observer = new ResizeObserver(update);
  observer.observe(node);

  const mutation_observer = new MutationObserver(update);
  if (!(node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement)) {
    mutation_observer.observe(node, { childList: true, characterData: true, subtree: true });
  }

  update();

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("input", update);
      observer.disconnect();
      mutation_observer.disconnect();
    },
  };
}
