import { ThemeService, PALETTE } from "../../services/theme.js";
import {
  getPictureHTML,
  setTopBarRight,
  renderDynamicsWidget,
  createProfileRow,
} from "../../services/ui-utils.js";
import { getVisualState } from "../../../data/models.js";
import { entities } from "../../../data/repo.js";
import {
  escapeHtml,
  isValidImageUrl,
  sanitizeHtml,
  error,
  getRandomSignatureKey,
} from "../../../core/utils.js";
import { state } from "../../../core/state.js";
import { VisualManager } from "../../services/visuals.js";
import { generateStream } from "../../../engine/llm.js";
import { events, EVENTS } from "../../../core/events.js";
import { audioService } from "../../../services/audio-service.js";

import { PROFILE_STRUCTURE, LABEL_MAP, SPLIT_HEADERS } from "./constants.js";
import {
  closeProfileModal,
  getOnUpdateSelection,
  getActiveSlotKey,
} from "./controller.js";
import { showAlert, showConfirm } from "../../services/modals.js";

const autoResize = (el) => {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
};

// Helper to access nested properties safely (e.g. entity.forever.physical)
const getNestedValue = (obj, path) =>
  path.split(".").reduce((acc, part) => acc && acc[part], obj) || "";

const getLiveEntityFromForm = (form, baseEntity) => {
  const live = { ...baseEntity };

  // Explicitly scrape name and description if available
  const nameEl = form.querySelector('[data-edit-field="name"]');
  const descEl = form.querySelector('[data-edit-field="description"]');
  if (nameEl) live.name = nameEl.value;
  if (descEl) live.description = descEl.value;

  Object.keys(PROFILE_STRUCTURE).forEach((key) => {
    const config = PROFILE_STRUCTURE[key];
    if (config.type === "nested") {
      live[key] = { ...(baseEntity[key] || {}) };
      Object.keys(config.fields).forEach((subKey) => {
        const el = form.querySelector(`[data-edit-field="${key}.${subKey}"]`);
        if (el) live[key][subKey] = el.value;
      });
    } else {
      const el = form.querySelector(`[data-edit-field="${key}"]`);
      if (el) live[key] = el.value;
    }
  });

  // --- DYNAMICS SCRAPING ---
  // [NEW] Supports Context-Aware "Baseline" vs "Current Value" editing
  const dynInputs = form.querySelectorAll("input[data-dynamics-target]");
  if (dynInputs.length > 0) {
    live.dynamics = {
      ...(baseEntity.dynamics || {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      }),
    };
    live.baseline = {
      ...(baseEntity.baseline || {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      }),
    };

    dynInputs.forEach((input) => {
      const target = input.dataset.dynamicsTarget; // 'baseline' or 'dynamics'
      const key = input.dataset.dynamicsKey;
      const val = parseInt(input.value, 10) || 50;

      if (target === "baseline") {
        // Editing Baseline sets the Anchor AND resets the Current State to match
        // (Assuming if you change who they are, you change how they start)
        live.baseline[key] = val;
        live.dynamics[key] = val;
      } else {
        // Editing Dynamics only changes the Momentary State
        live.dynamics[key] = val;
      }
    });
  }

  return live;
};

/**
 * Interactive Plot Editor (Director Mode)
 */
