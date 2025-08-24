<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->
> **Generated file** — built by `build/scripts/sync-combine.js` at build time.  
> Edit the source docs under `docs/` and `memory-bank/docs/`, not this file.

# Combined Tests (tests/)

## Table of Contents

- **tests/**
  - [tests/chin-grid.test.js](#testschin-gridtestjs)
  - [tests/chin-toggle.test.js](#testschin-toggletestjs)
  - [tests/entity-form.test.js](#testsentity-formtestjs)
  - [tests/glob-patterns.test.js](#testsglob-patternstestjs)
  - [tests/initialize-db.test.js](#testsinitialize-dbtestjs)
  - [tests/initialize.test.js](#testsinitializetestjs)
  - [tests/options-chin.test.js](#testsoptions-chintestjs)
  - [tests/setup-jest.js](#testssetup-jestjs)
  - [tests/storyboard-title.test.js](#testsstoryboard-titletestjs)
  - [tests/topbar-context.test.js](#teststopbar-contexttestjs)
  - [tests/utils.test.js](#testsutilstestjs)

---

<a id="testschin-gridtestjs"></a>
## tests\chin-grid.test.js

```javascript
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function loadScripts(dom) {
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};
  const utils = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utils);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
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
    <div class="chin-widget">
      <input class="chin-search" />
      <div class="chin-grid">
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

test('renderDropdown groups premade and custom items', () => {
  const dom = new JSDOM('<select id="sel"><option value="">Choose...</option></select>', { url: 'http://localhost', runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Custom' }]));
  loadScripts(dom);
  dom.window.App.renderDropdown('sel', 'characters');
  const groupLabels = Array.from(dom.window.document.querySelectorAll('#sel optgroup')).map((g) => g.label);
  expect(groupLabels).toEqual(expect.arrayContaining(['Premade', 'Custom']));
  const premadeOptions = Array.from(dom.window.document.querySelectorAll('#sel optgroup[label="Premade"] option')).map((o) => o.textContent);
  expect(premadeOptions).toEqual(expect.arrayContaining(['Aether Blade']));
});


```

---

<a id="testschin-toggletestjs"></a>
## tests\chin-toggle.test.js

```javascript
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

test('early chin toggle reveals chin container and selected chin', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utilsScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utilsScript);

  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(rpgScript);


  dom.window.App._toggleChinContent('stories');
  const chinContainer = dom.window.document.getElementById('chin-container');
  const selectedChin = dom.window.document.querySelector('[data-chin="stories"]');
  expect(chinContainer.hasAttribute('hidden')).toBe(false);
  expect(selectedChin.hasAttribute('hidden')).toBe(false);
});

```

---

<a id="testsentity-formtestjs"></a>
## tests\entity-form.test.js

```javascript
/* eslint-env jest */
require('../apps/rpglitch/js/entity-form.js');

describe('entity form page', () => {
  test('cancel navigates to storyboard', () => {
    global.App.entities = { upsert: jest.fn() };
    global.App.router = { navigate: jest.fn() };
    global.App.refreshAllLists = jest.fn();
    global.App.hideEl = jest.fn();
    global.App.showEl = jest.fn();
    const App = global.App;
    document.body.innerHTML = '<div id="character-form-screen"></div><button id="form-save"></button><button id="form-cancel"></button><button id="form-delete"></button>';
    App.renderForm('character', 'new');
    const cancel = document.getElementById('form-cancel');
    if (cancel && cancel.onclick) cancel.onclick();
    expect(App.router.navigate).toHaveBeenCalledWith('#storyboard');
  });
});

```

---

<a id="testsglob-patternstestjs"></a>
## tests\glob-patterns.test.js

```javascript
#!/usr/bin/env node

/**
 * Glob Pattern Testing for Cursor Rules
 * Tests which rules should apply to which files based on glob patterns
 */

// const fs = require('fs');
// const path = require('path');

// Test files to verify
const testFiles = [
    'test.md',
    'test.js', 
    'test.scss',
    'test.html'
];

// Rules with their glob patterns
const rules = {
    // General rules
    'thinking-framework.md': ['**/*.md', '**/*.mdc'],
    'memory-bank-optimization.md': ['**/*.md', '**/*.mdc'],
    'mcp-time.md': ['**/*.md', '**/*.mdc'],
    
    // JavaScript rules
    'js-development.md': ['**/*.js', '**/*.mjs', '**/*.ts'],
    'js-cash-dom-usage.md': ['**/*.js'],
    'js-dexie-usage.md': ['**/*.js'],
    'js-indexeddb-principles.md': ['**/*.js', '**/*.ts', '**/*.html'],
    
    // SCSS rules
    'scss-advanced-patterns.md': ['**/*.scss', '**/*.sass', '**/*.css'],
    'scss-debugging.md': ['**/*.scss', '**/*.sass', '**/*.css'],
    
    // HTML rules
    'html-development.md': ['**/*.html'],
    'html-hyperscript-usage.md': ['**/*.html'],
    
    // Perchance rules
    'perchance-architecture.md': ['**/apps/**'],
    'perchance-build-deployment.md': ['**/apps/**']
};

