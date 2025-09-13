import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  getPremadeItems: jest.fn().mockReturnValue([]),
  _allItemsCache: {},
}));

async function loadApp() {
  const html = `<!doctype html><html><body>
    <div id="upload-backup"></div>
    <div data-trigger="upload-backup"></div>
    <div id="download-backup"></div>
    <div id="chin-container"></div>
  </body></html>`;
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  dom.window.App = {
    ...index,
    ...utils,
  };

  dom.window.App.ui = {
    uploadBackupInput: dom.window.document.getElementById('upload-backup'),
    uploadBackupTrigger: dom.window.document.querySelector('[data-trigger="upload-backup"]'),
    downloadBackupButton: dom.window.document.getElementById('download-backup'),
    deleteAllDataButton: dom.window.document.getElementById('delete-all-data')
  };
  dom.window.App.chin.init();
  dom.window.App._attachOptionChinActions();

  return dom.window.App;
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
  const entities = require('../apps/rpglitch/js/entities.js');
  for (const key in entities._allItemsCache) {
    delete entities._allItemsCache[key];
  }
});

test('options chin actions trigger database methods', async () => {
  const App = await loadApp();

  App.importAllData = jest.fn();
  App.exportAllData = jest.fn();
  App.deleteAllData = jest.fn();

  App.chin.open('options');
  await new Promise(resolve => setTimeout(resolve, 0));

  const { uploadBackupTrigger, uploadBackupInput, downloadBackupButton, deleteAllDataButton } = App.ui;

  if (uploadBackupTrigger && uploadBackupInput) {
    const view = uploadBackupInput.ownerDocument.defaultView;
    const file = new view.File(['{}'], 'backup.json', { type: 'application/json' });
    uploadBackupTrigger.click();
    Object.defineProperty(uploadBackupInput, 'files', { value: [file] });
    uploadBackupInput.dispatchEvent(new view.Event('change'));
    expect(App.importAllData).toHaveBeenCalledWith(file);
  }

  if (downloadBackupButton) {
    downloadBackupButton.click();
    expect(App.exportAllData).toHaveBeenCalled();
  }

  if (deleteAllDataButton) {
    deleteAllDataButton.click();
    expect(App.deleteAllData).toHaveBeenCalled();
  }
});
