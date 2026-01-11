import {
  events,
  EVENTS,
  store as state,
} from "../../../../gamemaster/index.js";
import { handleAsyncError } from "../../../../gamemaster/utils.js";
import { renderProfileView } from "./view.js";
import { renderProfileEdit } from "./edit.js";
import { entities } from "../../../../scholar/index.js";
import { Mesmer } from "../../../index.js";

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
// --- MODAL MANAGEMENT ---
import { app } from "../../../../../artificer/stores/app.svelte.js";
import { runtime } from "../../../../../scholar/stores/runtime.svelte.js";

export const closeProfileModal = () => {
  app.toggleProfile(false);
  activeSlotKey = null;
};

export const openProfileModal = async (type, id, slotKey = null) => {
  activeSlotKey = slotKey;

  if (id === "new") {
    // Handle new entity logic later or pass defaults
    return;
  }

  try {
    const entity = await entities.get(type, id);
    if (entity) {
      // Normalize legacy fields if needed
      if (entity.forever && !entity.eternal) entity.eternal = entity.forever;

      runtime.updateCharacter(entity);
      app.toggleProfile(true);
    }
  } catch (e) {
    console.error("Failed to open profile:", e);
  }
};

export const refreshProfileIfOpen = async () => {
  // No-op for now in new architecture
};

// --- LEGACY COMPATIBILITY (Keep renderProfilePage but redirect) ---
export const renderProfilePage = async (type, id, forceEditMode = false) => {
  openProfileModal(type, id);
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
   * Uses Prometheus Mesmer V3.0 (Mesmer Extract).
   */
  generatePortrait: async (characterId) => {
    try {
      // 1. Notify UI (Start Loading)
      const btn = document.getElementById("profile-gen-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Invoking Prometheus...";
      }

      // 2. Delegate to Mesmer Engine
      const imageUrl = await Mesmer.extract(characterId);

      // 3. Save & Update UI
      await entities.update("character", characterId, { avatar: imageUrl });

      const imgEl = document.querySelector(
        `.profile-avatar[data-id="${characterId}"]`,
      );
      if (imgEl) imgEl.src = imageUrl;

      // 4. Notify System
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
