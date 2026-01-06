// apps/rpglitch/js/ui-chin.js
import { entities } from "../../../data/repo.js";
import { error } from "../../../core/utils.js";
import { getPictureHTML } from "../../services/ui-utils.js";

import { ThemeService } from "../../services/theme.js";
import { openDrawer } from "./desktop.js";
import { openProfileModal } from "../profile/controller.js";

// Shared Selection State (Local to this module's view context)
let localSelectedEntities = {};
let _onUpdateSelection = null;

export function setChinCallbacks(callbacks) {
  if (callbacks.onUpdateSelection)
    _onUpdateSelection = callbacks.onUpdateSelection;
}

export function updateLocalSelection(selection) {
  localSelectedEntities = { ...selection };
}

export function bindDrawerTrigger(
  buttonId,
  entityType,
  previewId,
  stateKey,
  titleOverride,
) {
  const button = document.querySelector(buttonId);
  if (!button) return;
  const cardContainer = button.closest(".entity-card");

  if (cardContainer) {
    cardContainer.style.cursor = "pointer";
    cardContainer.addEventListener("click", (e) => {
      openDrawerFor(
        entityType,
        stateKey,
        previewId,
        button,
        cardContainer,
        titleOverride,
      );
    });
  }
}

export function bindPortraitClick(selector, stateKey) {
  const el = document.querySelector(selector);
  if (el)
    el.addEventListener("click", () => {
      const entity = localSelectedEntities[stateKey];
      if (entity)
        openProfileModal(entity.type.toLowerCase(), entity.id, stateKey);
    });
}

export function openDrawerFor(
  entityType,
  stateKey,
  previewId,
  button,
  triggerElement,
  titleOverride,
) {
  openDrawer(
    entityType,
    async (entityId) => {
      try {
        const entity = await entities.get(entityType, entityId);

        // Update Selection
        // We call the router's update method via callback
        const updatePayload = {};
        updatePayload[stateKey] = entity;

        if (_onUpdateSelection) {
          _onUpdateSelection(updatePayload);
        }

        // Let's keep the localized behavior:
        const onEdit = () => {
          const container = button ? button.closest(".entity-card") : null;
          openDrawerFor(
            entityType,
            stateKey,
            previewId,
            button,
            container,
            titleOverride,
          );
        };

        const isFractal = entityType === "fractal";
        renderEntityPreview(
          previewId,
          entity,
          button,
          entityType,
          onEdit,
          isFractal,
          stateKey,
        );

        if (button) button.hidden = true;
      } catch (err) {
        error("Selection failed:", err);
      }
    },
    triggerElement,
    () => {
      // We need to signal the router to open the profile modal for "new"
      window.ephemeralEntity = null;
      openProfileModal(entityType, "new", stateKey);
    },
    titleOverride,
  );
}

export function renderEntityPreview(
  previewId,
  entity,
  slotButton,
  type,
  onEdit,
  isFractal = false,
  stateKey = null,
) {
  const previewEl = document.querySelector(previewId);
  if (!previewEl) return;

  if (entity) {
    previewEl.innerHTML = "";
    previewEl.className = "entity-preview card-filled";
    if (entity.signatureColor) {
      ThemeService.apply(previewEl, entity.signatureColor);
    }

    // 1. Top Section: Image (Opens Profile)
    const media = document.createElement("div");
    media.className = "card-media";
    media.title = "View Profile";

    const pic = getPictureHTML(entity, { cover: true, landscape: isFractal });

    media.appendChild(pic);
    media.addEventListener("click", (e) => {
      e.stopPropagation();
      openProfileModal(type, entity.id, stateKey);
    });
    previewEl.appendChild(media);

    // 2. Bottom Section: Details (Triggers Change/Edit)
    const body = document.createElement("div");
    body.className = "card-body";
    body.title = "Click to Change";
    body.addEventListener("click", (e) => {
      e.stopPropagation();
      onEdit();
    });

    const title = document.createElement("h4");
    title.textContent = entity.name;
    body.appendChild(title);

    if (entity.description) {
      const desc = document.createElement("p");
      desc.textContent = entity.description;
      body.appendChild(desc);
    }

    previewEl.appendChild(body);

    previewEl.removeAttribute("hidden");
    if (slotButton) slotButton.hidden = true;
  } else {
    previewEl.innerHTML = "";
    previewEl.setAttribute("hidden", "");
    if (slotButton) slotButton.hidden = false;
  }
}
