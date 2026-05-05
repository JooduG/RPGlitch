/**
 * Svelte Action: fitText
 * Automatically scales font size down to fit within the container's height/width.
 * Harmonized Version: Respects CSS-defined font-size (like clamp) if maxSize is omitted.
 *
 * @param {HTMLElement} node
 * @param {Object} [options]
 * @param {number} [options.maxSize] - Optional: Force a starting font size in px
 * @param {number} [options.minSize=12] - Minimum font size in px
 * @param {string} [options.lineHeight='1.2'] - Line height to apply
 */
export function fitText(node, options = {}) {
  let currentOptions = { ...options };

  function adjust() {
    // 1. Reset inline font-size to let CSS (clamp) take over
    node.style.fontSize = "";
    
    // 2. Only apply line-height if explicitly requested via options
    if (currentOptions.lineHeight) {
      node.style.lineHeight = currentOptions.lineHeight;
    }

    const computedStyle = window.getComputedStyle(node);
    
    // 3. Determine minimum size: Options -> Default (10px)
    let minSize = currentOptions.minSize || 10;

    // 4. Determine starting size: use override if provided, otherwise measure CSS
    let currentSize;
    if (currentOptions.maxSize) {
      currentSize = currentOptions.maxSize;
      node.style.fontSize = `${currentSize}px`;
    } else {
      currentSize = parseFloat(computedStyle.fontSize);
    }

    // Tolerance of 1px to prevent subpixel rounding loops
    const TOLERANCE = 1;

    // 5. Shrink loop: only shrinks if the current text overflows its container
    while (
      (node.scrollHeight > node.clientHeight + TOLERANCE ||
        node.scrollWidth > node.clientWidth + TOLERANCE) &&
      currentSize > minSize
    ) {
      currentSize--;
      node.style.fontSize = `${currentSize}px`;
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(adjust);
  });

  resizeObserver.observe(node);
  adjust();

  return {
    update(newOptions) {
      currentOptions = { ...newOptions };
      adjust();
    },
    destroy() {
      resizeObserver.disconnect();
    },
  };
}



