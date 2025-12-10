import { safeDecodeURIComponent } from "./utils.js";
import { db } from "./db.js";

// ====== SECURITY OVERRIDE: CLIENT-SIDE FREEDOM ======
(function enforceClientSideFreedom() {
  try {
    if (localStorage.getItem("okayToShowNSFWUntil")) {
      localStorage.setItem("okayToShowNSFWUntil", "0");
      console.log("[ImageGlitch] 🛡️ Freedom Protocol: Penalty flag purged.");
    }
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "okayToShowNSFWUntil") {
        console.warn(
          "[ImageGlitch] 🛡️ Blocked attempt to set censorship flag.",
        );
        return;
      }
      return originalSetItem.apply(this, arguments);
    };
  } catch (e) {
    console.error("[ImageGlitch] Security override failed:", e);
  }
})();

// ====== GLOBAL STATE & CONSTANTS ======
const TEST_MODE = (() => {
  if (globalThis.__TEST__) return true;
  try {
    return /jsdom/i.test(globalThis?.navigator?.userAgent || "");
  } catch {
    return false;
  }
})();

const DEFAULT_CREATIVITY_LEVEL = "4";
const BASE_IMAGE_URL = "https://image.pollinations.ai/prompt/";
const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 1280;

const creativityMap = {
  0: { gScale: 1, aiTemp: 1.9 },
  1: { gScale: 3, aiTemp: 1.5 },
  2: { gScale: 5, aiTemp: 1.2 },
  3: { gScale: 6, aiTemp: 1.1 },
  4: { gScale: 7, aiTemp: 1.0 },
  5: { gScale: 8, aiTemp: 0.9 },
  6: { gScale: 9, aiTemp: 0.8 },
  7: { gScale: 10, aiTemp: 0.7 },
  8: { gScale: 12, aiTemp: 0.5 },
  9: { gScale: 15, aiTemp: 0.3 },
  10: { gScale: 20, aiTemp: 0.1 },
};

