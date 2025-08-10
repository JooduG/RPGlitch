/**
 * Hides a DOM element by adding the hidden attribute.
 * @param {HTMLElement|string} el - The element or its ID.
 * @returns {HTMLElement|null}
 */

function hideEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.hidden = true;
  return el;
}

/**
 * Reveals a DOM element by removing the hidden attribute.
 * @param {HTMLElement|string} el - The element or its ID.
 * @returns {HTMLElement|null}
 */

function showEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.removeAttribute('hidden');
  return el;
}

window.hideEl = hideEl;
window.showEl = showEl;
