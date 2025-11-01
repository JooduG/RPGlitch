import { safeDecodeURIComponent } from './utils.js';
import { db } from './db.js';

// =================================================================
// Plugin Setup: Copy Perchance-exposed plugins to standard names
// =================================================================

/**
 * Copies plugins exposed by the Perchance left panel (pluginImage, pluginAi, etc.)
 * to the standard window property names (image, ai, etc.) so the rest of the app
 * can access them without needing to know about the Perchance naming convention.
 */
function setupPlugins() {
  // Map Perchance-exposed plugin names to standard names
  const pluginMap = {
    pluginImage: 'image',
    pluginAi: 'ai',
    pluginR: 'r',
  };

  for (const [perchanceName, standardName] of Object.entries(pluginMap)) {
    if (window[perchanceName] && !window[standardName]) {
      window[standardName] = window[perchanceName];
    }
  }
}

// Call setup immediately on module load
setupPlugins();

// ====== GLOBAL STATE & CONSTANTS ======
const TEST_MODE = (() => {
  if (globalThis.__TEST__) {
    return true;
  }
  try {
    return /jsdom/i.test(globalThis?.navigator?.userAgent || "");
  } catch {
    return false;
  }
})();
const DEFAULT_CREATIVITY_LEVEL = "4";
const creativityMap = {
  "0": { gScale: 1, aiTemp: 1.9 }, "1": { gScale: 3, aiTemp: 1.5 }, "2": { gScale: 5, aiTemp: 1.2 },
  "3": { gScale: 6, aiTemp: 1.1 }, "4": { gScale: 7, aiTemp: 1.0 }, "5": { gScale: 8, aiTemp: 0.9 },
  "6": { gScale: 9, aiTemp: 0.8 }, "7": { gScale: 10, aiTemp: 0.7 }, "8": { gScale: 12, aiTemp: 0.5 },
  "9": { gScale: 15, aiTemp: 0.3 }, "10": { gScale: 20, aiTemp: 0.1 }
};

const AI_SCRIBE_INSTRUCTION = "You are a world-renown expert prompt engineer that specialises in flawless text-to-image prompt design. Your task is to take the user's input prompt and transform it into a masterful, holistically detailed, and visually inspiring descriptive prompt that paints a vivid work of art with words. When refining, best practice is to analyze the user's prompt, deconstruct it into its core elements, and organize them into categories. For any category that is lacking in quality, vague, or missing from the user's prompt, you have the opportunity to flex your immense creativity. Pick the most suitable options from the corresponding list that anchors a balanced composition and intelligent red thread through the entire prompt, based on the user's original prompt and overall intent, except for Subject and Setting where you can just roll with what you got from the user's prompt. The categories are: Subject & Setting, Artistic Style (artisticStyles), Composition & Camera Perspective (composition), Lighting (lighting), Color Palette (colorPalettes), Mood & Atmosphere (mood), Technical Details (technicalDetails), and Other Additional Elements (additionalElements). Your goal is to manufacture a prompt that is cohesive, unified, and meticulously orchestrated—everything fitting together naturally. The result should be a single, complete, refined prompt that would be suitable for a world-renown artist, photographer, or designer. If any style, technical, or quality suggestion from the quality enhancement prefix conflicts with the user's vision, in that case consider the user's original prompt as master, focus on perfecting the prompt and keep it very close to their original vision while keeping the cohesion and consistency in mind. IMPORTANT: Do NOT use numerical weighting syntax (e.g., 'word:1.2'). If the user's original prompt contains weighted words or implies emphasis, translate that emphasis into descriptive language within the prompt. Make sure the prom... [truncated]";
const AI_CHAOS_INSTRUCTION = "You are a 'Mad Prompt Scientist'—a master of mixing different elements just to see what will happen. Your task is to create a completely chaotic, yet visually inspiring image prompt by mixing and matching different elements from the user's input and the categories below. First, analyze the user's original prompt and determine which of these categories below has gotten sufficiently described. For each category that is satisfactory fulfilled, keep the user's original theme. If a category is lacking in quality, vague, or missing, replace it with a keyword/phrase from that specific category. As an added twist, always replace (reroll) at least one category with a new random keyword from its list, even if the user has described it well. If the user's prompt is empty, create a completely random prompt rolling new keywords for every single category and filling in the gaps with your own creativity. The categories are: Subject and Setting: (Keep the user's original subject and setting and enhance it to the best of your ability, if it's missing, feel free to impress me with your creativity). Artistic Style: ([artisticStyles.selectOne()]) is potentially the new visual identity and technique for the image (Could also be a specific artist or movement). Composition and Camera Perspective: Is ([composition.selectOne()]) what will guide the arrangement of elements and point of view? Lighting: ([lighting.selectOne()]) might be creating the right atmosphere through illumination and shadows. Color Palette: The dominant colors and tones might be ([colorPalettes.selectOne()]), and could be what draws the viewer in. Mood and Atmosphere: The emotional tone and overall feeling of the image could be ([mood.selectOne()]). Technical Details: Does ([technicalDetails.selectOne()]) describe the perfect technical aspects of the image? Other Elements: Here comes a wildcard! What about adding ([additionalElements.selectOne()]). As a Mad Prompt Scientist, embrace atomica... [truncated]";

