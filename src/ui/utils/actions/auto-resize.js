/**
 * @file auto-resize.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 */
export function auto_resize(node, options = {}) {
  let frame;
  const update = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      node.style.height = "auto";
      const height = node.scrollHeight;
      node.style.height = height + "px";
      if (options.syncId) {
        const scope = node.closest(".storymode-grid, .modal-content, body");
        const siblings = scope.querySelectorAll(`[data-sync-id="${options.syncId}"]`);
        let maxHeight = 0;
        siblings.forEach((s) => {
          if (s instanceof HTMLElement) {
            s.style.height = "auto";
            maxHeight = Math.max(maxHeight, s.scrollHeight);
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
