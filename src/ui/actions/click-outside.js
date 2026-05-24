/**
 * @param {HTMLElement} node
 * @param {(event: MouseEvent) => void} handler
 */
export function click_outside(node, handler) {
  /** @param {MouseEvent} event */
  const handleClick = (event) => {
    if (node && !node.contains(/** @type {Node} */ (event.target)) && !event.defaultPrevented) {
      handler(event);
    }
  };

  document.addEventListener("click", handleClick, true);

  return {
    destroy() {
      document.removeEventListener("click", handleClick, true);
    },
  };
}