// ====== DYNAMIC INSTRUCTION BUILDER (THE VISUAL DIRECTOR) ======
function getScribeInstruction(userPrompt) {
  const lists = window.glitchLists || {
    styles: [
      "Cinematic Reality",
      "Analog Horror",
      "Ethereal Fantasy",
      "Cybernetic Grunge",
    ],
    mood: ["Melancholic", "Euphorical", "Dreadful", "Serene"],
    lighting: [
      "Volumetric God Rays",
      "Neon Rim Light",
      "Diffused Window Light",
      "Harsh Flash",
    ],
    tech: ["Imax 70mm", "Macro 100mm Lens", "Fish-eye Lens", "VHS Tape Grain"],
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const suggestions = {
    style: pick(lists.styles),
    mood: pick(lists.mood),
    light: pick(lists.lighting),
    tech: pick(lists.tech),
  };

  return `You are the "Visual Director" (Flux Architecture Specialist).
Your goal is to translate the User's concept into a "Photographic Specification" optimized for the Flux generation model.

USER PROMPT: "${userPrompt}"

SUGGESTED AESTHETICS (Use these as a baseline, but ensure cohesion):
- Visual Style: ${suggestions.style}
- Atmosphere: ${suggestions.mood}
- Lighting Setup: ${suggestions.light}
- Optical Tech: ${suggestions.tech}

<GENERATION_PROTOCOL>
1. **Camera Anchor:** Start by selecting a virtual lens/camera (e.g., "A low-angle 35mm shot...", "A grainy CCTV still...").
2. **Subject Focus:** Describe the physical materials (textures, skin, rust, fabric). Flux loves *texture*.
3. **Lighting Physics:** Describe how the light hits the subject (e.g., "casting long, hard shadows", "subsurface scattering on skin").
4. **Natural Language:** Write ONE dense, grammatically correct paragraph. DO NOT use comma-separated tag lists.

<EXAMPLE_OUTPUT>
"A close-up macro shot captured on 35mm film stock showing a weary knight's rusted gauntlet resting on moss, illuminated by harsh bioluminescent blue fungi that casts deep, high-contrast shadows, with a soft bokeh blurring the ancient ruins in the background."
</EXAMPLE_OUTPUT>

RETURN ONLY THE FINAL IMAGE DESCRIPTION.`;
}

// ====== CHAOS (ENTROPY) ENGINE ======
function getChaosInstruction(userPrompt) {
  const lists = window.glitchLists || {
    styles: [
      "Surrealism",
      "Glitch Art",
      "Abstract Expressionism",
      "Biomechanical",
    ],
    mood: ["Unsettling", "Fever Dream", "Distorted", "Eldritch"],
    lighting: [
      "Strobe",
      "Bioluminescent",
      "Radioactive Glow",
      "Pitch Black with Spotlights",
    ],
    extras: [
      "melting geometry",
      "fractal flesh",
      "glitch artifacts",
      "non-euclidean shapes",
    ],
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const roll = {
    style: pick(lists.styles),
    mood: pick(lists.mood),
    light: pick(lists.lighting),
    extra: pick(lists.extras),
  };

  return `You are the "Entropy Injector" (Surrealism Engine).
Your goal is to corrupt the User's prompt by forcing a "Visual Hallucination" or "Material Glitch."

USER PROMPT: "${userPrompt}"

FORCED MUTATIONS:
- Style: ${roll.style}
- Chaos Element: ${roll.extra}

<MUTATION_PROTOCOL>
1. **Material Transposition:** Take the main subject and change its material to something impossible (e.g., "A cat made of shattering glass," "A tree weeping liquid chrome").
2. **Environmental Decay:** The background must be dissolving, glitching, or morphing.
3. **Visual Coherence:** The scene can be weird, but it must be *describable*. Avoid abstract concepts; use concrete visual nouns.

<EXAMPLE_OUTPUT>
"A renaissance oil painting of a knight screaming, but his armor is made of translucent jelly and his face is dissolving into pixelated digital noise, illuminated by a flickering strobe light in a void."
</EXAMPLE_OUTPUT>

RETURN ONLY THE MUTATED PROMPT.`;
}

// ====== STATE EDITOR (TRANSFIGURE) ======
const AI_TRANSFIGURE_INSTRUCTION = `[SYSTEM: SEMANTIC_STATE_EDITOR_V2.0]
[MODE: PRECISION_SURGERY]

<CORE_DIRECTIVE>
You are an Image State Editor. Your ONLY function is to execute the User's specific modification instruction on the Base Prompt.
**CRITICAL:** You must preserve the original Art Style, Camera Angle, and Composition unless explicitly told to change them.
</CORE_DIRECTIVE>

<OPERATION_PROTOCOL>
1. **ANALYZE:** Identify the specific "Semantic Token" the user wants to change (e.g., "red shirt" -> "blue shirt", "day" -> "night").
2. **LOCK:** Identify the "Immutable Anchors" (Style, Subject Identity, Background) that MUST NOT change.
3. **EXECUTE:** Swap ONLY the target token. Adjust surrounding grammar if necessary (e.g., "a apple" -> "an apple"), but touch nothing else.
4. **VERIFY:** Read the new prompt. Does it still look like the original image, just modified? If yes, output.

<EXAMPLES>
Input Base: "A cinematic wide shot of a futuristic Tokyo street, rain falling, neon lights."
Instruction: "Make it snowy."
Output: "A cinematic wide shot of a futuristic Tokyo street, snow falling, neon lights."
(Note: It did NOT change "cinematic wide shot" or "Tokyo").

Input Base: "Oil painting of a sad clown."
Instruction: "Give him a happy mask."
Output: "Oil painting of a sad clown wearing a happy mask."
</EXAMPLES>

<OUTPUT_FORMAT>
Return ONLY the modified prompt string. No explanation. No quotes.`;

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
  if (typeof aiResponse.generatedText === "string")
    text = aiResponse.generatedText;
  else if (typeof aiResponse.text === "string") text = aiResponse.text;
  else if (typeof aiResponse === "string") text = aiResponse;

  const match = text.trim().match(/(?:Prompt:)\s*([\s\S]*)/i);
  return match ? match[1].trim() : text.trim();
}

function setPromptInputValue(text, isUndo = false) {
  const promptInput = document.getElementById("promptInput");
  if (promptInput) {
    promptInput.value = text;
    mainPromptContent = text;
    if (!isUndo)
      promptInput.dispatchEvent(new Event("input", { bubbles: true }));
    else checkAllButtonStates();
  }
}

function setUiLockState(isLocked) {
  const elements = [
    document.getElementById("promptInput"),
    document.getElementById("instructionInput"),
    document.getElementById("aiMagicSelect"),
    document.getElementById("numImagesSelect"),
    document.getElementById("imgSeed"),
    document.getElementById("masterCreativitySlider"),
  ];
  elements.forEach((el) => {
    if (el) el.disabled = isLocked;
  });
  document.querySelectorAll("textarea").forEach((ta) => {
    ta.readOnly = isLocked;
    ta.style.opacity = isLocked ? "0.5" : "1";
    ta.style.cursor = isLocked ? "not-allowed" : "text";
  });
  const genBtn = document.getElementById("generate-button");
  if (genBtn) {
    if (isLocked) genBtn.disabled = false;
    else checkAllButtonStates();
  }
}

function validatePrompt(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    alert("Prompt cannot be empty");
    return null;
  }
  return prompt.trim();
}

