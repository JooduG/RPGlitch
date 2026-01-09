import { events, EVENTS } from "../../../core/events.js";
import { entities } from "../../../data/repo.js";
import { handleAsyncError } from "../../../core/utils.js";
import { renderProfileView } from "./view.js";
import { renderProfileEdit } from "./edit.js";
import { state } from "../../../core/state.js";
import { VisualManager } from "../../services/visuals.js";
import { ContextBuilder } from "../../../engine/prompter.js";
import { LlmService } from "../../../services/llm-service.js";

// CALLBACK: Router must inject this
let _onUpdateSelection = null;
export const setProfileCallbacks = (callbacks) => {
  if (callbacks.onUpdateSelection)
    _onUpdateSelection = callbacks.onUpdateSelection;
};

export const getOnUpdateSelection = () => _onUpdateSelection;

// Shared State (Local to this module)
let activeSlotKey = null;

export const getActiveSlotKey = () => activeSlotKey;

// --- MODAL MANAGEMENT ---
export const closeProfileModal = () => {
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
};

export const openProfileModal = (type, id, slotKey = null) => {
  activeSlotKey = slotKey;
  renderProfilePage(type.toLowerCase(), id);
};

export const refreshProfileIfOpen = async () => {
  const screen = document.querySelector("#profile-screen");
  if (screen && screen.classList.contains("is-open") && activeSlotKey) {
    const hash = location.hash.replace("#", "");
    const parts = hash.split("/"); // profile/character/id
    if (parts[0] === "profile" && parts.length === 3) {
      await renderProfilePage(parts[1], parts[2]);
    }
  }
};

// Subscribe to background updates
events.addEventListener(EVENTS.DB_UPDATED, (data) => {
  if (data?.detail?.source === "profile-view") return;
  refreshProfileIfOpen();
});

// --- INITIALIZATION ---
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "profile-screen") {
    closeProfileModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProfileModal();
  }
});

// --- ORCHESTRATOR ---
export const renderProfilePage = async (type, id, forceEditMode = false) => {
  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  screen.removeAttribute("hidden");
  document.body.classList.add("profile-view-active");
  screen.classList.add("is-open");

  const isFractal = type === "fractal";
  if (isFractal) screen.classList.add("profile-view--fractal");
  else screen.classList.remove("profile-view--fractal");

  const isGameplay = document.body.classList.contains("storymode");
  const isDev = state.settings?.developerMode;
  let isEditing = id === "new" || (forceEditMode && (!isGameplay || isDev));

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

  screen.textContent = "";
  screen.className = "profile-view";
  screen.classList.add("is-open");
  if (isFractal) screen.classList.add("profile-view--fractal");
  screen.classList.toggle("is-editing", isEditing);

  if (isEditing) {
    await renderProfileEdit(screen, entity, type, id);
  } else {
    await renderProfileView(screen, entity, type, id, (editing) =>
      renderProfilePage(type, id, editing),
    );
  }
};

// --- CONTROLLER ACTIONS ---
export const ProfileController = {
  save: async (id, data) => {
    await entities.update("character", id, data);
    events.dispatchEvent(
      new CustomEvent(EVENTS.ENTITY_UPDATED, { detail: { id, ...data } }),
    );
  },

  /**
   * Generates a new profile picture based on the character's description.
   * Uses Prometheus Maestro V5.6 (Maestro Extract).
   */
  generatePortrait: async (characterId) => {
    try {
      // 1. Fetch Character Data
      const character = await entities.get("character", characterId);
      if (!character) throw new Error("Character not found");

      // 2. Notify UI (Start Loading)
      const btn = document.getElementById("profile-gen-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Invoking Prometheus...";
      }

      // 3. Build Prompt Strategy
      const builder = new ContextBuilder(null);
      const { system } = await builder.buildMaestroExtract(
        character.description || character.name,
      );

      // 4. Generate the optimized prompt
      const refinedPrompt = await LlmService.generate({ system, messages: [] });

      // 5. Generate the Image
      const imageUrl = await VisualManager.generate(refinedPrompt, {
        resolution: { width: 512, height: 768 }, // Portrait Aspect Ratio
      });

      // 6. Save & Update UI
      await entities.update("character", characterId, { avatar: imageUrl });

      const imgEl = document.querySelector(
        `.profile-avatar[data-id="${characterId}"]`,
      );
      if (imgEl) imgEl.src = imageUrl;

      // 7. Notify System
      events.dispatchEvent(
        new CustomEvent(EVENTS.ENTITY_UPDATED, {
          detail: { id: characterId, avatar: imageUrl },
        }),
      );
    } catch (e) {
      console.error("Profile Gen Failed:", e);
      const btn = document.getElementById("profile-gen-btn");
      if (btn) btn.textContent = "Failed. Retry?";
    } finally {
      // Reset UI
      const btn = document.getElementById("profile-gen-btn");
      if (btn && btn.textContent !== "Failed. Retry?") {
        btn.disabled = false;
        btn.textContent = "Reroll Portrait";
      } else if (btn) {
        btn.disabled = false;
      }
    }
  },
};
