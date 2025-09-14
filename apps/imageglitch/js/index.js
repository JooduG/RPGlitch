// Move the safeDecodeURIComponent function to a separate file (e.g., utils.js)
function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    console.error("Failed to decode URI component:", str, e);
    return str;
  }
}
const AI_PROCESS_TYPES = {
  SUMMON: 'summon',
  SCRIBE: 'scribe',
  CHAOS: 'chaos',
  TRANSFIGURE: 'transfigure',
  CANCELLING: 'cancelling',
};
// ====== GLOBAL STATE & CONSTANTS ======
const DEFAULT_CREATIVITY_LEVEL = "4";
const creativityMap = {
  "0": { gScale: 1, aiTemp: 1.9 }, "1": { gScale: 3, aiTemp: 1.5 }, "2": { gScale: 5, aiTemp: 1.2 },
  "3": { gScale: 6, aiTemp: 1.1 }, "4": { gScale: 7, aiTemp: 1.0 }, "5": { gScale: 8, aiTemp: 0.9 },
  "6": { gScale: 9, aiTemp: 0.8 }, "7": { gScale: 10, aiTemp: 0.7 }, "8": { gScale: 12, aiTemp: 0.5 },
  "9": { gScale: 15, aiTemp: 0.3 }, "10": { gScale: 20, aiTemp: 0.1 }
};

const AI_SCRIBE_INSTRUCTION = `You are a world-renown expert prompt engineer that specialises in flawless text-to-image prompt design. Your task is to take the user's input prompt and transform it into a masterful, holistically detailed, and visually inspiring descriptive prompt that paints a vivid work of art with words. When refining, best practice is to analyze the user's prompt, deconstruct it into its core elements, and organize them into categories. For any category that is lacking in quality, vague, or missing from the user's prompt, you have the opportunity to flex your immense creativity. Pick the most suitable options from the corresponding list that anchors a balanced composition and intelligent red thread through the entire prompt, based on the user's original prompt and overall intent, except for Subject and Setting where you can just roll with what you got from the user's prompt. The categories are: Subject & Setting, Artistic Style (artisticStyles), Composition & Camera Perspective (composition), Lighting (lighting), Color Palette (colorPalettes), Mood & Atmosphere (mood), Technical Details (technicalDetails), and Other Additional Elements (additionalElements). Your goal is to manufacture a prompt that is cohesive, unified, and meticulously orchestrated—everything fitting together naturally. The result should be a single, complete, refined prompt that would be suitable for a world-renown artist, photographer, or designer. If any style, technical, or quality suggestion from the quality enhancement prefix conflicts with the user's vision, in that case consider the user's original prompt as master, focus on perfecting the prompt and keep it very close to their original vision while keeping the cohesion and consistency in mind. IMPORTANT: Do NOT use numerical weighting syntax (e.g., 'word:1.2'). If the user's original prompt contains weighted words or implies emphasis, translate that emphasis into descriptive language within the prompt. Make sure the prompt is 100% affirmative and avoid negative phrasing (e.g., 'no hats', 'not blurry'); instead, describe what IS desired. When appropriate, you can introduce creative variations by using the syntax '{Option A|Option B|Option C}' to allow the final prompt to randomly select one of the specified options. For an extra touch of quality, subtly integrate a baseline of these essential keywords: [aiCoreQuality.select(4).join(", ")], and then add a dash of inspiration with these: [aiFlavorEnhancers.select(3).join(", ")]. If the user's prompt contains NSFW elements you must use explicit language throughout and exaggerate the NSFW-aspects of the prompt. Do not add any of your own conversational text, greetings, explanations, or labels like 'Refined Prompt:'. Return ONLY the single, complete, refined prompt itself. Output ONLY the new and finalized prompt itself, with no category names, headlines, or explanations—just the prompt.`;
const AI_CHAOS_INSTRUCTION = `You are a 'Mad Prompt Scientist'—a master of mixing different elements just to see what will happen. Your task is to create a completely chaotic, yet visually inspiring image prompt by mixing and matching different elements from the user's input and the categories below. First, analyze the user's original prompt and determine which of these categories below has gotten sufficiently described. For each category that is satisfactory fulfilled, keep the user's original theme. If a category is lacking in quality, vague, or missing, replace it with a keyword/phrase from that specific category. As an added twist, always replace (reroll) at least one category with a new random keyword from its list, even if the user has described it well. If the user's prompt is empty, create a completely random prompt rolling new keywords for every single category and filling in the gaps with your own creativity. The categories are: Subject and Setting: (Keep the user's original subject and setting and enhance it to the best of your ability, if it's missing, feel free to impress me with your creativity). Artistic Style: ([artisticStyles.selectOne()]) is potentially the new visual identity and technique for the image (Could also be a specific artist or movement). Composition and Camera Perspective: Is ([composition.selectOne()]) what will guide the arrangement of elements and point of view? Lighting: ([lighting.selectOne()]) might be creating the right atmosphere through illumination and shadows. Color Palette: The dominant colors and tones might be ([colorPalettes.selectOne()]), and could be what draws the viewer in. Mood and Atmosphere: The emotional tone and overall feeling of the image could be ([mood.selectOne()]). Technical Details: Does ([technicalDetails.selectOne()]) describe the perfect technical aspects of the image? Other Elements: Here comes a wildcard! What about adding ([additionalElements.selectOne()]). As a Mad Prompt Scientist, embrace atomical transformation, playful invention, and unexpected or whimsical twists. If NSFW elements becomes relevant you must use explicit language throughout. Make sure to exaggerate all aspects of the prompt but especially the NSFW-aspects. Surprise the user by weaving together disparate or imaginative elements, but always produce a valid, visually inspiring image prompt. Embrace the chaos, have fun, and flex your creativity, just make sure the result is a single, cohesive, and visually inspiring prompt. The result should be more detailed and varied than the original. If any input contains conflicting information, just roll with it and embrace the unpredictable and paradoxical chaos! Sprinkle in some of these chaotic quality enhancers for good measure: [aiCoreQuality.selectOne], [aiFlavorEnhancers.select(2).join(", ")]. Do not add any of your own conversational text, greetings, explanations, or labels like 'Refined Prompt:'. Return ONLY the single, complete, refined prompt itself. Output ONLY the new and finalized prompt itself, with no category names, headlines, or explanations—just the prompt.`;

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

  if (isLocked) document.getElementById('summonBtn').disabled = false;
  else checkAllButtonStates();
}

