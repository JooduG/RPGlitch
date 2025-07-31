const hideEl = require('../apps/rpglitch/utils/hideEl');

test('hideEl hides by element or id', () => {
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');
  window.App.hideEl(el);
  expect(el.classList.contains('hidden')).toBe(true);

  el.classList.remove('hidden');
  window.App.hideEl('test-el');
  expect(el.classList.contains('hidden')).toBe(true);
});
