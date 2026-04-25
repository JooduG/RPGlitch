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
      const currentScrollHeight = Math.ceil(node.scrollHeight);

      if (currentWidth === lastWidth && currentScrollHeight === lastScrollHeight) return;

      node.style.height = "auto";
      const style = window.getComputedStyle(node);
      const borderTop = parseFloat(style.borderTopWidth) || 0;
      const borderBottom = parseFloat(style.borderBottomWidth) || 0;

      const buffer = 10;
      const height = currentScrollHeight + borderTop + borderBottom + buffer;
      node.style.height = height + "px";

      lastWidth = currentWidth;
      lastScrollHeight = currentScrollHeight;

      if (options.syncId) {
        const boundary =
          node.closest("[data-auto-resize-boundary]") ||
          node.closest(".storymode-grid") ||
          node.closest(".modal-content") ||
          document;
        const siblings = boundary.querySelectorAll(`[data-sync-id="${options.syncId}"]`);
        let maxHeight = 0;

        const siblingData = Array.from(siblings).filter((s) => s instanceof HTMLElement);
        siblingData.forEach((s) => {
          s.style.height = "auto";
          const sStyle = window.getComputedStyle(s);
          const sBT = parseFloat(sStyle.borderTopWidth) || 0;
          const sBB = parseFloat(sStyle.borderBottomWidth) || 0;
          maxHeight = Math.max(maxHeight, Math.ceil(s.scrollHeight) + sBT + sBB + buffer);
        });

        siblingData.forEach((s) => {
          const newHeight = maxHeight + "px";
          if (s.style.height !== newHeight) {
            s.style.height = newHeight;
          }
        });
      }
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
