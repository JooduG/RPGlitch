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
      let maxScrollHeight = 0;
      const metrics = [];

      siblings.forEach((s) => {
        if (s instanceof HTMLElement) {
          const sStyle = getComputedStyle(s);
          const sIsBorderBox = sStyle.boxSizing === "border-box";
          const sBorderOffset = sIsBorderBox
            ? parseFloat(sStyle.borderTopWidth) + parseFloat(sStyle.borderBottomWidth)
            : 0;
          
          const sScrollHeight = s.scrollHeight;
          maxScrollHeight = Math.max(maxScrollHeight, sScrollHeight);
          
          metrics.push({ el: s, borderOffset: sBorderOffset });
        }
      });

      // 3. PHASE: BATCH WRITE (Apply)
      metrics.forEach((m) => {
        m.el.style.height = maxScrollHeight + m.borderOffset + buffer + "px";
      });

      lastWidth = node.clientWidth;
      lastScrollHeight = node.scrollHeight;
    });
  };
  node.addEventListener("input", update);
  const observer = new ResizeObserver(update);
  observer.observe(node);

  const mutationObserver = new MutationObserver(update);
  if (!(node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement)) {
    mutationObserver.observe(node, { childList: true, characterData: true, subtree: true });
  }

  update();

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("input", update);
      observer.disconnect();
      mutationObserver.disconnect();
    },
  };
}
