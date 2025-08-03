const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function loadScripts(dom) {
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};
  const utils = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/utils.js'), 'utf8');
  dom.window.eval(utils);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(script);
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

test('renderStoryList loads items from storage', () => {
  const dom = new JSDOM('<div id="chin-story-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.localStorage.setItem('stories', JSON.stringify([{ title: 'My Story' }]));
  loadScripts(dom);
  dom.window.App.renderStoryList();
  expect(dom.window.document.getElementById('chin-story-grid').textContent).toContain('My Story');
});

test('renderCharacterList loads items from storage', () => {
  const dom = new JSDOM('<div id="chin-character-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Hero' }]));
  loadScripts(dom);
  dom.window.App.renderCharacterList();
  expect(dom.window.document.getElementById('chin-character-grid').textContent).toContain('Hero');
});

test('renderWorldList loads items from storage', () => {
  const dom = new JSDOM('<div id="chin-world-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.localStorage.setItem('worlds', JSON.stringify([{ title: 'Earth' }]));
  loadScripts(dom);
  dom.window.App.renderWorldList();
  expect(dom.window.document.getElementById('chin-world-grid').textContent).toContain('Earth');
});

test('chin search hides non-matching cards via hidden attribute', () => {
  const html = `
    <div class="chin-panel">
      <input class="chin-search" />
      <div class="chin-list">
        <div data-title="Foo"></div>
        <div data-title="Bar"></div>
      </div>
    </div>`;
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  loadScripts(dom);
  dom.window.App._attachChinSearchHandlers();
  const input = dom.window.document.querySelector('.chin-search');
  input.value = 'foo';
  input.dispatchEvent(new dom.window.Event('input'));
  const foo = dom.window.document.querySelector('[data-title="Foo"]');
  const bar = dom.window.document.querySelector('[data-title="Bar"]');
  expect(foo.hasAttribute('hidden')).toBe(false);
  expect(bar.hasAttribute('hidden')).toBe(true);
});

