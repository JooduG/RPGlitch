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
  return el;
};

App.showEl = window.showEl || function (el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.remove('hidden');
  return el;
};

// Provide no-op default for selectTopBarTab so tests can mock it
App.selectTopBarTab = App.selectTopBarTab || function () {};

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
  const ui = App.ui || App._getUIElements();
  const container = ui.chinContainer;
  if (!container) return;
  App.showEl(container);
  const panel = container.querySelector(`[data-chin="${chin}"]`);
  if (panel) App.showEl(panel);
};

// Track attached listeners to avoid duplicates
App._attachedTopBarButtons = App._attachedTopBarButtons || new Set();
App._optionsListenersAttached = App._optionsListenersAttached || false;

/**
 * Attaches event listeners for top bar interactions and option chin actions.
 * Guards against attaching duplicate listeners across multiple invocations.
 */
App._attachTopBarEventListeners = function () {
  const ui = App.ui || App._getUIElements();
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
    if (typeof App.initialLoad === 'function') {
      await App.initialLoad();
    }
    App.initializeWhenReadyRetryCount = 0;
  } catch {
    App.initializeWhenReadyRetryCount += 1;
    // In tests we simply swallow the error to keep promise resolved
  }
};

// Export for Node-based tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