// ====== SETTINGS & STATE MANAGEMENT ======
function updateDerivedSettings() {
  const mc = Number(masterCreativity);
  const selectedSettings = creativityMap[String(mc)] || { gScale: 7, aiTemp: 1.0 };
  currentGScale = selectedSettings.gScale;
  currentAiTemperature = selectedSettings.aiTemp;
  document.getElementById('masterCreativityValue').innerText = mc;
}

function handleSeedInput(value) {
  const trimmedValue = value.trim();
  imgSeed = (trimmedValue === '' || isNaN(Number(trimmedValue))) ? trimmedValue : Number(trimmedValue);
}

function rememberSettings() {
  try {
    localStorage.mainPromptContent = mainPromptContent || "";
    localStorage.imgSeed = imgSeed;
    localStorage.numImagesToGen = numImagesToGen || 0;
    localStorage.masterCreativity = masterCreativity || DEFAULT_CREATIVITY_LEVEL;
    localStorage.instructionInput = document.getElementById('instructionInput').value || "";
    localStorage.instructionsVisible = (document.getElementById('instructionsPanel').style.display !== 'none');
  } catch (e) {
    console.error("Error saving settings to localStorage:", e);
  }
}

function loadSavedSettings() {
  try {
    if (localStorage.mainPromptContent) {
      mainPromptContent = localStorage.mainPromptContent;
      document.getElementById('promptInput').value = mainPromptContent;
    }

    if (localStorage.hasOwnProperty('imgSeed')) {
      imgSeed = localStorage.imgSeed;
      document.getElementById('imgSeed').value = imgSeed;
    }

    if (localStorage.numImagesToGen) {
      numImagesToGen = Number(localStorage.numImagesToGen);
      document.getElementById('numImagesSelect').value = numImagesToGen;
    }

    if (localStorage.masterCreativity) {
      masterCreativity = Number(localStorage.masterCreativity);
      document.getElementById('masterCreativitySlider').value = masterCreativity;
    }

    if (localStorage.instructionInput) {
      document.getElementById('instructionInput').value = localStorage.instructionInput;
    }

    if (localStorage.instructionsVisible === 'true') {
      document.getElementById('instructionsPanel').style.display = 'block';
      checkAllButtonStates();
    }
  } catch (e) {
    console.error("Error loading settings from localStorage:", e);
  }
}

