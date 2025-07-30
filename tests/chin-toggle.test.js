const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

test('chin elements toggle visibility', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const chinContainer = document.getElementById('chin-container');
  const storiesChin = document.getElementById('chin-stories');
  const btn = document.querySelector('#top-bar-left button[data-chin="stories"]');

  function showEl(el) { el.classList.remove('hidden'); }
  function hideEl(el) { el.classList.add('hidden'); }
  function toggleChin(chinName) {
    const selected = document.querySelector(`#chin-container [data-chin="${chinName}"]`);
    if (selected.classList.contains('hidden')) {
      showEl(chinContainer);
      showEl(selected);
    } else {
      hideEl(chinContainer);
      hideEl(selected);
    }
  }

  btn.addEventListener('click', () => toggleChin('stories'));

  // initial state hidden
  expect(chinContainer.classList.contains('hidden')).toBe(true);
  btn.click();
  expect(chinContainer.classList.contains('hidden')).toBe(false);
  expect(storiesChin.classList.contains('hidden')).toBe(false);
  btn.click();
  expect(chinContainer.classList.contains('hidden')).toBe(true);
});
