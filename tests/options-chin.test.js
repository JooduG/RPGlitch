jest.mock('../apps/rpglitch/js/db.js', () => ({
  db: {
    entities: {
      bulkPut: jest.fn(),
      clear: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([]),
        })),
      })),
    },
    isOpen: jest.fn().mockReturnValue(false),
    close: jest.fn().mockResolvedValue(),
  },
  initDB: jest.fn().mockResolvedValue(),
}));

const TEST_TIMEOUT = 5000; // 5 second timeout for async operations

async function loadApp() {
  const html = `<!doctype html><html><body>
    <div id="upload-backup"></div>
    <div data-trigger="upload-backup"></div>
    <div id="download-backup"></div>
    <div id="delete-all-data"></div>
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

  const App = {
    ...index,
    ...utils,
  };

  // Spy on the functions in the index module
  const importAllDataSpy = jest.spyOn(index, 'importAllData');
  const exportAllDataSpy = jest.spyOn(index, 'exportAllData');
  const deleteAllDataSpy = jest.spyOn(index, 'deleteAllData');

  await Promise.race([
    App.initializeWhenReady(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Initialize timeout')), TEST_TIMEOUT))
  ]);

  return { App, importAllDataSpy, exportAllDataSpy, deleteAllDataSpy };
}

beforeEach(async () => {
  // Delete any existing IndexedDB databases
  const databases = await window.indexedDB.databases();
  await Promise.all(
    databases.map(({ name }) => 
      new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    )
  );
});

afterEach(async () => {
  try {
    if (global.App && global.App.db && global.App.db.isOpen()) {
      await global.App.db.close();
    }
  } finally {
    jest.resetModules();
    jest.clearAllMocks();
  }
});

test('options chin actions trigger database methods', async () => {
  const { App, importAllDataSpy, exportAllDataSpy, deleteAllDataSpy } = await loadApp();

  try {
    await Promise.race([
      (async () => {
        App.chin.open('options');
        await new Promise(resolve => setTimeout(resolve, 100)); // Give more time for async operations

        // Re-query elements after modification
        const uploadBackupInput = document.getElementById('upload-backup');
        const downloadBackupButton = document.getElementById('download-backup');
        const deleteAllDataButton = document.getElementById('delete-all-data');

        expect(uploadBackupInput).not.toBeNull();
        expect(downloadBackupButton).not.toBeNull();
        expect(deleteAllDataButton).not.toBeNull();

        const view = window; // Use global window
        const file = new view.File(['{}'], 'backup.json', { type: 'application/json' });
        Object.defineProperty(uploadBackupInput, 'files', { value: [file] });
        uploadBackupInput.dispatchEvent(new view.Event('change'));
        expect(importAllDataSpy).toHaveBeenCalledWith(file);

        downloadBackupButton.click();
        expect(exportAllDataSpy).toHaveBeenCalled();

        deleteAllDataButton.click();
        expect(deleteAllDataSpy).toHaveBeenCalled();
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test operation timeout')), TEST_TIMEOUT))
    ]);
  } finally {
    if (App.db && App.db.isOpen && App.db.isOpen()) {
      await App.db.close();
    }
  }
}, TEST_TIMEOUT + 1000);

