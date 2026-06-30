/**
 * @param {HTMLElement} node
 * @param {(event: MouseEvent) => void} handler
 */
export function click_outside(node, handler) {
  /** @param {MouseEvent} event */
  const handleClick = (event) => {
    // If the target was detached from the DOM (e.g. bits-ui unmounting a dropdown item before the click event), ignore it
    if (!document.body.contains(/** @type {Node} */ (event.target))) return;

    if (node && !node.contains(/** @type {Node} */ (event.target)) && !event.defaultPrevented) {
      handler(event);
    }
  };

  document.addEventListener("pointerdown", handleClick, true);

  return {
    destroy() {
      document.removeEventListener("pointerdown", handleClick, true);
    },
  };
}
