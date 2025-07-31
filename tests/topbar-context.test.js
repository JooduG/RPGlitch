const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function attachTopBarEventListeners(App) {
  const chinTabs = document.querySelectorAll('#top-bar-left button[data-chin]');
  chinTabs.forEach(btn => {
    btn.addEventListener('click', App.selectTopBarTab.bind(App, btn.dataset.chin));
  });
}

test('top bar click triggers chin toggle without context errors', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  const App = {
    _toggleChinContent: jest.fn(),
    selectTopBarTab(tab) { this._toggleChinContent(tab); }
  };
  attachTopBarEventListeners(App);
  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  btn.click();
  expect(App._toggleChinContent).toHaveBeenCalled();
});
