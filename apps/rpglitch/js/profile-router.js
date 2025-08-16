/* eslint-env browser */

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

  // legacy helper removed in favor of App.updateStoryboardCard

  // Wiring
  global.addEventListener('hashchange', handleRoute);

  document.addEventListener('DOMContentLoaded', () => {
    handleRoute();

    const doc = global.document;

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
    const group = btn.closest('[role="tablist"]');
    group?.querySelectorAll('.chin-button.selected').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    btn.focus();
  };
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  const root = global.document;
  root.querySelectorAll('details[id^="chin-"], .chin').forEach((el) => {
    el.addEventListener('toggle', () => {
      if (!el.open) {
        el.querySelectorAll('.button--focused').forEach((b) => b.classList.remove('button--focused'));
      }
    }, { capture: true });
  });
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  // removed: card click handling now in RPGlitch.js
})(typeof window !== 'undefined' ? window : globalThis);
