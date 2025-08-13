(function (global) {
  const App = global.App || (global.App = {});

  function showStoryboard() {
    App.setTopBarRight('storyboard');
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
      showStoryboard();
    }
  }

  global.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', () => {
      const origUpdate = App.updateStoryboardCard;
      App.updateStoryboardCard = function (selectId, key) {
        origUpdate?.(selectId, key);
        const select = typeof selectId === 'string' ? document.getElementById(selectId) : selectId;
        if (!select) return;
        const card = select.closest('.storyboard-card');
        const small = card?.querySelector('footer small');
        const item = App.getAllItems?.(key).find((i) => (i.id ?? i.title) === select.value);
        if (small) {
          const premadeText = item?.isPremade ? 'Premade' : '';
          const tagsText = item?.tags?.join(', ') || '';
          small.textContent = [premadeText, tagsText].filter(Boolean).join(' | ');
        }
      };
      handleRoute();
      const sb = document.getElementById('storyboard-screen');
      if (sb && !sb._cardsBound) {
        sb._cardsBound = true;
        sb.addEventListener('click', (e) => {
          if (e.target.closest('select')) return;
          const card = e.target.closest('.storyboard-card');
          if (!card) return;
          const { entityType, entityId } = card.dataset;
          if (entityType && entityId) App.router.navigate(`#profile/${entityType}/${entityId}`);
        });
        sb.addEventListener('change', (e) => {
          const select = e.target.closest('select.storyboard-card-title');
          if (!select) return;
          e.preventDefault();
          e.stopPropagation();
          const key = `${select.closest('.storyboard-card').dataset.type}s`;
          App.updateStoryboardCard?.(select.id, key);
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
