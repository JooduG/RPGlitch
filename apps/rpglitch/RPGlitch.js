/* eslint-disable no-undef */
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
  App.selectTopBarTab(null);
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

function loadItems(key) {
  try {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function renderList(containerId, key) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = loadItems(key);
  container.textContent = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'chin-card';
    card.dataset.title = item.title;

    const left = document.createElement('div');
    left.className = 'chin-card-left';

    const article = document.createElement('article');
    article.className = 'chin-card';

    const header = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = item.title;

    header.appendChild(h4);
    article.appendChild(header);
    left.appendChild(article);
    card.appendChild(left);
    container.appendChild(card);
  });
}

App.renderStoryList = App.renderStoryList || function () {
  renderList('chin-story-grid', 'stories');
};

App.renderCharacterList = App.renderCharacterList || function () {
  renderList('chin-character-grid', 'characters');
};

App.renderWorldList = App.renderWorldList || function () {
  renderList('chin-world-grid', 'worlds');
};

// Track attached listeners to avoid duplicates
App._attachedTopBarButtons = App._attachedTopBarButtons || new Set();
App._optionsListenersAttached = App._optionsListenersAttached || false;
App._outsideChinListenerAttached = App._outsideChinListenerAttached || false;

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
    App.initializeWhenReadyRetryCount = 0;
  } catch (error) {
    App.initializeWhenReadyRetryCount += 1;
    console.error("Failed to initialize App:", error);
  }
};

// Export for Node-based tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