// Function to handle Enter key press in textareas
function handleTextareaKeyDown(event, textarea) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // Prevent default behavior (adding a new line)
    const summonBtn = document.getElementById('summonBtn');
    if (!summonBtn.disabled) {
      summonBtn.click(); // Trigger the command button
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
  rememberSettings();
}

function handleAiButtonClick(processType) {
  if (window.activeAiProcess) return;

  const currentPrompt = (mainPromptContent || "").trim();
  const instructions = document.getElementById('instructionInput').value;

  if (processType === 'transfigure' && !instructions.trim()) return;
  if (processType !== 'chaos' && !currentPrompt) return;

  updateDerivedSettings();
  executeAiProcess(processType, currentPrompt, instructions);
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
      aiPrompt = `${AI_SCRIBE_INSTRUCTION}\n\nUser's original prompt: ${prompt}`;
      break;
    case 'chaos':
      aiPrompt = AI_CHAOS_INSTRUCTION.replace('[RANDOM_ELEMENTS]', `Artistic Style: [artisticStyles.selectOne()], Composition and Camera Perspective: [composition.selectOne()], Lighting: [lighting.selectOne()], Color Palette: [colorPalettes.selectOne()], Mood and Atmosphere: [mood.selectOne()], Technical Details: [technicalDetails.selectOne()], Other Elements: [additionalElements.selectOne()]`) + `\n\nUser's original prompt: ${prompt}`;
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
  checkAllButtonStates();
  rememberSettings();
}

// ====== SMART BUTTON STATES ======
function setUndoState(type) {
  window.undoState.type = type;
  const summonBtn = document.getElementById('summonBtn');
  let typeName = type.charAt(0).toUpperCase() + type.slice(1);

  if (type === 'scribe') typeName = 'Refining';
  if (type === 'chaos') typeName = 'Chaos';
  if (type === 'transfigure') typeName = 'Instructions';

  summonBtn.textContent = `Undo ${typeName}`;
  summonBtn.className = 'undo-button';
  summonBtn.onclick = handleUndoClick;
}

function resetSmartButton() {
  const summonBtn = document.getElementById('summonBtn');
  summonBtn.textContent = 'Generate Images';
  summonBtn.className = 'summon-button';
  summonBtn.onclick = handleSummonClick;
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
  const summonBtn = document.getElementById('summonBtn');
  let seconds = 0;
  summonBtn.textContent = `Cancel (0s)`;
  summonBtn.className = 'cancel-button';
  summonBtn.onclick = () => { window.activeAiProcess = 'cancelling'; };

  if (window.aiProcessInterval) clearInterval(window.aiProcessInterval);
  window.aiProcessInterval = setInterval(() => {
    seconds++;
    if (window.activeAiProcess && window.activeAiProcess !== 'cancelling') {
      summonBtn.textContent = `Cancel (${seconds}s)`;
    } else {
      clearInterval(window.aiProcessInterval);
    }
  }, 1000);
}

function setCommandState(commandType) {
  const summonBtn = document.getElementById('summonBtn');
  let text = '', className = '';

  if (commandType === 'scribe') {
    text = 'Refine Prompt';
    className = 'scribe-button';
  } else if (commandType === 'chaos') {
    text = 'Embrace Chaos';
    className = 'chaos-button';
  } else if (commandType === 'transfigure') {
    text = 'Apply Instructions';
    className = 'transfigure-button';
  }

  summonBtn.textContent = text;
  summonBtn.className = className;
  summonBtn.onclick = () => handleAiButtonClick(commandType);
  checkAllButtonStates();
}

// ====== IMAGE SUMMONING & MAIN STATE LOGIC ======
function handleSummonClick() {
  if (!mainPromptContent.trim()) return;
  document.getElementById('output').innerHTML = buildImageGenerationHtml();

  // Add the mouseover actions after images are generated
  setTimeout(addImageOverlays, 500);
}

