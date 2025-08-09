/**
 * Legacy path wrapper for utility helpers.
 * Mirrors functions from ./js/utils.js so tests can load them.
 */

function hideEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.setAttribute('hidden', 'hidden');
  return el;
}

function showEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.removeAttribute('hidden');
  return el;
}

window.hideEl = hideEl;
window.showEl = showEl;
