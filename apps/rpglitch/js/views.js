// apps/rpglitch/js/views.js
import { entities, getPictureHTML, getSignature, copyEntity } from "./entities.js";
import {
  escapeHtml,
  handleAsyncError, dismissLoadingUI,
  chin, error, setTopBarRight,
  renderTags
} from "./utils.js";
import { isValidImageUrl, extractImageUrl, sanitizeHtml } from "./validation.js";
import { initDrawer, openDrawer } from "./drawer.js";

let _refreshAllLists = null;
let _onSelectionChanged = null; // The function set by storyboard-controller

const selectedEntities = {
  aiCharacter: null,
  userCharacter: null,
  world: null,
};

// --- CORE ROUTING ---
function showStoryboard() {
  document.body.classList.remove("profile-view-active");
  document.body.classList.remove("mode-gameplay");
  document.body.classList.add("mode-storyboard");
  closeProfileModal();
}

function showStoryScreen() {
  document.body.classList.remove("profile-view-active");
  document.body.classList.remove("mode-storyboard");
  document.body.classList.add("mode-gameplay");
  closeProfileModal();
}

function parseHash() {
  const [path] = location.hash.slice(1).split("?");
  return path.split("/").filter(Boolean);
}

function handleRoute() {
  try { dismissLoadingUI?.(); } catch (e) { void e; }
  const [section, type, id] = parseHash();
  const isType = (t) => t === "character" || t === "world";
  chin.closeAll?.();

  if (section === "profile" && isType(type) && id) {
    if (!document.body.classList.contains("mode-gameplay") && !document.body.classList.contains("mode-storyboard")) {
      document.body.classList.add("mode-storyboard");
    }
    renderProfilePage(type, id);
    try { chin.closeAll?.(); dismissLoadingUI?.(); } catch (e) { void e; }
  } else if (section === "story") {
    showStoryScreen();
  } else {
    showStoryboard();
  }
}

window.addEventListener("hashchange", handleRoute);
document.addEventListener("DOMContentLoaded", () => {
  handleRoute();
  document.querySelectorAll("button[data-chin]").forEach((btn) => btn.classList.add("chin-button"));
  document.querySelectorAll('form[role="search"]').forEach((form) => {
    form.addEventListener("submit", (e) => e.preventDefault());
  });
}, { once: true }
);

export const router = { navigate(hash) { location.hash = hash; }, parseHash, handleRoute };

// --- SHARED UI HELPERS ---

export function updatePortraits(aiCharacter, userCharacter) {
  const setPort = (id, ent, label) => {
    const container = document.querySelector(id);
    if (!container) return;

    const imgDiv = container.querySelector(".portrait-image");
    const nameDiv = container.querySelector(".portrait-name");

    if (imgDiv) {
      imgDiv.innerHTML = "";
      if (ent) {
        // Determine if the entity is a world to apply landscape aspect ratio
        const isWorld = ent.type === 'world';
        const picture = getPictureHTML(ent, { cover: true, landscape: isWorld });
        if (picture) imgDiv.appendChild(picture);
      }
    }
    if (nameDiv) nameDiv.textContent = ent?.name || label;
  };
  setPort("#gameplay-ai-portrait", aiCharacter, "AI");
  setPort("#gameplay-user-portrait", userCharacter, "You");
}

export function updateStoryboardSelection(newSelection) {
  const updateSlot = (key, entity, btnId, previewId, type) => {
    if (entity) {
      selectedEntities[key] = entity;
      const btn = document.querySelector(btnId);

      const onEdit = () => {
        const container = btn ? btn.closest('.entity-card') : null;
        openDrawerFor(type, key, previewId, btn, container);
      };

      // Ensure isWorld boolean is calculated here for the preview to render correctly
      const isWorld = type === 'world';
      renderEntityPreview(previewId, entity, btn, type, onEdit, isWorld);

      if (btn) btn.hidden = true;
    }
  };

  updateSlot("aiCharacter", newSelection.aiCharacter, "#btn-select-ai", "#ai-character-preview", "character");
  updateSlot("userCharacter", newSelection.userCharacter, "#btn-select-user", "#user-character-preview", "character");
  updateSlot("world", newSelection.world, "#btn-select-world", "#world-preview", "world");

  if (_onSelectionChanged) _onSelectionChanged(selectedEntities);
}

