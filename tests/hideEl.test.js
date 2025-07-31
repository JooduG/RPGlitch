const fs = require('fs');
const path = require('path');

beforeAll(() => {
  global.Dexie = function () {};
  global.DOMPurify = {};
  global._hyperscript = {};
  global.$ = function () {};
  global.App = {
    initializeWhenReady: jest.fn(),
    _attachTopBarEventListeners: jest.fn(),
  };
  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'),
    'utf8'
  );
  window.eval(script);
  if (typeof window.App.hideEl !== 'function') {
    throw new Error('App.hideEl failed to load');
  }
});

test('hideEl hides by element or id', () => {
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');
  window.App.hideEl(el);
  expect(el.classList.contains('hidden')).toBe(true);

  el.classList.remove('hidden');
  window.App.hideEl('test-el');
  expect(el.classList.contains('hidden')).toBe(true);
});
