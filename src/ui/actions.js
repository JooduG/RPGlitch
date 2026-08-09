import { resolve_px } from "@utils";
import { sanitize_to_fragment } from "@platform";

/**
 * @typedef {import('svelte/action').Action} Action
 * @typedef {Action & { is_kinetic?: boolean }} KineticAction
 * @typedef {import('svelte/action').ActionReturn} ActionReturn
 */

/**
 * @file src/ui/actions.js
 * 🔗 UNIVERSAL ACTION BRIDGE
 * Orchestrates multiple Svelte actions on a single node with Map-based reconciliation.
 * Now detects kinetic actions to enable CSS-based transition stabilization.
 *
 * @param {HTMLElement} node
 * @param {Array<KineticAction | [KineticAction, any] | null | undefined>} actions - Array of actions or [action, params] tuples.
 */
export function use_actions(node, actions) {
  /** @type {Map<KineticAction, ActionReturn | void | undefined>} */
  let instances = new Map();

  /**
   * @param {Array<KineticAction | [KineticAction, any] | null | undefined>} new_actions
   */
  function update(new_actions) {
    /** @type {Map<KineticAction, ActionReturn | void | undefined>} */
    const next_instances = new Map();
    let has_kinetic = false;

    new_actions.forEach((item) => {
      if (!item) return;

      /** @type {KineticAction} */
      let action;
      /** @type {any} */
      let params;

      if (Array.isArray(item)) {
        [action, params] = item;
      } else {
        action = item;
        params = undefined;
      }

      if (!action) return;

      // Detect kinetic actions for CSS stabilization
      if (action.is_kinetic) has_kinetic = true;

      const existing = instances.get(action);

      if (existing) {
        existing.update?.(params);
        next_instances.set(action, existing);
        instances.delete(action);
      } else {
        next_instances.set(action, action(node, params));
      }
    });

    // Apply kinetic signaling for CSS
    if (has_kinetic) node.setAttribute("data-kinetic", "true");
    else node.removeAttribute("data-kinetic");

    // Cleanup removed actions
    instances.forEach((result) => result?.destroy?.());
    instances = next_instances;
  }

  update(actions);

  return {
    update,
    destroy: () => instances.forEach((result) => result?.destroy?.()),
  };
}

/**
 * @param {HTMLElement} node
 * @param {(event: MouseEvent) => void} handler
 */
export function click_outside(node, handler) {
  /** @param {MouseEvent} event */
  const handle_click = (event) => {
    // If the target was detached from the DOM (e.g. bits-ui unmounting a dropdown item before the click event), ignore it
    if (!document.body.contains(/** @type {Node} */ (event.target))) return;

    if (node && !node.contains(/** @type {Node} */ (event.target)) && !event.defaultPrevented) {
      handler(event);
    }
  };

  setTimeout(() => {
    document.addEventListener("pointerdown", handle_click, true);
  }, 10);

  return {
    destroy() {
      document.removeEventListener("pointerdown", handle_click, true);
    },
  };
}

/**
 * Svelte Action: Safely injects sanitized HTML into a node.
 * @param {HTMLElement} node
 * @param {string | null | undefined} content
 */
export function safe_html(node, content) {
  /** @param {string | null | undefined} new_content */
  const update_content = (new_content) => {
    node.textContent = "";
    node.appendChild(sanitize_to_fragment(new_content ?? ""));
  };
  update_content(content);
  return {
    update: update_content,
  };
}

/**
 * @file src/ui/actions.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 * Optimized to prevent layout thrashing by batching DOM reads and writes.
 */

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
