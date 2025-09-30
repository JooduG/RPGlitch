const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

describe('ImageGlitch', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../build/output/ImageGlitch.html'), 'utf8');
    const virtualConsole = new VirtualConsole();
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      virtualConsole,
      beforeParse(window) {
        window.localStorage = {
          _data: {},
          getItem: jest.fn(function(key) { return this._data[key] || null; }),
          setItem: jest.fn(function(key, value) { this._data[key] = value; }),
          removeItem: jest.fn(function(key) { delete this._data[key]; }),
        };
        window.image = () => {};
      }
    });
    window = dom.window;
    document = window.document;
  });

  test('should generate an image when the form is filled and the button is clicked', () => {
    const promptInput = document.getElementById('promptInput');
    expect(promptInput).not.toBeNull();
    const numImagesSelect = document.getElementById('numImagesSelect');
    expect(numImagesSelect).not.toBeNull();
    const summonBtn = document.getElementById('generate-button');
    expect(summonBtn).not.toBeNull();
    const outputArea = document.getElementById('output');
    expect(outputArea).not.toBeNull();

    // Set the prompt and number of images
    promptInput.value = 'a test prompt';
    numImagesSelect.value = '1';

    // Dispatch input and change events to trigger the app's event listeners
    promptInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    numImagesSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    // Click the button
    summonBtn.click();

    // Check that a quad-cell was added to the output area
    const quadCell = outputArea.querySelector('.quad-cell');
    expect(quadCell).not.toBeNull();
  });
});