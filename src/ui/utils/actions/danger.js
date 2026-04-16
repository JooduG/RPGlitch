/**
 * @file danger.js
 * ☢️ THE HARBINGER OF ENDINGS
 * A Svelte action to manage destructive interactions via the Right-Edge Gutter.
 * Supports both immediate 'click' and 1000ms 'hold' modes.
 */

export function danger(node, options = { type: "hold", onComplete: () => {} }) {
  let timer = null;
  let startTime = 0;
  const HOLD_THRESHOLD = 1000;

  function handleStart(e) {
    if (options.type !== "hold") return;

    // Safety: If this is the main card, only trigger on the right edge.
    // If it's a dedicated .danger-zone, trigger on the whole element.
    const rect = node.getBoundingClientRect();
    const isGutter = node.classList.contains("danger-zone");
    const isRightEdge = e.clientX > rect.right - 40;

    if (!isGutter && !isRightEdge) return;

    startTime = Date.now();
    node.style.setProperty("--danger-progress", "0");
    node.classList.add("danger-charging");

    timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / HOLD_THRESHOLD, 1);
      node.style.setProperty("--danger-progress", progress.toString());

      if (progress >= 1) {
        handleComplete();
      }
    }, 16);
  }

  function handleEnd() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    node.classList.remove("danger-charging");
    node.style.setProperty("--danger-progress", "0");
  }

  function handleComplete() {
    handleEnd();
    options.onComplete?.();
  }

  function handleClick(e) {
    if (options.type !== "click") return;

    const rect = node.getBoundingClientRect();
    const isGutter = node.classList.contains("danger-zone");
    const isRightEdge = e.clientX > rect.right - 40;

    if (isGutter || isRightEdge) {
      e.stopPropagation();
      e.preventDefault();
      options.onComplete?.();
    }
  }

  node.addEventListener("mousedown", handleStart);
  window.addEventListener("mouseup", handleEnd);
  node.addEventListener("click", handleClick);

  return {
    update(newOptions) {
      options = { ...options, ...newOptions };
    },
    destroy() {
      node.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mouseup", handleEnd);
      node.removeEventListener("click", handleClick);
      if (timer) clearInterval(timer);
    },
  };
}
