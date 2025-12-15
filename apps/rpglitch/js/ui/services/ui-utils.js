import { SIGNATURE_COLORS, mixHex } from "../../core/utils.js";

// --- UI Helpers (Chin, TopBar) ---

export const chin = {
  init: () => {
    document.addEventListener("click", (e) => {
      const container = document.getElementById("chin-container");
      if (!container || container.hidden) return;
      if (e.target.id === "chin-backdrop") {
        chin.closeAll();
      }
    });
    document.querySelectorAll("[data-chin]").forEach((btn) => {
      if (btn.dataset.chinInitialized) return;
      if (btn.tagName === "BUTTON" || btn.getAttribute("role") === "button") {
        btn.dataset.chinInitialized = "true";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = btn.getAttribute("data-chin");
          chin.toggle(name);
        });
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
  const baseColor = SIGNATURE_COLORS[signatureKey];

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

  const rawSrc = entity.profilePictureUrl;
  const src = typeof rawSrc === "string" && rawSrc.trim() ? rawSrc.trim() : "";

  const signature = getSignature(entity);
  const contrast = "#fff";

  const wrap = document.createElement("div");
  let aspectRatioClass = "";
  if (landscape === true) aspectRatioClass = " picture--landscape";
  else if (landscape === false) aspectRatioClass = " picture--portrait";

  wrap.className = `picture${cover ? " picture--cover" : ""}${aspectRatioClass}`;
  wrap.style.setProperty("--signature", signature);
  wrap.style.setProperty("--signature-contrast", contrast);
  wrap.style.backgroundColor = "var(--signature)";

  if (src) {
    const img = document.createElement("img");
    img.alt = `${type} image for ${title}`;
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
    return wrap;
  }

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

    if (entity.signatureColour && entity.signatureColour !== "default") {
      chip.style.backgroundColor = SIGNATURE_COLORS[entity.signatureColour];
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
      entity.signatureColour &&
      entity.signatureColour !== "default"
    ) {
      chip.style.backgroundColor = SIGNATURE_COLORS[entity.signatureColour];
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
