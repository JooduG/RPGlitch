/**
 * @file auto-resize.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 * Batches DOM reads and writes via requestAnimationFrame to prevent layout thrashing.
 */
export function auto_resize(node, options = {}) {
  let frame;
  let lastWidth = 0;
  let lastScrollHeight = 0;

  const update = () => {
    if (frame) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      // 1. Accuracy: Account for border box if necessary
      const style = getComputedStyle(node);
      const isBorderBox = style.boxSizing === "border-box";
      const borderOffset = isBorderBox
        ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
        : 0;

      // 2. Optimization: Skip if no change in content or width
      if (node.clientWidth === lastWidth && node.scrollHeight === lastScrollHeight) {
        return;
      }

      // 3. Batched DOM manipulation
      node.style.height = "auto";
      const height = node.scrollHeight + borderOffset;
      node.style.height = height + "px";

      lastWidth = node.clientWidth;
      lastScrollHeight = node.scrollHeight;

      // 4. Sync Logic (if applicable)
      if (options.syncId) {
        const scope = node.closest(".storymode-grid, .modal-content, body") || document.body;
        const siblings = scope.querySelectorAll(`[data-sync-id="${options.syncId}"]`);

        // 1. Batch Write: Reset all to auto
        siblings.forEach((s) => {
          if (s instanceof HTMLElement) s.style.height = "auto";
        });

        // 2. Batch Read: Measure all heights
        let maxHeight = 0;
        siblings.forEach((s) => {
          if (s instanceof HTMLElement) {
            maxHeight = Math.max(maxHeight, s.scrollHeight);
          }
        });

        // 3. Batch Write: Apply max height
        siblings.forEach((s) => {
          if (s instanceof HTMLElement) {
            s.style.height = maxHeight + borderOffset + "px";
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
