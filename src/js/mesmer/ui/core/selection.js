import { log } from "../../../gamemaster/utils.js";
import { setAppBackground } from "./utils.js";
import { applyFractalAmbience } from "../components/visuals/generator.js";
import {
  updateLocalSelection,
  renderEntityPreview,
  openDrawerFor,
  bindDrawerTrigger,
} from "../components/drawer/mobile.js";

/**
 * SELECTION MANAGER (Mesmer Core)
 * Handles Entity Selection State in the Storyboard (Lobby).
 * Syncs visuals (backgrounds, themes) based on selection.
 */

const selectedEntities = {
  ai: null,
  user: null,
  fractal: null,
};

let _onSelectionChanged = null;

export const SelectionManager = {
  setOnSelectionChanged: (handler) => {
    _onSelectionChanged = handler;
  },

  update: (newSelection) => {
    if (newSelection.aiCharacter !== undefined)
      selectedEntities.ai = newSelection.aiCharacter;
    if (newSelection.userCharacter !== undefined)
      selectedEntities.user = newSelection.userCharacter;
    if (newSelection.fractal !== undefined) {
      selectedEntities.fractal = newSelection.fractal;
      log("[UI] Selecting Fractal:", newSelection.fractal);
      setAppBackground(selectedEntities.fractal?.signatureColor);
      applyFractalAmbience(selectedEntities.fractal);

      const toRemove = [...document.body.classList].filter((c) =>
        c.startsWith("theme-"),
      );
      document.body.classList.remove(...toRemove);

      const newTheme = selectedEntities.fractal?.simulation?.cssTheme;
      if (newTheme) {
        document.body.classList.add(newTheme);
        log(`[UI] Applied theme: ${newTheme}`);
      }
    }

    updateLocalSelection(selectedEntities);

    const updateSlot = (key, entity, btnId, previewId, type, titleOverride) => {
      const previewEl = document.querySelector(previewId);
      const btn = document.querySelector(btnId);

      if (entity) {
        if (previewEl) {
          const onEdit = () => {
            const container = btn ? btn.closest(".entity-card") : null;
            openDrawerFor(type, key, previewId, btn, container, titleOverride);
          };

          renderEntityPreview(
            previewId,
            entity,
            btn,
            type,
            onEdit,
            type === "fractal",
            key,
          );
          previewEl.hidden = false;
          previewEl.classList.remove("fade-in");
          void previewEl.offsetWidth;
          previewEl.classList.add("fade-in");
        }
        if (btn) {
          btn.hidden = true;
          btn.classList.remove("shimmer");
        }
      } else {
        if (previewEl) {
          previewEl.hidden = true;
          previewEl.classList.remove("fade-in");
        }
        if (btn) {
          btn.hidden = false;
          btn.classList.add("shimmer");
        }
      }
    };

    updateSlot(
      "aiCharacter",
      selectedEntities.ai,
      "#btn-select-ai",
      "#ai-character-preview",
      "character",
      "Select AI Character",
    );
    updateSlot(
      "userCharacter",
      selectedEntities.user,
      "#btn-select-user",
      "#user-character-preview",
      "character",
      "Select User Character",
    );
    updateSlot(
      "fractal",
      selectedEntities.fractal,
      "#btn-select-fractal",
      "#fractal-preview",
      "fractal",
      "Select Fractal",
    );

    if (_onSelectionChanged) {
      _onSelectionChanged({
        aiCharacter: selectedEntities.ai,
        userCharacter: selectedEntities.user,
        fractal: selectedEntities.fractal,
      });
    }
  },

  initTriggers: () => {
    bindDrawerTrigger(
      "#btn-select-ai",
      "character",
      "#ai-character-preview",
      "aiCharacter",
      "Select AI Character",
    );
    bindDrawerTrigger(
      "#btn-select-user",
      "character",
      "#user-character-preview",
      "userCharacter",
      "Select User Character",
    );
    bindDrawerTrigger(
      "#btn-select-fractal",
      "fractal",
      "#fractal-preview",
      "fractal",
      "Select Fractal",
    );
  },
};
