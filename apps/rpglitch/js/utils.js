// apps/rpglitch/js/utils.js
;(function (global) {
  const App = (global.App = global.App || {});

  // ---------- Show / Hide ----------
  App.hideEl = function (el) {
    if (!el) return;
    el.setAttribute('hidden', '');
    el.classList.remove('is-open');
  };
  App.showEl = function (el) {
    if (!el) return;
    el.removeAttribute('hidden');
    el.classList.add('is-open');
  };

  // ---------- Branding ----------
  App.applyBrand = function (container, entity) {
    if (!container) return;
    const color =
      (entity && (entity.palette || entity.brandColor || entity.color)) || '';
    if (color) {
      container.style.setProperty('--brand-color', String(color));
      container.classList.add('has-brand');
    } else {
      container.style.removeProperty('--brand-color');
      container.classList.remove('has-brand');
    }
  };

  // ---------- Selection helper ----------
  App.setSelected = function (el, all) {
    if (!el || !all) return;
    Array.from(all).forEach((node) => node.classList.toggle('selected', node === el));
  };

  // ---------- Hash query (used by forms/navigation) ----------
  App.getHashQuery = function () {
    const h = global.location?.hash || '';
    const qIndex = h.indexOf('?');
    const q = qIndex >= 0 ? h.slice(qIndex + 1) : '';
    try {
      return new URLSearchParams(q);
    } catch {
      const params = new URLSearchParams();
      q.split('&').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k) params.set(decodeURIComponent(k), decodeURIComponent(v || ''));
      });
      return params;
    }
  };

  // Convert entity/placeholder info into a picture node with white icon fallback
  App.getPictureNode = function (entity = {}, options = {}) {
    const node = App.getPictureHTML
      ? App.getPictureHTML(entity, options)
      : null;
    if (node) node.style.color = '#fff';
    return node || document.createElement('div');
  };

  // History back with graceful fallback hash
  App.goBackWithFallback = function (returnHash, fallback = '#storyboard') {
    const target = returnHash || fallback;
    if (global.history.length > 1) {
      global.history.back();
      return;
    }
    global.location.hash = target;
  };

  // Convert entity/placeholder info into a picture node with white icon fallback
  App.getPictureNode = function (entity = {}, options = {}) {
    const node = App.getPictureHTML
      ? App.getPictureHTML(entity, options)
      : null;
    if (node) node.style.color = '#fff';
    return node || document.createElement('div');
  };

  // History back with graceful fallback hash
  App.goBackWithFallback = function (returnHash, fallback = '#storyboard') {
    const target = returnHash || fallback;
    if (global.history.length > 1) {
      global.history.back();
      return;
    }
    global.location.hash = target;
  };

  // ---------- Back with fallback ----------
  App.goBackWithFallback = function (fallbackHash = '#storyboard') {
    try {
      // If we have history, go back; otherwise navigate to fallback.
      if (history.length > 2) history.back();
      else global.location.hash = fallbackHash;
    } catch {
      global.location.hash = fallbackHash;
    }
  };

  // ---------- Chin open/close & focus visuals ----------
  App._closeChin = function () {
    const container = document.getElementById('chin-container');
    if (!container) return;
    container.querySelectorAll('.chin').forEach((p) => App.hideEl(p));
    App.hideEl(container);
    document.body.classList.remove('chin-open'); // ensure focus ring is off
    App.selectTopBarTab?.(null);
  };

  App._toggleChinContent = function (chin) {
    const container = document.getElementById('chin-container');
    if (!container) return;

    const panels = container.querySelectorAll('.chin');
    const target = chin ? container.querySelector(`[data-chin="${chin}"]`) : null;

    // Hide everything first
    panels.forEach((panel) => App.hideEl(panel));
    App.hideEl(container);
    document.body.classList.remove('chin-open');

    if (!target || target.classList.contains('is-open')) return;

    // Open requested panel
    App.showEl(container);
    App.showEl(target);
    document.body.classList.add('chin-open');

    const input = target.querySelector('.chin-search');
    if (input) input.focus();

    const c = target.dataset.chin;
    if (c === 'stories'    && typeof App.renderStoryList     === 'function') App.renderStoryList();
    if (c === 'characters' && typeof App.renderCharacterList === 'function') App.renderCharacterList();
    if (c === 'worlds'     && typeof App.renderWorldList     === 'function') App.renderWorldList();
  };

  // Ensure we close chin on ESC / outside click / route change
  App._ensureGlobalChinEvents = function () {
    if (App._chinEventsBound) return;
    App._chinEventsBound = true;

    window.addEventListener('hashchange', App._closeChin, { passive: true });
    document.addEventListener(
      'click',
      (e) => {
        const inside = e.target.closest?.('#chin-container, [data-open-chin]');
        if (!inside) App._closeChin();
      },
      { capture: true }
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') App._closeChin();
    });
  };

  // ---------- Picture node (image or placeholder SVG) ----------
  App.getPictureNode = function (entity = {}, { context } = {}) {
    const url = entity.imageUrl || entity.image;
    const title = entity.title || entity.name || '';
    const kind = (entity.kind || entity.type || '').toLowerCase();

    if (url) {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'lazy';
      img.alt = title || 'picture';
      img.src = url;
      img.className = 'picture';
      return img;
    }

    const wrap = document.createElement('div');
    wrap.className = 'picture-placeholder';
    wrap.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
    svg.setAttribute('fill', 'currentColor');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Simple icons: character (user), world (planet), story (book)
    const d =
      kind === 'world'
        ? 'M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-3.1a15 15 0 010 8h3.1a8 8 0 000-8zM5.2 8a8 8 0 000 8h3.1a15 15 0 010-8H5.2z'
        : kind === 'story'
        ? 'M6 4h9a3 3 0 013 3v11H8a2 2 0 00-2 2H5V6a2 2 0 011-2zm1 4h10V7a1 1 0 00-1-1H7v2z'
        : 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-5 0-8 3-8 5v1h16v-1c0-2-3-5-8-5z';
    path.setAttribute('d', d);
    svg.appendChild(path);
    wrap.appendChild(svg);
    return wrap;
  };
})(this);
