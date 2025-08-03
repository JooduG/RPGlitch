/* eslint-disable no-undef */
// Main RPGlitch application namespace
// eslint-disable-next-line no-redeclare
const App = window.App || {};
window.App = App;

// Map utility helpers to App namespace with fallbacks
App.hideEl = window.hideEl || function (el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.add('hidden');
  el.setAttribute('hidden', 'hidden');
  return el;
};

App.showEl = window.showEl || function (el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.remove('hidden');
  el.removeAttribute('hidden');
  el.style.visibility = '';
  el.style.display = '';
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

  const panels = container.querySelectorAll('.chin-panel');
  let target = null;
  panels.forEach((panel) => {
    if (panel.dataset.chin === chin) target = panel;
    else App.hideEl(panel);
  });
  if (!target) return;

  const isHidden = target.classList.contains('hidden') || target.hasAttribute('hidden');
  if (!isHidden) {
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
  const id = chinId.startsWith('chin-') ? chinId.slice(5) : chinId;
  App._toggleChinContent(id);
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
        el.classList.toggle('hidden', !match);
      });
    });
  });
};

App.renderStoryList = App.renderStoryList || function () {
  const container = document.getElementById('chin-story-grid');
  if (!container) return;
  const items = [{ title: 'Sample Story' }];
  container.textContent = '';
  items.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'chin-card';
    card.dataset.title = s.title;

    const left = document.createElement('div');
    left.className = 'chin-card-left';

    const article = document.createElement('article');
    article.className = 'chin-card';

    const header = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = s.title;

    header.appendChild(h4);
    article.appendChild(header);
    left.appendChild(article);
    card.appendChild(left);
    container.appendChild(card);
  });
};

App.renderCharacterList = App.renderCharacterList || function () {
  const container = document.getElementById('chin-character-grid');
  if (!container) return;
  const items = [{ title: 'Sample Character' }];
  container.textContent = '';
  items.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'chin-card';
    card.dataset.title = c.title;

    const left = document.createElement('div');
    left.className = 'chin-card-left';

    const article = document.createElement('article');
    article.className = 'chin-card';

    const header = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = c.title;

    header.appendChild(h4);
    article.appendChild(header);
    left.appendChild(article);
    card.appendChild(left);
    container.appendChild(card);
  });

};

App.renderWorldList = App.renderWorldList || function () {
  const container = document.getElementById('chin-world-grid');
  if (!container) return;
  const items = [{ title: 'Sample World' }];
  container.textContent = '';
  items.forEach((w) => {
    const card = document.createElement('div');
    card.className = 'chin-card';
    card.dataset.title = w.title;

    const left = document.createElement('div');
    left.className = 'chin-card-left';

    const article = document.createElement('article');
    article.className = 'chin-card';

    const header = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = w.title;

    header.appendChild(h4);
    article.appendChild(header);
    left.appendChild(article);
    card.appendChild(left);
    container.appendChild(card);
  });
};

// Track attached listeners to avoid duplicates
App._attachedTopBarButtons = App._attachedTopBarButtons || new Set();
App._optionsListenersAttached = App._optionsListenersAttached || false;
App._outsideChinListenerAttached = App._outsideChinListenerAttached || false;

/**
 * Attaches event listeners for top bar interactions and option chin actions.
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
          App._toggleChinContent(btn.dataset.chin);
        });
        App._attachedTopBarButtons.add(btn);
      }
    });
  }

  if (!App._optionsListenersAttached) {
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
        if (file && typeof App.importAllData === 'function') {
          App.importAllData(file);
        }
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
  }

  if (!App._outsideChinListenerAttached) {
    document.addEventListener('click', (e) => {
      const current = App.ui || App._getUIElements();
      if (!current.chinContainer || current.chinContainer.classList.contains('hidden')) return;
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
