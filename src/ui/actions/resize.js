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
  let last_val = null;

  const update = () => {
    if (frame) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      const current_val = node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement ? node.value : node.textContent;
      const current_width = node.clientWidth;

      // Skip if content value and width haven't changed
      if (current_width === last_width && current_val === last_val) {
        return;
      }

      // 0. Load tokens dynamically (Red Thread)
      const buffer = resolve_px("--spacing-pixel", 2, node);

      const sync_id = /** @type {any} */ (options)?.sync_id;
      const scope = sync_id ? node.closest(".storymode-grid, .modal-content, body") || document.body : null;
      // @ts-ignore
      const siblings = sync_id ? scope.querySelectorAll(`[data-sync-id="${sync_id}"]`) : [node];

      // 1. PHASE: BATCH WRITE (Reset height to auto so scrollHeight reflects true content height)
      siblings.forEach((s) => {
        if (s instanceof HTMLElement) s.style.height = "auto";
      });

      // 2. PHASE: BATCH READ (Measure true content scrollHeight)
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

      // 3. PHASE: BATCH WRITE (Apply calculated height)
      metrics.forEach((m) => {
        m.el.style.height = max_scroll_height + m.borderOffset + buffer + "px";
      });

      last_width = current_width;
      last_val = current_val;
    });
  };

  // Intercept programmatic value assignments (Svelte bind:value)
  let original_value_set;
  if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
    const proto = Object.getPrototypeOf(node);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
      original_value_set = desc.set;
      try {
        Object.defineProperty(node, "value", {
          get() {
            return desc.get ? desc.get.call(this) : node.getAttribute("value");
          },
          set(v) {
            original_value_set.call(this, v);
            update();
          },
          configurable: true,
        });
      } catch (_err) {
        // Fallback if property is non-configurable
      }
    }
  }

  node.addEventListener("input", update);
  node.addEventListener("change", update);
  const observer = new ResizeObserver(update);
  observer.observe(node);

  const mutation_observer = new MutationObserver(update);
  if (!(node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement)) {
    mutation_observer.observe(node, { childList: true, characterData: true, subtree: true });
  }

  update();

  return {
    update(new_options) {
      options = new_options || {};
      update();
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("input", update);
      node.removeEventListener("change", update);
      observer.disconnect();
      mutation_observer.disconnect();
    },
  };
}
