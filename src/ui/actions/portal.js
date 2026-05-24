/**
 * usage: <div use:portal> or <div use:portal={targetElement}>
 * Default target is document.body
 * @param {HTMLDivElement} node
 */
export function portal(node, target = document.body) {
  target.appendChild(node);
  return {
    destroy() {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    },
  };
}
