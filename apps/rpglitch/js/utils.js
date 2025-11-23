// apps/rpglitch/js/utils.js
import { db } from "./db.js";
import { SIGNATURE_COLORS } from "./validation.js";

/* Utility helpers for RPGlitch
 * Safe storage, DOM helpers, chin management
 */

// Re-export SIGNATURE_COLORS as BASE_COLOUR_MAP for backward compatibility
export const BASE_COLOUR_MAP = SIGNATURE_COLORS;

// Removed: AUTO_UNLOCK_DELAYS_MS (Watchdog relic)

export function generateUUID() {
  let d = new Date().getTime();
  let d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  // WARNING: This is NOT a sanitizer. It only escapes HTML for display in text.
  // For safe HTML, use DOMPurify.
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- Error Handling ----------

export async function handleAsyncError(asyncFn, options = {}) {
  const {
    errorMessage = "An error occurred. Please try again.",
    context = "operation",
    showAlert = true,
    fallback = null,
  } = options;

  try {
    return await asyncFn();
  } catch (err) {
    error(`Failed to ${context}:`, err);
    if (showAlert) window.alert(errorMessage);
    return fallback;
  }
}

export function isHtmlErrorPage(text) {
  if (typeof text !== "string") return false;
  const trimmedText = text.trim().toLowerCase();
  return trimmedText.startsWith("<!doctype") || trimmedText.startsWith("<html");
}

// ---------- Event Handler Utilities ----------

export function replaceEventHandler(element, eventType, handler, handlerKey = "_handler") {
  if (!element) return;
  if (element[handlerKey]) element.removeEventListener(eventType, element[handlerKey]);
  element.addEventListener(eventType, handler);
  element[handlerKey] = handler;
}

// ---------- Debug Logger ----------

let isDebug = false;

export async function initDebugMode() {
  try {
    const settings = await db.settings.get("app-settings");
    if (settings && typeof settings.debugMode !== "undefined") {
      isDebug = !!settings.debugMode;
    }
  } catch (e) {
    console.error("[RPGlitch] Failed to load debug mode:", e);
    isDebug = false;
  }
  return isDebug;
}

export function log(...args) {
  if (isDebug) console.log("[RPGlitch]", ...args);
}

export function error(...args) {
  console.error("[RPGlitch]", ...args);
}

export async function setDebug(on) {
  isDebug = !!on;
  try {
    let settings = await db.settings.get("app-settings");
    if (!settings) settings = { id: "app-settings" };
    settings.debugMode = isDebug;
    await db.settings.put(settings);
  } catch (e) {
    error("Failed to save debug mode to settings:", e);
  }
  return isDebug;
}

// ---------- Debounce ----------
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

// ---------- Show / Hide ----------
export function hideEl(el, doc = document) {
  try {
    if (typeof el === "string") el = doc.querySelector(el.startsWith("#") ? el : `#${el}`);
    if (!el) return;
    el.hidden = true;
    el.classList.remove("is-open");
  } catch { /* ignore */ }
}

export function showEl(el, doc = document) {
  try {
    if (typeof el === "string") el = doc.querySelector(el.startsWith("#") ? el : `#${el}`);
    if (!el) return;
    el.hidden = false;
    el.classList.add("is-open");
  } catch { /* ignore */ }
}

// ---------- Loading/Overlay helpers ----------

/**
 * Cleanly closes the loading modal. 
 * Relies on the standard Dialog API usage.
 */
export function dismissLoadingUI() {
  const modal = document.querySelector("#loading-modal");
  if (modal) {
    try {
      if (typeof modal.close === "function") modal.close();
    } catch (e) { void 0; }
    modal.style.display = "none";
    modal.removeAttribute("open");
  }
}

// ---------- Selection helper ----------
export function setChosen(el, all) {
  if (!el || !all) return;
  Array.from(all).forEach((node) => node.classList.toggle("chosen", node === el));
}

// ---------- Hash query ----------
export function getHashQuery() {
  const h = location?.hash || "";
  const qIndex = h.indexOf("?");
  const q = qIndex >= 0 ? h.slice(qIndex + 1) : "";
  try {
    return new URLSearchParams(q);
  } catch {
    const params = new URLSearchParams();
    q.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) params.set(decodeURIComponent(k), decodeURIComponent(v || ""));
    });
    return params;
  }
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
      chip.style.backgroundColor = BASE_COLOUR_MAP[entity.signatureColour];
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

    if (t === "Premade" && entity.signatureColour && entity.signatureColour !== "default") {
      chip.style.backgroundColor = BASE_COLOUR_MAP[entity.signatureColour];
      chip.style.color = "white";
    }
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}

// ---------- Navigation shims ----------
export function navigateBackOrReturnDefault(returnTo = "#storyboard", router) {
  const q = getHashQuery?.() || new URLSearchParams("");
  const fallback = q.get("return") || returnTo;
  router?.navigate?.(fallback);
}

