(function (global) {
  const App = global.App || (global.App = {});

  function showStoryboard() {
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
      App.renderProfile?.(type, id);
      App.setTopBarRight('profile');
      return;
    }
    if (section === 'form' && isType(type)) {
      App.renderForm?.(type, id);
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
  document.addEventListener('DOMContentLoaded', handleRoute);

  App.router = {
    navigate(hash) { global.location.hash = hash; },
    parseHash,
    handleRoute
  };
})(typeof window !== 'undefined' ? window : globalThis);
