// apps/rpglitch/js/utils.js
;(function (global) {
  const App = (global.App = global.App || {});

  // Show/Hide helpers
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

  // Branding helper; accepts entity with palette/brandColor/color, else neutral
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

  // Selection helper for card lists/grids
  App.setSelected = function (el, all) {
    if (!el || !all) return;
    Array.from(all).forEach((node) => node.classList.toggle('selected', node === el));
  };

  // Parse #hash query into URLSearchParams
  // e.g. #profile/character/abc123?from=premade1  ->  get('from') === 'premade1'
  App.getHashQuery = function () {
    const h = global.location?.hash || '';
    const qIndex = h.indexOf('?');
    const q = qIndex >= 0 ? h.slice(qIndex + 1) : '';
    try {
      return new URLSearchParams(q);
    } catch {
      // very old browsers or weird input: gracefully degrade
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

  // Chin open/close visuals: ensure the body class reflects visibility
  App._closeChin = function () {
    const container = document.getElementById('chin-container');
    if (!container) return;
    container.querySelectorAll('.chin').forEach((p) => App.hideEl(p));
    App.hideEl(container);
    document.body.classList.remove('chin-open');
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

    // If no chin requested or clicking the already-open one => fully close
    if (!target || target.classList.contains('is-open')) return;

    // Open requested panel
    App.showEl(container);
    App.showEl(target);
    document.body.classList.add('chin-open');

    // Autofocus the search field if present
    const input = target.querySelector('.chin-search');
    if (input) input.focus();

    // Lazy render content by chin type
    const c = target.dataset.chin;
    if (c === 'stories'    && typeof App.renderStoryList     === 'function') App.renderStoryList();
    if (c === 'characters' && typeof App.renderCharacterList === 'function') App.renderCharacterList();
    if (c === 'worlds'     && typeof App.renderWorldList     === 'function') App.renderWorldList();
  };

  // Simple live-filter for chin grids
  App._attachChinSearchHandlers = function () {
    document.querySelectorAll('.chin-search').forEach((input) => {
      const container = input.closest('.chin') || input.closest('.chin-widget');
      const list = container?.querySelector('.chin-grid');
      if (!list) return;
      input.addEventListener('input', () => {
        const term = input.value.toLowerCase();
        list.querySelectorAll('[data-title]').forEach((card) => {
          const title = (card.dataset.title || '').toLowerCase();
          const match = title.includes(term);
          card.toggleAttribute('hidden', !match);
        });
      });
    });
  };
})(this);