const BASE_IMAGE_URL = 'https://image.pollinations.ai/prompt/';
const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 1280;

let mainPromptContent = "";
let numImagesToGen = 1;
let masterCreativity = DEFAULT_CREATIVITY_LEVEL;
let currentGScale, currentAiTemperature;
let imgSeed = "";

window.activeAiProcess = null;
window.aiProcessInterval = null;

window.undoState = { type: null, prompt: null, instruction: null };

// ====== UTILITY & UI FUNCTIONS ======
function extractAiResponse(aiResponse) {
  if (!aiResponse) return "";

  let text = "";
  if (typeof aiResponse.generatedText === 'string') text = aiResponse.generatedText;
  else if (typeof aiResponse.text === 'string') text = aiResponse.text;
  else if (typeof aiResponse === 'string') text = aiResponse;

  const match = text.trim().match(/(?:Prompt:)\s*([\s\S]*)/i);
  return match ? match[1].trim() : text.trim();
}

function setPromptInputValue(text, isUndo = false) {
  const promptInput = document.getElementById('promptInput');
  if (promptInput) {
    promptInput.value = text;
    mainPromptContent = text;
    if (!isUndo) {
      promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      checkAllButtonStates();
    }
  }
}

function setUiLockState(isLocked) {
  const elements = [
    document.getElementById('promptInput'), document.getElementById('instructionInput'),
    document.getElementById('aiMagicSelect'),
    document.getElementById('numImagesSelect'), document.getElementById('imgSeed'),
    document.getElementById('masterCreativitySlider')
  ];

  elements.forEach(el => {
    if (el) el.disabled = isLocked;
  });

  document.querySelectorAll('textarea').forEach(ta => {
    ta.readOnly = isLocked;
    ta.style.opacity = isLocked ? '0.5' : '1';
    ta.style.cursor = isLocked ? 'not-allowed' : 'text';
  });

  if (isLocked) document.getElementById('generate-button').disabled = false;
  else checkAllButtonStates();
}

function validatePrompt(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    alert('Prompt cannot be empty');
    return null;
  }
  if (prompt.length > 1000) { // reasonable limit
    alert('Prompt too long (max 1000 characters)');
    return null;
  }
  return prompt.trim();
}

function validateSeed(seed) {
  if (seed === '' || seed === null || typeof seed === 'undefined') {
    return ''; // Return empty string for random
  }
  const parsed = parseInt(seed, 10);
  if (isNaN(parsed) || parsed < 0) {
    alert('Seed must be a non-negative number. A random seed will be used.');
    return ''; // Return empty string for random
  }
  return parsed;
}

// ====== SETTINGS & STATE MANAGEMENT ======
function updateDerivedSettings() {
  const mc = Number(masterCreativity);
  const selectedSettings = creativityMap[String(mc)] || { gScale: 7, aiTemp: 1.0 };
  currentGScale = selectedSettings.gScale;
  currentAiTemperature = selectedSettings.aiTemp;
  const creativityValueEl = document.getElementById('masterCreativityValue');
  if (creativityValueEl) {
    creativityValueEl.innerText = mc;
  }
}

function handleSeedInput(value) {
  const trimmedValue = value.trim();
  imgSeed = (trimmedValue === '' || isNaN(Number(trimmedValue))) ? trimmedValue : Number(trimmedValue);
}

