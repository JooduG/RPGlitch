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
  let anyActive = false;
  ui.topBarButtons.forEach((b) => {
    const active = b === btn;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
    b.setAttribute('aria-expanded', active ? 'true' : 'false');
    b.setAttribute('tabindex', active ? '0' : '-1');
    if (active) {
      App._lastActiveTab = b;
      anyActive = true;
    }
  });
  if (!anyActive && ui.topBarButtons.length > 0) {
    ui.topBarButtons[0].setAttribute('tabindex', '0');
  }
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
  const panels = container.querySelectorAll('.chin');
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
  const panels = container.querySelectorAll('.chin');
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
    const container = input.closest('.chin-panel') || input.closest('.chin-widget');
    const list = container?.querySelector('.chin-list');
    if (!list) return;
    input.addEventListener('input', () => {
      const term = input.value.toLowerCase();
      list.querySelectorAll('[data-title]').forEach((card) => {
        const title = (card.dataset.title || '').toLowerCase();
        const match = title.includes(term);
        card.toggleAttribute('hidden', !match);
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

function addItem(key, item) {
  const current = loadStoredItems(key);
  current.push(item);
  window.localStorage.setItem(key, JSON.stringify(current));
}


App.addStory = function (item) {
  addItem('stories', item);
};

App.addCharacter = function (item) {
  addItem('characters', item);
};

App.addWorld = function (item) {
  addItem('worlds', item);
};

const addMap = {
  stories: App.addStory,
  characters: App.addCharacter,
  worlds: App.addWorld
};

const entityFormPath = '__ENTITY_FORM__';
const modalExportMap = {
  stories: 'openStoryModal',
  characters: 'openCharacterModal',
  worlds: 'openWorldModal'
};

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
    message.className = 'chin-empty';
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

    if (typeof window.getPictureHTML === 'function') {
      const frag = document.createRange().createContextualFragment(
        window.getPictureHTML(item, item.colorPalette, 'chin-card')
      );
      left.appendChild(frag);
    }

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
  const existingPlaceholder = select.querySelector('option[value=""]');
  const placeholderText = existingPlaceholder
    ? existingPlaceholder.textContent
    : select.dataset.placeholder || '';
  select.dataset.placeholder = placeholderText;
  const placeholder = existingPlaceholder
    ? existingPlaceholder.cloneNode(true)
    : document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderText;
  select.textContent = '';
  select.appendChild(placeholder);
  const items = App.getAllItems(key);
  const premadeGroup = document.createElement('optgroup');
  premadeGroup.label = 'Premade';
  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Custom';
  let premadeCount = 0;
  let customCount = 0;
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id || item.title;
    option.textContent = item.title || '';
    if (item.isPremade) {
      premadeGroup.appendChild(option);
      premadeCount += 1;
    } else {
      customGroup.appendChild(option);
      customCount += 1;
    }
  });
  if (premadeCount > 0) select.appendChild(premadeGroup);
  if (customCount > 0) select.appendChild(customGroup);
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
  App.setDynamicTitle?.();
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
  let heading = headerEl ? headerEl.querySelector('.card-title') : null;
  const footer = article.querySelector('footer');
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
      if (typeof window.getPictureHTML === 'function') {
        const placeholderSrc = img.dataset.placeholderSrc;
        const frag = document.createRange().createContextualFragment(
          window.getPictureHTML(item, item.colorPalette, 'storyboard-card')
        );
        const newImg = frag.querySelector('img');
        if (newImg && placeholderSrc) newImg.dataset.placeholderSrc = placeholderSrc;
        img.replaceWith(newImg);
      } else if (item.image) {
        img.src = item.image;
        img.alt = item.title || '';
      }
    }
    if (headerEl) {
      if (!heading) {
        heading = document.createElement('h4');
        heading.className = 'card-title';
        heading.addEventListener('click', () => {
          select.hidden = !select.hidden;
          if (!select.hidden) {
            heading.contentEditable = 'true';
            heading.classList.add('card-title--editing');
            const sel = window.getSelection();
            if (sel) {
              const range = document.createRange();
              range.selectNodeContents(heading);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            heading.focus();
          } else {
            heading.contentEditable = 'false';
            heading.classList.remove('card-title--editing');
          }
        });
        heading.addEventListener('blur', () => {
          heading.contentEditable = 'false';
          heading.classList.remove('card-title--editing');
          if (document.activeElement !== select) select.hidden = true;
          if (item) item.title = heading.textContent.trim();
          App.setDynamicTitle?.();
        });
        heading.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            heading.blur();
          }
        });
        headerEl.appendChild(heading);
      }
      heading.textContent = item.title || '';
      heading.hidden = false;

    }
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
  App.setDynamicTitle?.();
};

const titlePrompts = [
  'Once upon a time',
  'The tale of',
  'Chronicles of',
  'Legend speaks of',
  'Adventures of'
];

