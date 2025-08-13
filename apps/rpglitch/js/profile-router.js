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
      App.hideEl('storyboard-screen');
      App.hideEl('character-form-screen');
      App.hideEl('world-form-screen');
      App.renderProfile?.(type, id);
      App.setTopBarRight('profile');
      return;
    }
    if (section === 'form' && isType(type)) {
      App.hideEl('storyboard-screen');
      App.hideEl('profile-screen');
      App.renderForm?.(type, id || 'new');
      App.setTopBarRight('form');
      return;
    }
    if (section === 'storyboard') {
      showStoryboard();
      App.setTopBarRight('storyboard');
      return;
    }
    showStoryboard();
    App.setTopBarRight('storyboard');
  }

  global.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', () => {
    handleRoute();
    const sb = document.getElementById('storyboard-screen');
    if (sb && !sb._cardsBound) {
      sb._cardsBound = true;
      sb.addEventListener('click', (e) => {
        const card = e.target.closest('.storyboard-card');
        if (!card) return;
        const select = card.querySelector('select.storyboard-card-title');
        const type = card.dataset.type;
        const id = select && select.value;
        if (type && id) App.router.navigate(`#profile/${type}/${id}`);
      });
    }
  });

  App.router = {
    navigate(hash) { global.location.hash = hash; },
    parseHash,
    handleRoute
  };
})(typeof window !== 'undefined' ? window : globalThis);
