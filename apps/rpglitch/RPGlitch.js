(function (global, document) {
  const App = global.App || (global.App = {});
  // Main RPGlitch application namespace

// Map utility helpers to App namespace with fallbacks
App.hideEl = global.hideEl || function (el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.setAttribute('hidden', 'hidden');
  return el;
};

App.showEl = global.showEl || function (el) {
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
  ui.topBarRightStoryboard = ui.topBarRightStoryboard || doc.getElementById('top-bar-right-storyboard');
  ui.topBarRightForm = ui.topBarRightForm || doc.getElementById('top-bar-right-form');
  ui.topBarRightProfile = ui.topBarRightProfile || doc.getElementById('top-bar-right-profile');

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

App.setTopBarRight = function (mode) {
  const ui = App._getUIElements();
  const sectionMap = {
    storyboard: ui.topBarRightStoryboard,
    form: ui.topBarRightForm,
    profile: ui.topBarRightProfile
  };
  Object.values(sectionMap).forEach((sec) => sec && App.hideEl(sec));
  if (sectionMap[mode]) App.showEl(sectionMap[mode]);
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
    const container = input.closest('.chin') || input.closest('.chin-widget');
    const list = container?.querySelector('.chin-grid');

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
    const storage = global.localStorage;
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
  global.localStorage.setItem(key, JSON.stringify(current));
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

App.resetStoryboard = App.resetStoryboard || function () {
  // placeholder for future storyboard reset logic
};


App.premade = App.premade || {
  stories: [],
  characters: [
    {
      id: 'char-1',
      title: 'Aether Blade',
      description: 'Cybernetic warrior forging light into weapons.',
      type: 'Character',
      palette: 'cyan'
    },
    {
      id: 'char-2',
      title: 'Mystic Bard',
      description: 'Traveling musician who weaves spells with song.',
      type: 'Character',
      palette: 'pink'
    },
    {
      id: 'char-3',
      title: 'Clockwork Rogue',
      description: 'Stealthy thief powered by ticking gears.',
      type: 'Character',
      palette: 'emerald'
    },
    {
      id: 'char-4',
      title: 'Shadow Whisperer',
      description: 'Mysterious figure communing with darkness.',
      type: 'Character',
      palette: 'cyan'
    }
  ],
  worlds: [
    {
      id: 'world-1',
      title: 'Eldoria',
      description: 'Floating isles bound by ancient magic.',
      type: 'World',
      palette: 'emerald'
    },
    {
      id: 'world-2',
      title: 'Neo Arcadia',
      description: 'Futuristic metropolis built on dream tech.',
      type: 'World',
      palette: 'pink'
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
  App._allItemsCache = App._allItemsCache || Object.create(null);
  if (!refresh && Array.isArray(App._allItemsCache[key])) return App._allItemsCache[key];

  if ((key === 'characters' || key === 'worlds') && App.entities && typeof App.entities.list === 'function') {
    if (refresh) {
      // The cache is shared, so we need to clear the specific key to force a refresh.
      delete App._allItemsCache[key];
    }
    const items = App.entities.list(key.slice(0, -1));
    App._allItemsCache[key] = items;
    return items;
  }

  const premade = App.getPremadeItems(key).map((item) => ({ ...item, isPremade: true }));
  const stored = loadStoredItems(key).map((item) => ({ ...item, isPremade: false }));
  const data = premade.concat(stored);
  App._allItemsCache[key] = data;
  return data;
};

function renderList(containerId, key) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('img.entity-image[src^="blob:"]').forEach((img) => {
    URL.revokeObjectURL(img.src);
  });
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
    card.dataset.title = item.title || item.name || 'Empty';
    if (item.id) {
      card.dataset.id = item.id;
      card.dataset.type = key.slice(0, -1);
      card.dataset.entityId = item.id;
      card.dataset.entityType = key.slice(0, -1);
    }
    if (item.isPremade) card.dataset.premade = 'true';

    const media = document.createElement('div');
    media.className = 'media';

    if (typeof global.getPictureHTML === 'function') {
      const pic = global.getPictureHTML(item, { cover: true });
      media.appendChild(pic);
      pic.classList.toggle('empty', pic.classList.contains('placeholder-image'));
    }

    const title = document.createElement('h4');
    title.className = 'title';
    title.textContent = item.title || item.name || 'Empty';
    media.appendChild(title);

    if (item.isPremade) {
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = 'Premade';
      media.appendChild(badge);
    }

    const body = document.createElement('div');
    body.className = 'body';

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'description';
      desc.textContent = item.description;
      body.appendChild(desc);
    }

    card.appendChild(media);
    card.appendChild(body);
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
  App.updateStoryboardCard?.(selectId, key);
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

App._attachCardNavigation = function () {
  if (App._cardNavAttached) return;
  const container = document.getElementById('chin-container');
  if (!container) return;
  container.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input, select, textarea')) return;
    const card = e.target.closest('.chin-card[data-type][data-id]');
    if (!card) return;
    App.setSelected?.(card, container.querySelectorAll('.chin-card[data-type][data-id]'));
    const { type, id } = card.dataset;
    if (type && id) App.router?.navigate(`#profile/${type}/${id}`);
  });
  App._cardNavAttached = true;
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

  const imgWrap = card.querySelector('.storyboard-card-left');
  let img = imgWrap ? imgWrap.querySelector('.entity-image, .placeholder-image') : null;
  const item = App.getAllItems(key).find((i) => (i.id ?? i.title) === select.value);

  if (headerEl && !heading) {
    heading = document.createElement('h4');
    heading.className = 'card-title';
    heading.addEventListener('click', () => {
      select.showPicker?.() || (select.focus(), select.click());
    });
    headerEl.appendChild(heading);
  }

  const updateImage = (itemData) => {
    if (!imgWrap || typeof global.getPictureHTML !== 'function') return;
    const newImg = global.getPictureHTML(itemData, { cover: true });
    const oldUrl = img instanceof HTMLImageElement && img.src.startsWith('blob:') ? img.src : null;
    if (img) imgWrap.replaceChild(newImg, img);
    else imgWrap.appendChild(newImg);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    img = newImg;
    img.classList.toggle('empty', img.classList.contains('placeholder-image'));
  };

  if (item) {
    descEl.textContent = item.description || '';
    if (small) small.textContent = item.isPremade ? 'Premade' : '';
    if (heading) {
      heading.textContent = item.title || item.name || 'Empty';
      heading.hidden = false;
    }
    updateImage(item);
    card.dataset.entityType = key.slice(0, -1);
    card.dataset.entityId = item.id;
  } else {
    descEl.textContent = descEl.dataset.placeholder || '';
    if (small) small.textContent = '';
    select.hidden = false;
    const placeholderItem = { id: card.dataset.type || '', kind: card.dataset.type };
    updateImage(placeholderItem);
    if (heading) {
      heading.textContent = 'Empty';
      heading.hidden = false;
    }
    delete card.dataset.entityType;
    delete card.dataset.entityId;
  }
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
  const subjects = [ai, user].filter(Boolean).join(' & ');

  let title;
  if (subjects && world) {
    title = `${randPrompt()} ${subjects} in ${world}`;
  } else if (subjects) {
    title = `${randPrompt()} ${subjects}`;
  } else if (world) {
    title = `${randPrompt()} a story in ${world}`;
  } else {
    title = 'Your story begins…';
  }

  return title.length > 80 ? `${title.slice(0, 77)}…` : title;
};

App.setDynamicTitle = function () {
  const titleEl = document.getElementById('storyboard-dynamic-title');
  if (!titleEl || titleEl.dataset.manual === 'true') return;

  titleEl.textContent = App._defaultStoryboardTitle();
};

App._setupStoryboardTitle = function () {
  const titleEl = document.getElementById('storyboard-dynamic-title');
  if (!titleEl) return;
  if (titleEl.dataset.editable) return;
  titleEl.dataset.editable = 'true';
  titleEl.autocapitalize = 'off';
  titleEl.autocorrect = 'off';
  titleEl.spellcheck = false;
  titleEl.setAttribute('autocomplete', 'off');
  titleEl.setAttribute('autocapitalize', 'off');
  titleEl.setAttribute('autocorrect', 'off');
  titleEl.setAttribute('spellcheck', 'false');

  const finishEditing = () => {
    titleEl.contentEditable = 'false';
    App._editingStoryboardTitle = false;
  };

  titleEl.addEventListener('click', () => {
    if (App._editingStoryboardTitle) return;
    App._editingStoryboardTitle = true;
    titleEl.contentEditable = 'true';
    titleEl.dataset.manual = 'true';
    const sel = global.getSelection();
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
      const handler = () => {
        App.updateStoryboardCard(id, key);
        App.setDynamicTitle();
      };
      select.addEventListener('change', handler);
      App.updateStoryboardCard(id, key);
    }
  });
  App._setupStoryboardTitle();
  const title = document.getElementById('storyboard-dynamic-title');
  if (title) {
    title.addEventListener('dblclick', () => {
      if (title.dataset.manual === 'true') {
        title.dataset.manual = '';
      }
    });
  }
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      document.querySelectorAll('select.storyboard-card-title').forEach((select) => {
        const opts = select.querySelectorAll('option:not([value=""])');
        if (opts.length > 0) {
          const idx = Math.floor(Math.random() * opts.length);
          select.selectedIndex = idx + 1;
          select.dispatchEvent(new Event('change'));
        }
      });
    });
  }
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
      newButton.addEventListener('click', () => {
        if (key === 'stories') {
          App.resetStoryboard?.();
          App.router?.navigate('#storyboard');
          return;
        }
        if (key === 'characters' || key === 'worlds') {
          App.router?.navigate(`#form/${key.slice(0, -1)}/new`);
        }
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
            global.localStorage.setItem(key, JSON.stringify(current.concat(data)));
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
  App._attachCardNavigation();

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
  if (typeof global.dbName === 'undefined') {
    global.dbName = 'rpglitch-db';
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
          global.localStorage.setItem(key, JSON.stringify(data[key]));
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
      const value = global.localStorage.getItem(key);
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
    global.localStorage.removeItem(key);
  });
  App.refreshAllLists();
};

})(window, document);
