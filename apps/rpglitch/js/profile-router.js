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
      return;
    }
    if (section === 'form' && isType(type)) {
      App.setTopBarRight('form');
      App.hideEl('storyboard-screen');
      App.hideEl('profile-screen');
      App.renderForm?.(type, id || 'new');
      return;
    }
    if (section === 'storyboard') {
      App.setTopBarRight('storyboard');
      showStoryboard();
      return;
    }
    App.setTopBarRight('storyboard');
    showStoryboard();
  }

  global.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', () => {
    handleRoute();
    const sb = document.getElementById('storyboard-screen');
    if (sb && !sb._cardsBound) {
      sb._cardsBound = true;
      sb.addEventListener('click', (e) => {
        if (e.target.closest('select, option, button, a, input, textarea')) return;
        const card = e.target.closest('.storyboard-card');
        if (!card) return;
        const select = card.querySelector('select.storyboard-card-title');
        const type = card.dataset.type;
        const id = select && select.value;
        if (type && id) App.router.navigate(`#profile/${type}/${id}`);
      });
      sb.addEventListener('change', (e) => {
        const select = e.target.closest('select.storyboard-card-title');
        if (!select) return;
        e.preventDefault();
        e.stopPropagation();
        App.updateStoryboardCard?.(select.id, select.value);
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
