// JSDOM is default with jest-environment-jsdom, but set a couple safe globals.
global.fetch = global.fetch || (() => Promise.reject(new Error('fetch not mocked')));
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: false });

// If you need timers or extra matchers later, enable here.
// Example: require('@testing-library/jest-dom');

const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
