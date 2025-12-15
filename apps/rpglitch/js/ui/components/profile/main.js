
import { events, EVENTS } from "../../../core/events.js";
import { entities, copyEntity } from "../../../data/repo.js";
import { premade, getVisualState } from "../../../data/models.js";
import { getPictureHTML } from "../../../core/utils.js";
import { state } from "../../../core/state.js";
import { VisualManager } from "../../services/visuals.js";
import { ThemeService, PALETTE } from "../../services/theme.js";
import {
  escapeHtml,
  handleAsyncError,
  error,
  setTopBarRight,
  renderTags,
  isValidImageUrl,
  sanitizeHtml,
} from "../../../core/utils.js";

// CALLBACK: Router must inject this
let _onUpdateSelection = null;
export function setProfileCallbacks(callbacks) {
  if (callbacks.onUpdateSelection)
    _onUpdateSelection = callbacks.onUpdateSelection;
}

// Shared State (Local to this module)
let activeSlotKey = null;

// --- CONSTANTS ---
const SECTION_DEFINITIONS = {
  forever: {
    label: "Forever",
    sublabels: {
      character: "Core Identity & Permanent Features",
      fractal: "Eternal Truths & Laws of Nature",
    },
  },
  past: {
    label: "Past",
    sublabels: {
      character: "Background & Memories",
      fractal: "History & Ancient Lore",
    },
  },
  present: {
    label: "Present",
    sublabels: {
      character: "Mood & Conditions",
      fractal: "State of the World & Current Situation",
    },
  },
  future: {
    label: "Future",
    sublabels: {
      character: "Goals & Prophecies",
      fractal: "Impending Events & Prophecies",
    },
  },
};

// --- MODAL MANAGEMENT ---
export function closeProfileModal() {
  const screen = document.querySelector("#profile-screen");
  if (screen) {
    screen.classList.remove("is-open");
    screen.setAttribute("hidden", "");
    screen.classList.remove("profile-view--fractal");
    if (location.hash.includes("#profile")) {
      const base = location.pathname + location.search;
      history.replaceState(
        "",
        document.title,
        base +
          (document.body.classList.contains("mode-gameplay") ? "#story" : ""),
      );
    }
  }
  document.body.classList.remove("profile-view-active");
  activeSlotKey = null;
}

export function openProfileModal(type, id, slotKey = null) {
  activeSlotKey = slotKey;
  renderProfilePage(type.toLowerCase(), id);
  renderProfilePage(type.toLowerCase(), id);
}

export async function refreshProfileIfOpen() {
  const screen = document.querySelector("#profile-screen");
  if (screen && screen.classList.contains("is-open") && activeSlotKey) {
    // activeSlotKey implies we know what we are looking at.
    // We need to re-fetch the entity.
    // But `renderProfilePage` expects type/id.
    // We can parse the hash or store the current ID/Type in module scope?
    // Actually, let's just re-parse the hash since that is the source of truth for the router.

    // Simpler: Just re-render based on current hash state if it matches profile pattern.
    const hash = location.hash.replace("#", "");
    const parts = hash.split("/"); // profile/character/id
    if (parts[0] === "profile" && parts.length === 3) {
      await renderProfilePage(parts[1], parts[2]);
      console.log("[UI] Profile refreshed via background update.");
    }
  }
}

