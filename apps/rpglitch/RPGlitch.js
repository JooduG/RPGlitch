/* global module */
// Main RPGlitch application namespace
// eslint-disable-next-line no-redeclare
const App = window.App || {};
window.App = App;

// Map utility helpers to App namespace with fallbacks
App.hideEl = window.hideEl || function (el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.setAttribute('hidden', 'hidden');
  return el;
};

App.showEl = window.showEl || function (el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.removeAttribute('hidden');
  return el;
};

const DATA_KEYS = ['stories', 'characters', 'worlds'];

// Highlight the active top bar tab and update ARIA attributes
App.selectTopBarTab = function (btn) {
  const ui = App._getUIElements();
  if (!ui.topBarButtons) return;
  ui.topBarButtons.forEach((b) => {
    const active = b === btn;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
    b.setAttribute('aria-expanded', active ? 'true' : 'false');
    b.setAttribute('tabindex', active ? '0' : '-1');
    if (active) App._lastActiveTab = b;
  });
};

/**
 * Collects key DOM elements used by the app and stores them on App.ui.
 * Safely checks for element existence to avoid null dereferences in tests.
 */
App._getUIElements = function () {
  const doc = document;
  const ui = App.ui || {};

  ui.topBarLeft = ui.topBarLeft || doc.getElementById('top-bar-left');
  ui.chinContainer = ui.chinContainer || doc.getElementById('chin-container');
  ui.topBarButtons = ui.topBarButtons || (ui.topBarLeft ? ui.topBarLeft.querySelectorAll('button[data-chin]') : []);

  // Option chin actions
  ui.uploadBackupInput = ui.uploadBackupInput || doc.getElementById('upload-backup');
  ui.uploadBackupTrigger = ui.uploadBackupTrigger || doc.querySelector('[data-trigger="upload-backup"]');
  ui.downloadBackupButton = ui.downloadBackupButton || doc.getElementById('download-backup');
  ui.deleteAllDataButton = ui.deleteAllDataButton || doc.getElementById('delete-all-data');

  // Story chin actions
  ui.newStoryButton = ui.newStoryButton || doc.getElementById('new-story');
  ui.uploadStoryTrigger = ui.uploadStoryTrigger || doc.querySelector('[data-trigger="upload-story"]');
  ui.uploadStoryInput = ui.uploadStoryInput || doc.getElementById('upload-story');

  // Character chin actions
  ui.newCharacterButton = ui.newCharacterButton || doc.getElementById('new-character');
  ui.uploadCharacterTrigger = ui.uploadCharacterTrigger || doc.querySelector('[data-trigger="upload-character"]');
  ui.uploadCharacterInput = ui.uploadCharacterInput || doc.getElementById('upload-character');

  // World chin actions
  ui.newWorldButton = ui.newWorldButton || doc.getElementById('new-world');
  ui.uploadWorldTrigger = ui.uploadWorldTrigger || doc.querySelector('[data-trigger="upload-world"]');
  ui.uploadWorldInput = ui.uploadWorldInput || doc.getElementById('upload-world');

  App.ui = ui;
  return ui;
};

/**
 * Reveals the chin container and the specified chin panel.
 * @param {string} chin - The value of the data-chin attribute to reveal.
 */
App._toggleChinContent = function (chin) {
  if (!chin) return;
  const ui = App._getUIElements();
  const container = ui.chinContainer;
  if (!container) return;
  const target = container.querySelector(`[data-chin="${chin}"]`);
  const wasHidden = !target || target.hasAttribute('hidden');
  const panels = container.querySelectorAll('.chin-panel');
  panels.forEach((panel) => App.hideEl(panel));
  if (!target) return;

  if (!wasHidden) {
    App._closeChin();
    return;
  }

  App.showEl(container);
  App.showEl(target);

  const input = target.querySelector('.chin-search');
  if (input) input.focus();

  if (chin === 'stories' && typeof App.renderStoryList === 'function') App.renderStoryList();
  if (chin === 'characters' && typeof App.renderCharacterList === 'function') App.renderCharacterList();
  if (chin === 'worlds' && typeof App.renderWorldList === 'function') App.renderWorldList();
};

App._closeChin = function () {
  const ui = App._getUIElements();
  const container = ui.chinContainer;
  if (!container) return;
  const panels = container.querySelectorAll('.chin-panel');
  panels.forEach((p) => App.hideEl(p));
  App.hideEl(container);
  const last = App._lastActiveTab;
  App.selectTopBarTab(null);
  if (last) last.focus();
};

// UI helpers for toggling chin visibility and initializing listeners
App.ui = App.ui || {};

