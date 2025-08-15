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
  App.goBackWithFallback = function goBackWithFallback(returnTo, fallbackHash = '#storyboard') {
    if (returnTo) return App.router?.navigate?.(returnTo);
    if (global.history.length > 1) return global.history.back();
    App.router?.navigate?.(fallbackHash);
  };

  App.setSelected = function setSelected(target, group) {
    const items = typeof group === 'string' ? global.document.querySelectorAll(group) : group;
    if (!items) return;
    items.forEach((el) => {
      if (el === target) el.classList.add('is-selected');
      else el.classList.remove('is-selected');
    });
  };

  App.applyBrand = function applyBrand(el, entity = {}) {
    el = byId(el);
    if (!el) return;
    const palette = entity.palette || '';
    el.classList.forEach((c) => {
      if (c.startsWith('palette--')) el.classList.remove(c);
    });
    if (palette) el.classList.add(`palette--${palette}`);
  };

  const PLACEHOLDER_PATHS = {
    character: 'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-8 1.67-8 5v3h16v-3c0-3.33-4.67-5-8-5z',
    world: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 010-16 8 8 0 010 16zm0-14a6 6 0 00-5.29 3h10.58A6 6 0 0012 6zm-5.29 5a6 6 0 000 2h10.58a6 6 0 000-2H6.71zm.42 3a6 6 0 005.29 3 6 6 0 005.29-3H7.13z',
    default: 'M4 4h16v16H4z'
  };

  App.getPictureNode = function getPictureNode(entity = {}, { context } = {}) {
    const kind = entity.kind || context || 'default';
    const src = entity.imageUrl || entity.image || '';
    const title = entity.title || entity.name || 'Placeholder';
    if (src) {
      const img = global.document.createElement('img');
      img.className = 'profile-picture';
      img.alt = `${kind} image for ${title}`;
      img.src = src;
      img.onerror = () => {
        const ph = App.getPictureNode({ kind }, { context });
        img.replaceWith(ph);
      };
      return img;
    }
    const svg = global.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.classList.add('profile-picture');
    svg.dataset.isPlaceholder = '1';
    const path = global.document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', PLACEHOLDER_PATHS[kind] || PLACEHOLDER_PATHS.default);
    svg.appendChild(path);
    return svg;
  };
})(typeof window !== 'undefined' ? window : globalThis);