function buildImageGenerationHtml() {
  updateDerivedSettings();
  const n = Number(numImagesToGen);
  let outputHtml = "";
  const prompt = (mainPromptContent || "").trim();

  // Determine if we should use random seeds or a user-provided seed
  const useRandomSeeds = imgSeed === "";

  for (let i = 0; i < n; i++) {
    // Create a block seed based on whether we're using random seeds or not
    let blockSeed;

    if (useRandomSeeds) {
      // Generate a completely random seed for this block
      blockSeed = Math.floor(Math.random() * 10000000);
    } else {
      // Use exactly the provided seed for all images
      blockSeed = imgSeed;
    }

    if (Math.random() < 0.1) {
      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=1280&seed=${blockSeed}&model=flux&private=true&nologo=true`;
      outputHtml += `<div class="block solo-block" data-seed="${blockSeed}" data-prompt="${encodeURIComponent(prompt)}"><img src="${imgUrl}" loading="lazy" alt="Generated image" crossorigin="anonymous"></div>`;
    } else {
      outputHtml += `<div class="block quad-block" data-seed="${blockSeed}" data-prompt="${encodeURIComponent(prompt)}">`;

      // Create seeds for each quad cell - use the same seed if provided
      const cellSeeds = [];
      for (let j = 0; j < 4; j++) {
        if (useRandomSeeds) {
          // Each cell gets a completely random seed
          cellSeeds.push(Math.floor(Math.random() * 10000000));
        } else {
          // Use exactly the provided seed for all cells
          cellSeeds.push(imgSeed);
        }
      }

      // Create the quad cells
      outputHtml += `<div class="quad-row-top">
        <div class="quad-cell wide" data-resolution="768x768" data-seed="${cellSeeds[0]}">${image({ prompt, seed: cellSeeds[0], guidanceScale: currentGScale, resolution: "768x768", onFinish: (r) => r.iframe?.replaceWith(r.canvas) })}</div>
        <div class="quad-cell narrow" data-resolution="512x768" data-seed="${cellSeeds[1]}">${image({ prompt, seed: cellSeeds[1], guidanceScale: currentGScale, resolution: "512x768", onFinish: (r) => r.iframe?.replaceWith(r.canvas) })}</div>
      </div>`;
      outputHtml += `<div class="quad-row-bot">
        <div class="quad-cell wide" data-resolution="768x512" data-seed="${cellSeeds[2]}">${image({ prompt, seed: cellSeeds[2], guidanceScale: currentGScale, resolution: "768x512", onFinish: (r) => r.iframe?.replaceWith(r.canvas) })}</div>
        <div class="quad-cell narrow" data-resolution="512x512" data-seed="${cellSeeds[3]}">${image({ prompt, seed: cellSeeds[3], guidanceScale: currentGScale, resolution: "512x512", onFinish: (r) => r.iframe?.replaceWith(r.canvas) })}</div>
      </div>`;
      outputHtml += '</div>';
    }
  }
  return outputHtml;
}

// Add image overlay functions for download, reroll, and seed display
function addImageOverlays() {
  // Add overlays to solo blocks
  document.querySelectorAll('.solo-block').forEach(block => {
    if (block.querySelector('.image-overlay')) return; // Skip if overlay already exists

    const seed = block.dataset.seed;
    const prompt = safeDecodeURIComponent(block.dataset.prompt);

    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    // Create an info panel for prompt, seed, and guidance scale
    const infoPanel = document.createElement('div');
    infoPanel.className = 'image-info-panel';
    infoPanel.innerHTML = `
      <div class="prompt-display">${prompt}</div>
    `;

    // Create a bottom control bar that contains both seed display and buttons
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

    // Add event listeners
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

  // Add overlays to quad cells
  document.querySelectorAll('.quad-cell').forEach(cell => {
    if (cell.querySelector('.image-overlay')) return; // Skip if overlay already exists

    const seed = cell.dataset.seed;
    const quadBlock = cell.closest('.quad-block');
    const prompt = safeDecodeURIComponent(quadBlock.dataset.prompt);
    const resolution = cell.dataset.resolution;

    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    // Create an info panel for prompt, seed, and guidance scale
    const infoPanel = document.createElement('div');
    infoPanel.className = 'image-info-panel';
    infoPanel.innerHTML = `
      <div class="prompt-display">${prompt}</div>
    `;

    // Create a bottom control bar that contains both seed display and buttons
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

    // Add event listeners with stopPropagation to prevent event bubbling
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

// Function to download an image
function downloadImage(container) {
  const imgEl = container.querySelector('img');
  const canvasEl = container.querySelector('canvas');
  const seed = container.dataset.seed;

  if (imgEl) {
    // For pollinations.ai images
    try {
      // Try to use the Fetch API to download the image directly
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

          // Fallback: Try canvas method
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
    // For canvas elements
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

// Function to regenerate an image
function rerollImage(container, resolution) {
  const prompt = safeDecodeURIComponent(container.dataset.prompt);

  // Always generate a new random seed for rerolls
  const newSeed = window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000000;

  if (container.classList.contains('solo-block')) {
    // For pollinations.ai images
    const imgEl = container.querySelector('img');
    if (imgEl) {
      const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=1280&seed=${newSeed}&model=flux&private=true&nologo=true`;
      imgEl.src = newUrl;
      container.dataset.seed = newSeed;

      // Update the seed display in the overlay
      const seedDisplay = container.querySelector('.seed-guidance-display');
      if (seedDisplay) {
        seedDisplay.innerHTML = `Seed: ${newSeed}<br>model: flux<br>`;
      }
    }
  } else {
    // For quad cells
    const canvasEl = container.querySelector('canvas');
    if (canvasEl && resolution) {
      // Remove old canvas
      canvasEl.remove();

      // Create new image
      const newImgEl = document.createElement('div');
      newImgEl.innerHTML = image({
        prompt: prompt,
        seed: newSeed,
        guidanceScale: currentGScale,
        resolution: resolution,
        onFinish: (r) => {
          r.iframe?.replaceWith(r.canvas);
        }
      });

      // Insert new element before overlay
      const overlay = container.querySelector('.image-overlay');
      container.insertBefore(newImgEl, overlay);

      // Update the seed display in the overlay
      container.dataset.seed = newSeed;
      const seedDisplay = container.querySelector('.seed-guidance-display');
      if (seedDisplay) {
        seedDisplay.innerHTML = `Seed: ${newSeed}<br>Guidance Scale: ${currentGScale}`;
      }
    }
  }
}