// --- RENDER MESSAGE (Chat Bubbles) ---
// UPDATED: Added signatureColour to the function signature
export function renderMessage(container, role, text, characterName, signatureColour, type) {
  const div = document.createElement("div");

  // 1. Determine base class and role class (user/ai/narrator)
  const roleClass = (role === "user" || role === "ai") ? role : "narrator";
  let classList = ["story-message", roleClass];

  // 2. Add signature color class
  if (signatureColour && signatureColour !== "default") {
    classList.push(`signature-${signatureColour}`);
  }

  div.className = classList.join(" ");
  div.setAttribute("role", "log-item");
  div.setAttribute("data-type", type || "IC");

  if (characterName) {
    div.setAttribute("data-character-name", characterName);
  }

  // 3. Construct and sanitize content, including the speaker name prefix
  let contentHtml = sanitizeHtml(text); // Sanitize the message content first

  // Prepend speaker name if available and it's not a generic narrator role
  if (characterName && roleClass !== "narrator") {
    const safeName = sanitizeHtml(characterName);
    // Combine the sanitized name prefix with the sanitized message body
    contentHtml = `<span class="narrator-prefix">${safeName}:</span> ${contentHtml}`;
  } else if (roleClass === "narrator" && characterName) {
    // For system messages that include a dedicated name (e.g., 'Narrator:')
    const safeName = sanitizeHtml(characterName);
    contentHtml = `<span class="narrator-prefix">${safeName}:</span> ${contentHtml}`;
  }

  // Use innerHTML to insert the content, including the narrator-prefix span
  // MANDATE: Using sanitizeHtml on the text ensures security, but we must use innerHTML to insert the span.
  div.innerHTML = contentHtml;
  container.appendChild(div);
}

// --- CONSTANTS ---
const SECTION_DEFINITIONS = {
  forever: {
    label: "Forever",
    sublabels: { character: "Core Identity & Permanent Features", world: "Eternal Truths & Laws of Nature" },
  },
  past: {
    label: "Past",
    sublabels: { character: "Background & Memories", world: "History & Ancient Lore" },
  },
  present: {
    label: "Present",
    sublabels: { character: "Mood & Conditions", world: "State of the World & Current Situation" },
  },
  future: {
    label: "Future",
    sublabels: { character: "Goals & Prophecies", world: "Impending Events & Prophecies" },
  },
};

// --- MODAL MANAGEMENT ---

function closeProfileModal() {
  const screen = document.querySelector("#profile-screen");
  if (screen) {
    screen.classList.remove("is-open");
    screen.setAttribute("hidden", "");
    screen.classList.remove("profile-view--world"); // Cleanup context class
    if (location.hash.includes("#profile")) {
      const base = location.pathname + location.search;
      history.replaceState("", document.title, base + (document.body.classList.contains("mode-gameplay") ? "#story" : ""));
    }
  }
  document.body.classList.remove("profile-view-active");
}

function openProfileModal(type, id) {
  renderProfilePage(type.toLowerCase(), id);
}

// --- AUTO-RESIZE HELPER ---
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// --- PROFILE RENDERER ---