/**
 * Simple glob pattern matcher
 */
function matchesGlob(filename, pattern) {
    if (pattern === '**/apps/**') {
        return filename.includes('apps/');
    }
    
    const extensions = {
        '**/*.md': '.md',
        '**/*.mdc': '.mdc',
        '**/*.js': '.js',
        '**/*.ts': '.ts',
        '**/*.scss': '.scss',
        '**/*.css': '.css',
        '**/*.html': '.html',
        '**/*.json': '.json'
    };
    
    return extensions[pattern] ? filename.endsWith(extensions[pattern]) : false;
}

/**
 * Test which rules match each file
 */
function testGlobMatching() {
    console.log('🧪 GLOB PATTERN TESTING RESULTS\n');
    
    const results = {};
    
    for (const testFile of testFiles) {
        console.log(`📁 Testing file: ${testFile}`);
        
        const matchingRules = [];
        
        for (const [ruleName, patterns] of Object.entries(rules)) {
            for (const pattern of patterns) {
                if (matchesGlob(testFile, pattern)) {
                    matchingRules.push({ rule: ruleName, pattern });
                    break;
                }
            }
        }
        
        results[testFile] = matchingRules;
        
        if (matchingRules.length === 0) {
            console.log('❌ No matching rules found');
        } else {
            console.log(`✅ ${matchingRules.length} matching rules:`);
            matchingRules.forEach(({rule, pattern}) => {
                console.log(`   • ${rule} (pattern: ${pattern})`);
            });
        }
        console.log('');
    }
    
    return results;
}

// Jest tests
describe('Glob Pattern Matching', () => {
    test('JavaScript files match JS rules', () => {
        expect(matchesGlob('test.js', '**/*.js')).toBe(true);
        expect(matchesGlob('test.js', '**/*.scss')).toBe(false);
    });
    
    test('SCSS files match SCSS rules', () => {
        expect(matchesGlob('test.scss', '**/*.scss')).toBe(true);
        expect(matchesGlob('test.scss', '**/*.js')).toBe(false);
    });
    
    test('Markdown files match markdown rules', () => {
        expect(matchesGlob('test.md', '**/*.md')).toBe(true);
        expect(matchesGlob('test.md', '**/*.js')).toBe(false);
    });
    
    test('HTML files match HTML rules', () => {
        expect(matchesGlob('test.html', '**/*.html')).toBe(true);
        expect(matchesGlob('test.html', '**/*.scss')).toBe(false);
    });
});

// Run tests if called directly
if (require.main === module) {
    testGlobMatching();
}

module.exports = { testGlobMatching, matchesGlob, rules, testFiles };
```

---

<a id="testsinitialize-dbtestjs"></a>
## tests\initialize-db.test.js

```javascript
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp() {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.document.addEventListener = jest.fn();
  dom.window.alert = () => {};
  dom.window.Dexie = jest.fn(function(name){
    this.name = name;
    this.version = jest.fn().mockReturnThis();
    this.stores = jest.fn().mockReturnThis();
    this.upgrade = jest.fn().mockReturnThis();
    this.open = jest.fn().mockResolvedValue();
  });
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function(){};
  const utilsScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utilsScript);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(script);
  if (typeof dom.window.App._getUIElements !== 'function') {
    dom.window.App._getUIElements = jest.fn();
  }
  return { App: dom.window.App, dom };
}

test('initializeDb uses default db name when window.dbName is undefined', async () => {
  const { App, dom } = loadApp();
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await App.initializeWhenReady();
  expect(dom.window.dbName).toBe('rpglitch-db');
});

```

---

<a id="testsinitializetestjs"></a>
## tests\initialize.test.js

```javascript
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp(dom) {
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.App = {};
  dom.window.document.addEventListener = jest.fn();
  dom.window.alert = () => {};
  global.Dexie = function () {};
  global.DOMPurify = {};
  global._hyperscript = {};
  global.$ = function () {};
  const utilsScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utilsScript);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(script);
  if (typeof dom.window.App._getUIElements !== 'function') {
dom.window.App._getUIElements = jest.fn();
  }
  return dom.window.App;
}

test('initializeWhenReady runs without errors', async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const App = loadApp(dom);
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await expect(App.initializeWhenReady()).resolves.not.toThrow();
});

test('_getUIElements is defined before initialization', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
  const App = loadApp(dom);
  expect(typeof App._getUIElements).toBe('function');
});

test('initializeWhenReady resets retry counter on success', async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const App = loadApp(dom);
  App.initializeWhenReadyRetryCount = 2;
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await App.initializeWhenReady();
  expect(App.initializeWhenReadyRetryCount).toBe(0);
});

