// JSDOM is default with jest-environment-jsdom, but set a couple safe globals.
global.fetch = global.fetch || (() => Promise.reject(new Error('fetch not mocked')));
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: false });

globalThis.__TEST__ = true;

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers?.();
});

const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
