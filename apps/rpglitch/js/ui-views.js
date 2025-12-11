import { initDrawer, closeDrawer } from "./drawer.js";
import {
  setGameplayEntities,
  updatePortraits,
  setSendLock,
} from "./ui-render-chat.js";
import { setAppBackground } from "./core-utils.js";
import {
  updateLocalSelection,
  bindDrawerTrigger,
  bindPortraitClick,
  renderEntityPreview,
  openDrawerFor,
  setChinCallbacks,
} from "./ui-chin.js";
import {
  renderProfilePage,
  closeProfileModal,
  setProfileCallbacks,
} from "./ui-profile.js";

// Shared Selection State (The Source of Truth)
const selectedEntities = {
  aiCharacter: null,
  userCharacter: null,
  world: null,
};

let _onSelectionChanged = null;

export { setGameplayEntities, updatePortraits, setSendLock, router };

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
  try {
  } catch (e) {
    void e;
  }
  const [section, entityType, id] = parseHash();
  const isType = (t) => t === "character" || t === "fractal";

  closeDrawer();

  // [AIRLOCK] Lock user in story if gameplay is active
  const isGameplayActive = document.body.classList.contains("mode-gameplay");
  if (isGameplayActive) {
    if (section !== "story" && section !== "profile") {
      console.warn("🚫 Access Denied: Story in progress.");
      location.hash = "#story";
      return;
    }
  }

  if (section === "profile" && isType(entityType) && id) {
    if (
      !document.body.classList.contains("mode-gameplay") &&
      !document.body.classList.contains("mode-storyboard")
    ) {
      document.body.classList.add("mode-storyboard");
    }
    renderProfilePage(entityType, id);
    try {
      closeDrawer();
    } catch (e) {
      void e;
    }
  } else if (section === "story") {
    showStoryScreen();
  } else {
    showStoryboard();
  }
}

window.addEventListener("hashchange", handleRoute);
document.addEventListener(
  "DOMContentLoaded",
  () => {
    handleRoute();
    document
      .querySelectorAll("button[data-chin]")
      .forEach((btn) => btn.classList.add("entity-drawer-button"));
    document.querySelectorAll('form[role="search"]').forEach((form) => {
      form.addEventListener("submit", (e) => e.preventDefault());
    });
  },
  { once: true },
);

const router = {
  navigate(hash) {
    location.hash = hash;
  },
  parseHash,
  handleRoute,
};

export function updateStoryboardSelection(newSelection) {
  // Update Source of Truth
  if (newSelection.aiCharacter !== undefined)
    selectedEntities.aiCharacter = newSelection.aiCharacter;
  if (newSelection.userCharacter !== undefined)
    selectedEntities.userCharacter = newSelection.userCharacter;
  if (newSelection.world !== undefined) {
    selectedEntities.world = newSelection.world;
    // [NEW] Update Background Theme
    setAppBackground(selectedEntities.world?.signatureColour);
  }

  // Propagate to Chin Module
  updateLocalSelection(selectedEntities);

  // Render Updates
  const updateSlot = (key, entity, btnId, previewId, type) => {
    if (entity) {
      const btn = document.querySelector(btnId);
      const onEdit = () => {
        const container = btn ? btn.closest(".entity-card") : null;
        openDrawerFor(type, key, previewId, btn, container);
      };

      const isFractal = type === "fractal";
      renderEntityPreview(previewId, entity, btn, type, onEdit, isFractal, key);

      if (btn) btn.hidden = true;
    } else {
      const btn = document.querySelector(btnId);
      const previewEl = document.querySelector(previewId);
      if (previewEl) previewEl.setAttribute("hidden", "");
      if (btn) btn.hidden = false;
    }
  };

  updateSlot(
    "aiCharacter",
    selectedEntities.aiCharacter,
    "#btn-select-ai",
    "#ai-character-preview",
    "character",
  );
  updateSlot(
    "userCharacter",
    selectedEntities.userCharacter,
    "#btn-select-user",
    "#user-character-preview",
    "character",
  );
  updateSlot(
    "world",
    selectedEntities.world,
    "#btn-select-fractal",
    "#fractal-preview",
    "fractal",
  );

  if (_onSelectionChanged) _onSelectionChanged(selectedEntities);
}

// --- INITIALIZATION ---
export async function initViews(deps = {}) {
  if (deps.onSelectionChanged) {
    _onSelectionChanged = deps.onSelectionChanged;
  } else {
    initViews.setOnSelectionChanged = (handler) => {
      _onSelectionChanged = handler;
    };
  }

  initDrawer();

  bindDrawerTrigger(
    "#btn-select-ai",
    "character",
    "#ai-character-preview",
    "aiCharacter",
  );
  bindDrawerTrigger(
    "#btn-select-user",
    "character",
    "#user-character-preview",
    "userCharacter",
  );
  bindDrawerTrigger(
    "#btn-select-fractal",
    "fractal",
    "#fractal-preview",
    "world",
  );

  bindPortraitClick("#gameplay-ai-portrait", "aiCharacter");
  bindPortraitClick("#gameplay-user-portrait", "userCharacter");

  // Wire up callbacks to break circular dependencies
  setChinCallbacks({ onUpdateSelection: updateStoryboardSelection });
  setProfileCallbacks({ onUpdateSelection: updateStoryboardSelection });

  // Initial Sync
  updateLocalSelection(selectedEntities);

  return {
    setOnSelectionChanged: (handler) => {
      _onSelectionChanged = handler;
    },
    updateStoryboardSelection,
    renderProfilePage,
  };
}