async function rememberSettings() {
  try {
    const instructionInput = document.getElementById('instructionInput');
    const instructionsPanel = document.getElementById('instructionsPanel');

    const settings = {
      id: 'app-settings',
      mainPromptContent: mainPromptContent || "",
      seed: imgSeed !== '' && imgSeed !== null ? Number(imgSeed) : '',
      numImagesToGen: Number(numImagesToGen) || 1,
      masterCreativity: Number(masterCreativity) || Number(DEFAULT_CREATIVITY_LEVEL),
      instructionInput: instructionInput ? instructionInput.value : "",
      instructionsVisible: instructionsPanel ? (instructionsPanel.style.display !== 'none') : false
    };

    await db.settings.put(settings);
  } catch (error) {
    console.error('Failed to save settings to IndexedDB:', error);
    // Non-critical - don't alert user
  }
}

async function loadSavedSettings() {
  try {
    const settings = await db.settings.get('app-settings');
    if (!settings) {
      console.log('No saved settings found, using defaults');
      return; // First run, no settings yet
    }

    // Restore main prompt content
    if (settings.mainPromptContent) {
      mainPromptContent = settings.mainPromptContent;
      const promptInput = document.getElementById('promptInput');
      if (promptInput) {
        promptInput.value = settings.mainPromptContent;
      }
    }

    // Restore seed
    if (settings.seed !== undefined && settings.seed !== null) {
      imgSeed = settings.seed;
      const seedInput = document.getElementById('imgSeed');
      if (seedInput) {
        seedInput.value = settings.seed;
      }
    }

    // Restore number of images to generate
    if (typeof settings.numImagesToGen === 'number') {
      numImagesToGen = settings.numImagesToGen;
      const numImagesSelect = document.getElementById('numImagesSelect');
      if (numImagesSelect) {
        numImagesSelect.value = settings.numImagesToGen;
      }
    }

    // Restore master creativity
    if (typeof settings.masterCreativity === 'number') {
      masterCreativity = settings.masterCreativity;
      const creativitySlider = document.getElementById('masterCreativitySlider');
      if (creativitySlider) {
        creativitySlider.value = settings.masterCreativity;
      }
    }

    // Restore instruction input
    if (settings.instructionInput) {
      const instructionInput = document.getElementById('instructionInput');
      if (instructionInput) {
        instructionInput.value = settings.instructionInput;
      }
    }

    // Restore instructions panel visibility
    if (typeof settings.instructionsVisible === 'boolean') {
      const instructionsPanel = document.getElementById('instructionsPanel');
      if (instructionsPanel) {
        instructionsPanel.style.display = settings.instructionsVisible ? 'block' : 'none';
        if (settings.instructionsVisible) {
          checkAllButtonStates();
        }
      }
    }
  } catch (error) {
    console.error('Failed to load settings from IndexedDB:', error);
    // Non-critical - app continues with defaults
  }
}

// Function to handle Enter key press in textareas
function handleTextareaKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // Prevent default behavior (adding a new line)
    const generateButton = document.getElementById('generate-button');
    if (generateButton && !generateButton.disabled) {
      generateButton.click(); // Trigger the command button
    }
  }
}

// ====== AI PROCESSING & COMMAND BUTTON LOGIC ======
function handleAiMagicSelection(selectElement) {
  const selection = selectElement.value;
  if (selection === 'placeholder') return;

  document.getElementById('instructionsPanel').style.display = 'none';

  if (selection === 'summon') {
    resetSmartButton();
  } else if (selection === 'transfigure') {
    document.getElementById('instructionsPanel').style.display = 'block';
    document.getElementById('instructionInput').focus();
    setCommandState('transfigure');
  } else {
    setCommandState(selection);
  }

  selectElement.value = 'placeholder';
  rememberSettings().catch(err => console.error('Failed to save settings:', err));
}

function handleAiButtonClick(processType) {
  if (window.activeAiProcess) return;

  const instructions = document.getElementById('instructionInput').value;

  if (processType === 'transfigure' && !instructions.trim()) {
    alert('Instructions cannot be empty for Transfigure.');
    return;
  }
  
  if (processType !== 'chaos') {
    const validatedPrompt = validatePrompt(mainPromptContent);
    if (!validatedPrompt) return;
    mainPromptContent = validatedPrompt;
  }

  updateDerivedSettings();
  executeAiProcess(processType, mainPromptContent, instructions);
}

