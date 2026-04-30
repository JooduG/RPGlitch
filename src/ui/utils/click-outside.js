/**
 * click-outside.js
 * Svelte 5 action to detect clicks outside a specific element.
 */
export function click_outside(node, handler) {
  const handleClick = (event) => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
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
