import rfdc from 'rfdc';
global.structuredClone = rfdc();

import 'fake-indexeddb/auto';
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
global.window.DOMPurify = { sanitize: (str) => str };
global.DOMPurify = { sanitize: (str) => str }; // Also expose globally for direct access
global.window._hyperscript = {};
global.window.$ = function () {};
global.image = () => {};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store = {};
    return {
      getItem: function(key) {
        return store[key] || null;
      },
      setItem: function(key, value) {
        store[key] = value.toString();
      },
      removeItem: function(key) {
        delete store[key];
      },
      clear: function() {
        store = {};
      }
    };
  })()
});

// Mock getComputedStyle
global.window.getComputedStyle = jest.fn((el) => {
  return {
    pointerEvents: el.style.pointerEvents,
  };
});

const { afterAll } = require('@jest/globals');

// This global hook will run once after all test suites have finished.
// It checks for an open database connection on the global App object
// and closes it to ensure the test process can exit cleanly. This
// is the proper fix for tests hanging due to open async handles.
afterAll(async () => {
  if (global.App && global.App.db && global.App.db.isOpen()) {
    console.log('[Jest Teardown] Closing open database connection...');
    await global.App.db.close();
    console.log('[Jest Teardown] Database connection closed.');
  }
});
