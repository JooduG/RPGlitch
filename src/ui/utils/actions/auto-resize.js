/**
 * @file auto-resize.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 */
export function auto_resize(node, options = {}) {
  let frame;
  let lastWidth = 0;
  let lastScrollHeight = 0;

  const update = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const currentWidth = node.clientWidth;
      const currentScrollHeight = node.scrollHeight;

      if (currentWidth === lastWidth && currentScrollHeight === lastScrollHeight) return;

      node.style.height = "auto";
      const style = window.getComputedStyle(node);
      const borderTop = parseFloat(style.borderTopWidth) || 0;
      const borderBottom = parseFloat(style.borderBottomWidth) || 0;

      const height = node.scrollHeight + borderTop + borderBottom;
      node.style.height = height + "px";

      lastWidth = currentWidth;
      lastScrollHeight = height;

      if (options.syncId) {
        const boundary = node.closest(".storymode-grid") || node.closest(".modal-content") || document;
        const siblings = boundary.querySelectorAll(`[data-sync-id="${options.syncId}"]`);
        let maxHeight = 0;

        siblings.forEach((s) => {
          if (s instanceof HTMLElement) {
            s.style.height = "auto";
            maxHeight = Math.max(maxHeight, s.scrollHeight + borderTop + borderBottom);
          }
        });

        siblings.forEach((s) => {
          if (s instanceof HTMLElement) {
            s.style.height = maxHeight + "px";
          }
        });
      }
    });
  };
  node.addEventListener("input", update);
  const observer = new ResizeObserver(update);
  observer.observe(node);
  update();
  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("input", update);
      observer.disconnect();
    },
  };
}