export async function renderProfilePage(type, id) {
  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  screen.removeAttribute("hidden");
  document.body.classList.add("profile-view-active");
  screen.classList.add("is-open");

  // Determine if this is a World entity to apply landscape logic
  const isWorld = type === 'world';

  // Apply context class for CSS styling (wider layout)
  if (isWorld) {
    screen.classList.add("profile-view--world");
  } else {
    screen.classList.remove("profile-view--world");
  }

  let isEditing = id === "new";
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
    entity = await handleAsyncError(
      async () => await entities.get(type, id),
      { errorMessage: "Could not load profile.", context: "load profile", fallback: null }
    );
  }

  if (!entity) { closeProfileModal(); return; }

  screen.textContent = "";
  screen.className = "profile-view"; // Reset classes
  screen.classList.add("is-open");
  if (isWorld) screen.classList.add("profile-view--world"); // Re-add context
  screen.classList.toggle("is-editing", isEditing);

  const template = document.querySelector("#tpl-profile-page");
  if (!template) return;
  const layout = template.content.firstElementChild.cloneNode(true);

  const heroWrap = layout.querySelector(".hero-wrap");
  if (getPictureHTML) {
    // Pass landscape option to getPictureHTML
    const heroPic = getPictureHTML(entity, { cover: true, landscape: isWorld });
    if (heroPic) { heroPic.classList.add("hero-bleed"); heroWrap.appendChild(heroPic); }
  }

  const imageOverlay = layout.querySelector(".profile-hero-overlay");
  const imageInput = imageOverlay.querySelector('[data-profile-field="profilePictureUrl"]');
  const actionButton = imageOverlay.querySelector("button[data-action]");
  const fileInput = imageOverlay.querySelector('[data-profile-field="fileInput"]');
  const paletteSelect = imageOverlay.querySelector('select[name="signatureColour"]');
  const form = layout.querySelector("form");
  const secWrap = form.querySelector("[data-profile-sections]");

  if (imageInput) { imageInput.disabled = false; imageInput.removeAttribute("aria-busy"); }
  if (actionButton) { actionButton.disabled = false; actionButton.removeAttribute("aria-busy"); }

  function updateButtonState() {
    const val = imageInput.value.trim();
    if (val === "") { actionButton.textContent = "Upload"; actionButton.dataset.action = "upload"; }
    else if (val && !isValidImageUrl(val, true)) { actionButton.textContent = "Generate"; actionButton.dataset.action = "generate"; }
    else { actionButton.textContent = "Use URL"; actionButton.dataset.action = "use-url"; }
  }

  imageInput.addEventListener("input", () => {
    updateButtonState();
    const val = imageInput.value.trim();
    if (val && isValidImageUrl(val, true)) {
      const safeVal = sanitizeHtml(val);
      const newPic = getPictureHTML({ ...entity, profilePictureUrl: safeVal }, { cover: true, landscape: isWorld });
      const curPic = heroWrap.querySelector(".picture");
      if (newPic) {
        newPic.classList.add("hero-bleed");
        if (curPic) curPic.replaceWith(newPic);
        else heroWrap.appendChild(newPic);
      }
    }
  });
  updateButtonState();

  actionButton.addEventListener("click", async () => {
    const action = actionButton.dataset.action;
    if (action === "generate") {
      try {
        actionButton.setAttribute("aria-busy", "true");
        actionButton.textContent = "Generating...";
        const prompt = imageInput.value.trim();

        // Logic Fork: Landscape for Worlds, Portrait for others
        const resolution = isWorld ? "768x512" : "512x768";

        const res = await window.textToImage({ prompt, resolution: resolution });
        const url = typeof res === 'string' ? res : extractImageUrl(res);
        if (url) {
          imageInput.value = url;
          imageInput.dispatchEvent(new Event('input'));
        }
      } catch (e) { error(e); }
      finally { actionButton.removeAttribute("aria-busy"); updateButtonState(); }
    } else if (action === "upload") {
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !window.upload) return;
    try {
      actionButton.setAttribute("aria-busy", "true");
      actionButton.textContent = "Uploading...";
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise(r => reader.onload = r);
      const res = await window.upload(reader.result);
      const url = typeof res === 'string' ? res : extractImageUrl(res);
      if (url) {
        imageInput.value = url;
        imageInput.dispatchEvent(new Event('input'));
      }
    } catch (err) { error(err); }
    finally { actionButton.removeAttribute("aria-busy"); updateButtonState(); fileInput.value = null; }
  });

  const currentColor = entity.signatureColour || "default";
  Array.from(paletteSelect.options).forEach(opt => { opt.selected = opt.value === currentColor; });

  paletteSelect.addEventListener("change", () => {
    const newColor = paletteSelect.value;
    const newPic = getPictureHTML({ ...entity, signatureColour: newColor, profilePictureUrl: imageInput.value.trim() }, { cover: true, landscape: isWorld });
    const curPic = heroWrap.querySelector(".picture");
    if (curPic && newPic) { newPic.classList.add("hero-bleed"); curPic.replaceWith(newPic); }

    const nameInput = form.querySelector('.profile-name-input');
    const nameDisplay = form.querySelector('.profile-name-display');
    const colorStyle = getSignature ? getSignature({ ...entity, signatureColour: newColor }) : "white";
    if (nameInput) nameInput.style.color = colorStyle;
    if (nameDisplay) nameDisplay.style.color = colorStyle;
  });

  // --- HEADER ---
  const headerWrap = form.querySelector("[data-profile-header]");
  headerWrap.innerHTML = "";

  if (isEditing) {
    const nameInput = document.createElement("textarea");
    nameInput.className = "profile-name-input";
    nameInput.dataset.editField = "name";
    nameInput.value = entity.name || "";
    nameInput.placeholder = "Name";
    nameInput.rows = 1;
    nameInput.style.color = getSignature(entity);
    nameInput.addEventListener('input', () => autoResize(nameInput));
    headerWrap.appendChild(nameInput);
    setTimeout(() => autoResize(nameInput), 0);

    const descInput = document.createElement("textarea");
    descInput.className = "profile-desc-input";
    descInput.dataset.editField = "description";
    descInput.value = entity.description || "";
    descInput.placeholder = "Short description...";
    descInput.rows = 1;
    descInput.addEventListener('input', () => autoResize(descInput));
    headerWrap.appendChild(descInput);
    setTimeout(() => autoResize(descInput), 0);
  } else {
    const nameDisplay = document.createElement("h1");
    nameDisplay.className = "profile-name-display";
    nameDisplay.style.color = getSignature(entity);
    nameDisplay.textContent = entity.name || "Unknown";
    headerWrap.appendChild(nameDisplay);

    const descDisplay = document.createElement("p");
    descDisplay.className = "profile-desc-display";
    descDisplay.textContent = entity.description || "";
    headerWrap.appendChild(descDisplay);
  }

  // --- TAGS (TEMPORARILY HIDDEN) ---
  const tagsRow = document.createElement("div");
  tagsRow.className = "field-row";

  if (isEditing) {
    tagsRow.innerHTML = `
      <div class="field-label"><label>Tags</label><small class="muted">Comma separated</small></div>
      <div class="field-input">
        <textarea data-edit-field="tags" rows="1" placeholder="e.g. warrior, magic, dark">${(entity.tags || []).join(", ")}</textarea>
      </div>`;
    const tagInput = tagsRow.querySelector("textarea");
    tagInput.addEventListener('input', () => autoResize(tagInput));
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

  // HIDE: Hide the entire tags row until the feature is finalized
  tagsRow.hidden = true;

  headerWrap.after(tagsRow);

  // --- SECTIONS LOOP ---
  const createRow = (key, def) => {
    const div = document.createElement("div"); div.className = "field-row";
    const sublabel = def.sublabels[type] || "";

    div.innerHTML = `
        <div class="field-label">
            <label>${def.label}</label>
            ${sublabel ? `<small class="muted">${sublabel}</small>` : ''}
        </div>
        <div class="field-input">
            <div data-read class="profile-field-text-read">${escapeHtml(entity[key] || "")}</div>
        </div>`;

    if (isEditing) {
      const input = document.createElement("textarea");
      input.value = entity[key] || "";
      input.dataset.editField = key;
      input.rows = 1;
      input.addEventListener('input', () => autoResize(input));
      div.querySelector(".field-input").appendChild(input);
      div.querySelector("[data-read]").style.display = "none";
      setTimeout(() => autoResize(input), 0);
    }
    return div;
  };

  Object.entries(SECTION_DEFINITIONS).forEach(([key, def]) => {
    secWrap.appendChild(createRow(key, def));
  });

  screen.appendChild(layout);

  // --- ACTIONS ---
  const footerActions = document.createElement("div");
  footerActions.className = "profile-actions-footer";

  const setEditMode = (editing) => {
    isEditing = editing;
    screen.classList.toggle("is-editing", editing);
    setTopBarRight(editing ? "form" : "profile");
    if (imageOverlay) imageOverlay.style.display = editing ? "flex" : "none";
    renderProfilePage(type, id);
  };

  if (isEditing) {
    // SAVE
    const saveBtn = document.createElement("button");
    saveBtn.className = "primary"; saveBtn.textContent = "Save";
    saveBtn.onclick = async (e) => {
      e.preventDefault();
      const nameVal = screen.querySelector('[data-edit-field="name"]').value.trim();
      if (!nameVal) return alert("Name is required");

      const tagsInput = screen.querySelector('[data-edit-field="tags"]').value;
      const tagsArray = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

      const data = {
        name: escapeHtml(nameVal),
        description: escapeHtml(screen.querySelector('[data-edit-field="description"]').value.trim()),
        profilePictureUrl: escapeHtml(imageInput.value.trim()),
        signatureColour: escapeHtml(paletteSelect.value.trim()),
        tags: tagsArray
      };
      Object.keys(SECTION_DEFINITIONS).forEach(k => {
        const el = screen.querySelector(`[data-edit-field="${k}"]`);
        if (el) data[k] = escapeHtml(el.value.trim());
      });

      await entities.upsert(type, id === "new" || entity.isPremade ? data : { ...data, id });
      if (id === "new") closeProfileModal();
      else { entity = await entities.get(type, id); setEditMode(false); }
    };

    // DELETE
    if (!entity.isPremade && id !== "new") {
      const delBtn = document.createElement("button");
      delBtn.className = "secondary outline danger"; delBtn.textContent = "Delete";
      delBtn.onclick = async (e) => {
        e.preventDefault();
        if (confirm("Delete this entity?")) { await entities.remove(type, id); closeProfileModal(); if (_refreshAllLists) _refreshAllLists(); }
      };
      footerActions.appendChild(delBtn);
    }
    footerActions.appendChild(saveBtn);

  } else {
    // EDIT / CLONE
    const actionBtn = document.createElement("button");
    if (entity.isPremade) {
      actionBtn.className = "primary"; actionBtn.textContent = "Clone";
      actionBtn.onclick = async (e) => {
        e.preventDefault();
        const newEntity = await copyEntity(type, entity.id);
        if (newEntity) { window.ephemeralEntity = newEntity; openProfileModal(type, "new"); }
      };
    } else {
      actionBtn.className = "secondary outline"; actionBtn.textContent = "Edit";
      actionBtn.onclick = (e) => { e.preventDefault(); setEditMode(true); };
    }
    footerActions.appendChild(actionBtn);
  }

  layout.querySelector(".profile-right-content").appendChild(footerActions);
  screen.onclick = (e) => { if (e.target === screen) closeProfileModal(); };
  if (imageOverlay) imageOverlay.style.display = isEditing ? "flex" : "none";
}