function randPrompt() {
  return titlePrompts[Math.floor(Math.random() * titlePrompts.length)];
}

App._defaultStoryboardTitle = function () {
  const getTitle = (id, key) => {
    const select = document.getElementById(id);
    const value = select ? select.value : '';
    if (!value) return null;
    const item = App.getAllItems(key).find((i) => (i.id ?? i.title) === value);
    return item ? item.title || null : null;
  };
  const ai = getTitle('storyboard-ai-select', 'characters');
  const user = getTitle('storyboard-user-select', 'characters');
  const world = getTitle('storyboard-world-select', 'worlds');
  const selections = [ai, user].filter(Boolean);
  let title;
  if (!ai && !user && !world) title = 'Your story begins…';
  else if (ai && user && world) title = `${randPrompt()} ${ai} & ${user} in ${world}`;
  else if (selections.length === 1) title = `${randPrompt()} ${selections[0]}`;
  else if (selections.length === 2) title = `${randPrompt()} ${selections[0]} & ${selections[1]}`;
  else title = 'Your story begins…';
  return title.length > 80 ? title.slice(0, 80) : title;
};

App.setDynamicTitle = function () {
  const titleEl = document.getElementById('story-title');
  if (!titleEl || titleEl.dataset.manual === 'true') return;

  titleEl.textContent = App._defaultStoryboardTitle();
};

App._setupStoryboardTitle = function () {
  const titleEl = document.getElementById('story-title');
  if (!titleEl) return;
  if (titleEl.dataset.editable) return;
  titleEl.dataset.editable = 'true';

  const finishEditing = () => {
    titleEl.contentEditable = 'false';
    App._editingStoryboardTitle = false;
  };

  titleEl.addEventListener('click', () => {
    if (App._editingStoryboardTitle) return;
    App._editingStoryboardTitle = true;
    titleEl.contentEditable = 'true';
    titleEl.dataset.manual = 'true';
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(titleEl);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    titleEl.focus();
  });

  titleEl.addEventListener('blur', finishEditing);
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleEl.blur();
    }
  });
};

App._attachStoryboardListeners = App._attachStoryboardListeners || function () {
  const configs = [
    { id: 'storyboard-ai-select', key: 'characters' },
    { id: 'storyboard-user-select', key: 'characters' },
    { id: 'storyboard-world-select', key: 'worlds' }
  ];
  configs.forEach(({ id, key }) => {
    const select = document.getElementById(id);
    if (select) {
      const handler = () => App.updateStoryboardCard(id, key);
      select.addEventListener('change', handler);
      select.addEventListener('blur', handler);
      App.updateStoryboardCard(id, key);
    }
  });
  App._setupStoryboardTitle();
  const title = document.getElementById('story-title');
  if (title) {
    title.addEventListener('dblclick', () => {
      if (title.dataset.manual === 'true') {
        title.dataset.manual = '';
        App.setDynamicTitle();
      }
    });
  }
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      document.querySelectorAll('select.storyboard-picker').forEach((select) => {
        const opts = select.querySelectorAll('option:not([value=""])');
        if (opts.length > 0) {
          const idx = Math.floor(Math.random() * opts.length);
          select.selectedIndex = idx + 1;
          select.dispatchEvent(new Event('change'));
        }
      });
      const t = document.getElementById('story-title');
      if (t && !t.dataset.manual) App.setDynamicTitle();
    });
  }
  App.setDynamicTitle();
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
      newButton: ui.newStoryButton,
      uploadTrigger: ui.uploadStoryTrigger,
      uploadInput: ui.uploadStoryInput
    },
    {
      key: 'characters',
      newButton: ui.newCharacterButton,
      uploadTrigger: ui.uploadCharacterTrigger,
      uploadInput: ui.uploadCharacterInput
    },
    {
      key: 'worlds',
      newButton: ui.newWorldButton,
      uploadTrigger: ui.uploadWorldTrigger,
      uploadInput: ui.uploadWorldInput
    }
  ];

  configs.forEach(({ key, newButton, uploadTrigger, uploadInput }) => {
    if (newButton) {
      newButton.addEventListener('click', async () => {

        const exportName = modalExportMap[key];
        if (!exportName) return;
        const mod = await import(entityFormPath);
        const openModal = mod[exportName];
        if (typeof openModal !== 'function') return;
        openModal(({ title }) => {
          if (!title) return;
          addMap[key]?.({ title });
          App.refreshAllLists?.();
        });
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
    const buttons = Array.from(ui.topBarButtons);
    buttons.forEach((btn, idx) => {
      if (!App._attachedTopBarButtons.has(btn)) {
        btn.addEventListener('click', () => {
          App.selectTopBarTab(btn);
          App.ui.showChin(btn.dataset.chin);
        });
        btn.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (idx + dir + buttons.length) % buttons.length;
          buttons[next].focus();
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
    App.updateStoryboardTitle?.();
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