const renderPlotEditor = (container, entity) => {
  const plot = entity.customData?.plot || { active: [], resolved: [] };
  const activeData = plot.active || [];
  const resolvedData = plot.resolved || [];

  const wrapper = document.createElement("div");
  wrapper.className = "profile-section plot-editor-widget profile-dev-section";

  // Header
  const header = document.createElement("h4");
  header.textContent = "Director Controls: Plot";
  header.className = "dev-widget-header";
  header.style.color = `var(--color-${entity.signatureColor || "default"})`;
  wrapper.appendChild(header);

  // Active List
  const activeList = document.createElement("ul");
  activeList.className = "plot-list active-list";
  activeList.style.listStyle = "none";
  activeList.style.padding = "0";
  activeList.style.margin = "0 0 10px 0";

  // Resolved List
  const resolvedList = document.createElement("ul");
  resolvedList.className = "plot-list resolved-list";
  resolvedList.style.listStyle = "none";
  resolvedList.style.padding = "0";
  resolvedList.style.margin = "10px 0 0 0";
  resolvedList.style.opacity = "0.6";

  // Item Factory
  const createItem = (text, type) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.marginBottom = "5px";
    li.style.padding = "5px";
    li.style.background = "rgba(255,255,255,0.05)";
    li.style.borderRadius = "4px";

    if (type === "active") {
      li.className = "plot-active-item-wrapper";
      const input = document.createElement("input");
      input.type = "text";
      input.value = text;
      input.className = "plot-active-input profile-input"; // Scrape class
      input.style.marginBottom = "0";
      input.style.flex = "1";
      input.style.marginRight = "10px";
      input.style.background = "transparent";
      input.style.border = "none";
      input.style.color = "inherit";
      input.placeholder = "Plot thread details...";
      li.appendChild(input);
    } else {
      li.className = "plot-resolved-item"; // Scrape class (container)
      const span = document.createElement("span");
      span.textContent = text;
      span.className = "plot-resolved-text"; // Scrape class (text)
      span.style.flex = "1";
      span.style.marginRight = "10px";
      span.style.wordBreak = "break-word";
      span.style.textDecoration = "line-through";
      li.appendChild(span);
    }

    // Actions
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "5px";
    actions.style.flexShrink = "0";

    if (type === "active") {
      const resolveBtn = document.createElement("button");
      resolveBtn.textContent = "✓";
      resolveBtn.className = "btn-ghost small";
      resolveBtn.style.width = "auto";
      resolveBtn.style.padding = "2px 8px";
      resolveBtn.title = "Resolve";
      resolveBtn.onclick = (e) => {
        e.preventDefault();
        const currentText = li.querySelector("input").value;
        li.remove();
        resolvedList.insertBefore(
          createItem(currentText, "resolved"),
          resolvedList.firstChild,
        );
      };
      actions.appendChild(resolveBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.className = "btn-ghost danger small";
    deleteBtn.style.color = "var(--pico-del-color)";
    deleteBtn.style.width = "auto";
    deleteBtn.style.padding = "2px 8px";
    deleteBtn.title = "Delete";
    deleteBtn.onclick = (e) => {
      e.preventDefault();
      li.remove();
    };
    actions.appendChild(deleteBtn);

    li.appendChild(actions);
    return li;
  };

  // Populate Lists
  activeData.forEach((text) =>
    activeList.appendChild(createItem(text, "active")),
  );
  resolvedData.forEach((text) =>
    resolvedList.appendChild(createItem(text, "resolved")),
  );

  wrapper.appendChild(activeList);

  // Add New Controls
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "5px";
  controls.style.marginBottom = "10px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "New plot thread...";
  input.className = "profile-input";
  input.style.marginBottom = "0";
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBtn.click();
    }
  };

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add";
  addBtn.className = "btn-icon-raise";
  addBtn.style.width = "auto";
  addBtn.onclick = (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (val) {
      activeList.appendChild(createItem(val, "active"));
      input.value = "";
    }
  };

  controls.appendChild(input);
  controls.appendChild(addBtn);
  wrapper.appendChild(controls);

  // Resolved Header
  const resLabel = document.createElement("div");
  resLabel.textContent = "Resolved History";
  resLabel.style.fontSize = "0.8em";
  resLabel.style.marginTop = "10px";
  resLabel.style.opacity = "0.5";
  wrapper.appendChild(resLabel);

  wrapper.appendChild(resolvedList);

  container.appendChild(wrapper);
};

