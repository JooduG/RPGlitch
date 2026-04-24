/**
 * @file auto-resize.js
 * Svelte 5 logic action to resize textareas automatically based on their content.
 */
export function auto_resize(node, options = {}) {
  let frame;
  let lastWidth = node.clientWidth;
  let lastHeight = 0;

  const update = (force = false) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const currentWidth = node.clientWidth;
      
      // Only update if width changed, content changed (via mutation/input), or forced
      if (!force && currentWidth === lastWidth && node.scrollHeight === lastHeight) {
        return;
      }
      lastWidth = currentWidth;

      const savedHeight = node.style.height;
      node.style.height = "auto";
      
      const style = window.getComputedStyle(node);
      const borderTop = parseFloat(style.borderTopWidth) || 0;
      const borderBottom = parseFloat(style.borderBottomWidth) || 0;
      
      // Robustly resolve buffer from theme to respect accessibility settings
      let buffer = 10;
      const temp = document.createElement("div");
      temp.style.paddingTop = "var(--spacing-s)";
      temp.style.visibility = "hidden";
      temp.style.position = "absolute";
      document.body.appendChild(temp);
      const computedSpacing = window.getComputedStyle(temp).paddingTop;
      buffer = parseFloat(computedSpacing) || 10;
      document.body.removeChild(temp);
      
      const calculatedHeight = Math.ceil(node.scrollHeight) + borderTop + borderBottom + buffer;
      
      // Only apply if different to avoid triggering observers unnecessarily
      if (Math.abs(calculatedHeight - lastHeight) > 1) {
        lastHeight = calculatedHeight;
        node.style.height = calculatedHeight + "px";
      } else {
        node.style.height = savedHeight;
      }
      
      if (options.syncId) {
        const siblings = document.querySelectorAll(`[data-sync-id="${options.syncId}"]`);
        let maxHeight = 0;
        
        const siblingData = Array.from(siblings).filter(s => s instanceof HTMLElement);
        
        // Batch 1: Reset heights to auto
        siblingData.forEach(s => s.style.height = "auto");
        
        // Batch 2: Read scrollHeights and styles
        siblingData.forEach(s => {
          const sStyle = window.getComputedStyle(s);
          const sBorderTop = parseFloat(sStyle.borderTopWidth) || 0;
          const sBorderBottom = parseFloat(sStyle.borderBottomWidth) || 0;
          maxHeight = Math.max(maxHeight, Math.ceil(s.scrollHeight) + sBorderTop + sBorderBottom + buffer);
        });

        // Batch 3: Apply synchronized height
        siblingData.forEach(s => {
          if (Math.abs(parseFloat(s.style.height) - maxHeight) > 1) {
            s.style.height = maxHeight + "px";
          }
        });
      }
    });
  };

  const onInput = () => update(true);
  node.addEventListener("input", onInput);
  
  const resizeObserver = new ResizeObserver(() => {
    const currentWidth = node.clientWidth;
    if (currentWidth !== lastWidth) {
      update(true);
    }
  });
  resizeObserver.observe(node);

  const mutationObserver = new MutationObserver(() => update(true));
  if (!(node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement)) {
    mutationObserver.observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  update(true);

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("input", onInput);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    },
  };
}