async function executeAiProcess(type, prompt, instructions) {
  window.activeAiProcess = type;
  window.undoState.prompt = prompt;
  window.undoState.instruction = instructions;
  setUiLockState(true);
  startTimerOnButton();

  let aiPrompt, fallbackText;
  switch (type) {
    case 'scribe':
      aiPrompt = `${AI_SCRIBE_INSTRUCTION}\n\nUser\'s original prompt: ${prompt}`;
      break;
    case 'chaos':
      aiPrompt = AI_CHAOS_INSTRUCTION.replace('[RANDOM_ELEMENTS]', `Artistic Style: [artisticStyles.selectOne()], Composition and Camera Perspective: [composition.selectOne()], Lighting: [lighting.selectOne()], Color Palette: [colorPalettes.selectOne()], Mood and Atmosphere: [mood.selectOne()], Technical Details: [technicalDetails.selectOne()], Other Elements: [additionalElements.selectOne()]`) + `\n\nUser\'s original prompt: ${prompt}`;
      fallbackText = "A beautiful cat in a sunbeam, digital art.";
      break;
    case 'transfigure':
      aiPrompt = `You are a 'Prompt Modification Specialist.' Your task is to take the user's prompt: "${prompt}" and modify it precisely according to these specific instructions: "${instructions}". IMPORTANT: Do NOT use numerical weighting syntax (e.g., 'word:1.2'). If the user's input contains weighted words or implies emphasis, translate that emphasis into descriptive language. Make sure the prompt is 100% affirmative and avoid negative phrasing (e.g., 'no hats', 'not blurry'); instead, describe what IS desired. When appropriate, you can introduce variations by using the syntax '{Option A|Option B|Option C}' to allow the final prompt to randomly select one of the specified options. If the user wants NSFW elements you must use explicit language throughout and exaggerate the NSFW-aspects. Do not add any of your own conversational text, greetings, explanations, or labels like 'Refined Prompt:'. Return ONLY the single, complete, refined prompt itself. Output ONLY the new and finalized prompt itself, with no category names, headlines, or explanations—just the prompt.`;
      break;
  }

  try {
    const aiOperation = ai(aiPrompt, { temperature: Number(currentAiTemperature) });
    const cancellationPromise = new Promise((_, reject) => {
      const check = setInterval(() => {
        if (window.activeAiProcess === 'cancelling') {
          clearInterval(check);
          reject(new Error('Cancelled'));
        }
      }, 100);
      aiOperation.finally(() => clearInterval(check));
    });

    const result = await Promise.race([aiOperation, cancellationPromise]);
    const newPrompt = extractAiResponse(result);

    if (newPrompt && newPrompt !== prompt) {
      setPromptInputValue(newPrompt);
      setUndoState(type);
    } else {
      resetSmartButton();
    }
  } catch (error) {
    console.error("AI process error:", error);
    setPromptInputValue(window.undoState.prompt);
    resetSmartButton();

    if (type === 'chaos' && !prompt) {
      setPromptInputValue(fallbackText);
      setUndoState('chaos');
    }
  } finally {
    clearInterval(window.aiProcessInterval);
    window.aiProcessInterval = null;
    window.activeAiProcess = null;
    setUiLockState(false);
  }
}

function handleManualPromptChange() {
  // If the prompt content changes and we are in an undo state, reset the button
  if (window.undoState.type && window.undoState.prompt && mainPromptContent.trim() !== window.undoState.prompt.trim()) {
    resetSmartButton();
  }
  checkAllButtonStates();
  rememberSettings().catch(err => console.error('Failed to save settings:', err));
}

// ====== SMART BUTTON STATES ======
function setUndoState(type) {
  window.undoState.type = type;
  const generateButton = document.getElementById('generate-button');
  let typeName = type.charAt(0).toUpperCase() + type.slice(1);

  if (type === 'scribe') typeName = 'Refining';
  if (type === 'chaos') typeName = 'Chaos';
  if (type === 'transfigure') typeName = 'Instructions';

  generateButton.textContent = `Undo ${typeName}`;
  generateButton.className = 'secondary';
  generateButton.onclick = handleUndoClick;
}

function resetSmartButton() {
  const generateButton = document.getElementById('generate-button');
  generateButton.textContent = 'Generate Images';
  generateButton.className = 'btn-generate';
  generateButton.onclick = handleSummonClick;
  window.undoState.type = null;
  window.undoState.prompt = null;
  window.undoState.instruction = null;
  checkAllButtonStates();
}

