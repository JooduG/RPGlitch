import { ThemeService } from "../../services/theme.js";
import {
  getPictureHTML,
  setTopBarRight,
  renderDynamicsWidget,
} from "../../services/ui-utils.js";
import { getVisualState } from "../../../data/models.js";
import { entities } from "../../../data/repo.js";
import { escapeHtml } from "../../../core/utils.js";
import { state } from "../../../core/state.js";
import { PROFILE_STRUCTURE } from "./constants.js"; // [FIX] Import Structure

// autoResize removed as it is not used in read-only view

// Helper to access nested properties safely
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj) || "";
}

export async function renderProfileView(
  screen,
  entity,
  type,
  id,
  onSwitchToEdit,
) {
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
    // [FIX] Ensure we target the .picture wrapper, not the container or img
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

    // [FIX] Target the WRAPPER (.picture), not the images
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

        // [FIX] Silent save to prevent Controller loop
        await entities.upsert(type, entity, { silent: true });

        // [FIX] Update local state immediately
        if (state.selectedAI && state.selectedAI.id === id)
          state.selectedAI.visuals = entity.visuals;
        if (state.selectedUser && state.selectedUser.id === id)
          state.selectedUser.visuals = entity.visuals;
        if (state.selectedFractal && state.selectedFractal.id === id)
          state.selectedFractal.visuals = entity.visuals;

        // [NEW] Dispatch for Storyboard
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
        console.error("Failed to auto-save flip state:", err);
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

  const nameDisplay = document.createElement("h1");
  nameDisplay.className = "profile-name-display";
  ThemeService.apply(nameDisplay, entity.signatureColor);
  nameDisplay.textContent = entity.name || "Unknown";
  headerWrap.appendChild(nameDisplay);

  const descDisplay = document.createElement("p");
  descDisplay.className = "profile-desc-display";
  descDisplay.textContent = entity.description || "";
  headerWrap.appendChild(descDisplay);

  // --- SECTIONS (Nested Temporal Reader) ---
  const secWrap = form.querySelector("[data-profile-sections]");

  const createRow = (groupKey, groupConfig) => {
    // 1. Group Header
    const header = document.createElement("h4");
    header.className = "profile-group-header";
    header.textContent = groupConfig.label.split(" (")[0]; // Clean label
    secWrap.appendChild(header);

    // 2. Render Fields
    if (groupConfig.type === "nested") {
      Object.keys(groupConfig.fields).forEach((fieldKey) => {
        const fieldConfig = groupConfig.fields[fieldKey];
        const val = getNestedValue(entity, `${groupKey}.${fieldKey}`);

        const div = document.createElement("div");
        div.className = "field-row";
        div.innerHTML = `
          <div class="field-label">
              <label>${fieldConfig.label}</label>
          </div>
          <div class="field-input">
              <div data-read class="profile-field-text-read">${escapeHtml(val)}</div>
          </div>`;
        secWrap.appendChild(div);
      });
    } else {
      // String type (Past/Future)
      const val = entity[groupKey] || "";
      const div = document.createElement("div");
      div.className = "field-row";
      // Full width text block
      div.innerHTML = `
          <div class="field-input">
              <div data-read class="profile-field-text-read">${escapeHtml(val)}</div>
          </div>`;
      secWrap.appendChild(div);
    }
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
    editBtn.className = "btn-ghost btn-icon-raise"; // Ghost style with contrast text
    editBtn.style.width = "100%"; // Restore full width
    editBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; vertical-align:middle;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75-1.83 1.83z"/></svg>`;
    editBtn.title = "Edit Profile";
    editBtn.style.width = "auto";
    editBtn.onclick = (e) => {
      e.preventDefault();
      onSwitchToEdit(true);
    };
    footerActions.appendChild(editBtn);
  }

  form.appendChild(footerActions);
  screen.appendChild(layout);
}
