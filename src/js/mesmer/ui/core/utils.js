import { sanitizeHtml } from "../../../gamemaster/utils.js";
import { VisualManager } from "../components/visuals/manager.js";
import { ThemeService } from "./theme.js";

// [NEW] Shared UI Components
export function createIconBtn(
  iconSvg,
  title,
  onClick,
  className = "ghost-icon-btn",
) {
  const btn = document.createElement("button");
  btn.className = className;
  // 🛡️ SENTINEL SECURITY PATCH: XSS Mitigation
  btn.innerHTML = sanitizeHtml(iconSvg);
  btn.title = title;
  btn.type = "button";
  btn.onclick = (e) => {
    e.stopPropagation();
    onClick(e);
  };
  return btn;
}

/**
 * Creates a standard profile row structure.
 * Returns { row, labelCol, contentCol } elements.
 *
 * @param {string} labelText - The main label text.
 * @param {string} subLabelText - The sub label text.
 */
export function createProfileRow(labelText, subLabelText = "") {
  const row = document.createElement("div");
  row.className = "profile-row";

  // 1. Label Column
  const labelCol = document.createElement("div");
  labelCol.className = "label-group";

  const mainLabel = document.createElement("span");
  mainLabel.className = "main-label";
  mainLabel.textContent = labelText;
  labelCol.appendChild(mainLabel);

  const subLabel = document.createElement("span");
  subLabel.className = "sub-label";
  subLabel.textContent = subLabelText;
  labelCol.appendChild(subLabel);

  row.appendChild(labelCol);

  // 2. Content Column
  const contentCol = document.createElement("div");
  contentCol.className = "content-group";

  row.appendChild(contentCol);

  return { row, labelCol, contentCol };
}