function handleUndoClick() {
  setPromptInputValue(window.undoState.prompt, true);
  if (window.undoState.type === 'transfigure') {
    document.getElementById('instructionInput').value = window.undoState.instruction;
  }
  resetSmartButton();
}

function startTimerOnButton() {
  const generateButton = document.getElementById('generate-button');
  let seconds = 0;
  generateButton.textContent = `Cancel (0s)`;
  generateButton.className = 'contrast';
  generateButton.onclick = () => { window.activeAiProcess = 'cancelling'; };

  if (window.aiProcessInterval) clearInterval(window.aiProcessInterval);
  window.aiProcessInterval = setInterval(() => {
    seconds++;
    if (window.activeAiProcess && window.activeAiProcess !== 'cancelling') {
      generateButton.textContent = `Cancel (${seconds}s)`;
    } else {
      clearInterval(window.aiProcessInterval);
    }
  }, 1000);
}

function setCommandState(commandType) {
  const generateButton = document.getElementById('generate-button');
  let text = '', className = '';

  if (commandType === 'scribe') {
    text = 'Refine Prompt';
    className = 'btn-refine';
  } else if (commandType === 'chaos') {
    text = 'Embrace Chaos';
    className = 'btn-chaos';
  } else if (commandType === 'transfigure') {
    text = 'Apply Instructions';
    className = 'btn-instruct';
  }

  generateButton.textContent = text;
  generateButton.className = className;
  generateButton.onclick = () => handleAiButtonClick(commandType);
  checkAllButtonStates();
}

// ====== IMAGE SUMMONING & MAIN STATE LOGIC ======
async function handleSummonClick() {
  const generateButton = document.getElementById('generate-button');
  
  const validatedPrompt = validatePrompt(mainPromptContent);
  if (!validatedPrompt) return;
  mainPromptContent = validatedPrompt; // update with trimmed prompt

  generateButton.setAttribute('aria-busy', 'true');
  generateButton.disabled = true;

  try {
    // Verify text-to-image plugin is available
    if (typeof image === 'undefined') {
      console.error('[ImageGlitch] text-to-image-plugin not loaded - image function unavailable');
      alert('Image generation is currently unavailable. Please refresh the page.');
      return;
    }

    document.getElementById('output').innerHTML = buildImageGenerationHtml();

    document.querySelectorAll('.quad-cell').forEach(cell => {
      const prompt = safeDecodeURIComponent(cell.closest('.quad-block').dataset.prompt);
      const seed = cell.dataset.seed;
      const resolution = cell.dataset.resolution;

      image({
        prompt: prompt,
        seed: seed,
        guidanceScale: currentGScale,
        resolution: resolution,
        onFinish: (r) => {
          r.iframe?.replaceWith(r.canvas);
          cell.appendChild(r.canvas);
        }
      });
    });

    // Add the mouseover actions after images are generated
    await new Promise(resolve => setTimeout(resolve, 500));
    addImageOverlays();
  } catch (error) {
    console.error('Image generation failed:', error);
    alert('Failed to generate images. Please try again.');
  } finally {
    generateButton.setAttribute('aria-busy', 'false');
    generateButton.disabled = false;
  }
}

function buildImageGenerationHtml() {
  updateDerivedSettings();
  const n = Number(numImagesToGen);
  let outputHtml = "";
  const prompt = mainPromptContent.trim(); // Already validated
  const validatedSeed = validateSeed(imgSeed);
  const useRandomSeeds = validatedSeed === '';

  for (let i = 0; i < n; i++) {
    let imageGenerator;
    if (i === 1) {
      imageGenerator = 'pollinations';
    } else if (i > 1) {
      imageGenerator = Math.random() < 0.05 ? 'pollinations' : 'perchance';
    } else {
      imageGenerator = 'perchance';
    }

    if (imageGenerator === 'perchance') {
      outputHtml += `<div class="block quad-block" data-prompt="${encodeURIComponent(prompt)}">`;
      const resolutions = {
        "top-left": "768x768", "top-right": "512x768",
        "bottom-left": "768x512", "bottom-right": "512x512"
      };
      for (const position in resolutions) {
        const resolution = resolutions[position];
        let blockSeed = useRandomSeeds ? Math.floor(Math.random() * 10000000) : validatedSeed;
        outputHtml += `<div class="quad-cell ${position}" data-seed="${blockSeed}" data-resolution="${resolution}"></div>`;
      }
      outputHtml += `</div>`;
    } else { // pollinations
      let blockSeed = useRandomSeeds ? Math.floor(Math.random() * 10000000) : validatedSeed;
      const params = new URLSearchParams({
        width: DEFAULT_IMAGE_WIDTH, height: DEFAULT_IMAGE_HEIGHT,
        seed: blockSeed, model: 'flux', private: true, nologo: true,
      });
      const imgUrl = `${BASE_IMAGE_URL}${encodeURIComponent(prompt)}?${params.toString()}`;
      outputHtml += `<div class="block solo-block" data-seed="${blockSeed}" data-prompt="${encodeURIComponent(prompt)}"><img src="${imgUrl}" loading="lazy" alt="Generated image" crossorigin="anonymous"></div>`;
    }
  }
  return outputHtml;
}