// Subscribe to background updates
events.addEventListener(EVENTS.DB_UPDATED, () => refreshProfileIfOpen());

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// --- PROFILE RENDERER ---
export async function renderProfilePage(type, id, forceEditMode = false) {
  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  screen.removeAttribute("hidden");
  document.body.classList.add("profile-view-active");
  screen.classList.add("is-open");

  const isFractal = type === "fractal";
  if (isFractal) screen.classList.add("profile-view--fractal");
  else screen.classList.remove("profile-view--fractal");

  // Check Gameplay Status (Lock)
  const isGameplay = document.body.classList.contains("mode-gameplay");
  let isEditing = (id === "new" || forceEditMode) && !isGameplay;

  let entity;

  if (id === "new") {
    if (window.ephemeralEntity) {
      entity = { ...window.ephemeralEntity, kind: type };
      delete entity.id;
    } else {
      entity = { kind: type, type: type, sections: {} };
    }
    isEditing = true;
  } else {
    entity = await handleAsyncError(async () => await entities.get(type, id), {
      errorMessage: "Could not load profile.",
      context: "load profile",
      fallback: null,
    });
  }

  if (!entity) {
    closeProfileModal();
    return;
  }

  // Identify Blueprint for Factory Revert
  const blueprint = entity.originId
    ? premade.entities.find((p) => p.id === entity.originId)
    : null;

  screen.textContent = "";
  screen.className = "profile-view";
  screen.classList.add("is-open");
  if (isFractal) screen.classList.add("profile-view--fractal");
  screen.classList.toggle("is-editing", isEditing);

  const template = document.querySelector("#tpl-profile-page");
  if (!template) return;
  const layout = template.content.firstElementChild.cloneNode(true);

  // --- HERO & IMAGE HANDLING ---
  const heroWrap = layout.querySelector(".hero-wrap");

  // Visual State Management
  let localVisuals = getVisualState(entity);

  const applyVisualsToImage = (imgEl) => {
    if (!imgEl) return;
    if (localVisuals.flipped) imgEl.classList.add("img-flipped");
    else imgEl.classList.remove("img-flipped");
  };

  if (getPictureHTML) {
    const heroPic = getPictureHTML(entity, {
      cover: true,
      landscape: isFractal, // Revert to match container's 3/2 aspect ratio (cropping square image)
    });
    if (heroPic) {
      heroPic.classList.add("hero-bleed");
      // Apply flip state immediately on render
      applyVisualsToImage(heroPic.querySelector("img"));
      heroWrap.appendChild(heroPic);
    }
  }

  // Flip Button (Live Control with Auto-Save)
  const flipBtn = document.createElement("button");
  flipBtn.className = "btn-visual-flip";
  flipBtn.innerHTML = "⇄"; // Icon
  flipBtn.title = "Flip Orientation";
  flipBtn.type = "button"; // Prevent form submit
  flipBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Toggle Local State
    localVisuals.flipped = !localVisuals.flipped;

    // 2. Update DOM Instantly (Feedback)
    const imgs = heroWrap.querySelectorAll("img");
    imgs.forEach(applyVisualsToImage);

    // 3. Persist State (If not a "New" entity)
    if (id !== "new" && !isEditing) {
      try {
        // Update the entity object in memory
        if (!entity.visuals) entity.visuals = {};
        entity.visuals.flipped = localVisuals.flipped;

        // Use upsert to save immediately
        await entities.upsert(type, entity);

        // Notify other components (Chat, Drawer)
        window.dispatchEvent(
          new CustomEvent("entity-visual-update", {
            detail: { id: entity.id },
          }),
        );

        console.log("[Profile] Visual flip saved automatically.");
      } catch (err) {
        console.error("Failed to auto-save flip state:", err);
      }
    }
  };
  heroWrap.appendChild(flipBtn);

  const imageOverlay = layout.querySelector(".profile-hero-overlay");
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

  if (paletteSelect && paletteSelect.options.length === 0) {
    // Generate Options from Theme Service (No "Default")
    Object.keys(PALETTE).forEach((key) => {
      if (key === "default") return;
      const option = document.createElement("option");
      option.value = key;
      // Capitalize First Letter (e.g. "emerald" -> "Emerald")
      option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      paletteSelect.appendChild(option);
    });
  }

  const magicBtn = imageOverlay.querySelector(
    'button[data-action="magic-prompt"]',
  );

  const form = layout.querySelector("form");
  const secWrap = form.querySelector("[data-profile-sections]");

  if (imageInput) {
    imageInput.disabled = false;
    imageInput.removeAttribute("aria-busy");
    imageInput.value = entity.profilePictureUrl || "";
  }
  if (actionButton) {
    actionButton.disabled = false;
    actionButton.removeAttribute("aria-busy");
  }

  const setEditMode = (editing) => {
    if (isGameplay) return; // Cannot switch to edit mode in game
    isEditing = editing;
    screen.classList.toggle("is-editing", editing);
    setTopBarRight(editing ? "form" : "profile");
    if (imageOverlay) {
      imageOverlay.style.display = editing ? "flex" : "none";
      // [NEW] Hide Background Toggle for Fractals
      const bgToggle = imageOverlay.querySelector(".btn-subtle-toggle");
      if (bgToggle) bgToggle.style.display = isFractal ? "none" : "flex";
    }
    renderProfilePage(type, id, editing);
  };

  // --- UI STATE HELPERS ---
  // [NEW] Initial visibility check for Background Toggle
  if (imageOverlay && isFractal) {
    const bgToggle = imageOverlay.querySelector(".btn-subtle-toggle");
    if (bgToggle) bgToggle.style.display = "none";
  }

  const elementLockList = [
    imageInput,
    actionButton,
    fileInput,
    paletteSelect,
    magicBtn,
  ].filter(Boolean);

  const setBusy = (busy) => {
    // Apply busy state to the entire container for the overlay effect
    if (heroWrap) {
      const wrapper = heroWrap.closest(".profile-hero");
      if (wrapper) {
        if (busy) wrapper.setAttribute("aria-busy", "true");
        else wrapper.removeAttribute("aria-busy");
      }
    }
    // Lock the overlay interaction
    if (imageOverlay) imageOverlay.classList.toggle("is-locked", busy);

    elementLockList.forEach((el) => {
      el.disabled = busy;
      if (!busy) el.removeAttribute("aria-busy");
    });

    // Visual tweak (opacity)
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
        // Ensure flip state persists on preview update
        applyVisualsToImage(newPic.querySelector("img"));

        if (curPic) curPic.replaceWith(newPic);
        else heroWrap.appendChild(newPic);
      }
    }
  };

  function updateButtonState() {
    const val = imageInput.value.trim();
    const hasPending = !!imageInput.dataset.pendingUrl;

    // Smart Context Logic:
    // 1. Empty? -> "Upload" (Clicking triggers file picker)
    // 2. Valid URL? -> "Use URL" (Visual confirmation, logic handled by save)
    // 3. Text (Prompt)? -> "Generate" (Triggers AI)

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
  updateButtonState();

  // --- MAIN ACTION BUTTON (Smart Context) ---
  actionButton.addEventListener("click", async () => {
    const action = actionButton.dataset.action;

    // 1. GENERATE
    if (action === "generate") {
      try {
        setBusy(true);
        const prompt = imageInput.value.trim();
        const resolution = isFractal ? "768x768" : "512x768";
        const removeBgCheckbox = layout.querySelector("#gen-transparent-bg");
        const isTransparent =
          removeBgCheckbox && !isFractal ? removeBgCheckbox.checked : false;

        const url = await VisualManager.generate(prompt, {
          resolution,
          removeBackground: isTransparent,
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
    }

    // 2. UPLOAD (Proxy click to hidden input)
    else if (action === "upload") {
      if (fileInput) fileInput.click();
    }

    // 3. USE URL (Just confirm)
    else if (action === "use-url") {
      // Visual feedback only, as the input event handles the data
      const originalText = actionButton.textContent;
      actionButton.textContent = "Saved!";
      setTimeout(() => {
        actionButton.textContent = originalText;
        updateButtonState();
      }, 1000);
    }
  });

  // --- AI HELPER: MAGIC PROMPT (Director Mode) ---
  if (magicBtn) {
    magicBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        setBusy(true);

        // Determine style preference from palette or default
        const selectedStyle = paletteSelect
          ? paletteSelect.value
          : entity.signatureColour || "photorealistic";
        const styleTerm =
          selectedStyle === "default" || !selectedStyle
            ? "photorealistic"
            : selectedStyle;
        const existingText = imageInput.value.trim();

        // [FIX] Scrape LIVE values from the form inputs
        // The 'entity' object only holds what was last SAVED to the DB.
        // To support "See it before you save it", we must read the DOM.
        const liveEntity = { ...entity };

        // 1. Core Fields
        const nameInput = form.querySelector('[data-edit-field="name"]');
        if (nameInput) liveEntity.name = nameInput.value;

        const descInput = form.querySelector('[data-edit-field="description"]');
        if (descInput) liveEntity.description = descInput.value;

        // 2. Sections (Past, Present, etc.)
        // These are flattened on the object for prompts usually, but let's check structure
        Object.keys(SECTION_DEFINITIONS).forEach((k) => {
          const el = form.querySelector(`[data-edit-field="${k}"]`);
          if (el) liveEntity[k] = el.value;
        });

        // 3. Tags
        const tagsInput = form.querySelector('[data-edit-field="tags"]');
        if (tagsInput) {
          liveEntity.tags = tagsInput.value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }

        // Call the unified Director with the LIVE data
        const finalPrompt = await VisualManager.composePrompt(
          liveEntity,
          styleTerm,
          existingText,
        );

        imageInput.value = finalPrompt;
        imageInput.dispatchEvent(new Event("input")); // Trigger button state updates
      } catch (err) {
        console.error("Magic Prompt failed", err);
        alert("The Director is currently unavailable. Please try again.");
      } finally {
        setBusy(false);
      }
    });
  }

  // --- FILE UPLOAD ---
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

  // --- COLOR PALETTE & PREVIEW ---
  const currentColor = entity.signatureColour || "default";
  Array.from(paletteSelect.options).forEach((opt) => {
    opt.selected = opt.value === currentColor;
  });

  paletteSelect.addEventListener("change", () => {
    const newColor = paletteSelect.value;

    // [FIX] Sanitization: prevent empty strings from creating broken <img> tags
    const rawVal = imageInput.dataset.pendingUrl || imageInput.value.trim();
    const urlToCheck = rawVal && rawVal !== "" ? rawVal : null;

    const newPic = getPictureHTML(
      {
        ...entity,
        signatureColour: newColor,
        profilePictureUrl: urlToCheck,
      },
      { cover: true, landscape: isFractal },
    );

    const curPic = heroWrap.querySelector(".picture");
    if (curPic && newPic) {
      newPic.classList.add("hero-bleed");
      // Preserve flip state on color change
      applyVisualsToImage(newPic.querySelector("img"));
      curPic.replaceWith(newPic);
    }

    const nameInput = form.querySelector(".profile-name-input");
    const nameDisplay = form.querySelector(".profile-name-display");

    // Apply Theme to Name Elements
    if (nameInput) ThemeService.apply(nameInput, newColor);
    if (nameDisplay) ThemeService.apply(nameDisplay, newColor);
  });

  // --- HEADER (Name/Desc) ---
  const headerWrap = form.querySelector("[data-profile-header]");
  headerWrap.innerHTML = "";

  if (isEditing) {
    const nameInput = document.createElement("textarea");
    nameInput.className = "profile-name-input";
    nameInput.dataset.editField = "name";
    nameInput.value = entity.name || "";
    nameInput.placeholder = "Name";
    nameInput.rows = 1;
    ThemeService.apply(nameInput, entity.signatureColour);
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
  } else {
    const nameDisplay = document.createElement("h1");
    nameDisplay.className = "profile-name-display";
    ThemeService.apply(nameDisplay, entity.signatureColour);
    nameDisplay.textContent = entity.name || "Unknown";
    headerWrap.appendChild(nameDisplay);

    const descDisplay = document.createElement("p");
    descDisplay.className = "profile-desc-display";
    descDisplay.textContent = entity.description || "";
    headerWrap.appendChild(descDisplay);
  }

  // --- TAGS ---
  const tagsRow = document.createElement("div");
  tagsRow.className = "field-row";
  tagsRow.hidden = true;

  if (isEditing) {
    tagsRow.innerHTML = `
      <div class="field-label"><label>Tags</label><small class="muted">Comma separated</small></div>
      <div class="field-input">
        <textarea data-edit-field="tags" rows="1" placeholder="e.g. warrior, magic, dark">${(entity.tags || []).join(", ")}</textarea>
      </div>`;
    const tagInput = tagsRow.querySelector("textarea");
    tagInput.addEventListener("input", () => autoResize(tagInput));
    setTimeout(() => autoResize(tagInput), 0);
  } else {
    tagsRow.innerHTML = `<div class="field-label"><label>Tags</label></div><div class="field-input"></div>`;
    const inputContainer = tagsRow.querySelector(".field-input");
    if (renderTags) {
      renderTags(inputContainer, entity);
    } else {
      inputContainer.textContent = (entity.tags || []).join(", ");
    }
  }
  headerWrap.after(tagsRow);

  // --- SECTIONS (Forever, Past, etc.) ---
  const createRow = (key, def) => {
    const div = document.createElement("div");
    div.className = "field-row";
    const sublabel = def.sublabels[type] || "";

    div.innerHTML = `
        <div class="field-label">
            <label>${def.label}</label>
            ${sublabel ? `<small class="muted">${sublabel}</small>` : ""}
        </div>
        <div class="field-input">
            <div data-read class="profile-field-text-read">${escapeHtml(entity[key] || "")}</div>
        </div>`;

    if (isEditing) {
      const input = document.createElement("textarea");
      input.value = entity[key] || "";
      input.dataset.editField = key;
      input.rows = 1;
      input.addEventListener("input", () => autoResize(input));
      div.querySelector(".field-input").appendChild(input);
      div.querySelector("[data-read]").style.display = "none";
      // [FIX] Auto-resize immediately on render
      setTimeout(() => autoResize(input), 0);
    }
    secWrap.appendChild(div);
  };

  Object.keys(SECTION_DEFINITIONS).forEach((k) =>
    createRow(k, SECTION_DEFINITIONS[k]),
  );

  // --- DYNAMICS (Director Mode) ---
  if (
    state.settings.directorMode &&
    (type === "character" || type === "fractal")
  ) {
    const dynRow = document.createElement("div");
    dynRow.className = "field-row";
    const dyns = entity.dynamics || {
      entropy: 50,
      permeability: 50,
      velocity: 50,
      resonance: 50,
    };

    if (isEditing) {
      dynRow.innerHTML = `
                <div class="field-label"><label>Dynamics</label><small class="muted">Director Mode</small></div>
                <div class="field-input" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                    ${["entropy", "permeability", "velocity", "resonance"]
                      .map(
                        (k) => `
                        <label style="font-size: 0.8rem; text-transform: capitalize;">
                            ${k} <input type="number" data-edit-dynamic="${k}" value="${dyns[k] !== undefined ? dyns[k] : 50}" min="0" max="100">
                        </label>
                    `,
                      )
                      .join("")}
                </div>`;
    } else {
      const isFractal = type === "fractal";
      const gridCols = isFractal ? "repeat(4, 1fr)" : "repeat(2, 1fr)";
      dynRow.innerHTML = `
                <div class="field-label"><label>Dynamics</label><small class="muted">Director Mode</small></div>
                <div class="field-input" style="display: grid; grid-template-columns: ${gridCols}; gap: 0.75rem;">
                     ${["entropy", "permeability", "velocity", "resonance"]
                       .map(
                         (k) => `
                        <div style="background: var(--pico-card-background-color); padding: 0.5rem; border-radius: 4px; border: 1px solid var(--pico-muted-border-color); text-align: center;">
                            <div style="font-size: 0.65rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.25rem;">${k}</div>
                            <div style="font-family: monospace; font-size: 1.1rem; font-weight: 800; color: var(--pico-primary);">${dyns[k] !== undefined ? dyns[k] : 50}%</div>
                        </div>
                    `,
                       )
                       .join("")}
                </div>`;
    }
    secWrap.appendChild(dynRow);
  }

  // --- FOOTER ACTIONS (Grouped) ---
  const footerActions = document.createElement("div");
  footerActions.className = "profile-actions-footer";

  if (isGameplay) {
    const statusMsg = document.createElement("div");
    statusMsg.className = "muted";
    statusMsg.style.width = "100%";
    statusMsg.style.textAlign = "center";
    statusMsg.innerHTML =
      "<em>Entity is active in story. Changes are managed by the AI.</em>";
    footerActions.appendChild(statusMsg);
  } else if (isEditing) {
    // [UPDATED] Grouped Actions for Pico.css
    const btnGroup = document.createElement("fieldset");
    btnGroup.setAttribute("role", "group");
    btnGroup.style.marginBottom = "0";
    btnGroup.style.width = "100%";

    // Revert
    if (blueprint) {
      const revertBtn = document.createElement("button");
      revertBtn.className = "secondary outline warning";
      revertBtn.textContent = "Revert";
      revertBtn.title = "Revert to Default";
      revertBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm("Reset this character? All changes will be lost.")) {
          const flatBp = { ...blueprint, ...(blueprint.sections || {}) };
          screen.querySelector('[data-edit-field="name"]').value = flatBp.name;
          screen.querySelector('[data-edit-field="description"]').value =
            flatBp.description;
          Object.keys(SECTION_DEFINITIONS).forEach((k) => {
            const el = screen.querySelector(`[data-edit-field="${k}"]`);
            if (el) el.value = flatBp[k] || "";
          });
          if (flatBp.profilePictureUrl) {
            imageInput.value = flatBp.profilePictureUrl;
            imageInput.dispatchEvent(new Event("input"));
          }
          screen
            .querySelectorAll("textarea")
            .forEach((t) => t.dispatchEvent(new Event("input")));
        }
      };
      btnGroup.appendChild(revertBtn);
    }

    // Delete
    if (id !== "new") {
      const delBtn = document.createElement("button");
      delBtn.className = "secondary outline danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = async (e) => {
        e.preventDefault();
        if (confirm("Delete this entity?")) {
          await entities.remove(type, id);
          if (_onUpdateSelection) {
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
    saveBtn.className = "primary";
    saveBtn.textContent = "Save";
    saveBtn.onclick = async (e) => {
      e.preventDefault();
      const nameVal = screen
        .querySelector('[data-edit-field="name"]')
        .value.trim();
      if (!nameVal) return alert("Name is required");

      const tagsInput = screen.querySelector('[data-edit-field="tags"]').value;
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const finalImageUrl = escapeHtml(
        imageInput.dataset.pendingUrl || imageInput.value.trim(),
      );

      // [FIX] Sync visuals.profilePictureUrl to prevent normalization revert
      if (localVisuals) {
        localVisuals.profilePictureUrl = finalImageUrl;
      }

      const data = {
        name: escapeHtml(nameVal),
        description: escapeHtml(
          screen.querySelector('[data-edit-field="description"]').value.trim(),
        ),
        profilePictureUrl: finalImageUrl,
        signatureColour: escapeHtml(paletteSelect.value.trim()),
        tags: tagsArray,
        // Persist the visual state (flipped, etc)
        visuals: localVisuals,
      };
      Object.keys(SECTION_DEFINITIONS).forEach((k) => {
        const el = screen.querySelector(`[data-edit-field="${k}"]`);
        if (el) data[k] = escapeHtml(el.value.trim());
      });

      if (state.settings.directorMode) {
        const dyn = {};
        ["entropy", "permeability", "velocity", "resonance"].forEach((k) => {
          const el = screen.querySelector(`[data-edit-dynamic="${k}"]`);
          if (el) dyn[k] = parseInt(el.value, 10) || 0;
        });
        data.dynamics = dyn;
        // Also persist dynamics to simulation if present (Fractals)
        if (entity.simulation) {
          // Fractals store dynamics in root usually, but simulation config
          // might be relevant. For now, root dynamics is enough.
        }
      }

      const saved = await entities.upsert(
        type,
        id === "new" || entity.isPremade ? data : { ...data, id },
      );

      if (activeSlotKey && _onUpdateSelection) {
        _onUpdateSelection({ [activeSlotKey]: saved });
      }

      // Notify Global State
      window.dispatchEvent(
        new CustomEvent("entity-visual-update", { detail: { id: saved.id } }),
      );

      if (id === "new") closeProfileModal();
      else {
        entity = await entities.get(type, saved.id);
        setEditMode(false);
      }
    };
    btnGroup.appendChild(saveBtn);

    footerActions.appendChild(btnGroup);
  } else {
    // View Mode
    if (entity.isPremade && !entity.originId) {
      const cloneBtn = document.createElement("button");
      cloneBtn.className = "primary";
      cloneBtn.textContent = "Clone";
      cloneBtn.onclick = async (e) => {
        e.preventDefault();
        const newEntity = await copyEntity(type, entity.id);
        if (newEntity) {
          window.ephemeralEntity = newEntity;
          openProfileModal(type, "new", activeSlotKey);
        }
      };
      footerActions.appendChild(cloneBtn);
    } else {
      const editBtn = document.createElement("button");
      editBtn.className = "secondary outline";
      editBtn.textContent = "Edit";
      editBtn.onclick = (e) => {
        e.preventDefault();
        setEditMode(true);
      };
      footerActions.appendChild(editBtn);
    }
  }

  layout.querySelector(".profile-right-content").appendChild(footerActions);
  screen.appendChild(layout);

  screen.onclick = (e) => {
    if (e.target === screen) closeProfileModal();
  };
  if (imageOverlay) imageOverlay.style.display = isEditing ? "flex" : "none";
}
