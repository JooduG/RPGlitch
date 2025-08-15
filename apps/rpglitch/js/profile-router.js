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
      App.setDynamicTitle?.();
      return;
    }

    card.dataset.entityId = id;
    card.classList.add('is-selected');
    card.classList.remove('empty-card');

    // Render preview using the shared helper so image/title stay consistent
    const entity = App.entities.get(type === 'ai' ? 'character' : type, id);
    const unified = entity?.imageUrl || entity?.image || '';
    if (entity) {
      entity.image = unified;
      entity.imageUrl = unified;
    }

    const left = card.querySelector('.storyboard-card-left');
    if (left) {
      left.textContent = '';
      const pic = global.getPictureHTML
        ? global.getPictureHTML(entity || { id: '', kind: type }, { cover: true })
        : null;
      if (pic) left.appendChild(pic);
    }

    const headerEl = card.querySelector('header');
    let titleEl = card.querySelector('h4.card-title');
    if (!titleEl && headerEl) {
      titleEl = doc.createElement('h4');
      titleEl.className = 'card-title';
      headerEl.appendChild(titleEl);
    }
    if (titleEl) titleEl.textContent = entity?.title || entity?.name || 'Empty';

    const small = card.querySelector('footer small');
    if (small) {
      const premade = entity?.isPremade ? 'Premade' : '';
      const tags = entity?.tags?.join(', ') || '';
      small.textContent = [premade, tags].filter(Boolean).join(' | ');
    }

    const profile = doc.getElementById('profile-screen');
    if (profile && !profile.hidden && profile.dataset.entityId === id) {
      const heroImg = profile.querySelector('.hero-wrap .entity-image, .hero-wrap .placeholder-image');
      const pic = global.getPictureHTML
        ? global.getPictureHTML(entity || { id: '', kind: type }, { cover: true })
        : null;
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

    const sb = document.getElementById('storyboard-screen');
    if (sb && !sb._cardsBound) {
      sb.querySelectorAll('.storyboard-card').forEach((card) => {
        emptyCardHTML.set(card, card.innerHTML);
      });
      sb._cardsBound = true;

      // Click a **card** → navigate to its profile (ignore clicks on controls)
      sb.addEventListener('click', (e) => {
        if (e.target.closest('select, button, a, input, textarea')) return;
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
  });

  // Router surface
  App.router = {
    navigate(hash) { global.location.hash = hash; },
    parseHash,
    handleRoute
  };
})(typeof window !== 'undefined' ? window : globalThis);