// --- INITIALIZATION ---

export async function initViews(deps = {}) {
  _refreshAllLists = deps.refreshAllLists;

  // NEW: Store the onSelectionChanged setter from the dependencies
  if (deps.onSelectionChanged) {
    _onSelectionChanged = deps.onSelectionChanged;
  } else {
    // Create a setter function to be used by initStoryboardStage
    initViews.setOnSelectionChanged = (handler) => {
      _onSelectionChanged = handler;
    };
  }

  initDrawer();

  bindDrawerTrigger("#btn-select-ai", "character", "#ai-character-preview", "aiCharacter");
  bindDrawerTrigger("#btn-select-user", "character", "#user-character-preview", "userCharacter");
  bindDrawerTrigger("#btn-select-world", "world", "#world-preview", "world");

  bindPortraitClick("#gameplay-ai-portrait", "aiCharacter");
  bindPortraitClick("#gameplay-user-portrait", "userCharacter");

  // Return the necessary setters/helpers for the App object
  return {
    setOnSelectionChanged: (handler) => { _onSelectionChanged = handler; },
    updateStoryboardSelection, // Export update function for external use (e.g. shuffle)
    renderProfilePage // Export for external use
  };
}

function bindDrawerTrigger(buttonId, entityType, previewId, stateKey) {
  const button = document.querySelector(buttonId);
  if (!button) return;
  const cardContainer = button.closest('.entity-card');

  button.addEventListener("click", () => openDrawerFor(entityType, stateKey, previewId, button, cardContainer));
}

