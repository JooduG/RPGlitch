/**
 * Test suite for ImageGlitch localStorage → IndexedDB migration
 */

import { JSDOM } from 'jsdom';

describe('ImageGlitch IndexedDB Migration', () => {
  let dom;
  let mockDb;
  let mockSettingsTable;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset module cache first to ensure fresh import
    jest.resetModules();
    jest.clearAllMocks();

    // Create a fresh JSDOM instance
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost',
      runScripts: 'outside-only'
    });

    global.window = dom.window;
    global.document = dom.window.document;

    // Mock localStorage on the window object
    mockLocalStorage = {
      data: {},
      getItem(key) {
        return mockLocalStorage.data[key] || null;
      },
      setItem(key, value) {
        mockLocalStorage.data[key] = value;
      },
      removeItem(key) {
        delete mockLocalStorage.data[key];
      },
      clear() {
        mockLocalStorage.data = {};
      }
    };

    // Spy on the methods to track calls
    jest.spyOn(mockLocalStorage, 'getItem');
    jest.spyOn(mockLocalStorage, 'setItem');
    jest.spyOn(mockLocalStorage, 'removeItem');
    jest.spyOn(mockLocalStorage, 'clear');

    // Define localStorage property on window - try direct assignment first
    try {
      delete global.window.localStorage;
    } catch { /* ignore */ }
    global.window.localStorage = mockLocalStorage;

    // Mock Dexie database
    mockSettingsTable = {
      get: jest.fn(),
      put: jest.fn().mockResolvedValue(),
    };

    // Create a proper Dexie mock that captures the upgrade callback
    global.Dexie = jest.fn(function(name) {
      this.name = name;
      const self = this;

      this.version = function(versionNumber) {
        const versionObj = {
          stores: function(schema) {
            return {
              upgrade: function(upgradeCallback) {
                // Store the upgrade callback for version 2
                if (versionNumber === 2) {
                  self._upgradeCallback = upgradeCallback;
                }
                return this;
              }
            };
          }
        };
        return versionObj;
      };

      this.settings = mockSettingsTable;
      mockDb = this;
    });
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.localStorage;
    delete global.Dexie;
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('Migration reads all 6 localStorage keys correctly', async () => {
    // Setup: Populate localStorage with test data BEFORE importing the module
    mockLocalStorage.data = {
      'mainPromptContent': 'A beautiful sunset',
      'imgSeed': '12345',
      'numImagesToGen': '3',
      'masterCreativity': '7',
      'instructionInput': 'Make it more vibrant',
      'instructionsVisible': 'true',
    };

    await import('../apps/imageglitch/js/db.js');

    // Get the upgrade callback that was stored
    const upgradeFunc = mockDb._upgradeCallback;
    expect(typeof upgradeFunc).toBe('function');

    // Mock transaction
    const mockTrans = {
      table: jest.fn(() => mockSettingsTable),
    };

    // Simulate migration has not been completed yet
    mockSettingsTable.get.mockResolvedValue(null);

    // Execute migration
    await upgradeFunc(mockTrans);

    // Verify put was called with correct settings
    expect(mockSettingsTable.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'app-settings',
        mainPromptContent: 'A beautiful sunset',
        seed: 12345,
        numImagesToGen: 3,
        masterCreativity: 7,
        instructionInput: 'Make it more vibrant',
        instructionsVisible: true,
        _migrated: true,
      })
    );

    // Verify localStorage was cleaned up
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mainPromptContent');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('imgSeed');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('numImagesToGen');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('masterCreativity');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('instructionInput');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('instructionsVisible');
  });

  test('Migration handles empty localStorage gracefully', async () => {
    // Setup: Empty localStorage
    await import('../apps/imageglitch/js/db.js');

    const upgradeFunc = mockDb._upgradeCallback;

    const mockTrans = {
      table: jest.fn(() => mockSettingsTable),
    };

    mockSettingsTable.get.mockResolvedValue(null);

    await upgradeFunc(mockTrans);

    // Should create settings with default values
    expect(mockSettingsTable.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'app-settings',
        mainPromptContent: '',
        seed: '',
        numImagesToGen: 1,
        masterCreativity: 4, // DEFAULT_CREATIVITY_LEVEL
        instructionInput: '',
        instructionsVisible: false,
      })
    );
  });

  test('Migration skips if already completed', async () => {
    // Setup: Migration already done
    mockLocalStorage.data = {
      'mainPromptContent': 'Should not be migrated',
    };

    await import('../apps/imageglitch/js/db.js');

    const upgradeFunc = mockDb._upgradeCallback;

    const mockTrans = {
      table: jest.fn(() => mockSettingsTable),
    };

    // Simulate migration already completed
    mockSettingsTable.get.mockResolvedValue({
      id: 'app-settings',
      _migrated: true,
    });

    await upgradeFunc(mockTrans);

    // Should NOT call put again
    expect(mockSettingsTable.put).not.toHaveBeenCalled();

    // Should NOT remove localStorage
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  test('Migration preserves localStorage on IndexedDB write failure', async () => {
    // Setup
    mockLocalStorage.data = {
      'mainPromptContent': 'Important data',
      'imgSeed': '99999',
    };

    await import('../apps/imageglitch/js/db.js');

    const upgradeFunc = mockDb._upgradeCallback;

    const mockTrans = {
      table: jest.fn(() => mockSettingsTable),
    };

    mockSettingsTable.get.mockResolvedValue(null);

    // Simulate IndexedDB write failure
    mockSettingsTable.put.mockRejectedValue(new Error('IndexedDB write failed'));

    // Migration should throw and NOT clean up localStorage
    await expect(upgradeFunc(mockTrans)).rejects.toThrow('IndexedDB write failed');

    // Verify localStorage was NOT cleaned up
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    expect(mockLocalStorage.data.mainPromptContent).toBe('Important data');
    expect(mockLocalStorage.data.imgSeed).toBe('99999');
  });

  test('Migration handles boolean string conversion correctly', async () => {
    // Test both 'true' and 'false' string values
    mockLocalStorage.data = {
      'instructionsVisible': 'false',
    };

    await import('../apps/imageglitch/js/db.js');

    const upgradeFunc = mockDb._upgradeCallback;

    const mockTrans = {
      table: jest.fn(() => mockSettingsTable),
    };

    mockSettingsTable.get.mockResolvedValue(null);

    await upgradeFunc(mockTrans);

    expect(mockSettingsTable.put).toHaveBeenCalledWith(
      expect.objectContaining({
        instructionsVisible: false, // String 'false' should become boolean false
      })
    );
  });

  test('Migration handles numeric string conversion', async () => {
    mockLocalStorage.data = {
      'imgSeed': '0', // Edge case: zero seed
      'numImagesToGen': '10',
      'masterCreativity': '0', // Edge case: minimum creativity
    };

    await import('../apps/imageglitch/js/db.js');

    const upgradeFunc = mockDb._upgradeCallback;

    const mockTrans = {
      table: jest.fn(() => mockSettingsTable),
    };

    mockSettingsTable.get.mockResolvedValue(null);

    await upgradeFunc(mockTrans);

    expect(mockSettingsTable.put).toHaveBeenCalledWith(
      expect.objectContaining({
        seed: 0, // Should be number 0, not empty string
        numImagesToGen: 10,
        masterCreativity: 0,
      })
    );
  });
});
