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

import { PROFILE_STRUCTURE, LABEL_MAP, SPLIT_HEADERS } from "./constants.js";
import {
  closeProfileModal,
  getOnUpdateSelection,
  getActiveSlotKey,
} from "./controller.js";
import { showAlert, showConfirm } from "../../orchestrator.js";

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// Helper to access nested properties safely (e.g. entity.forever.physical)
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj) || "";
}

function getLiveEntityFromForm(form, baseEntity) {
  const live = { ...baseEntity };

  // Explicitly scrape name and description if available
  const nameEl = form.querySelector('[data-edit-field="name"]');
  const descEl = form.querySelector('[data-edit-field="description"]');
  if (nameEl) live.name = nameEl.value;
  if (descEl) live.description = descEl.value;

  Object.keys(PROFILE_STRUCTURE).forEach((key) => {
    const config = PROFILE_STRUCTURE[key];
    if (config.type === "nested") {
      live[key] = live[key] || {};
      Object.keys(config.fields).forEach((subKey) => {
        const el = form.querySelector(`[data-edit-field="${key}.${subKey}"]`);
        if (el) live[key][subKey] = el.value;
      });
    } else {
      const el = form.querySelector(`[data-edit-field="${key}"]`);
      if (el) live[key] = el.value;
    }
  });

  return live;
}

