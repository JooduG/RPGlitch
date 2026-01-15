import { entities } from "../../../../scholar/index.js";

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

/* 
   LEGACY CONTROLLER DEPRECATED 
   Logic moved to src/scholar/Profile.svelte 
*/
