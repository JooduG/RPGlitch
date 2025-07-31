const fs = require('fs');
const path = require('path');

beforeAll(() => {
  global.Dexie = function () {};
  global.DOMPurify = {};
  global._hyperscript = {};
  global.$ = function () {};
  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'),
    'utf8'
  );
  const scriptEl = document.createElement('script');
  scriptEl.textContent = script;
  document.body.appendChild(scriptEl);

  // After loading the script, App.hideEl should be a function.
  // If it's not, the test setup has failed, and we should know about it.
  if (typeof window.App?.hideEl !== 'function') {
    throw new Error('window.App.hideEl is not a function after loading RPGlitch.js. The script might have failed to initialize correctly.');
  };
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
