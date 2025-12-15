import { ThemeService } from "../../services/theme.js";
import { getPictureHTML, setTopBarRight } from "../../services/ui-utils.js";
import { getVisualState } from "../../../data/models.js";
import { entities } from "../../../data/repo.js";
import { escapeHtml } from "../../../core/utils.js";
import { state } from "../../../core/state.js";
import { SECTION_DEFINITIONS } from "./constants.js";

// autoResize removed as it is not used in read-only view

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

  const applyVisualsToImage = (imgEl) => {
    if (!imgEl) return;
    if (localVisuals.flipped) imgEl.classList.add("img-flipped");
    else imgEl.classList.remove("img-flipped");
  };

  if (getPictureHTML) {
    const heroPic = getPictureHTML(entity, {
      cover: true,
      landscape: isFractal,
    });
    if (heroPic) {
      heroPic.classList.add("hero-bleed");
      applyVisualsToImage(heroPic.querySelector("img"));
      heroWrap.appendChild(heroPic);
    }
  }

  // Flip Button (Live Control with Auto-Save)
  const flipBtn = document.createElement("button");
  flipBtn.className = "btn-visual-flip";
  flipBtn.innerHTML = "⇄";
  flipBtn.title = "Flip Orientation";
  flipBtn.type = "button";
  flipBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    localVisuals.flipped = !localVisuals.flipped;
    const imgs = heroWrap.querySelectorAll("img");
    imgs.forEach(applyVisualsToImage);

    // Persist State
    if (id !== "new") {
      try {
        if (!entity.visuals) entity.visuals = {};
        entity.visuals.flipped = localVisuals.flipped;
        await entities.upsert(type, entity);
        window.dispatchEvent(
          new CustomEvent("entity-visual-update", {
            detail: { id: entity.id },
          }),
        );
        console.log("[Profile] Visual flip saved automatically.");
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
  ThemeService.apply(nameDisplay, entity.signatureColour);
  nameDisplay.textContent = entity.name || "Unknown";
  headerWrap.appendChild(nameDisplay);

  const descDisplay = document.createElement("p");
  descDisplay.className = "profile-desc-display";
  descDisplay.textContent = entity.description || "";
  headerWrap.appendChild(descDisplay);

  // --- TAGS ---
  // const tagsRow = document.createElement("div");
  // tagsRow.className = "field-row";
  // tagsRow.innerHTML = `<div class="field-label"><label>Tags</label></div><div class="field-input"></div>`;
  // const inputContainer = tagsRow.querySelector(".field-input");
  // if (renderTags) {
  //   renderTags(inputContainer, entity);
  // } else {
  //   inputContainer.textContent = (entity.tags || []).join(", ");
  // }
  // headerWrap.after(tagsRow);

  // --- SECTIONS ---
  const secWrap = form.querySelector("[data-profile-sections]");
  const createRow = (key, def) => {
    const div = document.createElement("div");
    div.className = "field-row";
    const sublabel = def.sublabels[type] || "";

    div.innerHTML = `
        <div class="field-label">
            <label>${def.label}</label>
            ${sublabel ? `<small class="muted">${sublabel}</small>` : ""}
        </div>
        <div class="field-input">
            <div data-read class="profile-field-text-read">${escapeHtml(entity[key] || "")}</div>
        </div>`;
    secWrap.appendChild(div);
  };

  Object.keys(SECTION_DEFINITIONS).forEach((k) =>
    createRow(k, SECTION_DEFINITIONS[k]),
  );

  // --- DYNAMICS (Director Mode) ---
  if (
    state.settings.directorMode &&
    (type === "character" || type === "fractal")
  ) {
    const dynRow = document.createElement("div");
    dynRow.className = "field-row";
    const dyns = entity.dynamics || {
      entropy: 50,
      permeability: 50,
      velocity: 50,
      resonance: 50,
    };

    const gridCols = isFractal ? "repeat(4, 1fr)" : "repeat(2, 1fr)";
    dynRow.innerHTML = `
        <div class="field-label"><label>Dynamics</label><small class="muted">Director Mode</small></div>
        <div class="field-input" style="display: grid; grid-template-columns: ${gridCols}; gap: 0.75rem;">
             ${["entropy", "permeability", "velocity", "resonance"]
               .map(
                 (k) => `
                <div style="background: var(--pico-card-background-color); padding: 0.5rem; border-radius: 4px; border: 1px solid var(--pico-muted-border-color); text-align: center;">
                    <div style="font-size: 0.65rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.25rem;">${k}</div>
                    <div style="font-family: monospace; font-size: 1.1rem; font-weight: 800; color: var(--pico-primary);">${dyns[k] !== undefined ? dyns[k] : 50}%</div>
                </div>
            `,
               )
               .join("")}
        </div>`;
    secWrap.appendChild(dynRow);
  }

  // --- FOOTER ACTIONS ---
  const footerActions = document.createElement("div");
  footerActions.className = "profile-actions-footer";

  const isGameplay = document.body.classList.contains("mode-gameplay");

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
    editBtn.className = "secondary outline";
    editBtn.textContent = "Edit Profile";
    editBtn.style.width = "100%";
    editBtn.onclick = (e) => {
      e.preventDefault();
      onSwitchToEdit(true);
    };
    footerActions.appendChild(editBtn);
  }

  form.appendChild(footerActions);
  screen.appendChild(layout);
}