export const renderProfileEdit = async (screen, entity, type, id) => {
  // Setup Visuals
  setTopBarRight("form");

  // Randomize color immediately so placeholder gets it too
  const currentColor = entity.signatureColor || getRandomSignatureKey();

  // Create a local "live" entity for rendering the initial state
  const localEntity = { ...entity, signatureColor: currentColor };

  const template = document.querySelector("#tpl-profile-page");
  if (!template) return;
  const layout = template.content.firstElementChild.cloneNode(true);

  const isFractal = type === "fractal";
  const heroWrap = layout.querySelector(".hero-wrap");

  // --- HERO IMAGE & EDIT OVERLAY ---
  let localVisuals = getVisualState(entity);

  const applyVisualsToImage = (wrapperEl) => {
    if (!wrapperEl) return;
    if (localVisuals.flipped) wrapperEl.classList.add("img-flipped");
    else wrapperEl.classList.remove("img-flipped");
  };

  if (getPictureHTML) {
    const heroPic = getPictureHTML(localEntity, {
      cover: true,
      landscape: isFractal,
    });
    if (heroPic) {
      heroPic.classList.add("hero-bleed");
      applyVisualsToImage(heroPic);
      heroWrap.appendChild(heroPic);
    }
  }

  // Edit Overlay Logic
  const imageOverlay = layout.querySelector(".profile-hero-overlay");
  imageOverlay.style.display = "flex"; // Ensure visible in edit mode

  const imageInput = imageOverlay.querySelector(
    '[data-profile-field="profilePictureUrl"]',
  );
  const actionButton = imageOverlay.querySelector(".profile-main-action");
  const fileInput = imageOverlay.querySelector(
    '[data-profile-field="fileInput"]',
  );
  const paletteSelect = imageOverlay.querySelector(
    'select[name="signatureColour"]',
  );
  const magicBtn = imageOverlay.querySelector(
    'button[data-action="magic-prompt"]',
  );

  // Hide Background Toggle for Fractals
  const bgToggle = imageOverlay.querySelector(".btn-subtle-toggle");
  if (bgToggle) bgToggle.style.display = isFractal ? "none" : "flex";

  // Palette Options
  if (paletteSelect && paletteSelect.options.length === 0) {
    Object.keys(PALETTE).forEach((key) => {
      if (key === "default") return;
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      paletteSelect.appendChild(option);
    });
  }

  // Init Inputs
  if (imageInput) {
    imageInput.disabled = false;
    imageInput.value = entity.profilePictureUrl || "";
  }
  if (actionButton) {
    actionButton.disabled = false;
  }

  // --- HELPERS ---
  const elementLockList = [
    imageInput,
    actionButton,
    fileInput,
    paletteSelect,
    magicBtn,
  ].filter(Boolean);

  const setBusy = (busy) => {
    if (heroWrap) {
      const wrapper = heroWrap.closest(".profile-hero");
      if (wrapper) {
        if (busy) wrapper.setAttribute("aria-busy", "true");
        else wrapper.removeAttribute("aria-busy");
      }
    }
    if (imageOverlay) imageOverlay.classList.toggle("is-locked", busy);

    elementLockList.forEach((el) => {
      el.disabled = busy;
      if (!busy) el.removeAttribute("aria-busy");
      // Optional visual hint
      el.classList.toggle("btn-disabled-visual", busy);
    });

    if (magicBtn) magicBtn.style.opacity = busy ? "0.5" : "1";
  };

  const updatePreview = (urlOverride) => {
    const val =
      urlOverride || imageInput.dataset.pendingUrl || imageInput.value.trim();
    if (val && isValidImageUrl(val, true)) {
      const safeVal = sanitizeHtml(val);
      const newPic = getPictureHTML(
        { ...entity, profilePictureUrl: safeVal },
        { cover: true, landscape: isFractal },
      );
      const curPic = heroWrap.querySelector(".picture");
      if (newPic) {
        newPic.classList.add("hero-bleed");
        applyVisualsToImage(newPic);

        if (curPic) curPic.replaceWith(newPic);
        else heroWrap.appendChild(newPic);
      }
    }
  };

  const updateButtonState = () => {
    const val = imageInput.value.trim();
    const hasPending = !!imageInput.dataset.pendingUrl;

    if (val === "" && !hasPending) {
      actionButton.textContent = "Upload";
      actionButton.dataset.action = "upload";
    } else if ((val && !isValidImageUrl(val, true)) || hasPending) {
      actionButton.textContent = "Generate";
      actionButton.dataset.action = "generate";
    } else {
      actionButton.textContent = "Use URL";
      actionButton.dataset.action = "use-url";
    }
  };

  const updateMagicButtonState = () => {
    if (!magicBtn) return;

    const WAND_ICON_SVG = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 7l-1.2-2.8L16 3l-1.2 2.8L12 7l2.8 1.2L16 11l1.2-2.8L20 7zm-9 6l-2.3-5L6.5 3 4.2 8 2 10.3l5 2.3L4.7 17l2.3 5L9.3 17l5-2.3L12 13z"/></svg>`;
    const SPARKLES_ICON_SVG = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.5 5.6L10 7 7.5 8.4 6.1 10.9 4.7 8.4 2.2 7 4.7 5.6 6.1 3.1 7.5 5.6zm12 9.8L22 14l-2.5-1.4L18.1 10.1l-1.4 2.5L14.2 14l2.5 1.4L18.1 17.9l1.4-2.5zM22 2l-2.5 1.4L18.1 0.9 16.7 3.4 14.2 4.8l2.5 1.4L18.1 8.7l1.4-2.5L22 4.8l-2.5-1.4L22 2z"/></svg>`;

    if (imageInput.value.trim().length > 0) {
      // Enhance Mode (Sparkles)
      magicBtn.innerHTML = `${SPARKLES_ICON_SVG} Enhance`;
      magicBtn.dataset.mode = "enhance";
    } else {
      // Extract Mode (Wand)
      magicBtn.innerHTML = `${WAND_ICON_SVG} Extract`;
      magicBtn.dataset.mode = "extract";
    }
  };

  imageInput.addEventListener("input", () => {
    if (imageInput.dataset.pendingUrl) delete imageInput.dataset.pendingUrl;
    updateButtonState();
    updateMagicButtonState();
    updatePreview();
  });

  // [UX] Enter Key Hook
  imageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      actionButton.click();
    }
  });

  updateButtonState();
  updateMagicButtonState();

  // Action Button Logic
  actionButton.addEventListener("click", async () => {
    const action = actionButton.dataset.action;

    if (action === "generate") {
      try {
        setBusy(true);
        const prompt = imageInput.value.trim();
        const negativePrompt = imageInput.dataset.negativePrompt || ""; // [NEW] Negative Prompt Support
        const resolution = isFractal ? "768x768" : "512x768";
        const removeBgCheckbox = layout.querySelector("#gen-transparent-bg");
        const isTransparent =
          removeBgCheckbox && !isFractal ? removeBgCheckbox.checked : false;

        const url = await VisualManager.generate(prompt, {
          resolution,
          removeBackground: isTransparent,
          negative: negativePrompt, // Pass strictly as 'negative' per Visuals.js contract
        });

        if (url) {
          imageInput.dataset.pendingUrl = url;
          updatePreview(url);
          audioService.play("notification");
        }
      } catch (e) {
        error(e);
      } finally {
        setBusy(false);
        updateButtonState();
      }
    } else if (action === "upload") {
      if (fileInput) fileInput.click();
    } else if (action === "use-url") {
      const originalText = actionButton.textContent;
      actionButton.textContent = "Saved!";
      setTimeout(() => {
        actionButton.textContent = originalText;
        updateButtonState();
      }, 1000);
    }
  });

  // File Upload
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await VisualManager.upload(file);
      if (url) {
        imageInput.value = url;
        imageInput.dispatchEvent(new Event("input"));
      }
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
      updateButtonState();
      fileInput.value = null;
    }
  });

  // Color Palette
  if (paletteSelect) {
    Array.from(paletteSelect.options).forEach((opt) => {
      opt.selected = opt.value === currentColor;
    });

    paletteSelect.addEventListener("change", () => {
      const newColor = paletteSelect.value;
      const rawVal = imageInput.dataset.pendingUrl || imageInput.value.trim();
      const urlToCheck = rawVal && rawVal !== "" ? rawVal : null;

      const newPic = getPictureHTML(
        { ...entity, signatureColor: newColor, profilePictureUrl: urlToCheck },
        { cover: true, landscape: isFractal },
      );

      const curPic = heroWrap.querySelector(".picture");
      if (curPic && newPic) {
        newPic.classList.add("hero-bleed");
        applyVisualsToImage(newPic);
        curPic.replaceWith(newPic);
      }
      const nameInput = form.querySelector(".profile-name-input");
      if (nameInput) ThemeService.apply(nameInput, newColor);
    });
  }

  // --- HEADER (Inputs) ---
  const form = layout.querySelector("form");
  const headerWrap = form.querySelector("[data-profile-header]");
  headerWrap.innerHTML = "";

  const nameInput = document.createElement("textarea");
  nameInput.className = "profile-name-input";
  nameInput.dataset.editField = "name";
  nameInput.value = entity.name || "";
  nameInput.placeholder = "Name";
  nameInput.rows = 1;
  ThemeService.apply(nameInput, currentColor);
  nameInput.addEventListener("input", () => autoResize(nameInput));
  headerWrap.appendChild(nameInput);
  setTimeout(() => autoResize(nameInput), 0);

  const descInput = document.createElement("textarea");
  descInput.className = "profile-desc-input";
  descInput.dataset.editField = "description";
  descInput.value = entity.description || "";
  descInput.placeholder = "Short description...";
  descInput.rows = 1;
  descInput.addEventListener("input", () => autoResize(descInput));
  headerWrap.appendChild(descInput);
  setTimeout(() => autoResize(descInput), 0);

  // --- SECTIONS (Maestro 2-Column Grid) ---
  const secWrap = form.querySelector("[data-profile-sections]");

  Object.keys(PROFILE_STRUCTURE).forEach((key) => {
    const config = PROFILE_STRUCTURE[key];

    // ⚡ BOLT REFACTOR: Use shared row logic
    const { row, contentCol } = createProfileRow(
      config.label.split(" (")[0],
      LABEL_MAP[key] || "",
    );

    // Case 1: Nested Objects (Forever/Present)
    if (config.type === "nested") {
      const splitWrap = document.createElement("div");
      splitWrap.className = "split-content";

      const keys = ["mental", "physical"];

      keys.forEach((subKey) => {
        const fieldConfig = config.fields[subKey];
        if (!fieldConfig) {
          console.warn(
            `Configuration for nested field '${key}.${subKey}' not found. Skipping.`,
          );
          return;
        }
        const splitCol = document.createElement("div");
        splitCol.className = "split-column";

        // Only show headers for "forever" (first row) to avoid duplicates in "present"
        if (key === "forever") {
          const header = document.createElement("div");
          header.className = "split-header";
          header.textContent = SPLIT_HEADERS[subKey];
          splitCol.appendChild(header);
        }

        const input = document.createElement("textarea");
        input.className = "profile-input";
        const finalPath = `${key}.${subKey}`;
        input.value = getNestedValue(entity, finalPath);
        input.dataset.editField = finalPath;
        input.rows = fieldConfig.rows || 2;
        input.placeholder = fieldConfig.placeholder || "";
        input.addEventListener("input", () => autoResize(input));

        splitCol.appendChild(input);
        setTimeout(() => autoResize(input), 0);

        splitWrap.appendChild(splitCol);
      });
      contentCol.appendChild(splitWrap);
    }
    // Case 2: String Fields (Past/Future)
    else if (config.type === "string") {
      const input = document.createElement("textarea");
      input.className = "profile-input";
      input.value = entity[key] || "";
      input.dataset.editField = key;
      input.rows = config.rows || 4;
      input.placeholder = config.placeholder || "";
      input.addEventListener("input", () => autoResize(input));

      contentCol.appendChild(input);
      setTimeout(() => autoResize(input), 0);
    }

    secWrap.appendChild(row);
  });

  // [NEW] VOICE SELECTOR (AWS Polly Roster)
  // Inject after standard sections, but HIDDEN for Fractals
  const { row: voiceRow, contentCol: voiceContent } = createProfileRow(
    "VOICE",
    "NARRATIVE AUDIO",
  );

  // User-requested structure
  const voiceGroup = document.createElement("div");
  voiceGroup.className = "form-group voice-selector-group";
  voiceGroup.style.width = "100%";

  const label = document.createElement("label");
  label.textContent = "Voice Model";
  label.style.display = "block";
  label.style.marginBottom = "0.5rem";
  label.style.fontSize = "0.75rem";
  label.style.opacity = "0.7";
  voiceGroup.appendChild(label);

  const flexRow = document.createElement("div");
  flexRow.className = "flex-row";
  flexRow.style.display = "flex";
  flexRow.style.gap = "0.5rem";
  flexRow.style.alignItems = "center";

  const voiceSelect = document.createElement("select");
  voiceSelect.id = "profile-voice";
  voiceSelect.className = "rpg-input";
  voiceSelect.dataset.editField = "voiceId"; // Binds to entity.voiceId
  voiceSelect.style.flex = "1";
  voiceSelect.style.marginBottom = "0";

  // Populate from VoiceService
  import("../../../services/voice-service.js").then(({ voiceService }) => {
    const roster = voiceService.getVoices();
    let hasMatch = false;

    roster.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.name;

      if (entity.voiceId === v.id) {
        opt.selected = true;
        hasMatch = true;
      }
      voiceSelect.appendChild(opt);
    });

    // Fallback default
    if (!hasMatch && roster.length > 0) {
      voiceSelect.value = "joanna"; // AWS Default
    }
  });

  const previewBtn = document.createElement("button");
  previewBtn.type = "button";
  previewBtn.id = "preview-voice";
  previewBtn.className = "rpg-btn small icon-only";
  previewBtn.innerHTML = "🔊";
  previewBtn.title = "Preview Voice";
  previewBtn.onclick = async (e) => {
    e.preventDefault();
    const { voiceService } = await import("../../../services/voice-service.js");
    await voiceService.init(); // Ensure initialized
    const selectedId = voiceSelect.value;
    if (selectedId) {
      voiceService.preview(selectedId);
    }
  };

  flexRow.appendChild(voiceSelect);
  flexRow.appendChild(previewBtn);
  voiceGroup.appendChild(flexRow);
  voiceContent.appendChild(voiceGroup);
  secWrap.appendChild(voiceRow);

  // FIX: Hide for Fractals
  if (type === "fractal") {
    voiceRow.style.display = "none";
  }

  // --- MAGIC PROMPT LOGIC ---
  const handleEnhancePrompt = async (currentVal) => {
    // Inject Identity Context to prevent Gender/Subject Swapping
    const subjectGender = (entity.gender || "").toLowerCase();
    const subjectContext = `Subject: ${entity.name} (${entity.type}). Gender: ${subjectGender}.`;

    const prompt = `Rewrite this image prompt for the FLUX model. ${subjectContext}\nUse descriptive prose, natural lighting terms, and high fidelity. Keep it concise but vivid.\n\nInput: "${currentVal}"`;

    const fullText = await generateStream({
      payload: {
        system:
          "You are a backend image prompt processor. Preserve the subject's gender and identity. OUTPUT RAW TEXT ONLY. 1. Do NOT use headers like 'Revised Prompt'. 2. Do NOT use quotation marks around the prompt. 3. Do NOT add 'Notes' or explanations at the end. 4. Just output the descriptive text block ready for the image generator.",
        messages: [{ role: "user", text: prompt }],
        params: {
          temperature: 0.7,
          maxTokens: 200,
          model: "flux-prompter",
        },
      },
    });

    return fullText
      .replace(/^\s*(\*\*.*?\*\*|Revised.*?Prompt:)\s*/gim, "")
      .replace(/Note:[\s\S]*$/i, "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim();
  };

  const handleAutoWritePrompt = async () => {
    const liveEntity = getLiveEntityFromForm(form, entity);

    // 1. Gender Enforcement
    const gender = (liveEntity.gender || entity.gender || "").toLowerCase();
    const pronouns = (
      liveEntity.pronouns ||
      entity.pronouns ||
      ""
    ).toLowerCase();
    const isMale =
      gender === "male" || gender === "man" || pronouns.includes("he/");
    const isFemale =
      gender === "female" || gender === "woman" || pronouns.includes("she/");

    let genderKeywords = "";
    if (isMale) genderKeywords = "Male, Man, Masculine features, chiseled";
    else if (isFemale) genderKeywords = "Female, Woman, Feminine features";

    // 2. Style Injection
    let styleKeywords = "";
    let negParts = [];

    if (isFractal) {
      styleKeywords =
        "Hyper-realistic texture, Macro photography, Cinematic lighting, Optical illusion";
      negParts.push("Humans, People, Face, Eyes");
    } else {
      styleKeywords =
        "Photorealistic Profile Picture, 8k, raw photo, natural skin texture, visible pores, cinematic lighting, sharp focus";
    }

    // 3. Negative Prompting
    if (isMale) negParts.push("woman, girl, female, boobs, feminine");
    else if (isFemale) negParts.push("man, boy, male, masculine, facial hair");

    negParts.push("text, watermark, blurry, low quality");
    const finalNeg = negParts.join(", ");

    // 4. Color Injection
    const sigKey = paletteSelect
      ? paletteSelect.value
      : entity.signatureColor || "default";
    const readableColor = sigKey
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const colorInjection = `${readableColor} lighting, ${readableColor} accents`;

    // 5. Build Final Prompt
    const subject = `A portrait of ${liveEntity.name}`;
    let descSources = [
      liveEntity.forever?.physical,
      liveEntity.present?.physical,
    ].filter(Boolean);

    if (descSources.length === 0) {
      if (liveEntity.appearance) descSources.push(liveEntity.appearance);
      else descSources.push(`${liveEntity.type} - A mysterious figure`);
    }

    const baseDesc = descSources.join(", ");
    const promptParts = [
      styleKeywords,
      colorInjection,
      genderKeywords,
      subject,
      baseDesc,
    ].filter((p) => p && p.trim() !== "");

    return { pos: promptParts.join(", "), neg: finalNeg };
  };

  if (magicBtn) {
    magicBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        setBusy(true);
        const currentVal = imageInput.value.trim();

        if (currentVal) {
          const cleanText = await handleEnhancePrompt(currentVal);
          imageInput.value = cleanText;
          audioService.play("notification");
        } else {
          const { pos, neg } = await handleAutoWritePrompt();
          imageInput.value = pos;
          imageInput.dataset.negativePrompt = neg;
        }
        imageInput.dispatchEvent(new Event("input"));
      } catch (err) {
        error("Magic Prompt failed", err);
        showAlert("Error", "The Maestro is silent. Please try again.");
      } finally {
        setBusy(false);
        updateButtonState();
      }
    };
  }

  // --- DYNAMICS ---
  if (
    state.settings.developerMode &&
    (type === "character" || type === "fractal")
  ) {
    const isStoryMode = document.body.classList.contains("storymode");

    if (isStoryMode) {
      // [CONTEXT: ACTIVE STORY]
      // Editing "Current State" (Temporary fluctuations)
      renderDynamicsWidget(secWrap, entity, "edit", {
        label: "DYNAMICS: CURRENT VALUE",
        tooltip: "",
        source: "dynamics",
      });
    } else {
      // [CONTEXT: ROSTER / STORYBOARD]
      // Editing "Baseline" (Personality)
      // This is the "Center of Gravity" for the character.
      renderDynamicsWidget(secWrap, entity, "edit", {
        label: "DYNAMICS: DEFAULT VALUE",
        tooltip: "",
        source: "baseline",
      });
    }

    renderPlotEditor(secWrap, entity);
  }

  // --- FOOTER ACTIONS ---
  const footerActions = document.createElement("div");
  footerActions.className = "profile-actions-footer";

  const btnGroup = document.createElement("fieldset");
  btnGroup.setAttribute("role", "group");
  btnGroup.style.marginBottom = "0";
  btnGroup.style.width = "100%";

  // Delete
  if (id !== "new") {
    const delBtn = document.createElement("button");
    delBtn.className = "btn-ghost danger btn-icon-raise"; // Ghost + Danger
    delBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; vertical-align:middle;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
    delBtn.title = "Delete Profile";
    delBtn.onclick = async (e) => {
      e.preventDefault();
      if (await showConfirm("Delete Profile", "Delete this entity?")) {
        await entities.remove(type, id);
        const _onUpdateSelection = getOnUpdateSelection();
        if (_onUpdateSelection) {
          const activeSlotKey = getActiveSlotKey();
          const update = {};
          update[activeSlotKey] = null;
          _onUpdateSelection(update);
        }
        closeProfileModal();
      }
    };
    btnGroup.appendChild(delBtn);
  }

  // Save
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn-primary btn-icon-raise";
  saveBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; vertical-align:middle;"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`;
  saveBtn.title = "Save Profile";
  saveBtn.onclick = async (e) => {
    e.preventDefault();
    const live = getLiveEntityFromForm(form, entity);

    if (!live.name?.trim()) return showAlert("Validation", "Name is required");

    // Scrape Plot Data (Director Mode)
    let plotData = entity.customData?.plot || { active: [], resolved: [] };
    const plotContainer = form.querySelector(".plot-editor-widget");
    if (plotContainer) {
      const activeInputs = Array.from(
        plotContainer.querySelectorAll(".plot-active-input"),
      );
      const resolvedItems = Array.from(
        plotContainer.querySelectorAll(".plot-resolved-text"),
      );

      plotData = {
        active: activeInputs.map((el) => el.value.trim()).filter((v) => v),
        resolved: resolvedItems
          .map((el) => el.textContent.trim())
          .filter((v) => v),
      };
    }

    // Patch visual alignment
    const finalImageUrl = escapeHtml(
      imageInput.dataset.pendingUrl || imageInput.value.trim(),
    );
    localVisuals.profilePictureUrl = finalImageUrl;
    localVisuals.signatureColour = paletteSelect.value; // Sync palette choice

    // Merge everything
    const data = {
      ...live,
      name: escapeHtml(live.name),
      description: escapeHtml(live.description),
      profilePictureUrl: finalImageUrl,
      signatureColour: escapeHtml(paletteSelect.value.trim()),
      visuals: localVisuals,
      voiceId: form.querySelector('[data-edit-field="voiceId"]')?.value, // [FIX] Persist Voice
      customData: {
        ...entity.customData,
        plot: plotData,
      },
      povStyle: isFractal
        ? form.querySelector('[data-edit-field="povStyle"]')?.value ||
          entity.povStyle ||
          "IMMERSIVE"
        : undefined,
    };

    // Sanitize any root or nested strings
    const allInputs = form.querySelectorAll("textarea[data-edit-field]");
    allInputs.forEach((input) => {
      const fieldKey = input.dataset.editField;
      if (["name", "description", "povStyle"].includes(fieldKey)) return;
      const val = escapeHtml(input.value.trim());
      if (fieldKey.includes(".")) {
        const [parent, child] = fieldKey.split(".");
        if (data[parent]) data[parent][child] = val;
      } else {
        data[fieldKey] = val;
      }
    });

    if (state.settings.developerMode) {
      const dynInputs = screen.querySelectorAll("[data-edit-dynamic]");
      if (dynInputs.length > 0) {
        data.dynamics = {};
        dynInputs.forEach((input) => {
          data.dynamics[input.dataset.editDynamic] = parseInt(input.value, 10);
        });
      }

      // Scrape Plot Data
      const activeDivs = screen.querySelectorAll(".plot-active-item span");
      const resolvedDivs = screen.querySelectorAll(".plot-resolved-item span");

      const active = Array.from(activeDivs).map((el) => el.textContent);
      const resolved = Array.from(resolvedDivs).map((el) => el.textContent);

      // Merge safe
      data.customData = {
        ...(entity.customData || {}),
        plot: { active, resolved },
      };
    }

    try {
      if (id === "new") {
        console.log("[Profile] Creating New Entity. Data:", data);
        await entities.create(type, data);
      } else {
        console.log(`[Profile] Updating ${id}. VoiceID: ${data.voiceId}`); // DEBUG
        await entities.upsert(type, { ...entity, ...data });

        const _onUpdateSelection = getOnUpdateSelection();
        if (_onUpdateSelection) {
          const activeKey = getActiveSlotKey();
          if (activeKey) {
            const freshEntity = await entities.get(type, id);
            _onUpdateSelection({ [activeKey]: freshEntity });
          }
        }
      }
      closeProfileModal();
    } catch (err) {
      error("Saving Failed", err);
      showAlert("Saving Failed", "Failed to save profile.");
    }
  };
  btnGroup.appendChild(saveBtn);

  footerActions.appendChild(btnGroup);
  form.appendChild(footerActions);

  // --- LIVE SYNC ---
  const handleEntityUpdate = (e) => {
    // Check if update matches this entity
    if (e.detail?.id === id && e.detail?.entity) {
      const fresh = e.detail.entity;

      // Update Dynamics Only (Preserve user edits in text fields if any?)
      // Actually, physics primarily updates dynamics.
      if (fresh.dynamics && state.settings.developerMode) {
        const w = screen.querySelector(".dynamics-widget");
        if (w) {
          // Re-render widget
          w.innerHTML = "";
          renderDynamicsWidget(
            screen.querySelector("[data-profile-sections]"),
            fresh,
            "edit",
          );
        }
      }

      // Note: fully re-rendering inputs might clobber user typing.
      // We assume physics updates happen during Story Mode, where the user isn't heavily editing per se,
      // but if they have the modal open, they might be.
      // Safe bet: Update Dynamics and maybe Header stats if we had them.
    }
  };
  events.addEventListener(EVENTS.ENTITY_UPDATED, handleEntityUpdate);

  // Cleanup listener when modal closes
  // (We don't have a direct "close" event here easily, but we can hook the remove)
  // This is a bit leaky if we're not careful.
  // Ideally `closeProfileModal` handles cleanup.
  // For now, we can attach it to the screen element's removal?
  // Or just rely on the fact that `renderProfileEdit` clears the screen or creates a new one?
  // WeakMap or similar?
  // Let's attach a cleanup method to the screen element?
  screen._cleanupProfile = () => {
    events.removeEventListener(EVENTS.ENTITY_UPDATED, handleEntityUpdate);
  };

  screen.appendChild(layout);
};