/**
 * Wait for Perchance plugins to become available before initializing.
 * Plugins are loaded asynchronously by the left panel and may not be ready immediately.
 * Left panel exposes them with "plugin" prefix (pluginImage, pluginAi, etc.)
 * to avoid Perchance syntax parsing issues with dot notation.
 * In test mode, this function skips the wait and returns immediately.
 * @param {string[]} requiredPlugins - Array of global plugin names to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} retryCount - Current retry attempt
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<boolean>} - True if all plugins loaded, false if timeout
 */
async function waitForPlugins(requiredPlugins, timeout = 10000, retryCount = 0, maxRetries = 3) {
  // Skip plugin waiting in test mode
  if (TEST_MODE) {
    console.log('[ImageGlitch] Test mode detected, skipping plugin wait');
    return true;
  }

  const startTime = Date.now();

  console.log(`[ImageGlitch] Waiting for plugins (attempt ${retryCount + 1}/${maxRetries + 1}):`, requiredPlugins);

  // Convert standard names to prefixed names that left panel actually exposes
  // (e.g., 'image' -> 'pluginImage', 'ai' -> 'pluginAi')
  const prefixedPlugins = requiredPlugins.map(name => {
    return 'plugin' + name.charAt(0).toUpperCase() + name.slice(1);
  });

  while (Date.now() - startTime < timeout) {
    // Check if prefixed plugins are available (they get exposed by left panel)
    const allPrefixedAvailable = prefixedPlugins.every(name => typeof window[name] !== 'undefined');
    // Also check if standard names are available (they get set by setupPlugins())
    const allStandardAvailable = requiredPlugins.every(name => typeof window[name] !== 'undefined');

    if (allPrefixedAvailable || allStandardAvailable) {
      console.log('[ImageGlitch] All plugins loaded successfully:', requiredPlugins);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before checking again
  }

  if (retryCount < maxRetries) {
    console.warn(`[ImageGlitch] Plugins not available, retrying (${retryCount + 1}/${maxRetries})...`);
    return waitForPlugins(requiredPlugins, timeout, retryCount + 1, maxRetries);
  }

  const availableStandard = requiredPlugins.filter(name => typeof window[name] !== 'undefined');
  const missingStandard = requiredPlugins.filter(name => typeof window[name] === 'undefined');
  const availablePrefixed = prefixedPlugins.filter(name => typeof window[name] !== 'undefined');
  const missingPrefixed = prefixedPlugins.filter(name => typeof window[name] === 'undefined');
  console.warn(`[ImageGlitch] Plugin timeout after ${Date.now() - startTime}ms. Standard available: ${availableStandard.join(', ') || 'none'} | Prefixed available: ${availablePrefixed.join(', ') || 'none'} | Missing standard: ${missingStandard.join(', ') || 'none'} | Missing prefixed: ${missingPrefixed.join(', ') || 'none'}`);
  return false;
}

async function main() {
  // Wait for required Perchance plugins to load
  const pluginsLoaded = await waitForPlugins(['image', 'ai']);

  if (!pluginsLoaded) {
    console.error('[ImageGlitch] Required plugins failed to load. Application may not function correctly.');
    alert('Required plugins failed to load. Please refresh the page and try again.');
    // Continue with initialization anyway for graceful degradation
  }

  // Verify plugin dependencies are available
  console.log('[ImageGlitch] Dexie available:', typeof Dexie !== 'undefined');
  console.log('[ImageGlitch] DOMPurify available:', typeof DOMPurify !== 'undefined');
  console.log('[ImageGlitch] image function available:', typeof image !== 'undefined');
  console.log('[ImageGlitch] ai function available:', typeof ai !== 'undefined');

  const generateButton = document.getElementById('generate-button');
  const aiMagicSelect = document.getElementById('aiMagicSelect');
  const numImagesSelect = document.getElementById('numImagesSelect');
  const imgSeedInput = document.getElementById('imgSeed');
  const promptInput = document.getElementById('promptInput');
  const instructionInput = document.getElementById('instructionInput');
  const slider = document.getElementById('masterCreativitySlider');

  await loadSavedSettings();
  updateDerivedSettings();

  if (generateButton) {
    resetSmartButton();
  }

  if (aiMagicSelect) {
    aiMagicSelect.addEventListener('change', () => handleAiMagicSelection(aiMagicSelect));
  }
  if (numImagesSelect) {
    numImagesSelect.addEventListener('change', () => {
      numImagesToGen = Number(numImagesSelect.value);
      checkAllButtonStates();
      rememberSettings().catch(err => console.error('Failed to save settings:', err));
    });
  }
  if (imgSeedInput) {
    imgSeedInput.addEventListener('input', () => {
      handleSeedInput(imgSeedInput.value);
      rememberSettings().catch(err => console.error('Failed to save settings:', err));
    });
  }
  if (promptInput) {
    promptInput.addEventListener('input', () => {
      mainPromptContent = promptInput.value;
      handleManualPromptChange();
    });
    promptInput.addEventListener('keydown', handleTextareaKeyDown);
  }
  if (instructionInput) {
    instructionInput.addEventListener('input', handleManualPromptChange);
    instructionInput.addEventListener('keydown', handleTextareaKeyDown);
  }

  if (slider) {
    const updateTooltip = () => {
      const value = slider.value;
      slider.setAttribute('data-tooltip', `Creativity: ${value}`);
    };

    slider.addEventListener('input', () => {
      masterCreativity = Number(slider.value);
      updateDerivedSettings();
      rememberSettings().catch(err => console.error('Failed to save settings:', err));
      updateTooltip();
    });

    updateTooltip(); // Initial call
  }
}

function addImageOverlays() {
  document.querySelectorAll('.solo-block').forEach(block => {
    if (block.querySelector('.image-overlay')) return;

    const seed = block.dataset.seed;
    const prompt = safeDecodeURIComponent(block.dataset.prompt);

    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    const infoPanel = document.createElement('div');
    infoPanel.className = 'image-info-panel';
    // Sanitize user prompt before displaying (XSS protection)
    const sanitizedPrompt = window.DOMPurify ? window.DOMPurify.sanitize(prompt) : prompt;
    infoPanel.innerHTML = `<div class="prompt-display">${sanitizedPrompt}</div>`;

    const bottomBar = document.createElement('div');
    bottomBar.className = 'image-control-bar';
    bottomBar.innerHTML = `
      <div class="seed-guidance-display">Seed: ${seed}<br>model: flux<br></div>
      <div class="overlay-controls">
        <button class="overlay-button download-btn" title="Download Image">⬇️</button>
        <button class="overlay-button reroll-btn" title="Regenerate Image">🔄</button>
      </div>
    `;

    overlay.appendChild(infoPanel);
    overlay.appendChild(bottomBar);

    bottomBar.querySelector('.download-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      downloadImage(block);
    });
    bottomBar.querySelector('.reroll-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      rerollImage(block);
    });

    block.classList.add('image-container');
    block.appendChild(overlay);
  });

  document.querySelectorAll('.quad-cell').forEach(cell => {
    if (cell.querySelector('.image-overlay')) return;

    const seed = cell.dataset.seed;
    const quadBlock = cell.closest('.quad-block');
    const prompt = safeDecodeURIComponent(quadBlock.dataset.prompt);
    const resolution = cell.dataset.resolution;

    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    const infoPanel = document.createElement('div');
    infoPanel.className = 'image-info-panel';
    // Sanitize user prompt before displaying (XSS protection)
    const sanitizedPrompt = window.DOMPurify ? window.DOMPurify.sanitize(prompt) : prompt;
    infoPanel.innerHTML = `<div class="prompt-display">${sanitizedPrompt}</div>`;

    const bottomBar = document.createElement('div');
    bottomBar.className = 'image-control-bar';
    bottomBar.innerHTML = `
      <div class="seed-guidance-display">Seed: ${seed}<br>Guidance Scale: ${currentGScale}</div>
      <div class="overlay-controls">
        <button class="overlay-button download-btn" title="Download Image">⬇️</button>
        <button class="overlay-button reroll-btn" title="Regenerate Image">🔄</button>
      </div>
    `;

    overlay.appendChild(infoPanel);
    overlay.appendChild(bottomBar);

    bottomBar.querySelector('.download-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      downloadImage(cell);
    });
    bottomBar.querySelector('.reroll-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      rerollImage(cell, resolution);
    });

    cell.classList.add('image-container');
    cell.dataset.prompt = quadBlock.dataset.prompt;
    cell.appendChild(overlay);
  });
}