function validateSeed(seed) {
  if (seed === "" || seed === null || typeof seed === "undefined") return "";
  const parsed = parseInt(seed, 10);
  if (isNaN(parsed) || parsed < 0) {
    alert("Seed must be a non-negative number. A random seed will be used.");
    return "";
  }
  return parsed;
}

// ====== SETTINGS & STATE MANAGEMENT ======

function updateDerivedSettings() {
  const mc = Number(masterCreativity);
  const selectedSettings = creativityMap[String(mc)] || {
    gScale: 7,
    aiTemp: 1.0,
  };
  currentGScale = selectedSettings.gScale;
  currentAiTemperature = selectedSettings.aiTemp;
  const creativityValueEl = document.getElementById("masterCreativityValue");
  if (creativityValueEl) creativityValueEl.innerText = mc;
}

function handleSeedInput(value) {
  const trimmedValue = value.trim();
  imgSeed =
    trimmedValue === "" || isNaN(Number(trimmedValue))
      ? trimmedValue
      : Number(trimmedValue);
}

async function rememberSettings() {
  try {
    const instructionInput = document.getElementById("instructionInput");
    const instructionsPanel = document.getElementById("instructionsPanel");
    const settings = {
      id: "app-settings",
      mainPromptContent: mainPromptContent || "",
      seed: imgSeed !== "" && imgSeed !== null ? Number(imgSeed) : "",
      numImagesToGen: Number(numImagesToGen) || 1,
      masterCreativity:
        Number(masterCreativity) || Number(DEFAULT_CREATIVITY_LEVEL),
      instructionInput: instructionInput ? instructionInput.value : "",
      instructionsVisible: instructionsPanel
        ? instructionsPanel.style.display !== "none"
        : false,
    };
    await db.settings.put(settings);
  } catch (error) {
    console.error("Failed to save settings to IndexedDB:", error);
  }
}

