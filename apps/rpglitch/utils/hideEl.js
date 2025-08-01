function hideEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.add('hidden');
  el.style.display = '';
  return el;
}

/**
 * Reveals a DOM element by removing the hidden class and resetting styles.
 * @param {HTMLElement|string} el - The element or its ID.
 * @returns {HTMLElement|null}
 */
function showEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.remove('hidden');
  el.style.visibility = '';
  el.style.display = '';
  return el;
}

/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hideEl, showEl };
} else {
  window.hideEl = hideEl;
  window.showEl = showEl;
}
/* eslint-enable no-undef */
