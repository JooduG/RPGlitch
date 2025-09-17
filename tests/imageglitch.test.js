const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('ImageGlitch', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../build/output/ImageGlitch.html'), 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    window = dom.window;
    document = window.document;

    // Remove the style tag that causes CSS parsing errors in JSDOM if it exists
    const style = document.getElementById('imageglitch-inline-css');
    if (style) {
      style.remove();
    }
  });

  test('should generate an image when the form is filled and the button is clicked', () => {
    const promptInput = document.getElementById('promptInput');
    expect(promptInput).not.toBeNull();
    const numImagesSelect = document.getElementById('numImagesSelect');
    expect(numImagesSelect).not.toBeNull();
    const summonBtn = document.getElementById('summonBtn');
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

    // Check that an image was added to the output area
    const img = outputArea.querySelector('img');
    expect(img).not.toBeNull();
    // Verify img.src contains the expected Pollinations URL based on the prompt
    expect(img.src).toContain('https://image.pollinations.ai/prompt/a%20test%20prompt');
  });
});