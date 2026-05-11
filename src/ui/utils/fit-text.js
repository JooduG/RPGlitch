/** @type {HTMLElement | null} */
let sharedMeasureEl = null;

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

      const rootStyle = window.getComputedStyle(document.documentElement);

      // Load centralized logic tokens (Tier 1 Foundations)
      const TOKEN_MIN_SIZE =
        rootStyle.getPropertyValue("--fit-text-min").trim() || "var(--font-size-tiny)";
      const TOKEN_LINE_HEIGHT =
        rootStyle.getPropertyValue("--fit-text-height").trim() || "var(--font-height-short)";
      const TOKEN_TOLERANCE = parseFloat(rootStyle.getPropertyValue("--fit-text-tolerance")) || 1;

      /**
       * Helper to resolve CSS values (handles variables, clamp, rem, etc.)
       * @param {string | number | undefined} value
       * @param {number} fallback
       * @returns {number}
       */
      const resolve_px = (value, fallback) => {
        if (!value) return fallback;
        if (typeof value === "number") return value;

        // If it's a variable or complex string, measure it using the shared element
        if (!sharedMeasureEl && typeof document !== "undefined") {
          sharedMeasureEl = document.createElement("div");
          sharedMeasureEl.style.position = "absolute";
          sharedMeasureEl.style.visibility = "hidden";
          sharedMeasureEl.style.pointerEvents = "none";
          sharedMeasureEl.style.zIndex = "-9999";
          document.body.appendChild(sharedMeasureEl);
        }

        if (sharedMeasureEl) {
          sharedMeasureEl.style.fontSize = value.startsWith("--") ? `var(${value})` : value;
          const result = parseFloat(window.getComputedStyle(sharedMeasureEl).fontSize);
          return isNaN(result) ? fallback : result;
        }

        return fallback;
      };

      // 4. Determine boundaries
      // Default to --fit-text-min if no minSize provided
      const minSize = resolve_px(currentOptions.minSize || TOKEN_MIN_SIZE, 12);

      let maxSize;
      if (currentOptions.maxSize) {
        maxSize = resolve_px(currentOptions.maxSize, 16);
      } else {
        // Measure the 'natural' CSS size (e.g. from clamp or fixed rem)
        node.style.fontSize = "";
        maxSize = parseFloat(window.getComputedStyle(node).fontSize) || 16;
      }

      // Default line-height from tokens
      node.style.lineHeight = currentOptions.lineHeight || TOKEN_LINE_HEIGHT;

      // Initial state: Start at the maximum allowed size
      node.style.fontSize = `${maxSize}px`;

      const isOverflowing = () => {
        return (
          node.scrollHeight > node.clientHeight + TOKEN_TOLERANCE ||
          node.scrollWidth > node.clientWidth + TOKEN_TOLERANCE
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
