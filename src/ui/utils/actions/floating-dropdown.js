/**
 * @file src/ui/utils/actions/floating-dropdown.js
 * Svelte action: `use:floating_dropdown`.
 *
 * A true-portal floating dropdown that escapes every overflow,
 * transform, filter, mask-image, and backdrop-filter stacking
 * context in the ancestor chain.
 *
 * Strategy:
 *   1. On mount, physically move `node` to `document.body` and
 *      leave a comment placeholder in its original position.
 *      This makes backdrop-filter work unconditionally.
 *   2. On every visibility change / resize / scroll, anchor the
 *      panel with `position: fixed` coords derived from the
 *      trigger element's DOMRect.
 *   3. Width is taken from `width_el` (defaults to `trigger_el`).
 *      Pass the full row container as `width_el` to span multiple
 *      buttons.
 *   4. Prefer upward (drop-up); fall back to downward when there
 *      is more space below.
 *
 * @param {HTMLElement} node
 * @param {{ trigger_el: HTMLElement|null, width_el?: HTMLElement|null, visible: boolean }} params
 */

const DEFAULT_HEIGHT = 300;
const MAX_PANEL_HEIGHT = 320;
const MIN_VISIBLE_HEIGHT = 120;
const VIEWPORT_GUTTER = 8;
const ANCHOR_GAP = 4;

export function floating_dropdown(node, params) {
  let { trigger_el, width_el, visible } = params;

  // --- Portal: physically move node to body ---
  /** @type {Comment} */
  const placeholder = document.createComment('floating-dropdown-portal');
  node.parentNode?.insertBefore(placeholder, node);
  document.body.appendChild(node);

  // Initialize styles for transitions
  node.style.visibility = 'hidden';
  node.style.opacity = '0';
  node.style.pointerEvents = 'none';
  node.style.display = 'flex';
  node.style.flexDirection = 'column';
  node.style.zIndex = 'var(--z-index-max, 9999)';

  let cleanup_fns = [];

  let frame;
  function position() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!visible || !trigger_el) {
        node.style.visibility = 'hidden';
        node.style.opacity = '0';
        node.style.pointerEvents = 'none';
        return;
      }

      const anchor_el = width_el ?? trigger_el;
      const rect = anchor_el.getBoundingClientRect();
      const trigger_rect = trigger_el.getBoundingClientRect();

      // Measure panel height capped at a comfortable maximum.
      const panel_height = Math.min(node.scrollHeight || DEFAULT_HEIGHT, MAX_PANEL_HEIGHT);

      const space_above = trigger_rect.top;
      const space_below = window.innerHeight - trigger_rect.bottom;
      const go_up = space_above > panel_height || space_above > space_below;

      node.style.position = 'fixed';
      node.style.width = `${rect.width}px`;
      node.style.left = `${rect.left}px`;
      node.style.maxHeight = `${Math.max(go_up ? space_above : space_below, MIN_VISIBLE_HEIGHT) - VIEWPORT_GUTTER - ANCHOR_GAP}px`;
      node.style.overflowY = 'auto';

      node.style.visibility = 'visible';
      node.style.opacity = '1';
      node.style.pointerEvents = 'auto';

      if (go_up) {
        node.style.top = 'auto';
        node.style.bottom = `${window.innerHeight - trigger_rect.top + ANCHOR_GAP}px`;
      } else {
        node.style.top = `${trigger_rect.bottom + ANCHOR_GAP}px`;
        node.style.bottom = 'auto';
      }
    });
  }

  function attach() {
    if (cleanup_fns.length > 0) return;
    window.addEventListener('resize', position, { passive: true });
    window.addEventListener('scroll', position, { passive: true, capture: true });
    cleanup_fns.push(
      () => window.removeEventListener('resize', position),
      () => window.removeEventListener('scroll', position, { capture: true }),
    );
  }

  function detach() {
    if (frame) cancelAnimationFrame(frame);
    cleanup_fns.forEach((fn) => fn());
    cleanup_fns = [];
  }

  function sync() {
    if (visible) {
      attach();
      position();
    } else {
      detach();
      // Ensure it's hidden immediately when detached
      node.style.visibility = 'hidden';
      node.style.opacity = '0';
      node.style.pointerEvents = 'none';
    }
  }

  sync();

  return {
    update(new_params) {
      trigger_el = new_params.trigger_el;
      width_el = new_params.width_el ?? null;
      visible = new_params.visible;
      sync();
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      detach();
      // Restore node to its original DOM position before Svelte cleans it up.
      if (placeholder.parentNode) {
        placeholder.parentNode.insertBefore(node, placeholder);
      } else {
        node.remove();
      }
      placeholder.remove();
    },
  };
}
