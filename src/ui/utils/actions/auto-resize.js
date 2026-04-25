/**
 * @file auto-resize.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 * Optimized to prevent layout thrashing by batching DOM reads and writes.
 */
export function auto_resize(node, options = {}) {
  let frame;
  let lastWidth = 0;
  let lastScrollHeight = 0;

  const update = () => {
    if (frame) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      const style = getComputedStyle(node);
      const isBorderBox = style.boxSizing === "border-box";
      const borderOffset = isBorderBox
        ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
        : 0;

      // Add a small buffer to prevent flickering scrollbars
      const buffer = 2;

      // Skip if no change in content or width
      if (node.clientWidth === lastWidth && node.scrollHeight === lastScrollHeight) {
        return;
      }

      const syncId = options.syncId;
      const scope = syncId ? (node.closest(".storymode-grid, .modal-content, body") || document.body) : null;
      const siblings = syncId ? scope.querySelectorAll(`[data-sync-id="${syncId}"]`) : [node];

      // 1. PHASE: BATCH WRITE (Reset)
      siblings.forEach((s) => {
        if (s instanceof HTMLElement) s.style.height = "auto";
      });

      // 2. PHASE: BATCH READ (Measure)
      let maxHeight = 0;
      siblings.forEach((s) => {
        if (s instanceof HTMLElement) {
          maxHeight = Math.max(maxHeight, s.scrollHeight);
        }
      });

      // 3. PHASE: BATCH WRITE (Apply)
      const finalHeight = maxHeight + borderOffset + buffer + "px";
      siblings.forEach((s) => {
        if (s instanceof HTMLElement) {
          s.style.height = finalHeight;
        }
      });

      lastWidth = node.clientWidth;
      lastScrollHeight = node.scrollHeight;
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
