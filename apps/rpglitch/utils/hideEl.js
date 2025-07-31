function hideEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.add('hidden');
  el.style.display = '';
  return el;
}

/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = hideEl;
} else {
  window.hideEl = hideEl;
}
/* eslint-enable no-undef */
