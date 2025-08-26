// JSDOM is default with jest-environment-jsdom, but set a couple safe globals.
global.fetch =
  global.fetch || (() => Promise.reject(new Error('fetch not mocked')));
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: false });

globalThis.__TEST__ = true;

// Track last assigned JSDOM window so we can close it after tests
if (!global.__LAST_WINDOW__) global.__LAST_WINDOW__ = null;
try {
  const current = Object.getOwnPropertyDescriptor(global, 'window');
  Object.defineProperty(global, 'window', {
    configurable: true,
    enumerable: true,
    get() {
      return current && current.get ? current.get.call(global) : this.__trackedWindow;
    },
    set(v) {
      this.__trackedWindow = v;
      global.__LAST_WINDOW__ = v;
      return true;
    }
  });
} catch {}

// Use fake timers to prevent real timers from keeping the process alive.
beforeEach(() => {
  try {
    jest.useFakeTimers();
  } catch {}
  if (typeof global.requestAnimationFrame === 'undefined') {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
  if (typeof global.cancelAnimationFrame === 'undefined') {
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

afterEach(() => {
  try {
    // Flush any queued timers and intervals created during tests.
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers?.();
  } catch {}
  try {
    if (global.__LAST_WINDOW__ && typeof global.__LAST_WINDOW__.close === 'function') {
      global.__LAST_WINDOW__.close();
    }
  } catch {}
});

// If you need timers or extra matchers later, enable here.
// Example: require('@testing-library/jest-dom');


const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
