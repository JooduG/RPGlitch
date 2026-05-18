import { resolve_px, resolve_number } from "./dom.js";

/**
 * Svelte Action: fitText
 * Automatically scales font size down to fit within the container's height/width.
 * Harmonized Version: Respects CSS-defined font-size (like clamp) if maxSize is omitted.
 *
 * @param {HTMLElement} node
 * @param {Object} [options]
 * @param {number | string} [options.maxSize] - Optional: Force a starting font size (px number or CSS string)
 * @param {number | string} [options.minSize] - Minimum font size (px number or CSS string)
 * @param {string} [options.lineHeight='1.2'] - Line height to apply
 */
export function fit_text(node, options = {}) {
  let currentOptions = { ...options };
  /**
   * @type {number | null}
   */
  let frameId = null;

  /**
   *
   */
  function adjust() {
    if (frameId) cancelAnimationFrame(frameId);

    frameId = requestAnimationFrame(() => {
      // 1. Reset inline font-size to let CSS (clamp) take over
      node.style.fontSize = "";

      // 2. Safeguard: Don't adjust if the container is hidden or not yet measured
      if (node.clientHeight === 0 || node.clientWidth === 0) return;

      // 3. Line-height: reset or apply override

      // 0. Load tokens dynamically (Chalk Regime)
      const tolerance = resolve_number("--fit-text-tolerance", 1, node);
      const default_line_height = "var(--fit-text-height, var(--font-height-base))";

      // 4. Determine boundaries
      const minSize = resolve_px(
        currentOptions.minSize || "--fit-text-min",
        resolve_px("--font-size-tiny", 12, node),
        node,
      );

      let maxSize;
      if (currentOptions.maxSize) {
        maxSize = resolve_px(currentOptions.maxSize, 16, node);
      } else {
        // Measure the 'natural' CSS size (e.g. from clamp or fixed rem)
        node.style.fontSize = "";
        maxSize = parseFloat(window.getComputedStyle(node).fontSize) || 16;
      }

      // Default line-height from tokens
      node.style.lineHeight = currentOptions.lineHeight || default_line_height;

      // Initial state: Start at the maximum allowed size
      node.style.fontSize = `${maxSize}px`;

      const isOverflowing = () => {
        return (
          node.scrollHeight > node.clientHeight + tolerance ||
          node.scrollWidth > node.clientWidth + tolerance
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
    /**
     * @param {{ maxSize?: number | undefined; minSize?: number | undefined; lineHeight?: string | undefined; }} newOptions
     */
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
