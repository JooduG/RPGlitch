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

    // ---------- Image helper ----------
    App.getPictureNode =
      App.getPictureNode ||
      function getPictureNode(entity, opts = {}) {
        const html = (global.getPictureHTML || globalThis.getPictureHTML)?.(
          entity || {},
          opts
        ) || '';
        const frag = global.document
          .createRange()
          .createContextualFragment(html);
        return frag.firstElementChild || global.document.createElement('div');
      };

    // ---------- Navigation shims ----------
    App.navigateBackOrReturnDefault =
      App.navigateBackOrReturnDefault ||
      function (returnTo = '#storyboard') {
        const q = App.getHashQuery?.() || new URLSearchParams('');
        const fallback = q.get('return') || returnTo;
        App.router?.navigate?.(fallback);
      };

    App.goBackWithFallback =
      App.goBackWithFallback ||
      function (returnTo = '#storyboard', fallback = '#storyboard') {
        try {
          App.navigateBackOrReturnDefault?.(returnTo) ??
            App.router?.navigate(fallback);
        } catch {
          App.router?.navigate?.(fallback);
        }
      };

  // ---------- Chin open/close & focus visuals ----------
    App._closeChin = function () {
      const container = document.getElementById('chin-container');
      if (!container) return;
      container.querySelectorAll('.chin').forEach((p) => App.hideEl(p));
      App.hideEl(container);
      document.body.classList.remove('chin-open');
      App.selectTopBarTab?.(null);
    };

    App._closeChin = (function (prev) {
      return function (...args) {
        prev?.apply(this, args);
        requestAnimationFrame(() => {
          global.document.activeElement?.blur();
          global.document.body.classList.remove('chin-open');
        });
      };
    })(App._closeChin);

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

  })(this);
