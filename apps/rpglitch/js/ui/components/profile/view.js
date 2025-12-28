import { ThemeService } from "../../services/theme.js";
import {
  getPictureHTML,
  setTopBarRight,
  renderDynamicsWidget,
  createProfileRow,
} from "../../services/ui-utils.js";
import { getVisualState } from "../../../data/models.js";
import { entities } from "../../../data/repo.js";
import { escapeHtml, log, error } from "../../../core/utils.js";
import { state } from "../../../core/state.js";
import { PROFILE_STRUCTURE, LABEL_MAP, SPLIT_HEADERS } from "./constants.js";

// Helper to access nested properties safely
const getNestedValue = (obj, path) =>
  path.split(".").reduce((acc, part) => acc && acc[part], obj) || "";

export const renderProfileView = async (
  screen,
  entity,
  type,
  id,
  onSwitchToEdit,
) => {
  // Setup Visuals
  setTopBarRight("profile");

  const template = document.querySelector("#tpl-profile-page");
  if (!template) return;
  const layout = template.content.firstElementChild.cloneNode(true);

  const isFractal = type === "fractal";
  const heroWrap = layout.querySelector(".hero-wrap");

  // --- HERO IMAGE ---
  // Visual State Management
  let localVisuals = getVisualState(entity);

  const applyVisualsToImage = (wrapperEl) => {
    if (!wrapperEl) return;
    const target = wrapperEl.classList.contains("picture")
      ? wrapperEl
      : wrapperEl.querySelector(".picture") || wrapperEl;
    if (localVisuals.flipped) target.classList.add("img-flipped");
    else target.classList.remove("img-flipped");
  };

  if (getPictureHTML) {
    const heroPic = getPictureHTML(entity, {
      cover: true,
      landscape: isFractal,
    });
    if (heroPic) {
      heroPic.classList.add("hero-bleed");
      applyVisualsToImage(heroPic);
      heroWrap.appendChild(heroPic);
    }
  }

  // Flip Button (Live Control with Auto-Save)
  const flipBtn = document.createElement("button");
  flipBtn.className = "btn-visual-flip btn-glass btn-round";
  flipBtn.innerHTML = "⇄";
  flipBtn.title = "Flip Orientation";
  flipBtn.type = "button";
  flipBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    localVisuals.flipped = !localVisuals.flipped;

    const wrappers = heroWrap.querySelectorAll(".picture");
    wrappers.forEach((el) => {
      if (localVisuals.flipped) el.classList.add("img-flipped");
      else el.classList.remove("img-flipped");
    });

    // Persist State
    if (id !== "new") {
      try {
        if (!entity.visuals) entity.visuals = {};
        entity.visuals.flipped = localVisuals.flipped;

        await entities.upsert(type, entity, { silent: true });

        if (state.selectedAI && state.selectedAI.id === id)
          state.selectedAI.visuals = entity.visuals;
        if (state.selectedUser && state.selectedUser.id === id)
          state.selectedUser.visuals = entity.visuals;
        if (state.selectedFractal && state.selectedFractal.id === id)
          state.selectedFractal.visuals = entity.visuals;

        const { events, EVENTS } = await import("../../../core/events.js");
        events.dispatchEvent(
          new CustomEvent(EVENTS.DB_UPDATED, {
            detail: {
              id: entity.id,
              type: type,
              store: "entities",
              source: "profile-view",
            },
          }),
        );

        window.dispatchEvent(
          new CustomEvent("entity-visual-update", {
            detail: { id: entity.id },
          }),
        );
      } catch (err) {
        error("Failed to auto-save flip state:", err);
      }
    }
  };
  heroWrap.appendChild(flipBtn);

  // Hide Edit Overlays
  const imageOverlay = layout.querySelector(".profile-hero-overlay");
  if (imageOverlay) imageOverlay.style.display = "none";

  // --- HEADER (Name/Desc) ---
  const form = layout.querySelector("form");
  const headerWrap = form.querySelector("[data-profile-header]");
  headerWrap.innerHTML = "";

  // [NEXUS FIX] Reactivity: Listen for live updates
  const { events, EVENTS } = await import("../../../core/events.js");
  const onEntityUpdate = (e) => {
    if (e.detail && e.detail.id === entity.id) {
      log(`⚡ [PROFILE] Live Update Received for ${entity.name}`);

      // Refresh In-Memory Entity
      Object.assign(entity, e.detail);

      // Refresh Split Fields (Present/Mental/Physical)
      const updateField = (key, val) => {
        const el = form.querySelector(`[data-split-key="${key}"]`);
        if (el) el.innerHTML = escapeHtml(val);
      };

      updateField("mental", getNestedValue(entity, "present.mental"));
      updateField("physical", getNestedValue(entity, "present.physical"));

      // Refresh Dynamics (if present)
      const dynamicsContainer = form.querySelector(".dynamics-widget");
      if (dynamicsContainer) {
        // [NEXUS FIX] Clean re-render of Dynamics Widget
        const container = dynamicsContainer.parentElement;
        dynamicsContainer.remove();
        if (container) {
          renderDynamicsWidget(container, entity, "view");
        }
      }
    }
  };

  events.addEventListener(EVENTS.ENTITY_UPDATED, onEntityUpdate);

  // [CLEANUP] Remove listener when removed from DOM
  const observer = new MutationObserver(() => {
    if (!document.body.contains(layout)) {
      events.removeEventListener(EVENTS.ENTITY_UPDATED, onEntityUpdate);
      observer.disconnect();
    }
  });
  observer.observe(screen, { childList: true });

  const nameDisplay = document.createElement("h1");
  nameDisplay.className = "profile-name-display";
  ThemeService.apply(nameDisplay, entity.signatureColor);
  nameDisplay.textContent = entity.name || "Unknown";
  headerWrap.appendChild(nameDisplay);

  const descDisplay = document.createElement("p");
  descDisplay.className = "profile-desc-display";
  descDisplay.textContent = entity.description || "";
  headerWrap.appendChild(descDisplay);

  // --- SECTIONS (Maestro 2-Column Grid) ---
  const secWrap = form.querySelector("[data-profile-sections]");

  const createRow = (groupKey, groupConfig) => {
    const { row, contentCol } = createProfileRow(
      groupConfig.label.split(" (")[0],
      LABEL_MAP[groupKey] || "",
    );

    if (groupConfig.type === "nested") {
      const splitWrap = document.createElement("div");
      splitWrap.className = "split-content";

      const keys = ["mental", "physical"];

      keys.forEach((key) => {
        if (!groupConfig.fields[key]) return;

        const val = getNestedValue(entity, `${groupKey}.${key}`);

        const splitCol = document.createElement("div");
        splitCol.className = "split-column";

        // Only show headers for "forever" to avoid duplicates in "present"
        if (groupKey === "forever") {
          const header = document.createElement("div");
          header.className = "split-header";
          header.textContent = SPLIT_HEADERS[key];
          splitCol.appendChild(header);
        }

        const readField = document.createElement("div");
        readField.className = "profile-field-text-read";
        readField.setAttribute("data-read", "");
        readField.setAttribute("data-split-key", key);
        readField.innerHTML = escapeHtml(val);
        splitCol.appendChild(readField);

        splitWrap.appendChild(splitCol);
      });
      contentCol.appendChild(splitWrap);
    } else {
      const val = entity[groupKey] || "";
      const readField = document.createElement("div");
      readField.className = "profile-field-text-read";
      readField.setAttribute("data-read", "");
      readField.innerHTML = escapeHtml(val);
      contentCol.appendChild(readField);
    }

    secWrap.appendChild(row);
  };

  Object.keys(PROFILE_STRUCTURE).forEach((k) =>
    createRow(k, PROFILE_STRUCTURE[k]),
  );

  // --- DYNAMICS (Developer Mode) ---
  if (
    state.settings.developerMode &&
    (type === "character" || type === "fractal")
  ) {
    renderDynamicsWidget(secWrap, entity, "view");
  }

  // --- FOOTER ACTIONS ---
  const footerActions = document.createElement("div");
  footerActions.className = "profile-actions-footer";

  const isGameplay = document.body.classList.contains("storymode");

  if (isGameplay) {
    const statusMsg = document.createElement("div");
    statusMsg.className = "muted";
    statusMsg.style.width = "100%";
    statusMsg.style.textAlign = "center";
    statusMsg.innerHTML =
      "<em>Entity is active in story. Changes are managed by the AI.</em>";
    footerActions.appendChild(statusMsg);
  } else {
    const editBtn = document.createElement("button");
    editBtn.className = "btn-ghost btn-icon-raise";
    editBtn.style.width = "auto";
    editBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; vertical-align:middle;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75-1.83 1.83z"/></svg>`;
    editBtn.title = "Edit Profile";
    editBtn.onclick = (e) => {
      e.preventDefault();
      onSwitchToEdit(true);
    };
    footerActions.appendChild(editBtn);
  }

  form.appendChild(footerActions);
  screen.appendChild(layout);
};
