import { events, EVENTS } from "../../../core/events.js";
import { entities } from "../../../data/repo.js";
import { handleAsyncError } from "../../../core/utils.js";
import { renderProfileView } from "./view.js";
import { renderProfileEdit } from "./edit.js";

// CALLBACK: Router must inject this
let _onUpdateSelection = null;
export function setProfileCallbacks(callbacks) {
  if (callbacks.onUpdateSelection)
    _onUpdateSelection = callbacks.onUpdateSelection;
}

export function getOnUpdateSelection() {
  return _onUpdateSelection;
}

// Shared State (Local to this module)
let activeSlotKey = null;

export function getActiveSlotKey() {
  return activeSlotKey;
}

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
        base + (document.body.classList.contains("storymode") ? "#story" : ""),
      );
    }
  }
  document.body.classList.remove("profile-view-active");
  activeSlotKey = null;
}

export function openProfileModal(type, id, slotKey = null) {
  activeSlotKey = slotKey;
  renderProfilePage(type.toLowerCase(), id);
}

export async function refreshProfileIfOpen() {
  const screen = document.querySelector("#profile-screen");
  if (screen && screen.classList.contains("is-open") && activeSlotKey) {
    const hash = location.hash.replace("#", "");
    const parts = hash.split("/"); // profile/character/id
    if (parts[0] === "profile" && parts.length === 3) {
      await renderProfilePage(parts[1], parts[2]);
    }
  }
}

// Subscribe to background updates
events.addEventListener(EVENTS.DB_UPDATED, () => refreshProfileIfOpen());

// --- INITIALIZATION ---
// Bind backdrop click using delegation (handles early load / test envs)
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "profile-screen") {
    closeProfileModal();
  }
});

// Bind Escape key to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProfileModal();
  }
});

// --- ORCHESTRATOR ---
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
  const isGameplay = document.body.classList.contains("storymode");
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
    // If we have an ephemeral entity matching the ID, use it (preview mode)
    // Otherwise fetch from DB
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

  // Clear & Prepare Screen
  screen.textContent = "";
  screen.className = "profile-view";
  screen.classList.add("is-open");
  if (isFractal) screen.classList.add("profile-view--fractal");
  screen.classList.toggle("is-editing", isEditing);

  // Delegate to View or Edit Renderer
  if (isEditing) {
    await renderProfileEdit(screen, entity, type, id);
  } else {
    await renderProfileView(screen, entity, type, id, (editing) =>
      renderProfilePage(type, id, editing),
    );
  }
}