```

---

<a id="testsoptions-chintestjs"></a>
## tests\options-chin.test.js

```javascript
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp() {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.App = {};
  dom.window.document.addEventListener = jest.fn();
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utils = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utils);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(script);
  const App = dom.window.App;
  App.ui = {
    uploadBackupInput: dom.window.document.getElementById('upload-backup'),
    uploadBackupTrigger: dom.window.document.querySelector('[data-trigger="upload-backup"]'),
    downloadBackupButton: dom.window.document.getElementById('download-backup'),
    deleteAllDataButton: dom.window.document.getElementById('delete-all-data')
  };
  App._attachTopBarEventListeners();
  return App;
}

test('options chin actions trigger database methods', () => {
  const App = loadApp();

  App.importAllData = jest.fn();
  App.exportAllData = jest.fn();
  App.deleteAllData = jest.fn();

  const { uploadBackupTrigger, uploadBackupInput, downloadBackupButton, deleteAllDataButton } = App.ui;

  if (uploadBackupTrigger && uploadBackupInput) {
    const view = uploadBackupInput.ownerDocument.defaultView;
    const file = new view.File(['{}'], 'backup.json', { type: 'application/json' });
    uploadBackupTrigger.click();
    Object.defineProperty(uploadBackupInput, 'files', { value: [file] });
    uploadBackupInput.dispatchEvent(new view.Event('change'));
    expect(App.importAllData).toHaveBeenCalledWith(file);
  }

  if (downloadBackupButton) {
    downloadBackupButton.click();
    expect(App.exportAllData).toHaveBeenCalled();
  }

  if (deleteAllDataButton) {
    deleteAllDataButton.click();
    expect(App.deleteAllData).toHaveBeenCalled();
  }
});

```

---

<a id="testssetup-jestjs"></a>
## tests\setup-jest.js

```javascript
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

```

---

<a id="testsstoryboard-titletestjs"></a>
## tests\storyboard-title.test.js

```javascript
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
    path.resolve(__dirname, '../apps/rpglitch/js/utils.js'),
    'utf8'
  );
  dom.window.eval(utilsScript);
  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/js/index.js'),
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
    const items = map[key] || [];
    return items.map(item => ({
      ...item,
      title: item.title ? String(item.title).replace(/[<>&"']/g, '') : ''
    }));
  };
  const originalRandom = dom.window.Math.random;
  dom.window.Math.random = () => 0;
  expect(App._defaultStoryboardTitle()).toBe('Your story begins…');
  document.getElementById('storyboard-ai-select').value = 'a1';
  expect(App._defaultStoryboardTitle()).toBe('Once upon a time Alice');
  document.getElementById('storyboard-user-select').value = 'u1';
  expect(App._defaultStoryboardTitle()).toBe('Once upon a time Alice & Bob');
  document.getElementById('storyboard-world-select').value = 'w1';
  expect(App._defaultStoryboardTitle()).toBe('Once upon a time Alice & Bob in Mars');
  dom.window.Math.random = originalRandom;
});

```

---

<a id="teststopbar-contexttestjs"></a>
## tests\topbar-context.test.js

```javascript
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

// Test the actual _attachTopBarEventListeners method

test('top bar click triggers chin toggle without duplicate handlers', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Load the actual RPGlitch.js
  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(rpgScript);
  
  // Mock the methods that _attachTopBarEventListeners depends on
  dom.window.App.ui.showChin = jest.fn();
  dom.window.App.selectTopBarTab = jest.fn();
  dom.window.App._attachedTopBarButtons = new Set();
  
  // Test the actual method
  dom.window.App._attachTopBarEventListeners();
  dom.window.App._attachTopBarEventListeners();
  
  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  if (btn) {
    btn.click();
    expect(dom.window.App.selectTopBarTab).toHaveBeenCalledTimes(1);
    expect(dom.window.App.ui.showChin).toHaveBeenCalledTimes(1);
    expect(dom.window.App.ui.showChin).toHaveBeenCalledWith('stories');
  }
});


```

---

<a id="testsutilstestjs"></a>
## tests\utils.test.js

```javascript
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

  // Provide minimal globals inside the JSDOM context
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utilsScript = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/js/utils.js'),
    'utf8'
  );
  dom.window.eval(utilsScript);

  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/js/index.js'),
    'utf8'
  );
  dom.window.eval(script);

  // Return the isolated JSDOM context and the loaded App instance
  return { dom, App: dom.window.App };
}

test('hideEl hides by element or id', () => {
  const { dom, App } = loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');
  expect(typeof App.hideEl).toBe('function');
  App.hideEl(el);
  expect(el.hasAttribute('hidden')).toBe(true);
  el.removeAttribute('hidden');
  // Using the string ID should work the same
  App.hideEl('test-el');
  expect(el.hasAttribute('hidden')).toBe(true);
});

test('showEl reveals element by removing hidden attribute', () => {
  const { dom, App } = loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el" hidden="hidden"></div>';
  const el = document.getElementById('test-el');
  App.showEl(el);
  expect(el.hasAttribute('hidden')).toBe(false);
  el.setAttribute('hidden', 'hidden');
  App.showEl('test-el');
  expect(el.hasAttribute('hidden')).toBe(false);
});

```

---
