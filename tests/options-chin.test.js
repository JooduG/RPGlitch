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
  // Clear the document body before each test
  document.body.innerHTML = html;

  // Mock URL.createObjectURL as it's not implemented in JSDOM
  Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(() => 'blob:mock-url'),
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    writable: true,
    value: jest.fn(),
  });

  // Re-import modules to get a fresh state
  jest.resetModules();

  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  // Ensure window.App exists and mock its functions
  window.App = {
    ...index,
    ...utils,
    importAllData: jest.fn(),
    exportAllData: jest.fn(),
    deleteAllData: jest.fn(),
  };

  jest.spyOn(window.App, 'refreshAllLists').mockImplementation(() => {});

  // Re-query ui elements after document.body.innerHTML is set
  window.App.ui = {
    uploadBackupInput: document.getElementById('upload-backup'),
    uploadBackupTrigger: document.querySelector('[data-trigger="upload-backup"]'),
    downloadBackupButton: document.getElementById('download-backup'),
    deleteAllDataButton: document.getElementById('delete-all-data')
  };
  window.App.chin.init();
  window.App._attachOptionChinActions();

  return window.App; // Return the global App object
}

afterEach(() => {
  delete global.window.App; // Clean up global App
  jest.resetModules();
  jest.clearAllMocks();
});

test('options chin actions trigger database methods', async () => {
  const App = await loadApp(); // App is now window.App

  App.chin.open('options');
  await new Promise(resolve => setTimeout(resolve, 0));

  // Re-query elements after modification
  const uploadBackupTrigger = document.querySelector('[data-trigger="upload-backup"]');
  const uploadBackupInput = document.getElementById('upload-backup');
  const downloadBackupButton = document.getElementById('download-backup');
  const deleteAllDataButton = document.getElementById('delete-all-data');

  if (uploadBackupTrigger && uploadBackupInput) {
    const view = window; // Use global window
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