const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp() {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.App = {};
  dom.window.document.addEventListener = jest.fn();
  dom.window.alert = () => {};
  global.Dexie = function () {};
  global.DOMPurify = {};
  global._hyperscript = {};
  global.$ = function () {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utils = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/utils.js'), 'utf8');
  dom.window.eval(utils);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(script);
  const App = dom.window.App;
  App.ui = {
    uploadBackupInput: dom.window.document.getElementById('upload-backup'),
    uploadBackupTrigger: dom.window.document.querySelector('[data-trigger="upload-backup"]'),
    downloadBackupButton: dom.window.document.getElementById('download-backup'),
    deleteAllDataButton: dom.window.document.getElementById('delete-all-data')
  };
  App._attachTopBarEventListeners();
  return App;
}

test('options chin actions trigger database methods', () => {
  const App = loadApp();

  App.importAllData = jest.fn();
  App.exportAllData = jest.fn();
  App.deleteAllData = jest.fn();

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