function checkAllButtonStates() {
  const summonBtn = document.getElementById('summonBtn');
  const aiMagicSelect = document.getElementById('aiMagicSelect');
  const promptInput = document.getElementById('promptInput');
  const instructionInput = document.getElementById('instructionInput');
  const numImagesSelect = document.getElementById('numImagesSelect');

  if (!summonBtn || !aiMagicSelect || !promptInput || !instructionInput || !numImagesSelect) {
    return;
  }

  const mainPromptContent = promptInput.value;
  const numImagesToGen = numImagesSelect.value;

  const promptIsEmpty = !(mainPromptContent || "").trim();
  const instructionsIsEmpty = !instructionInput.value.trim();

  if (window.undoState.type || window.activeAiProcess) return;

  const currentMode = summonBtn.className;
  if (currentMode.includes('transfigure-button')) {
    summonBtn.disabled = promptIsEmpty || instructionsIsEmpty;
  } else if (currentMode.includes('scribe-button') || currentMode.includes('chaos-button')) {
    summonBtn.disabled = promptIsEmpty;
  } else { // It's in 'summon-button' mode
    summonBtn.disabled = promptIsEmpty || Number(numImagesToGen) === 0;
  }

  aiMagicSelect.disabled = promptIsEmpty;
}

function main() {
  loadSavedSettings();
  updateDerivedSettings();
  checkAllButtonStates();

  const summonBtn = document.getElementById('summonBtn');
  const aiMagicSelect = document.getElementById('aiMagicSelect');
  const numImagesSelect = document.getElementById('numImagesSelect');
  const imgSeedInput = document.getElementById('imgSeed');
  const promptInput = document.getElementById('promptInput');
  const instructionInput = document.getElementById('instructionInput');

  summonBtn.addEventListener('click', handleSummonClick);
  aiMagicSelect.addEventListener('change', () => handleAiMagicSelection(aiMagicSelect));
  numImagesSelect.addEventListener('change', () => {
    numImagesToGen = Number(numImagesSelect.value);
    checkAllButtonStates();
    rememberSettings();
  });
  imgSeedInput.addEventListener('input', () => {
    handleSeedInput(imgSeedInput.value);
    rememberSettings();
  });
  promptInput.addEventListener('input', () => {
    mainPromptContent = promptInput.value;
    handleManualPromptChange();
  });
  promptInput.addEventListener('keydown', (e) => handleTextareaKeyDown(e, promptInput));
  instructionInput.addEventListener('input', handleManualPromptChange);
  instructionInput.addEventListener('keydown', (e) => handleTextareaKeyDown(e, instructionInput));

  const slider = document.getElementById('masterCreativitySlider');
  const label = document.getElementById('masterCreativityLabel');

  slider.addEventListener('input', () => {
    masterCreativity = Number(slider.value);
    updateDerivedSettings();
    rememberSettings();
  });

  slider.addEventListener('pointerdown', () => label.classList.add('is-active'));
  slider.addEventListener('pointerup', () => label.classList.remove('is-active'));
  slider.addEventListener('blur', () => label.classList.remove('is-active'));
}


// ====== INIT ======
document.addEventListener('DOMContentLoaded', main);
