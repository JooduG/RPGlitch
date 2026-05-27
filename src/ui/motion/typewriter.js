import { sanitizeToFragment } from "@platform";

/**
 * Svelte Action: Safely types out sanitized HTML character-by-character.
 * Preserves all HTML tags intact and only truncates text nodes.
 * @param {HTMLElement} node
 * @param {string | null | undefined} content
 * @returns {{ update: (new_content: string | null | undefined) => void, destroy: () => void }}
 */
export function typewriter(node, content) {
  let currentLength = 0;
  /** @type {string | null | undefined} */
  let targetHtml = "";
  /** @type {any} */
  let frameId = null;
  /** @type {number} */
  let lastTime = 0;

  /**
   * Calculates the total text length inside a document fragment.
   * @param {DocumentFragment} fragment
   * @returns {number}
   */
  function get_text_length(fragment) {
    let length = 0;
    /**
     * @param {Node} n
     */
    const walk = (n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        length += n.textContent?.length ?? 0;
      } else {
        for (let i = 0; i < n.childNodes.length; i++) {
          walk(n.childNodes[i]);
        }
      }
    };
    walk(fragment);
    return length;
  }

  /**
   * Truncates the text content of a node to a specific length.
   * @param {Node} n
   * @param {number} targetLength
   */
  function truncate_to_length(n, targetLength) {
    let count = 0;
    /**
     * @param {Node} current
     */
    const walk = (current) => {
      if (current.nodeType === Node.TEXT_NODE) {
        const text = current.textContent ?? "";
        const len = text.length;
        if (count + len <= targetLength) {
          count += len;
        } else if (count >= targetLength) {
          current.textContent = "";
        } else {
          current.textContent = text.substring(0, targetLength - count);
          count = targetLength;
        }
      } else {
        for (let i = 0; i < current.childNodes.length; i++) {
          walk(current.childNodes[i]);
        }
      }
    };
    walk(n);
  }

  /**
   * @param {string | null | undefined} new_content
   */
  const update_content = (new_content) => {
    targetHtml = new_content ?? "";
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    const fragment = sanitizeToFragment(targetHtml);
    const totalLength = get_text_length(fragment);

    if (totalLength < currentLength) {
      currentLength = 0;
    }

    lastTime = performance.now();

    /**
     * @param {number} now
     */
    const tick = (now) => {
      const elapsed = now - lastTime;
      lastTime = now;

      const remaining = totalLength - currentLength;
      if (remaining <= 0) {
        currentLength = totalLength;
        const finalFragment = sanitizeToFragment(targetHtml ?? "");
        node.textContent = "";
        node.appendChild(finalFragment);
        frameId = null;
        return;
      }

      // Dynamic speed adjustments to catch up with fast streams
      let speed = 0.04; // ~40 chars/sec base speed
      if (remaining > 150) {
        speed = 0.2; // 200 chars/sec
      } else if (remaining > 50) {
        speed = 0.1; // 100 chars/sec
      }

      currentLength = Math.min(totalLength, currentLength + elapsed * speed);

      const displayFragment = sanitizeToFragment(targetHtml ?? "");
      truncate_to_length(displayFragment, Math.floor(currentLength));
      node.textContent = "";
      node.appendChild(displayFragment);

      if (currentLength < totalLength) {
        frameId = requestAnimationFrame(tick);
      } else {
        frameId = null;
      }
    };

    frameId = requestAnimationFrame(tick);
  };

  update_content(content);

  return {
    update: update_content,
    destroy() {
      if (frameId) cancelAnimationFrame(frameId);
    },
  };
}
