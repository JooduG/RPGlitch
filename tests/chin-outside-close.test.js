const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function load(dom) {
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};
  const utils = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utils);
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

test('outside click closes chin and disables container pointer-events', async () => {
  const html = `<!doctype html><html><body>
    <header id="top-bar"></header>
    <div id="chin-container">
      <div id="chin-backdrop" hidden></div>
      <div class="chin" data-chin="stories" hidden></div>
      <div class="chin" data-chin="characters" hidden></div>
    </div>
  </body></html>`;
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  load(dom);

  // Ensure listeners are attached
  dom.window.App.chin.init();

  // Open the Stories chin
  dom.window.App.chin.open('stories');
  const cont = dom.window.document.getElementById('chin-container');
  const panel = dom.window.document.querySelector('.chin[data-chin="stories"]');
  expect(cont.hasAttribute('hidden')).toBe(false);
  // container should be interactive while open
  expect(cont.style.pointerEvents).toBe('auto');
  expect(panel.hasAttribute('hidden')).toBe(false);

  // Click on backdrop (outside chin but within container)
  const bd = dom.window.document.getElementById('chin-backdrop');
  bd.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  // Allow deferred close (setTimeout 0) to run via jest fake timers
  jest.runOnlyPendingTimers();

  // Ensure a sync pass applied post-close
  dom.window.App.chin.sync();
  // Container becomes hidden and non-interactive
  expect(cont.hasAttribute('hidden')).toBe(true);
  expect(cont.style.pointerEvents).toBe('none');
});
