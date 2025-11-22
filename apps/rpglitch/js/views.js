// apps/rpglitch/js/views.js
import { entities, getPictureHTML, getSignature, copyEntity } from "./entities.js";
import {
  hideEl, showEl, getHashQuery, navigateBackOrReturnDefault, escapeHtml,
  replaceEventHandler, handleAsyncError, goBackWithFallback, dismissLoadingUI,
  chin, log, error, unlockNow, setTopBarRight
} from "./utils.js";
import { isValidImageUrl, extractImageUrl } from "./validation.js";
import { initDrawer, openDrawer } from "./drawer.js";

let _refreshAllLists = null;
let _onSelectionChanged = null;

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
  const [section, type, id] = parseHash();
  chin.closeAll?.();

  if (section === "profile" && id) {
    if (!document.body.classList.contains("mode-gameplay") && !document.body.classList.contains("mode-storyboard")) {
      document.body.classList.add("mode-storyboard");
    }
    renderProfilePage(type, id);
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

export const router = {
  navigate(hash) { location.hash = hash; },
  parseHash,
  handleRoute,
};

// --- MODAL MANAGEMENT ---

function closeProfileModal() {
  const screen = document.querySelector("#profile-screen");
  if (screen) {
    screen.classList.remove("is-open");
    screen.setAttribute("hidden", "");
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

// --- PROFILE RENDERER ---

export async function renderProfilePage(type, id) {
  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  // Force Visible
  screen.removeAttribute("hidden");
  document.body.classList.add("profile-view-active");
  screen.classList.add("is-open");

  let isEditing = id === "new";
  let entity;

  if (id === "new") {
    entity = { kind: type, type: type, sections: {} };
    isEditing = true;
  } else {
    entity = await handleAsyncError(
      async () => await entities.get(type, id),
      { errorMessage: "Could not load profile.", fallback: null }
    );
  }

  if (!entity) { closeProfileModal(); return; }

  screen.textContent = "";
  screen.className = "profile-view";
  screen.classList.toggle("is-editing", isEditing);
  screen.classList.add("is-open");

  const template = document.querySelector("#tpl-profile-page");
  if (!template) return;
  const layout = template.content.firstElementChild.cloneNode(true);

  const heroWrap = layout.querySelector(".hero-wrap");
  if (getPictureHTML) {
    const heroPic = getPictureHTML(entity, { cover: true });
    if (heroPic) { heroPic.classList.add("hero-bleed"); heroWrap.appendChild(heroPic); }
  }

  const imageOverlay = layout.querySelector(".profile-hero-overlay");
  const imageInput = imageOverlay.querySelector('[data-profile-field="profilePictureUrl"]');
  const actionButton = imageOverlay.querySelector("button[data-action]");
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
  imageInput.addEventListener("input", updateButtonState);
  updateButtonState();

  actionButton.addEventListener("click", () => {
    const action = actionButton.dataset.action;
    if (action === "upload") layout.querySelector('[data-profile-field="fileInput"]').click();
  });

  paletteSelect.addEventListener("change", () => {
    const newPic = getPictureHTML({ ...entity, signatureColour: paletteSelect.value, profilePictureUrl: imageInput.value.trim() }, { cover: true });
    const curPic = heroWrap.querySelector(".picture");
    if (curPic && newPic) { newPic.classList.add("hero-bleed"); curPic.replaceWith(newPic); }
  });

  // --- HEADER (Custom) ---
  const headerWrap = form.querySelector("[data-profile-header]");
  headerWrap.innerHTML = "";

  if (isEditing) {
    const nameInput = document.createElement("input");
    nameInput.type = "text"; nameInput.className = "profile-name-input";
    nameInput.dataset.editField = "name"; nameInput.value = entity.name || "";
    nameInput.placeholder = "Name";
    headerWrap.appendChild(nameInput);

    const descInput = document.createElement("textarea");
    descInput.className = "profile-desc-input";
    descInput.dataset.editField = "description";
    descInput.value = entity.description || "";
    descInput.placeholder = "Short description...";
    headerWrap.appendChild(descInput);
  } else {
    const nameDisplay = document.createElement("h1");
    nameDisplay.className = "profile-name-display";
    nameDisplay.style.color = entity.signatureColour ? `var(--signature-${entity.signatureColour})` : "#fff";
    nameDisplay.textContent = entity.name || "Unknown";
    headerWrap.appendChild(nameDisplay);

    const descDisplay = document.createElement("p");
    descDisplay.className = "profile-desc-display";
    descDisplay.textContent = entity.description || "";
    headerWrap.appendChild(descDisplay);
  }

  // --- SECTIONS ---
  const sections = { forever: "Forever", past: "Past", present: "Present", future: "Future" };
  const createRow = (label, value, id) => {
    const div = document.createElement("div"); div.className = "field-row";
    div.innerHTML = `<div class="field-label"><label>${label}</label></div><div class="field-input"><div data-read class="profile-field-text-read">${value || ""}</div></div>`;
    if (isEditing) {
      const input = document.createElement("textarea");
      input.value = value || ""; input.dataset.editField = id;
      div.querySelector(".field-input").appendChild(input);
      div.querySelector("[data-read]").style.display = "none";
    }
    return div;
  };
  Object.entries(sections).forEach(([key, label]) => secWrap.appendChild(createRow(label, entity[key], key)));

  screen.appendChild(layout);

  // --- ACTIONS ---
  const setEditMode = (editing) => {
    isEditing = editing;
    screen.classList.toggle("is-editing", editing);
    setTopBarRight(editing ? "form" : "profile");
    if (imageOverlay) imageOverlay.style.display = editing ? "flex" : "none";
    renderProfilePage(type, id);
  };

  const editBtn = document.querySelector("#profile-edit");
  if (editBtn) {
    editBtn.hidden = entity.isPremade || id === "new";
    replaceEventHandler(editBtn, "click", () => setEditMode(true), "_editHandler");
  }

  const backBtn = document.querySelector("#profile-back");
  if (backBtn) replaceEventHandler(backBtn, "click", () => closeProfileModal(), "_backHandler");

  const saveBtn = document.querySelector("#form-save");
  if (saveBtn) {
    replaceEventHandler(saveBtn, "click", async () => {
      const nameVal = screen.querySelector('[data-edit-field="name"]').value.trim();
      if (!nameVal) return alert("Name is required");
      const data = {
        name: escapeHtml(nameVal),
        description: escapeHtml(screen.querySelector('[data-edit-field="description"]').value.trim()),
        profilePictureUrl: escapeHtml(imageInput.value.trim()),
        signatureColour: escapeHtml(paletteSelect.value.trim()),
        tags: entity.tags || []
      };
      Object.keys(sections).forEach(k => { data[k] = escapeHtml(screen.querySelector(`[data-edit-field="${k}"]`).value.trim()); });

      await entities.upsert(type, id === "new" || entity.isPremade ? data : { ...data, id });
      if (id === "new") closeProfileModal();
      else { entity = await entities.get(type, id); setEditMode(false); renderProfilePage(type, id); }
    }, "_saveHandler");
  }

  screen.onclick = (e) => { if (e.target === screen) closeProfileModal(); };
  if (imageOverlay) imageOverlay.style.display = isEditing ? "flex" : "none";
}

// ============================================================================
// SELECTION LOGIC
// ============================================================================

export async function initViews(deps = {}) {
  _refreshAllLists = deps.refreshAllLists;
  _onSelectionChanged = deps.onSelectionChanged;

  initDrawer();

  bindDrawerTrigger("#btn-select-ai", "character", "#ai-character-preview", "aiCharacter");
  bindDrawerTrigger("#btn-select-user", "character", "#user-character-preview", "userCharacter");
  bindDrawerTrigger("#btn-select-world", "world", "#world-preview", "world");

  bindPortraitClick("#gameplay-ai-portrait", "aiCharacter");
  bindPortraitClick("#gameplay-user-portrait", "userCharacter");
}

function bindDrawerTrigger(buttonId, entityType, previewId, stateKey) {
  const button = document.querySelector(buttonId);
  if (!button) return;
  const cardContainer = button.closest('.entity-card');

  button.addEventListener("click", () => {
    openDrawerFor(entityType, stateKey, previewId, button, cardContainer);
  });
}

function bindPortraitClick(selector, stateKey) {
  const el = document.querySelector(selector);
  if (el) {
    el.addEventListener("click", () => {
      const entity = selectedEntities[stateKey];
      if (entity) openProfileModal(entity.type.toLowerCase(), entity.id);
    });
    el.style.cursor = "pointer";
  }
}

function openDrawerFor(entityType, stateKey, previewId, button, triggerElement) {
  openDrawer(entityType, async (entityId) => {
    try {
      const entity = await entities.get(entityType, entityId);
      selectedEntities[stateKey] = entity;
      renderEntityPreview(previewId, entity, button, entityType);
      button.hidden = true;
      if (_onSelectionChanged) _onSelectionChanged(selectedEntities);
    } catch (err) {
      error("Selection failed:", err);
    }
  }, triggerElement);
}

function renderEntityPreview(previewId, entity, slotButton, fallbackType) {
  const previewEl = document.querySelector(previewId);
  if (!previewEl) return;

  if (entity) {
    previewEl.innerHTML = "";
    previewEl.className = "entity-preview card-filled";

    if (entity.signatureColour) {
      previewEl.style.setProperty("--signature", `var(--signature-${entity.signatureColour})`);
      previewEl.dataset.signature = entity.signatureColour;
    }

    const media = document.createElement("div");
    media.className = "card-media";
    media.title = "View Profile";
    media.appendChild(getPictureHTML(entity, { cover: true }));

    media.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = (fallbackType || entity.type || "character").toLowerCase();
      openProfileModal(type, entity.id);
    });

    const body = document.createElement("div");
    body.className = "card-body";
    body.title = "Change Selection";
    body.innerHTML = `<h4>${entity.name}</h4><p class="muted">${entity.description || ""}</p>`;

    body.addEventListener("click", (e) => {
      e.stopPropagation();
      if (slotButton) slotButton.click();
    });

    previewEl.appendChild(media);
    previewEl.appendChild(body);

    previewEl.removeAttribute("hidden");
    previewEl.style.display = "flex";
    previewEl.style.pointerEvents = "auto";
  } else {
    previewEl.setAttribute("hidden", "");
  }
}

export function renderMessage() { }