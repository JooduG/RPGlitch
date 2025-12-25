import { mixHex, sanitizeHtml } from "../../core/utils.js";
import { PALETTE } from "../../core/constants.js";
import { getVisualState } from "../../data/models.js";

// [NEW] Shared UI Components
export function createIconBtn(
  iconSvg,
  title,
  onClick,
  className = "ghost-icon-btn",
) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.innerHTML = iconSvg;
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

export function renderDynamicsWidget(container, entity, mode = "view") {
  const dyns = entity.dynamics || {
    entropy: 50,
    permeability: 50,
    velocity: 50,
    resonance: 50,
  };

  const isEdit = mode === "edit";
  const isFractal = entity.type === "fractal";

  // [REFACTOR] Use Maestro 2-Column Grid (Profile Row)
  const { row, contentCol } = createProfileRow("DYNAMICS", "Hidden Metrics");

  // [LOGIC] Conditional Layout (Fractal = 1x4, Character = 2x2)
  const wrapper = document.createElement("div");

  // Helper to render a card
  const renderCard = (key) => {
    let val = Number(dyns[key]);
    if (isNaN(val)) val = 50;

    const card = document.createElement("div");
    card.className = "dynamics-card";
    const labelHtml = `<div class="dynamics-label">${sanitizeHtml(key)}</div>`;

    if (isEdit) {
      card.innerHTML = `
        ${labelHtml}
        <input type="number" class="dynamics-input" data-edit-dynamic="${key}" value="${val}" min="0" max="100">
      `;
    } else {
      card.innerHTML = `
        ${labelHtml}
        <div class="dynamics-value">${val}%</div>
      `;
    }
    return card;
  };

  if (isFractal) {
    wrapper.className = "dynamics-grid--linear";

    const keys = ["entropy", "permeability", "velocity", "resonance"];
    keys.forEach((key) => {
      wrapper.appendChild(renderCard(key));
    });
  } else {
    // Original 2x2 Split
    wrapper.className = "split-content";

    // Column 1: Non-Physical / Mental (Entropy, Permeability)
    const colLeft = document.createElement("div");
    colLeft.className = "split-column";

    // Column 2: Physical (Velocity, Resonance)
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

// --- UI Helpers (Chin, TopBar) ---

export const chin = {
  init: () => {
    // ⚡ BOLT OPTIMIZATION: Event Delegation
    // Replaced multiple individual listeners with a single document-level delegate.
    // Handles current and future [data-chin] elements automatically.
    if (chin._initialized) return;
    chin._initialized = true;

    document.addEventListener("click", (e) => {
      // 1. Handle Backdrop Click
      const container = document.getElementById("chin-container");
      if (container && !container.hidden && e.target.id === "chin-backdrop") {
        chin.closeAll();
        return;
      }

      // 2. Handle Trigger Click (Delegation)
      const btn = e.target.closest("[data-chin]");
      if (btn) {
        // Optional: Safety check if we want to restrict to buttons only,
        // but closest() usually implies intent.
        // e.stopPropagation();
        const name = btn.getAttribute("data-chin");
        chin.toggle(name);
      }
    });
  },
  open: (name) => {
    chin.closeAll();
    const el = document.querySelector(`.chin[data-chin="${name}"]`);
    const container = document.getElementById("chin-container");
    const backdrop = document.getElementById("chin-backdrop");

    if (el) el.removeAttribute("hidden");
    if (container) {
      container.removeAttribute("hidden");
      container.style.pointerEvents = "auto";
    }
    if (backdrop) backdrop.removeAttribute("hidden");
  },
  close: (name) => {
    const el = document.querySelector(`.chin[data-chin="${name}"]`);
    if (el) el.setAttribute("hidden", "");

    const visible = document.querySelector(".chin:not([hidden])");
    if (!visible) {
      const container = document.getElementById("chin-container");
      if (container) {
        container.setAttribute("hidden", "");
        container.style.pointerEvents = "none";
      }
    }
  },
  closeAll: () => {
    const chins = document.querySelectorAll(".chin");
    chins.forEach((c) => c.setAttribute("hidden", ""));
    const container = document.getElementById("chin-container");
    if (container) {
      container.setAttribute("hidden", "");
      container.style.pointerEvents = "none";
    }
    const backdrop = document.getElementById("chin-backdrop");
    if (backdrop) backdrop.setAttribute("hidden", "");
  },
  toggle: (name) => {
    const el = document.querySelector(`.chin[data-chin="${name}"]`);
    if (el && !el.hasAttribute("hidden")) chin.close(name);
    else chin.open(name);
  },
};

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

// --- Visual Utilities (DOM) ---

const DEFAULT_BG = ["#181c2f", "#23243a", "#1a3a4a", "#2a1a3a"];

/**
 * Updates the global app background gradient based on a signature color.
 */
export function setAppBackground(signatureKey) {
  const root = document.documentElement;
  const baseColor = PALETTE[signatureKey];

  if (!signatureKey || signatureKey === "default" || !baseColor) {
    root.style.setProperty("--bg-grad-1", DEFAULT_BG[0]);
    root.style.setProperty("--bg-grad-2", DEFAULT_BG[1]);
    root.style.setProperty("--bg-grad-3", DEFAULT_BG[2]);
    root.style.setProperty("--bg-grad-4", DEFAULT_BG[3]);
    return;
  }

  const VOID_TARGET = "#1c1f33";

  // Use the mixHex from utils because it is pure logic
  root.style.setProperty("--bg-grad-1", mixHex(baseColor, VOID_TARGET, 0.1));
  root.style.setProperty("--bg-grad-2", mixHex(baseColor, VOID_TARGET, 0.4));
  root.style.setProperty("--bg-grad-3", mixHex(baseColor, VOID_TARGET, 0.75));
  root.style.setProperty("--bg-grad-4", "#0e101a");
}

import { getSignature } from "../../core/utils.js";

/**
 * Generates the HTML for an entity picture.
 */
export function getPictureHTML(entity = {}, options = {}) {
  const { cover, landscape, neutralPlaceholder = false } = options;
  const title = entity.name || "Empty";
  const type = (entity.type || "default").toLowerCase();

  let visuals = options.visuals || entity.visuals;
  if (!visuals && typeof getVisualState === "function") {
    visuals = getVisualState(entity);
  }

  const rawSrc = entity.profilePictureUrl;
  const src = typeof rawSrc === "string" && rawSrc.trim() ? rawSrc.trim() : "";
  // Ensure we have a signature string
  const signature =
    typeof getSignature === "function"
      ? getSignature(entity)
      : entity.signatureColor
        ? `var(--pico-color-${entity.signatureColor})`
        : "var(--signature-default)";
  const contrast = "#fff";

  const wrap = document.createElement("div");
  let aspectRatioClass = "";
  if (landscape === true) aspectRatioClass = " picture--landscape";
  else if (landscape === false) aspectRatioClass = " picture--portrait";

  wrap.className = `picture${cover ? " picture--cover" : ""}${aspectRatioClass}`;
  wrap.style.setProperty("--signature", signature);
  wrap.style.setProperty("--signature-contrast", contrast);
  wrap.style.backgroundColor = "var(--signature)";

  if (visuals && visuals.flipped) {
    wrap.classList.add("img-flipped");
  }

  if (src) {
    const img = document.createElement("img");
    img.alt = `${type} image for ${title}`;
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "placeholder-image";
    if (!neutralPlaceholder) {
      ph.style.backgroundColor = "var(--signature)";
      ph.style.color = "var(--signature-contrast)";
    }

    const iconKey = (entity.icon || entity.type || "default").toLowerCase();
    const iconTemplateId = `tpl-placeholder-icon-${iconKey}`;
    const iconTemplate =
      document.querySelector(`#${iconTemplateId}`) ||
      document.querySelector("#tpl-placeholder-icon-default");

    if (iconTemplate?.content) {
      ph.appendChild(iconTemplate.content.cloneNode(true));
    }

    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", `${type} placeholder for ${title}`);
    wrap.appendChild(ph);
  }

  return wrap;
}

export function renderTags(container, entity, options = {}) {
  const { singleTag = false } = options;

  if (singleTag) {
    const entityType = entity.type || entity.kind || "Entity";
    const typeLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    const wrap = document.createElement("div");
    wrap.className = "tag-chips";
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = typeLabel;

    if (entity.signatureColor && entity.signatureColor !== "default") {
      chip.style.backgroundColor = PALETTE[entity.signatureColor];
      chip.style.color = "white";
    }
    wrap.appendChild(chip);
    container.appendChild(wrap);
    return;
  }

  const tags = entity.tags || [];
  if (entity.isPremade) tags.unshift("Premade");

  if (tags.length === 0) return;

  const wrap = document.createElement("div");
  wrap.className = "tag-chips";
  tags.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = t;

    if (
      t === "Premade" &&
      entity.signatureColor &&
      entity.signatureColor !== "default"
    ) {
      chip.style.backgroundColor = PALETTE[entity.signatureColor];
      chip.style.color = "white";
    }
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}

export async function downloadImage(url, filename = "image.png") {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error("Download failed:", e);
    // Fallback for non-CORS or simple saving
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
// --- Tooltip Service ---
export const TooltipService = {
  element: null,
  timer: null,
  delay: 600, // Short moment

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Create container if not exists
    let el = document.getElementById("global-tooltip");
    if (!el) {
      el = document.createElement("div");
      el.id = "global-tooltip";
      el.className = "tooltip-popup";
      document.body.appendChild(el);
    }
    this.element = el;

    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (target) {
        this.schedule(target);
      }
    });

    document.addEventListener("mouseout", (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (target) {
        this.cancel();
      }
    });

    // Also cancel on click to avoid sticky tooltips
    document.addEventListener("mousedown", () => this.cancel());
  },

  schedule(target) {
    this.clearTimer();
    const text = target.getAttribute("data-tooltip");
    if (!text) return;

    this.timer = setTimeout(() => {
      this.show(target, text);
    }, this.delay);
  },

  cancel() {
    this.clearTimer();
    this.hide();
  },

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  show(target, text) {
    if (!this.element) return;
    this.element.textContent = text;
    this.element.classList.add("is-visible");

    // Positioning logic (Simple Float-UI style)
    const rect = target.getBoundingClientRect();
    const tipRect = this.element.getBoundingClientRect();

    // Default: centered ABOVE
    let top = rect.top - tipRect.height - 8;
    let left = rect.left + rect.width / 2 - tipRect.width / 2;

    // Initial check to keep on screen horizontally
    if (left < 10) left = 10;
    if (left + tipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tipRect.width - 10;
    }

    // Check vertical overflow (if top is offscreen, flip to below)
    if (top < 10) {
      top = rect.bottom + 8;
    }

    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  },

  hide() {
    if (this.element) {
      this.element.classList.remove("is-visible");
    }
  },
};
