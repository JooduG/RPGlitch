/* eslint-env browser */
(function (global) {
  // Create/attach the app namespace safely
  const App = global.App || (global.App = {});

  function byId(el) {
    return typeof el === 'string' ? global.document.getElementById(el) : el;
  }

  /**
   * Hides a DOM element by adding the hidden attribute.
   * @param {HTMLElement|string} el - The element or its ID.
   * @returns {HTMLElement|null}
   */
  function hideEl(el) {
    el = byId(el);
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
    el = byId(el);
    if (!el) return null;
    el.removeAttribute('hidden');
    return el;
  }

  // Expose helpers on both window and App
  global.hideEl = hideEl;
  global.showEl = showEl;
  App.hideEl = hideEl;
  App.showEl = showEl;

  // ---- Routing/query tiny helpers ----

  App.getHashQuery = function getHashQuery() {
    const [, q = ''] = (global.location.hash || '').split('?');
    return new URLSearchParams(q);
  };

  App.navigate = function navigate(hash) {
    if (!hash || hash === '#') {
      App.router?.navigate?.('#storyboard');
      return;
    }
    App.router?.navigate?.(hash);
  };

  // Single back helper used by profile + form
  App.goBackWithFallback = function goBackWithFallback(fallbackHash = '#storyboard') {
    const before = global.location.hash;
    if (global.history.length > 1) {
      global.history.back();
      // Slightly generous delay to avoid races on slower machines
      global.setTimeout(() => {
        if (global.location.hash === before) App.navigate(fallbackHash);
      }, 250);
    } else {
      App.navigate(fallbackHash);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
