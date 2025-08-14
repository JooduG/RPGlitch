(function (global) {
  const App = global.App || (global.App = {});

  function showStoryboard() {
    App.showEl('storyboard-screen');
    App.showEl('chin-container');
    App.hideEl('profile-screen');
    App.hideEl('character-form-screen');
    App.hideEl('world-form-screen');
  }

  function parseHash() {
    return global.location.hash.slice(1).split('/').filter(Boolean);
  }

  function handleRoute() {
    const [section, type, id] = parseHash();
    const isType = (t) => t === 'character' || t === 'world';
    if (section === 'profile' && isType(type) && id) {
      App.setTopBarRight('profile');
      App.hideEl('storyboard-screen');
      App.hideEl('character-form-screen');
      App.hideEl('world-form-screen');
      App.renderProfile?.(type, id);
    } else if (section === 'form' && isType(type)) {
      App.setTopBarRight('form');
      App.hideEl('storyboard-screen');
      App.hideEl('profile-screen');
      App.renderForm?.(type, id || 'new');
    } else {
      App.setTopBarRight('storyboard');
      showStoryboard();
    }
  }

  App.updateStoryboardCard = function (selectEl, collection) {
    const doc = global.document;
    const select = typeof selectEl === 'string' ? doc.getElementById(selectEl) : selectEl;
    if (!select) return;
    const card = select.closest('.storyboard-card');
    if (!card) return;
    const type = collection.slice(0, -1);
    const id = select.value;
    const entity = id ? App.entities.get(type, id) : null;
    if (entity) {
      const unified = entity.imageUrl || entity.image || '';
      entity.image = unified;
      entity.imageUrl = unified;
    }
    card.classList.toggle('empty-card', !entity);
    const group = card.querySelector('.storyboard-card-buttons');
    if (group) {
      group.querySelectorAll('button').forEach((btn) => btn.classList.remove('selected'));
      if (id) group.querySelector(`[data-id="${id}"]`)?.classList.add('selected');
    }
    const left = card.querySelector('.storyboard-card-left');
    if (left) {
      left.textContent = '';
      if (entity) {
        const pic = global.getPictureHTML?.(entity, 'storyboard-card-picture');
        if (pic) left.appendChild(pic);
      }
    }
    const headerEl = card.querySelector('header');
    let titleEl = card.querySelector('h4.card-title');
    if (!titleEl && headerEl) {
      titleEl = doc.createElement('h4');
      titleEl.className = 'card-title';
      headerEl.appendChild(titleEl);
    }
    if (titleEl) titleEl.textContent = entity?.title || entity?.name || '';
    card.dataset.entityId = id || '';
    const small = card.querySelector('footer small');
    if (small) {
      const premadeText = entity?.isPremade ? 'Premade' : '';
      const tagsText = entity?.tags?.join(', ') || '';
      small.textContent = [premadeText, tagsText].filter(Boolean).join(' | ');
    }
    const profile = doc.getElementById('profile-screen');
    if (profile && !profile.hidden && profile.dataset.entityId === id) {
      const heroImg = profile.querySelector('.hero-wrap img');
      const pic = entity ? global.getPictureHTML?.(entity, 'profile-background') : null;
      if (pic && heroImg) heroImg.replaceWith(pic);
    }
  };

  global.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', () => {
    handleRoute();
    const sb = document.getElementById('storyboard-screen');
    if (sb && !sb._cardsBound) {
      sb._cardsBound = true;
        sb.addEventListener('click', (e) => {
          if (e.target.closest('select')) return;
          if (e.target.closest('option, button, a, input, textarea')) return;
          const card = e.target.closest('.storyboard-card');
          if (!card) return;
          const { type, id } = card.dataset;
          if (type && id) App.router.navigate(`#profile/${type}/${id}`);
        });
      sb.addEventListener('change', (e) => {
        const select = e.target.closest('select.storyboard-card-title');
        if (!select) return;
        e.preventDefault();
        e.stopPropagation();
        const card = select.closest('.storyboard-card');
        if (!card) return;
        const collection = `${card.dataset.type}s`;
        App.updateStoryboardCard?.(select, collection);
        App.setDynamicTitle?.();
      });
    }
  });

  App.router = {
    navigate(hash) { global.location.hash = hash; },
    parseHash,
    handleRoute
  };
})(typeof window !== 'undefined' ? window : globalThis);