export function renderDynamicsWidget(
  container,
  entity,
  mode = "view",
  options = {},
) {
  // Options destructuring with defaults
  const {
    label = "DYNAMICS",
    tooltip = "Current Simulation State",
    source = "dynamics", // 'dynamics' or 'baseline'
  } = options;

  // Determine values based on source
  let values;
  if (source === "baseline") {
    // If baseline is missing, assume current dynamics represent the default personality
    values = entity.baseline ||
      entity.dynamics || {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
  } else {
    values = entity.dynamics || {
      entropy: 50,
      permeability: 50,
      velocity: 50,
      resonance: 50,
    };
  }

  const isEdit = mode === "edit";
  const isFractal = entity.type === "fractal";

  // createProfileRow returns { row, labelCol, contentCol }
  const { row, contentCol, labelCol } = createProfileRow(label, "");
  row.classList.add("profile-dev-section");

  // Add Tooltip to Label Column if exists
  if (labelCol && tooltip) {
    labelCol.setAttribute("data-tooltip", tooltip);
    labelCol.style.cursor = "help"; // Visual hint
  }

  const wrapper = document.createElement("div");

  const renderCard = (key) => {
    let val = Number(values[key]);
    if (isNaN(val)) val = 50;

    const card = document.createElement("div");
    card.className = "dynamics-card";
    const labelHtml = `<div class="dynamics-label">${sanitizeHtml(key)}</div>`;

    if (isEdit) {
      // Data attribute distinguishes source (data-edit-dynamic="entropy" vs data-edit-baseline="entropy")
      // Actually edit.js uses `data-edit-dynamic` generally, but we need to know WHICH target.
      // We will use `data-dynamics-target="${source}"` and `data-dynamics-key="${key}"`
      card.innerHTML = sanitizeHtml(`
        ${labelHtml}
        <input type="number" 
               class="dynamics-input" 
               data-dynamics-target="${source}" 
               data-dynamics-key="${key}" 
               value="${val}" 
               min="0" 
               max="100">
      `);
    } else {
      card.innerHTML = sanitizeHtml(`
        ${labelHtml}
        <div class="dynamics-value">${val}%</div>
      `);
    }
    return card;
  };

  if (isFractal) {
    wrapper.className = "dynamics-grid--linear";
    ["entropy", "permeability", "velocity", "resonance"].forEach((key) => {
      wrapper.appendChild(renderCard(key));
    });
  } else {
    wrapper.className = "split-content";
    const colLeft = document.createElement("div");
    colLeft.className = "split-column";
    const colRight = document.createElement("div");
    colRight.className = "split-column";

    colLeft.appendChild(renderCard("entropy"));
    colLeft.appendChild(renderCard("permeability"));
    colRight.appendChild(renderCard("velocity"));
    colRight.appendChild(renderCard("resonance"));

    wrapper.appendChild(colLeft);
    wrapper.appendChild(colRight);
  }

  contentCol.appendChild(wrapper);
  container.appendChild(row);
}

// --- UI Helpers (Mobile Drawer / Bottom Sheet, TopBar) ---

// --- UI Helpers (Mobile Drawer / Bottom Sheet, TopBar) ---

export function setTopBarRight(mode) {
  const doc = document;
  const topBarRightStoryboard = doc.querySelector("#top-bar-right-storyboard");
  const topBarRightForm = doc.querySelector("#top-bar-right-form");
  const topBarRightProfile = doc.querySelector("#top-bar-right-profile");
  const sectionMap = {
    storyboard: topBarRightStoryboard,
    form: topBarRightForm,
    profile: topBarRightProfile,
  };
  Object.values(sectionMap).forEach(
    (sec) => sec && sec.setAttribute("hidden", ""),
  );
  if (sectionMap[mode]) sectionMap[mode].removeAttribute("hidden");
}

export function hideEl(el, doc = document) {
  if (typeof el === "string") el = doc.getElementById(el);
  if (el) el.setAttribute("hidden", "");
}

export function showEl(el, doc = document) {
  if (typeof el === "string") el = doc.getElementById(el);
  if (el) el.removeAttribute("hidden");
}

export function replaceEventHandler(el, event, handler, handlerName) {
  if (!el) return;
  if (el[handlerName]) {
    el.removeEventListener(event, el[handlerName]);
  }
  el[handlerName] = handler;
  el.addEventListener(event, handler);
}

/**
 * Dismisses the global loading modal.
 */
export function dismissLoadingUI() {
  const modal = document.querySelector("#loading-modal");
  if (modal) {
    try {
      if (typeof modal.close === "function") modal.close();
    } catch (e) {
      void 0;
    }
    modal.style.display = "none";
    modal.removeAttribute("open");
  }
}

/**
 * Returns a picture container element for an entity.
 * Handles profile pictures, placeholders, and flipping.
 * @param {object} entity - Character or Fractal
 * @param {object} options - { cover, landscape }
 */
export function getPictureHTML(entity, options = {}) {
  const { cover = false, landscape = false } = options;
  const div = document.createElement("div");
  div.className = "picture-container picture"; // [FIX] Added 'picture' for selector/CSS targeting
  if (cover) div.classList.add("picture-cover");
  if (landscape) div.classList.add("picture-landscape");

  const url = entity.profilePictureUrl || "";
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = entity.name || "Portrait";

    const visuals = VisualManager.getVisualState(entity);
    if (visuals.flipped) {
      img.style.transform = "scaleX(-1)";
    }

    div.appendChild(img);
  } else {
    div.classList.add("picture-placeholder");
    if (entity.signatureColor) {
      ThemeService.apply(div, entity.signatureColor);
      // [FIX] Force signature background for placeholders (Requested by User)
      div.style.backgroundColor = "var(--signature-color)";
      div.style.color = "#fff"; // Icon always white
    }

    // [FIX] Use Silhouette Icon instead of Letter
    div.innerHTML = `<svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor" style="width:50%; height:50%; opacity:1;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
  }

  return div;
}

/**
 * Trigger a browser download for a specific URL.
 * @param {string} url
 * @param {string} filename
 */
export function downloadImage(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Sets the main application background.
 * @param {string} imageUrlOrColor - URL or color key
 */
export function setAppBackground(imageUrlOrColor) {
  const bg = document.getElementById("fractal-background");
  if (!bg) return;

  if (!imageUrlOrColor) {
    bg.style.backgroundImage = "none";
    bg.style.opacity = "0";
    return;
  }

  // Detect if it's a URL or a color key from the palette
  if (
    imageUrlOrColor.startsWith("http") ||
    imageUrlOrColor.startsWith("data:")
  ) {
    bg.style.backgroundImage = `url('${imageUrlOrColor}')`;
    bg.style.opacity = "1";
    bg.style.backgroundColor = "transparent";
  } else {
    // If it's a color key (used in orchestrator)
    bg.style.backgroundImage = "none";
    bg.style.opacity = "1";
    // The actual background color is often handled by CSS variables via applyFractalAmbience
  }
}
