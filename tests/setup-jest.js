const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom'); // Import JSDOM after TextEncoder/Decoder are global

// Create a JSDOM instance for all tests
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'outside-only'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator; // Expose navigator as well

// Mock common browser globals that might be used by the app
global.window.alert = () => {};
global.window.Dexie = function () {};
global.window.DOMPurify = { sanitize: (str) => str };
global.DOMPurify = { sanitize: (str) => str }; // Also expose globally for direct access
global.window._hyperscript = {};
global.window.$ = function () {};
global.image = () => {};

// Mock localStorage
global.window.localStorage = {
  _data: {},
  getItem: jest.fn(function(key) { return this._data[key] || null; }),
  setItem: jest.fn(function(key, value) { this._data[key] = value; }),
  removeItem: jest.fn(function(key) { delete this._data[key]; }),
};

// Mock getComputedStyle
global.window.getComputedStyle = jest.fn((el) => {
  return {
    pointerEvents: el.style.pointerEvents,
  };
});

// This global hook will run once after all test suites have finished.
// It checks for an open database connection on the global App object
// and closes it to ensure the test process can exit cleanly. This
// is the proper fix for tests hanging due to open async handles.
afterAll(async () => {
  if (global.App && global.App.db && global.App.db.isOpen()) {
    console.log('\n[Jest Teardown] Closing open database connection...');
    await global.App.db.close();
    console.log('[Jest Teardown] Database connection closed.');
  }
});