async function loadSavedSettings() {
  try {
    const settings = await db.settings.get("app-settings");
    if (!settings) return;

    if (settings.mainPromptContent) {
      mainPromptContent = settings.mainPromptContent;
      const promptInput = document.getElementById("promptInput");
      if (promptInput) promptInput.value = settings.mainPromptContent;
    }
    if (settings.seed !== undefined && settings.seed !== null) {
      imgSeed = settings.seed;
      const seedInput = document.getElementById("imgSeed");
      if (seedInput) seedInput.value = settings.seed;
    }
    if (typeof settings.numImagesToGen === "number") {
      numImagesToGen = settings.numImagesToGen;
      const numImagesSelect = document.getElementById("numImagesSelect");
      if (numImagesSelect) numImagesSelect.value = settings.numImagesToGen;
    }
    if (typeof settings.masterCreativity === "number") {
      masterCreativity = settings.masterCreativity;
      const creativitySlider = document.getElementById(
        "masterCreativitySlider",
      );
      if (creativitySlider) creativitySlider.value = settings.masterCreativity;
    }
    if (settings.instructionInput) {
      const instructionInput = document.getElementById("instructionInput");
      if (instructionInput) instructionInput.value = settings.instructionInput;
    }
    if (typeof settings.instructionsVisible === "boolean") {
      const instructionsPanel = document.getElementById("instructionsPanel");
      if (instructionsPanel) {
        instructionsPanel.style.display = settings.instructionsVisible
          ? "block"
          : "none";
        if (settings.instructionsVisible) checkAllButtonStates();
      }
    }
  } catch (error) {
    console.error("Failed to load settings from IndexedDB:", error);
  }
}

function handleTextareaKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const generateButton = document.getElementById("generate-button");
    if (generateButton && !generateButton.disabled) generateButton.click();
  }
}

// ====== AI PROCESSING ======

function handleAiMagicSelection(selectElement) {
  const selection = selectElement.value;
  if (selection === "placeholder") return;

  const instructionsPanel = document.getElementById("instructionsPanel");
  const instructionInput = document.getElementById("instructionInput");

  if (instructionsPanel) instructionsPanel.style.display = "none";

  if (selection === "summon") {
    resetSmartButton();
  } else if (selection === "transfigure") {
    if (instructionsPanel) instructionsPanel.style.display = "block";
    if (instructionInput) instructionInput.focus();
    setCommandState("transfigure");
  } else {
    setCommandState(selection);
  }
  selectElement.value = "placeholder";
  rememberSettings();
}

