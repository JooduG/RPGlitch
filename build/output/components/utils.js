<<<<<<< HEAD
/* global module */

/**
 * Hides a DOM element by adding the hidden attribute.
 * @param {HTMLElement|string} el - The element or its ID.
 * @returns {HTMLElement|null}
 */

function hideEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.setAttribute('hidden', 'hidden');
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hideEl, showEl };
} else {
  window.hideEl = hideEl;
  window.showEl = showEl;
}
=======
function hideEl(e){return"string"==typeof e&&(e=document.getElementById(e)),e?(e.setAttribute("hidden","hidden"),e):null}function showEl(e){return"string"==typeof e&&(e=document.getElementById(e)),e?(e.removeAttribute("hidden"),e):null}window.hideEl=hideEl,window.showEl=showEl;
>>>>>>> 58fac1ef9dbb0c3de479d6d9ce84a281a385a066