function downloadImage(container) {
  const imgEl = container.querySelector('img');
  const canvasEl = container.querySelector('canvas');
  const seed = container.dataset.seed;

  if (imgEl) {
    try {
      fetch(imgEl.src)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `image_seed_${seed}.png`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 100);
        })
        .catch(err => {
          console.error("Error fetching image:", err);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imgEl.naturalWidth || 1280;
          tempCanvas.height = imgEl.naturalHeight || 1280;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(imgEl, 0, 0, tempCanvas.width, tempCanvas.height);
          try {
            const dataUrl = tempCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `image_seed_${seed}.png`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          } catch(e) {
            console.error("Error with canvas method:", e);
            alert("Failed to download the image. Please try right-clicking and using 'Save Image As' instead.");
          }
        });
    } catch(e) {
      console.error("Error initiating download:", e);
      alert("Failed to download the image. Please try right-clicking and using 'Save Image As' instead.");
    }
  } else if (canvasEl) {
    try {
      const a = document.createElement('a');
      a.href = canvasEl.toDataURL('image/png');
      a.download = `image_seed_${seed}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    } catch(e) {
      console.error("Error downloading canvas:", e);
      alert("Failed to download the image. This may be due to cross-origin restrictions.");
    }
  }
}

function rerollImage(container, resolution) {
  const prompt = safeDecodeURIComponent(container.dataset.prompt);
  const newSeed = window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000000;

  if (container.classList.contains('solo-block')) {
    const imgEl = container.querySelector('img');
    if (imgEl) {
      const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=1280&seed=${newSeed}&model=flux&private=true&nologo=true`;
      imgEl.src = newUrl;
      container.dataset.seed = newSeed;
      const seedDisplay = container.querySelector('.seed-guidance-display');
      if (seedDisplay) {
        seedDisplay.innerHTML = `Seed: ${newSeed}<br>model: flux<br>`;
      }
    }
  } else if (container.classList.contains('quad-cell')) {
    const canvasEl = container.querySelector('canvas');
    if (canvasEl && resolution) {
      canvasEl.remove();
      image({
        prompt: prompt,
        seed: newSeed,
        guidanceScale: currentGScale,
        resolution: resolution,
        onFinish: (r) => {
          r.iframe?.replaceWith(r.canvas);
          container.appendChild(r.canvas);
        }
      });
      container.dataset.seed = newSeed;
      const seedDisplay = container.querySelector('.seed-guidance-display');
      if (seedDisplay) {
        seedDisplay.innerHTML = `Seed: ${newSeed}<br>Guidance Scale: ${currentGScale}`;
      }
    }
  }
}

function checkAllButtonStates() {
  const generateButton = document.getElementById('generate-button');
  const aiMagicSelect = document.getElementById('aiMagicSelect');
  const promptInput = document.getElementById('promptInput');
  const instructionInput = document.getElementById('instructionInput');
  const numImagesSelect = document.getElementById('numImagesSelect');

  if (!generateButton || !aiMagicSelect || !promptInput || !instructionInput || !numImagesSelect) {
    return;
  }

  const mainPromptContent = promptInput.value;
  const numImagesToGen = numImagesSelect.value;
  const promptIsEmpty = !(mainPromptContent || "").trim();
  const instructionsIsEmpty = !instructionInput.value.trim();

  if (window.undoState.type || window.activeAiProcess) return;

  if (generateButton.classList.contains('secondary')) {
    generateButton.disabled = promptIsEmpty || instructionsIsEmpty;
  } else if (generateButton.classList.contains('contrast')) {
    generateButton.disabled = promptIsEmpty;
  } else { // It's in 'primary' mode
    generateButton.disabled = promptIsEmpty || Number(numImagesToGen) === 0;
  }

  aiMagicSelect.disabled = promptIsEmpty;
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', main);