export function goBackWithFallback(returnTo = "#storyboard", fallback = "#storyboard", router) {
  try {
    navigateBackOrReturnDefault?.(returnTo, router) ?? router?.navigate(fallback);
  } catch {
    router?.navigate?.(fallback);
  }
}

// ---------- Top Bar ----------
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
  Object.values(sectionMap).forEach((sec) => sec && hideEl(sec));
  if (sectionMap[mode]) showEl(sectionMap[mode]);
}

// ---------- Chin controls ----------

function getButtons() {
  return document.querySelectorAll("header [data-chin], #chin-container [data-chin]");
}

function getPanels() {
  const container = () => document.querySelector("#chin-container");
  return (
    container()?.querySelectorAll(".chin[data-chin]") ||
    document.querySelectorAll(".chin[data-chin]")
  );
}

function sync() {
  const buttons = getButtons();
  const panels = getPanels();
  let anyOpen = false;
  panels.forEach((panel) => {
    const name = panel.dataset.chin;
    const hidden = panel.hasAttribute("hidden");
    const btn = [...buttons].find((b) => b.dataset.chin === name);
    const selected = !hidden;
    if (btn) {
      btn.classList.toggle("selected", selected);
      btn.setAttribute("aria-selected", selected ? "true" : "false");
      btn.setAttribute("aria-expanded", selected ? "true" : "false");
      btn.setAttribute("tabindex", selected ? "0" : "-1");
    }
    if (selected) anyOpen = true;
  });
  const cont = document.querySelector("#chin-container");
  if (cont && cont.style) {
    cont.style.pointerEvents = anyOpen ? "auto" : "none";
  }
  const bd = document.querySelector("#chin-backdrop");
  if (bd) {
    if (anyOpen) {
      bd.removeAttribute("hidden");
      bd.style.pointerEvents = "auto";
      bd.style.display = "block";
    } else {
      bd.setAttribute("hidden", "");
      bd.style.pointerEvents = "none";
      bd.style.display = "none";
    }
  }
  if (anyOpen) {
    cont?.removeAttribute("hidden");
    cont?.setAttribute("aria-hidden", "false");
    cont?.style.setProperty("display", "block");
    document.body.classList.add("chin-open");
  } else {
    if (document.activeElement && cont?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    cont?.setAttribute("hidden", "");
    cont?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("chin-open");
  }
  log?.("chin.sync", { anyOpen });
}

function closeAll() {
  getPanels().forEach((p) => p.setAttribute("hidden", ""));
  sync();
  log?.("chin.closeAll");
}

function open(name) {
  if (!name) return;
  const panels = getPanels();
  panels.forEach((p) => {
    if (p.dataset.chin === name) {
      p.hidden = false;
      p.removeAttribute("hidden");
      const focusTarget = p.querySelector("[tabindex], button, input, select, textarea, a") || p;
      focusTarget.focus?.();
    } else {
      p.hidden = true;
      p.setAttribute("hidden", "");
    }
  });
  sync();
}

function close(name) {
  if (!name) return;
  const panels = getPanels();
  panels.forEach((p) => {
    if (p.dataset.chin === name) {
      p.hidden = true;
      p.setAttribute("hidden", "");
    }
  });
  sync();
}

function toggle(name) {
  const panel = [...getPanels()].find((p) => p.dataset.chin === name);
  if (!panel) return;
  if (panel.hasAttribute("hidden")) open(name);
  else close(name);
}

let chinBound = false;
function initChin() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChin);
    return;
  }
  const doc = document;
  const cont = document.querySelector("#chin-container");
  if (cont && !document.querySelector("#chin-backdrop")) {
    const bd = doc.createElement("div");
    bd.id = "chin-backdrop";
    bd.setAttribute("hidden", "");
    bd.setAttribute("aria-hidden", "true");
    cont.prepend(bd);
  }
  const bd = document.querySelector("#chin-backdrop");
  if (bd && !bd._bound) {
    bd.addEventListener("click", () => {
      closeAll();
      dismissLoadingUI();
    });
    bd._bound = true;
  }
  const buttons = getButtons();
  buttons.forEach((btn) => {
    if (btn._chinBound) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = btn.dataset.chin;
      toggle(name);
    });
    btn._chinBound = true;
  });
  if (!chinBound) {
    const topBar = doc.querySelector("#top-bar");
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
    doc.addEventListener("click", (e) => {
      if (topBar && topBar.contains(e.target)) return;
      if (e.target.closest(".chin")) return;
      closeAll();
    });
    chinBound = true;
  }
  sync();
}

export const chin = {
  getButtons,
  getPanels,
  open,
  close,
  closeAll,
  toggle,
  sync,
  init: initChin,
};

export function toggleChinContent(name) {
  chin.toggle(name);
}