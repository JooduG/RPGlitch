const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only'
  });
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};
  const utilsScript = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/utils.js'),
    'utf8'
  );
  dom.window.eval(utilsScript);
  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'),
    'utf8'
  );
  dom.window.eval(script);
  return { dom, App: dom.window.App };
}

test('default storyboard title adapts to selections', () => {
  const { dom, App } = loadApp();
  const document = dom.window.document;
  document.body.innerHTML = `
    <select id="storyboard-ai-select"><option value=""></option><option value="a1">Alice</option></select>
    <select id="storyboard-user-select"><option value=""></option><option value="u1">Bob</option></select>
    <select id="storyboard-world-select"><option value=""></option><option value="w1">Mars</option></select>
  `;
  App.getAllItems = (key) => {
    const map = {
      characters: [
        { id: 'a1', title: 'Alice' },
        { id: 'u1', title: 'Bob' }
      ],
      worlds: [{ id: 'w1', title: 'Mars' }]
    };
    return map[key] || [];
  };
  const originalRandom = dom.window.Math.random;
  dom.window.Math.random = () => 0;
  expect(App._defaultStoryboardTitle()).toBe('Your story begins…');
  document.getElementById('storyboard-ai-select').value = 'a1';
  expect(App._defaultStoryboardTitle()).toBe('The story of Alice');
  document.getElementById('storyboard-user-select').value = 'u1';
  expect(App._defaultStoryboardTitle()).toBe('The story of Alice & Bob');
  document.getElementById('storyboard-world-select').value = 'w1';
  expect(App._defaultStoryboardTitle()).toBe('Alice & Bob in Mars');
  dom.window.Math.random = originalRandom;
});