App.ui.showChin = function (chinId) {
  if (!chinId) return;
  App._toggleChinContent(chinId);
};

App.ui.setupChinListeners = function () {
  App._attachTopBarEventListeners();
};

App._attachChinSearchHandlers = function () {
  const inputs = document.querySelectorAll('.chin-search');
  inputs.forEach((input) => {
    const panel = input.closest('.chin-panel');
    const list = panel ? panel.querySelector('.chin-list') : null;
    if (!list) return;
    input.addEventListener('input', () => {
      const term = input.value.toLowerCase();
      list.querySelectorAll('[data-title]').forEach((el) => {
        const title = (el.dataset.title || '').toLowerCase();
        const match = title.includes(term);
        if (match) App.showEl(el); else App.hideEl(el);
      });
    });
  });
};

function loadStoredItems(key) {
  try {
    const storage = window.localStorage;
    if (!storage) return [];
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Failed to parse localStorage item with key "${key}":`, e);
    return [];
  }
}

App.premade = App.premade || {
  stories: [],
  characters: [
    {
      id: 'char-1',
      title: 'Aether Blade',
      description: 'Cybernetic warrior forging light into weapons.'
    },
    {
      id: 'char-2',
      title: 'Mystic Bard',
      description: 'Traveling musician who weaves spells with song.'
    },
    {
      id: 'char-3',
      title: 'Clockwork Rogue',
      description: 'Stealthy thief powered by ticking gears.'
    },
    {
      id: 'char-4',
      title: 'Shadow Whisperer',
      description: 'Mysterious figure communing with darkness.'
    }
  ],
  worlds: [
    {
      id: 'world-1',
      title: 'Eldoria',
      description: 'Floating isles bound by ancient magic.'
    },
    {
      id: 'world-2',
      title: 'Neo Arcadia',
      description: 'Futuristic metropolis built on dream tech.'
    }
  ]
};

App.getPremadeItems = App.getPremadeItems || function (key) {
  const bank = App.premade || {};
  const list = bank[key];
  return Array.isArray(list) ? list : [];
};

App.getPremadeStories = App.getPremadeStories || function () {
  return App.getPremadeItems('stories');
};

App.getPremadeCharacters = App.getPremadeCharacters || function () {
  return App.getPremadeItems('characters');
};

App.getPremadeWorlds = App.getPremadeWorlds || function () {
  return App.getPremadeItems('worlds');
};

App._allItemsCache = App._allItemsCache || {};

App.getAllItems = App.getAllItems || function (key, refresh = false) {
  if (!refresh && Array.isArray(App._allItemsCache[key])) return App._allItemsCache[key];
  const premade = App.getPremadeItems(key).map((item) => ({ ...item, isPremade: true }));
  const stored = loadStoredItems(key).map((item) => ({ ...item, isPremade: false }));
  App._allItemsCache[key] = premade.concat(stored);
  return App._allItemsCache[key];
};

function renderList(containerId, key) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = '';
  const all = App.getAllItems(key);
  if (key === 'stories' && all.length === 0) {
    const message = document.createElement('p');
    message.className = 'story-item-empty-message';
    message.textContent = 'Empty here—time to write your first story!';
    container.appendChild(message);
    return;
  }
  all.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'chin-card';
    card.dataset.title = item.title;
    if (item.isPremade) card.dataset.premade = 'true';

    const left = document.createElement('div');
    left.className = 'chin-card-left';

    const article = document.createElement('article');
    article.className = 'chin-card';

    const header = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = item.title || '';
    header.appendChild(h4);

    article.appendChild(header);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'card-description';
      desc.textContent = item.description;
      article.appendChild(desc);
    }

    if (item.isPremade) {
      const footer = document.createElement('footer');
      const small = document.createElement('small');
      small.textContent = 'Premade';
      footer.appendChild(small);
      article.appendChild(footer);
    }
    
    left.appendChild(article);
    card.appendChild(left);
    container.appendChild(card);
  });
}

function renderDropdown(selectId, key) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const placeholderOption = select.querySelector('option[value=""]');
  const placeholder = placeholderOption ? placeholderOption.cloneNode(true) : document.createElement('option');
  if (!placeholderOption) {
    placeholder.value = '';
    placeholder.textContent = '';
  }
  select.textContent = '';
  select.appendChild(placeholder);
  const items = App.getAllItems(key);
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id || item.title;
    option.textContent = item.title + (item.isPremade ? ' (Premade)' : '');
    if (item.isPremade) option.dataset.premade = 'true';
    select.appendChild(option);
  });
}

App.renderDropdown = App.renderDropdown || renderDropdown;

App.refreshAllLists = App.refreshAllLists || function () {
  DATA_KEYS.forEach((key) => App.getAllItems(key, true));
  App.renderStoryList?.();
  App.renderCharacterList?.();
  App.renderWorldList?.();
  App.renderDropdown?.('storyboard-ai-select', 'characters');
  App.renderDropdown?.('storyboard-user-select', 'characters');
  App.renderDropdown?.('storyboard-world-select', 'worlds');
};

App.renderStoryList = App.renderStoryList || function () {
  renderList('chin-story-grid', 'stories');
};

App.renderCharacterList = App.renderCharacterList || function () {
  renderList('chin-character-grid', 'characters');
};

App.renderWorldList = App.renderWorldList || function () {
  renderList('chin-world-grid', 'worlds');
};

App.updateStoryboardCard = App.updateStoryboardCard || function (selectId, key) {
  const select = typeof selectId === 'string' ? document.getElementById(selectId) : selectId;
  if (!select) return;
  const card = select.closest('.storyboard-card');
  if (!card) return;
  const article = card.querySelector('.storyboard-card-right');
  if (!article) return;
  const headerEl = article.querySelector('header');
  let heading = headerEl ? headerEl.querySelector('.card-title-selected') : null;
  const footer = article.querySelector('footer');
  const oldTitle = article.querySelector('.card-title');
  if (oldTitle) oldTitle.remove();
  let descEl = article.querySelector('.card-description');
  if (!descEl) {
    const textNode = Array.from(article.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const placeholder = textNode ? textNode.textContent.trim() : '';
    if (textNode) article.removeChild(textNode);
    descEl = document.createElement('p');
    descEl.className = 'card-description';
    descEl.textContent = placeholder;
    descEl.dataset.placeholder = placeholder;
    article.insertBefore(descEl, footer);
  }
  const small = footer ? footer.querySelector('small') : null;
  const img = card.querySelector('.storyboard-card-left img');
  if (img && !img.dataset.placeholderSrc) img.dataset.placeholderSrc = img.src;
  const value = select.value;
  const item = App.getAllItems(key).find((i) => (i.id ?? i.title) === value);
  if (item) {
    descEl.textContent = item.description || '';
    if (small) small.textContent = item.isPremade ? 'Premade' : '';
    if (img) {
      if (item.image) img.src = item.image;
      img.alt = item.title || '';
    }
    if (headerEl) {
      if (!heading) {
        heading = document.createElement('h4');
        heading.className = 'card-title-selected';
        heading.addEventListener('click', () => {
          select.hidden = false;
          heading.hidden = true;
          select.focus();
        });
        headerEl.appendChild(heading);
      }
      heading.textContent = item.title || '';
      heading.hidden = false;
    }
    select.hidden = true;
  } else {
    descEl.textContent = descEl.dataset.placeholder || '';
    if (small) small.textContent = '';
    if (img) {
      img.src = img.dataset.placeholderSrc || img.src;
      img.alt = '';
    }
    select.hidden = false;
    if (heading) heading.hidden = true;
  }
};

App._attachStoryboardListeners = App._attachStoryboardListeners || function () {
  const configs = [
    { id: 'storyboard-ai-select', key: 'characters' },
    { id: 'storyboard-user-select', key: 'characters' },
    { id: 'storyboard-world-select', key: 'worlds' }
  ];
  configs.forEach(({ id, key }) => {
    const select = document.getElementById(id);
    if (select) select.addEventListener('change', () => App.updateStoryboardCard(id, key));
  });
};

// Track attached listeners to avoid duplicates
App._attachedTopBarButtons = App._attachedTopBarButtons || new Set();
App._optionsListenersAttached = App._optionsListenersAttached || false;
App._contentListenersAttached = App._contentListenersAttached || false;
App._outsideChinListenerAttached = App._outsideChinListenerAttached || false;
App._lastActiveTab = App._lastActiveTab || null;

App._attachOptionChinActions = function () {
  if (App._optionsListenersAttached) return;
  const ui = App._getUIElements();
  const {
    uploadBackupTrigger,
    uploadBackupInput,
    downloadBackupButton,
    deleteAllDataButton
  } = ui;

  if (uploadBackupTrigger && uploadBackupInput) {
    uploadBackupTrigger.addEventListener('click', () => uploadBackupInput.click());
      uploadBackupInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && typeof App.importAllData === 'function') App.importAllData(file);
      });
  }

  if (downloadBackupButton) {
    downloadBackupButton.addEventListener('click', () => {
      if (typeof App.exportAllData === 'function') App.exportAllData();
    });
  }

  if (deleteAllDataButton) {
    deleteAllDataButton.addEventListener('click', () => {
      if (typeof App.deleteAllData === 'function') App.deleteAllData();
    });
  }

  App._optionsListenersAttached = true;
};

App._attachContentChinActions = function () {
  if (App._contentListenersAttached) return;
  const ui = App._getUIElements();
  const configs = [
    {
      key: 'stories',
      singular: 'story',
      newButton: ui.newStoryButton,
      uploadTrigger: ui.uploadStoryTrigger,
      uploadInput: ui.uploadStoryInput
    },
    {
      key: 'characters',
      singular: 'character',
      newButton: ui.newCharacterButton,
      uploadTrigger: ui.uploadCharacterTrigger,
      uploadInput: ui.uploadCharacterInput
    },
    {
      key: 'worlds',
      singular: 'world',
      newButton: ui.newWorldButton,
      uploadTrigger: ui.uploadWorldTrigger,
      uploadInput: ui.uploadWorldInput
    }
  ];

  configs.forEach(({ key, singular, newButton, uploadTrigger, uploadInput }) => {
    if (newButton) {
      newButton.addEventListener('click', () => {
        const title = window.prompt(`New ${singular} title?`);
        if (!title) return;
        const item = { title };
        const current = loadStoredItems(key);
        current.push(item);
        window.localStorage.setItem(key, JSON.stringify(current));
        App.refreshAllLists();
      });
    }

    if (uploadTrigger && uploadInput) {
      uploadTrigger.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) return;
            const current = loadStoredItems(key);
            window.localStorage.setItem(key, JSON.stringify(current.concat(data)));
            App.refreshAllLists();
          } catch (err) {
            console.error('Failed to import', err);
          }
          uploadInput.value = null;
        };
        reader.readAsText(file);
      });
    }
  });

  App._contentListenersAttached = true;
};

/**
 * Attaches event listeners for top bar interactions.
 * Guards against attaching duplicate listeners across multiple invocations.
 */
App._attachTopBarEventListeners = function () {
  const ui = App._getUIElements();
  if (!ui) return;

  if (ui.topBarButtons) {
    ui.topBarButtons.forEach((btn) => {
      if (!App._attachedTopBarButtons.has(btn)) {
        btn.addEventListener('click', () => {
          App.selectTopBarTab(btn);
          App.ui.showChin(btn.dataset.chin);
        });
        App._attachedTopBarButtons.add(btn);
      }
    });
  }

  App._attachOptionChinActions();
  App._attachContentChinActions();

  if (!App._outsideChinListenerAttached) {
    document.addEventListener('click', (e) => {
      const current = App.ui || App._getUIElements();
      if (!current.chinContainer || current.chinContainer.hasAttribute('hidden')) return;
      if (current.chinContainer.contains(e.target) || current.topBarLeft.contains(e.target)) return;
      e.preventDefault();
      App._closeChin();
    });
    App._outsideChinListenerAttached = true;
  }
};

App.initializeWhenReadyRetryCount = App.initializeWhenReadyRetryCount || 0;

/**
 * Initializes the application once dependencies and DOM are ready.
 * Sets default database name, collects UI elements, and runs initial load.
 */
App.initializeWhenReady = async function () {
  if (typeof window.dbName === 'undefined') {
    window.dbName = 'rpglitch-db';
  }

  try {
    App._getUIElements();
    App.ui.setupChinListeners();
    App._attachChinSearchHandlers();
    if (typeof App.initialLoad === 'function') {
      await App.initialLoad();
    }
    App.refreshAllLists?.();
    App._attachStoryboardListeners?.();
    App.initializeWhenReadyRetryCount = 0;
  } catch (error) {
    App.initializeWhenReadyRetryCount += 1;
    console.error("Failed to initialize App:", error);
  }
};

App.importAllData = function (file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      DATA_KEYS.forEach((key) => {
        if (Array.isArray(data[key])) {
          window.localStorage.setItem(key, JSON.stringify(data[key]));
        }
      });
      App.refreshAllLists();
    } catch (err) {
      console.error('Failed to import backup', err);
    } finally {
      const ui = App._getUIElements();
      if (ui.uploadBackupInput) ui.uploadBackupInput.value = null;
    }
  };
  reader.readAsText(file);
};

App.exportAllData = function () {
  const data = {};
  DATA_KEYS.forEach((key) => {
    try {
      const value = window.localStorage.getItem(key);
      data[key] = value ? JSON.parse(value) : [];
    } catch {
      data[key] = [];
    }
  });
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rpglitch-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

App.deleteAllData = function () {
  DATA_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
  App.refreshAllLists();
};

// Export for Node-based tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
