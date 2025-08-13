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

  App.updateStoryboardCard = function (cardEl, type, id) {
    const doc = global.document;
    const card = typeof cardEl === 'string' ? doc.getElementById(cardEl) : cardEl;
    if (!card) return;
    card.dataset.type = type;
    card.dataset.id = id || '';
    const entity = id ? App.entities.get(type, id) : null;
    const left = card.querySelector('.storyboard-card-left');
    if (left) {
      left.innerHTML = '';
      if (entity) {
        const pic = global.getPictureHTML ? global.getPictureHTML(entity, null, 'storyboard-card-left') : null;
        if (pic) left.appendChild(pic);
      }
    }
    const titleSel = card.querySelector('select.storyboard-card-title');
    if (titleSel && titleSel.value !== id) titleSel.value = id || '';
    const small = card.querySelector('footer small');
    if (small) {
      const premadeText = entity?.isPremade ? 'Premade' : '';
      const tagsText = entity?.tags?.join(', ') || '';
      small.textContent = [premadeText, tagsText].filter(Boolean).join(' | ');
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
        const type = card.dataset.type;
        const id = select.value;
        App.updateStoryboardCard?.(card, type, id);
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
