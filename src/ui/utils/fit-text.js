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
export function fit_text(node, options = {}) {
  let currentOptions = { ...options };
  let frameId = null;

  function adjust() {
    if (frameId) cancelAnimationFrame(frameId);

    frameId = requestAnimationFrame(() => {
      // 1. Reset inline font-size to let CSS (clamp) take over
      node.style.fontSize = "";

      // 2. Safeguard: Don't adjust if the container is hidden or not yet measured
      if (node.clientHeight === 0 || node.clientWidth === 0) return;

      // 3. Line-height: reset or apply override
      node.style.lineHeight = currentOptions.lineHeight || "";

      const computedStyle = window.getComputedStyle(node);

      // 4. Determine boundaries
      const minSize = currentOptions.minSize || 10;
      let maxSize;

      if (currentOptions.maxSize) {
        maxSize = currentOptions.maxSize;
      } else {
        // Measure the 'natural' CSS size (e.g. from clamp or fixed rem)
        maxSize = parseFloat(computedStyle.fontSize) || 16;
      }

      // Initial state: Start at the maximum allowed size
      node.style.fontSize = `${maxSize}px`;

      // Tolerance to prevent subpixel rounding loops
      const TOLERANCE = 1;

      const isOverflowing = () => {
        return (
          node.scrollHeight > node.clientHeight + TOLERANCE ||
          node.scrollWidth > node.clientWidth + TOLERANCE
        );
      };

      // 5. Binary search for the largest font size that fits
      if (isOverflowing()) {
        let low = minSize;
        let high = maxSize;
        let bestFit = minSize;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          node.style.fontSize = `${mid}px`;

          if (isOverflowing()) {
            high = mid - 1;
          } else {
            bestFit = mid;
            low = mid + 1;
          }
        }
        node.style.fontSize = `${bestFit}px`;
      }
    });
  }

  // Monitor size changes (container resizing)
  const resizeObserver = new ResizeObserver(() => adjust());
  resizeObserver.observe(node);

  // Monitor content changes (text node updates)
  const mutationObserver = new MutationObserver(() => adjust());
  mutationObserver.observe(node, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  // Initial run
  adjust();

  return {
    update(newOptions) {
      currentOptions = { ...newOptions };
      adjust();
    },
    destroy() {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    },
  };
}