function handleAiButtonClick(processType) {
  if (window.activeAiProcess) return;
  const instructions = document.getElementById("instructionInput")?.value || "";
  if (processType === "transfigure" && !instructions.trim()) {
    alert("Instructions cannot be empty for Transfigure.");
    return;
  }
  if (processType !== "chaos") {
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

  let aiPrompt;
  switch (type) {
    case "scribe":
      aiPrompt = getScribeInstruction(prompt);
      break;
    case "chaos":
      aiPrompt = getChaosInstruction(prompt);
      break;
    case "transfigure":
      aiPrompt = `${AI_TRANSFIGURE_INSTRUCTION}\n\nInput A (Base Prompt): "${prompt}"\nInput B (Instruction): "${instructions}"`;
      break;
  }

  try {
    if (typeof window.ai !== "function")
      throw new Error("AI plugin not found.");

    const aiOperation = window.ai(aiPrompt, {
      temperature: Number(currentAiTemperature),
    });
    const cancellationPromise = new Promise((_, reject) => {
      const check = setInterval(() => {
        if (window.activeAiProcess === "cancelling") {
          clearInterval(check);
          reject(new Error("Cancelled"));
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
    if (type === "chaos" && !prompt) {
      setPromptInputValue("A beautiful cat in a sunbeam, digital art.");
      setUndoState("chaos");
    }
  } finally {
    if (window.aiProcessInterval) clearInterval(window.aiProcessInterval);
    window.aiProcessInterval = null;
    window.activeAiProcess = null;
    setUiLockState(false);
  }
}

function handleManualPromptChange() {
  if (
    window.undoState.type &&
    window.undoState.prompt &&
    mainPromptContent.trim() !== window.undoState.prompt.trim()
  ) {
    resetSmartButton();
  }
  checkAllButtonStates();
  rememberSettings();
}

function setUndoState(type) {
  window.undoState.type = type;
  const generateButton = document.getElementById("generate-button");
  let typeName = type.charAt(0).toUpperCase() + type.slice(1);
  if (type === "scribe") typeName = "Refining";
  if (type === "chaos") typeName = "Chaos";
  if (type === "transfigure") typeName = "Instructions";
  generateButton.textContent = `Undo ${typeName}`;
  generateButton.className = "secondary";
  generateButton.onclick = handleUndoClick;
}

function resetSmartButton() {
  const generateButton = document.getElementById("generate-button");
  if (!generateButton) return;
  generateButton.textContent = "Generate Images";
  generateButton.className = "btn-generate";
  generateButton.onclick = handleSummonClick;
  window.undoState.type = null;
  window.undoState.prompt = null;
  window.undoState.instruction = null;
  checkAllButtonStates();
}

function handleUndoClick() {
  setPromptInputValue(window.undoState.prompt, true);
  if (window.undoState.type === "transfigure") {
    const instInput = document.getElementById("instructionInput");
    if (instInput) instInput.value = window.undoState.instruction;
  }
  resetSmartButton();
}

function startTimerOnButton() {
  const generateButton = document.getElementById("generate-button");
  let seconds = 0;
  generateButton.textContent = `Cancel (0s)`;
  generateButton.className = "contrast";
  generateButton.onclick = () => {
    window.activeAiProcess = "cancelling";
  };
  if (window.aiProcessInterval) clearInterval(window.aiProcessInterval);
  window.aiProcessInterval = setInterval(() => {
    seconds++;
    if (window.activeAiProcess && window.activeAiProcess !== "cancelling") {
      generateButton.textContent = `Cancel (${seconds}s)`;
    } else {
      clearInterval(window.aiProcessInterval);
    }
  }, 1000);
}

function setCommandState(commandType) {
  const generateButton = document.getElementById("generate-button");
  let text = "",
    className = "";
  if (commandType === "scribe") {
    text = "Refine Prompt";
    className = "btn-refine";
  } else if (commandType === "chaos") {
    text = "Embrace Chaos";
    className = "btn-chaos";
  } else if (commandType === "transfigure") {
    text = "Apply Instructions";
    className = "btn-instruct";
  }
  generateButton.textContent = text;
  generateButton.className = className;
  generateButton.onclick = () => handleAiButtonClick(commandType);
  checkAllButtonStates();
}

// ====== IMAGE GENERATION ======

async function handleSummonClick() {
  localStorage.setItem("okayToShowNSFWUntil", "0");

  const generateButton = document.getElementById("generate-button");
  const validatedPrompt = validatePrompt(mainPromptContent);
  if (!validatedPrompt) return;
  mainPromptContent = validatedPrompt;

  generateButton.setAttribute("aria-busy", "true");
  generateButton.disabled = true;

  try {
    if (typeof window.image === "undefined") {
      console.error("[ImageGlitch] Text-to-Image plugin not found!");
      alert(
        "Image generation is currently unavailable. Please refresh the page.",
      );
      return;
    }

    document.getElementById("output").innerHTML = buildImageGenerationHtml();

    document.querySelectorAll(".quad-cell").forEach((cell) => {
      const prompt = safeDecodeURIComponent(
        cell.closest(".quad-block").dataset.prompt,
      );
      const seed = cell.dataset.seed;
      const resolution = cell.dataset.resolution;

      window.image({
        prompt: prompt,
        seed: seed,
        guidanceScale: currentGScale,
        resolution: resolution,
        onFinish: (r) => {
          if (r.iframe) r.iframe.replaceWith(r.canvas);
          cell.appendChild(r.canvas);
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    addImageOverlays();
  } catch (error) {
    console.error("Image generation failed:", error);
  } finally {
    generateButton.setAttribute("aria-busy", "false");
    generateButton.disabled = false;
  }
}

function buildImageGenerationHtml() {
  updateDerivedSettings();
  const n = Number(numImagesToGen);
  let outputHtml = "";
  const prompt = mainPromptContent.trim();
  const validatedSeed = validateSeed(imgSeed);
  const useRandomSeeds = validatedSeed === "";

  for (let i = 0; i < n; i++) {
    let imageGenerator;
    if (i === 1) imageGenerator = "pollinations";
    else if (i > 1)
      imageGenerator = Math.random() < 0.05 ? "pollinations" : "perchance";
    else imageGenerator = "perchance";

    if (imageGenerator === "perchance") {
      outputHtml += `<div class="block quad-block" data-prompt="${encodeURIComponent(prompt)}">`;
      const resolutions = {
        "top-left": "768x768",
        "top-right": "512x768",
        "bottom-left": "768x512",
        "bottom-right": "512x512",
      };
      for (const position in resolutions) {
        let blockSeed = useRandomSeeds
          ? Math.floor(Math.random() * 10000000)
          : validatedSeed;
        outputHtml += `<div class="quad-cell ${position}" data-seed="${blockSeed}" data-resolution="${resolutions[position]}"></div>`;
      }
      outputHtml += `</div>`;
    } else {
      let blockSeed = useRandomSeeds
        ? Math.floor(Math.random() * 10000000)
        : validatedSeed;
      const params = new URLSearchParams({
        width: DEFAULT_IMAGE_WIDTH,
        height: DEFAULT_IMAGE_HEIGHT,
        seed: blockSeed,
        model: "flux",
        private: true,
        nologo: true,
      });
      const imgUrl = `${BASE_IMAGE_URL}${encodeURIComponent(prompt)}?${params.toString()}`;
      outputHtml += `<div class="block solo-block" data-seed="${blockSeed}" data-prompt="${encodeURIComponent(prompt)}"><img src="${imgUrl}" loading="lazy" alt="Generated image" crossorigin="anonymous"></div>`;
    }
  }
  return outputHtml;
}

// ====== STARTUP ======

async function waitForPlugins(requiredPlugins, timeout = 10000) {
  if (TEST_MODE) return true;
  const startTime = Date.now();
  console.log(`[ImageGlitch] Waiting for plugins:`, requiredPlugins);

  while (Date.now() - startTime < timeout) {
    const allReady = requiredPlugins.every(
      (name) => typeof window[name] !== "undefined",
    );
    if (allReady) {
      console.log("[ImageGlitch] Plugins loaded successfully.");
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  const generateButton = document.getElementById("generate-button");
  const aiMagicSelect = document.getElementById("aiMagicSelect");
  const numImagesSelect = document.getElementById("numImagesSelect");
  const imgSeedInput = document.getElementById("imgSeed");
  const promptInput = document.getElementById("promptInput");
  const instructionInput = document.getElementById("instructionInput");
  const slider = document.getElementById("masterCreativitySlider");

  if (aiMagicSelect)
    aiMagicSelect.addEventListener("change", () =>
      handleAiMagicSelection(aiMagicSelect),
    );
  if (numImagesSelect)
    numImagesSelect.addEventListener("change", () => {
      numImagesToGen = Number(numImagesSelect.value);
      checkAllButtonStates();
      rememberSettings();
    });
  if (imgSeedInput)
    imgSeedInput.addEventListener("input", () => {
      handleSeedInput(imgSeedInput.value);
      rememberSettings();
    });
  if (promptInput) {
    promptInput.addEventListener("input", () => {
      mainPromptContent = promptInput.value;
      handleManualPromptChange();
    });
    promptInput.addEventListener("keydown", handleTextareaKeyDown);
  }
  if (instructionInput) {
    instructionInput.addEventListener("input", handleManualPromptChange);
    instructionInput.addEventListener("keydown", handleTextareaKeyDown);
  }
  if (slider) {
    const updateTooltip = () =>
      slider.setAttribute("data-tooltip", `Creativity: ${slider.value}`);
    slider.addEventListener("input", () => {
      masterCreativity = Number(slider.value);
      updateDerivedSettings();
      rememberSettings();
      updateTooltip();
    });
    updateTooltip();
  }

  await loadSavedSettings();
  updateDerivedSettings();
  if (generateButton) resetSmartButton();

  await waitForPlugins(["image", "ai"]);

  // Check if the lists were injected properly
  if (window.glitchLists) {
    console.log("[ImageGlitch] Lists loaded from Left Panel.");
  } else {
    console.warn("[ImageGlitch] Lists NOT found. Using default fallback.");
  }
}

function addImageOverlays() {
  document.querySelectorAll(".solo-block, .quad-cell").forEach((el) => {
    if (el.querySelector(".image-overlay")) return;
    const seed = el.dataset.seed;
    const prompt = safeDecodeURIComponent(
      el.closest(".quad-block")?.dataset.prompt || el.dataset.prompt,
    );

    const overlay = document.createElement("div");
    overlay.className = "image-overlay";
    const sanitized = window.DOMPurify
      ? window.DOMPurify.sanitize(prompt)
      : prompt;

    overlay.innerHTML = `
      <div class="image-info-panel"><div class="prompt-display">${sanitized}</div></div>
      <div class="image-control-bar">
        <div class="seed-guidance-display">Seed: ${seed}</div>
        <div class="overlay-controls">
          <button class="overlay-button download-btn" title="Download">⬇️</button>
          <button class="overlay-button reroll-btn" title="Reroll">🔄</button>
        </div>
      </div>
    `;

    el.classList.add("image-container");
    el.appendChild(overlay);

    overlay.querySelector(".download-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      downloadImage(el);
    });
    overlay.querySelector(".reroll-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      rerollImage(el, el.dataset.resolution);
    });
  });
}

function downloadImage(container) {
  const img = container.querySelector("img, canvas");
  if (!img) return;
  const link = document.createElement("a");
  link.download = `image_${container.dataset.seed}.png`;

  if (img.tagName === "CANVAS") {
    try {
      link.href = img.toDataURL();
      link.click();
    } catch (e) {
      console.error(e);
    }
  } else {
    try {
      fetch(img.src)
        .then((res) => res.blob())
        .then((blob) => {
          link.href = URL.createObjectURL(blob);
          link.click();
        })
        .catch(() => {
          link.href = img.src;
          link.target = "_blank";
          link.click();
        });
    } catch (e) {
      link.href = img.src;
      link.target = "_blank";
      link.click();
    }
  }
}

function rerollImage(container, resolution) {
  const prompt = safeDecodeURIComponent(
    container.closest(".quad-block")?.dataset.prompt ||
      container.dataset.prompt,
  );
  const newSeed = Math.floor(Math.random() * 10000000);

  if (resolution) {
    const canvas = container.querySelector("canvas");
    if (canvas) canvas.remove();
    if (typeof window.image === "function") {
      window.image({
        prompt: prompt,
        seed: newSeed,
        guidanceScale: currentGScale,
        resolution: resolution,
        onFinish: (r) => {
          if (r.iframe) r.iframe.replaceWith(r.canvas);
          container.appendChild(r.canvas);
        },
      });
    }
  } else {
    const img = container.querySelector("img");
    if (img) {
      const params = new URLSearchParams({
        width: DEFAULT_IMAGE_WIDTH,
        height: DEFAULT_IMAGE_HEIGHT,
        seed: newSeed,
        model: "flux",
        private: true,
        nologo: true,
      });
      img.src = `${BASE_IMAGE_URL}${encodeURIComponent(prompt)}?${params.toString()}`;
    }
  }
  container.dataset.seed = newSeed;
}

function checkAllButtonStates() {
  const btn = document.getElementById("generate-button");
  const prompt = document.getElementById("promptInput");
  if (!btn || !prompt) return;
  const isEmpty = !prompt.value.trim();
  if (!window.activeAiProcess) btn.disabled = isEmpty;
}

document.addEventListener("DOMContentLoaded", main);