export async function renderProfileEdit(screen, entity, type, id) {
  // Setup Visuals
  setTopBarRight("form");

  // [FIX] Randomize color immediately so placeholder gets it too
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
      applyVisualsToImage(heroPic); // [FIX] Pass the wrapper directly
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
        applyVisualsToImage(newPic); // [FIX] Pass the wrapper directly

        if (curPic) curPic.replaceWith(newPic);
        else heroWrap.appendChild(newPic);
      }
    }
  };

  function updateButtonState() {
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
  }

  imageInput.addEventListener("input", () => {
    if (imageInput.dataset.pendingUrl) delete imageInput.dataset.pendingUrl;
    updateButtonState();
    updatePreview();
  });

  // [UX] Enter Key Hook
  imageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      actionButton.click();
    }
  });

  updateButtonState();

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
        applyVisualsToImage(newPic); // [FIX] Pass the wrapper directly
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

        const header = document.createElement("div");
        header.className = "split-header";
        header.textContent = SPLIT_HEADERS[subKey];
        splitCol.appendChild(header);

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

  // --- MAGIC PROMPT LOGIC ---
  if (magicBtn) {
    magicBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        setBusy(true);
        const currentVal = imageInput.value.trim();

        // MODE B: ENHANCE (Existing Text)
        if (currentVal) {
          try {
            const prompt = `Rewrite this image prompt for the FLUX model. Use descriptive prose, natural lighting terms, and high fidelity. Keep it concise but vivid.\n\nInput: "${currentVal}"`;

            // Stream Logic via llm.js
            const fullText = await generateStream({
              payload: {
                system: "You are an expert prompt engineer.",
                messages: [{ role: "user", text: prompt }],
                params: {
                  temperature: 0.7,
                  maxTokens: 200,
                  model: "flux-prompter", // Metadata for tracking
                },
              },
            });

            imageInput.value = fullText.trim();
            imageInput.dispatchEvent(new Event("input"));
          } catch (llmErr) {
            console.error(llmErr);
            showAlert("Enhance Failed", "The muse is silent. (Check AI Plugin)");
          }
        }
        // MODE A: AUTO-WRITE (Empty Input)
        else {
          // Scrape LIVE values using helper
          const liveEntity = getLiveEntityFromForm(form, entity);

          // --- BRAIN TRANSPLANT: Deterministic Prompt Engineering ---

          // 1. Gender Enforcement
          const gender = (
            liveEntity.gender ||
            entity.gender ||
            ""
          ).toLowerCase();
          const pronouns = (
            liveEntity.pronouns ||
            entity.pronouns ||
            ""
          ).toLowerCase();
          const isMale =
            gender === "male" || gender === "man" || pronouns.includes("he/");
          const isFemale =
            gender === "female" ||
            gender === "woman" ||
            pronouns.includes("she/");

          let genderKeywords = "";
          if (isMale)
            genderKeywords = "Male, Man, Masculine features, chiseled";
          else if (isFemale)
            genderKeywords = "Female, Woman, Feminine features";

          // 2. Style Injection
          let styleKeywords = "";
          let negParts = [];

          if (isFractal) {
            // [FIX] Semantic Repair for Fractals
            styleKeywords =
              "Hyper-realistic texture, Macro photography, Cinematic lighting, Optical illusion";
            negParts.push("Humans, People, Face, Eyes");
          } else {
            // Default to Character
            styleKeywords =
              "Photorealistic Profile Picture, 8k, raw photo, natural skin texture, visible pores, cinematic lighting, sharp focus";
          }

          // 3. Negative Prompting (Gender & Base)
          if (isMale) negParts.push("woman, girl, female, boobs, feminine");
          else if (isFemale)
            negParts.push("man, boy, male, masculine, facial hair");

          negParts.push("text, watermark, blurry, low quality");
          const finalNeg = negParts.join(", ");

          // 4. Color Injection (Signature Color)
          // Convert "neon_blue" -> "Neon Blue"
          const sigKey = paletteSelect
            ? paletteSelect.value
            : entity.signatureColor || "default";
          const readableColor = sigKey
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          const colorInjection = `${readableColor} lighting, ${readableColor} accents`;

          // 5. The Wiring (Construct Rich Prompt)
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

          const finalPos = promptParts.join(", ");

          imageInput.value = finalPos;
          imageInput.dataset.negativePrompt = finalNeg;
          imageInput.dispatchEvent(new Event("input"));
        }
      } catch (err) {
        console.error("Magic Prompt failed", err);
        showAlert("Error", "The Maestro is silent. Please try again.");
      } finally {
        setBusy(false);
        updateButtonState();
      }
    });
  }

  // --- DYNAMICS ---
  if (
    state.settings.developerMode &&
    (type === "character" || type === "fractal")
  ) {
    renderDynamicsWidget(secWrap, entity, "edit");
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
  saveBtn.className = "btn-primary btn-icon-raise"; // Ghost + Primary
  saveBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; vertical-align:middle;"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`;
  saveBtn.title = "Save Profile";
  saveBtn.onclick = async (e) => {
    e.preventDefault();
    const nameVal = nameInput.value.trim();
    if (!nameVal) return showAlert("Validation", "Name is required");

    // Gather Tags
    let tagsArray = [];
    const tagInputEl = form.querySelector('[data-edit-field="tags"]');
    if (tagInputEl) {
      tagsArray = tagInputEl.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else {
      tagsArray = entity.tags || [];
    }

    const finalImageUrl = escapeHtml(
      imageInput.dataset.pendingUrl || imageInput.value.trim(),
    );

    if (localVisuals) {
      localVisuals.profilePictureUrl = finalImageUrl;
    }

    // Base Data
    const data = {
      name: escapeHtml(nameVal),
      description: escapeHtml(descInput.value.trim()),
      profilePictureUrl: finalImageUrl,
      signatureColour: escapeHtml(paletteSelect.value.trim()),
      tags: tagsArray,
      visuals: localVisuals,
      povStyle: isFractal
        ? form.querySelector('[data-edit-field="povStyle"]')?.value ||
          entity.povStyle ||
          "IMMERSIVE"
        : undefined,
      // Initialize nested containers
      forever: {},
      present: {},
    };

    // Scrape Fields from DOM
    // Iterate all textareas with data-edit-field
    const allInputs = form.querySelectorAll("textarea[data-edit-field]");
    allInputs.forEach((input) => {
      const fieldKey = input.dataset.editField;
      if (
        [
          "name",
          "description",
          "tags",
          "povStyle",
          "profilePictureUrl",
        ].includes(fieldKey)
      )
        return; // Handled separately

      const val = escapeHtml(input.value.trim());

      if (fieldKey.includes(".")) {
        // Handle nested: "forever.physical"
        const [parent, child] = fieldKey.split(".");
        if (!data[parent]) data[parent] = {};
        data[parent][child] = val;
      } else {
        // Handle root string: "past"
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
    }

    try {
      if (id === "new") {
        await entities.create(type, data);
      } else {
        await entities.upsert(type, { ...entity, ...data });

        // Force update of the underlying selection
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
      console.error(err);
      showAlert("Saving Failed", "Failed to save.");
    }
  };
  btnGroup.appendChild(saveBtn);

  footerActions.appendChild(btnGroup);
  form.appendChild(footerActions);

  screen.appendChild(layout);
}
