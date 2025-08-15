/* eslint-env browser */

(function (global) {
  const App = global.App || (global.App = {});
  const emptyCardHTML = new Map();

  function showStoryboard() {
    App.showEl('storyboard-screen');
    App.showEl('chin-container');
    App.hideEl('profile-screen');
    App.hideEl('character-form-screen');
    App.hideEl('world-form-screen');
  }

  function parseHash() {
    const [path] = global.location.hash.slice(1).split('?');
    return path.split('/').filter(Boolean);
  }

  function handleRoute() {
    const [section, type, id] = parseHash();
    const isType = (t) => t === 'character' || t === 'world';

    if (section === 'profile' && isType(type) && id) {
      App.setTopBarRight?.('profile');
      App.hideEl('storyboard-screen');
      App.hideEl('character-form-screen');
      App.hideEl('world-form-screen');
      App.renderProfile?.(type, id);
    } else if (section === 'form' && isType(type)) {
      App.setTopBarRight?.('form');
      App.hideEl('storyboard-screen');
      App.hideEl('profile-screen');
      App.renderForm?.(type, id || 'new');
    } else {
      // Default to storyboard for '#', '#storyboard', or unknown routes
      App.setTopBarRight?.('storyboard');
      showStoryboard();
    }
  }

  /**
   * Update a single storyboard card preview when its <select> changes.
   * Stays on storyboard (no navigation).
   */
  App.handleStoryboardSelect = function handleStoryboardSelect(selectEl) {
    const doc = global.document;
    const select = typeof selectEl === 'string' ? doc.getElementById(selectEl) : selectEl;
    if (!select) return;

    const card = select.closest('.storyboard-card');
    if (!card) return;

    const type = card.dataset.type; // 'character' | 'world' | 'ai'
    const id = select.value;

    if (!id) {
      const html = emptyCardHTML.get(card);
      if (html) card.innerHTML = html;
      card.dataset.entityId = '';
      card.classList.remove('is-selected');
      card.classList.add('empty-card');
      const ph = card.querySelector('[data-picture-host], .storyboard-card-left');
      if (ph) {
        ph.textContent = '';
        const pic = App.getPictureHTML ? App.getPictureHTML(null, { context: 'storyboard-card', cover: true }) : null;
        if (pic) ph.appendChild(pic);
      }
      App.setDynamicTitle?.();
      return;
    }

    card.dataset.entityId = id;
    card.classList.add('is-selected');
    card.classList.remove('empty-card');

    const entity = App.entities.get(type === 'ai' ? 'character' : type, id);
    const img = entity?.imageUrl || entity?.image || '';
    const normalized = entity ? { ...entity, image: img, imageUrl: img } : { id, kind: type };

    const host = card.querySelector('[data-picture-host], .storyboard-card-left');
    if (host) {
      host.textContent = '';
      const pic = App.getPictureHTML ? App.getPictureHTML(normalized, { context: 'storyboard-card', cover: true }) : null;
      if (pic) host.appendChild(pic);
    }

    const headerEl = card.querySelector('header');
    let titleEl = card.querySelector('h4.card-title');
    if (!titleEl && headerEl) {
      titleEl = doc.createElement('h4');
      titleEl.className = 'card-title';
      headerEl.appendChild(titleEl);
    }
    if (titleEl) titleEl.textContent = normalized.title || normalized.name || 'Empty';

    const right = card.querySelector('.storyboard-card-right');
    if (right) {
      let bodyEl = right.querySelector('.card-description');
      if (!bodyEl) {
        bodyEl = doc.createElement('p');
        bodyEl.className = 'card-description';
        const footer = right.querySelector('footer');
        right.insertBefore(bodyEl, footer);
      }
      bodyEl.textContent = normalized.summary || normalized.description || '';
    }

    const small = card.querySelector('footer small');
    if (small) {
      const premade = normalized.isPremade ? 'Premade' : '';
      const tags = normalized.tags?.join(', ') || '';
      small.textContent = [premade, tags].filter(Boolean).join(' | ');
    }

    const profile = doc.getElementById('profile-screen');
    if (profile && !profile.hidden && profile.dataset.entityId === id) {
      const heroImg = profile.querySelector('.hero-wrap .entity-image, .hero-wrap .placeholder-image');
      const pic = App.getPictureHTML ? App.getPictureHTML(normalized, { cover: true }) : null;
      if (pic && heroImg) heroImg.replaceWith(pic);
    }

    App.setDynamicTitle?.();
  };

  // A lower-level helper used elsewhere (kept public)
  App.updateStoryboardCard = App.handleStoryboardSelect;

  // Wiring
  global.addEventListener('hashchange', handleRoute);

  document.addEventListener('DOMContentLoaded', () => {
    handleRoute();

    const doc = global.document;
    const sb = doc.getElementById('storyboard-screen');
    if (sb && !sb._cardsBound) {
      sb.querySelectorAll('.storyboard-card').forEach((card) => {
        emptyCardHTML.set(card, card.innerHTML);
      });
      sb._cardsBound = true;

      const isInteractive = (el) => el.closest('select,button,a,[role="button"],input,textarea');

      // Click a **card** → navigate to its profile (ignore clicks on controls)
      sb.addEventListener('click', (e) => {
        if (isInteractive(e.target)) return;
        const card = e.target.closest('.storyboard-card');
        if (!card) return;
        const type = card.dataset.type;
        const id = card.dataset.entityId;
        if (type && id) App.router.navigate(`#profile/${type}/${id}`);
      });

      // Change a card’s dropdown → update preview only
      sb.addEventListener('change', (e) => {
        const select = e.target.closest('select.storyboard-card-title');
        if (!select) return;
        e.preventDefault();
        e.stopPropagation();
        App.handleStoryboardSelect(select);
      });
    }

    // Chin tab buttons: selected/focus handling
    doc.querySelectorAll('button[data-chin]').forEach((btn) => {
      btn.classList.add('chin-button');
      btn.addEventListener('click', () => App.activateChin(btn));
    });

    // Prevent search form reload; convert button to clear
    doc.querySelectorAll('form[role="search"]').forEach((form) => {
      form.addEventListener('submit', (e) => e.preventDefault());
      const btn = form.querySelector('button');
      if (btn) {
        btn.type = 'button';
        btn.addEventListener('click', () => {
          form.querySelectorAll('input[type="search"]').forEach((i) => { i.value = ''; });
          App.refreshAllLists?.();
        });
      }
    });
  });

  // Router surface
  App.router = {
    navigate(hash) { global.location.hash = hash; },
    parseHash,
    handleRoute
  };

  App.activateChin = (btn) => {
    if (!btn) return;
    const group = btn.closest('[data-chin-group]');
    group?.querySelectorAll('.chin-button.selected').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    btn.focus();
  };
})(typeof window !== 'undefined' ? window : globalThis);