function bindPortraitClick(selector, stateKey) {
  const el = document.querySelector(selector);
  if (el) el.addEventListener("click", () => {
    const entity = selectedEntities[stateKey];
    if (entity) openProfileModal(entity.type.toLowerCase(), entity.id);
  });
}

function openDrawerFor(entityType, stateKey, previewId, button, triggerElement) {
  openDrawer(entityType, async (entityId) => {
    try {
      const entity = await entities.get(entityType, entityId);
      selectedEntities[stateKey] = entity;

      const onEdit = () => {
        const container = button ? button.closest('.entity-card') : null;
        openDrawerFor(entityType, stateKey, previewId, button, container);
      };

      // Pass landscape option here too, to show preview card correctly if desired
      const isWorld = entityType === 'world';
      renderEntityPreview(previewId, entity, button, entityType, onEdit, isWorld);

      button.hidden = true;
      if (_onSelectionChanged) _onSelectionChanged(selectedEntities);
    } catch (err) {
      error("Selection failed:", err);
    }
  }, triggerElement);
}

function renderEntityPreview(previewId, entity, slotButton, type, onEdit, isWorld = false) {
  const previewEl = document.querySelector(previewId);
  if (!previewEl) return;

  if (entity) {
    previewEl.innerHTML = "";
    previewEl.className = "entity-preview card-filled";
    if (entity.signatureColour) previewEl.style.setProperty("--signature", `var(--signature-${entity.signatureColour})`);

    const media = document.createElement("div");
    media.className = "card-media";
    media.title = "View Profile";
    // Pass landscape option
    media.appendChild(getPictureHTML(entity, { cover: true, landscape: isWorld }));
    media.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      openProfileModal(type, entity.id);
    });

    const body = document.createElement("div");
    body.className = "card-body";
    body.title = "Change Selection";
    body.innerHTML = `<h4>${entity.name}</h4><p class="muted">${entity.description || ""}</p>`;

    body.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (onEdit) {
        onEdit();
      } else if (slotButton) {
        slotButton.click();
      }
    });

    previewEl.appendChild(media);
    previewEl.appendChild(body);
    previewEl.removeAttribute("hidden");
    previewEl.style.display = "flex";
    previewEl.style.pointerEvents = "auto";
  } else {
    previewEl.setAttribute("hidden", "");
    if (slotButton) slotButton.hidden = false;
  }
}