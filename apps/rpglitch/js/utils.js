// apps/rpglitch/js/utils.js
/* Utility helpers for RPGlitch
 * Safe storage, DOM helpers, chin management
 */

(function (global) {
  const App = (global.App = global.App || {});

  // ---------- Debug Logger ----------
  App.debug = App.debug ?? true;
  App.log = function (...args) {
    if (App.debug) console.log("[RPGlitch]", ...args);
  };

  // ---------- Safe JSON & Storage ----------
  App.safeJSONParse = function (str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.warn("⚠️ Failed to parse JSON:", e.message);
      return fallback;
    }
  };

  App.safeLocalStorageGet = function (key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? App.safeJSONParse(raw, fallback) : fallback;
    } catch (e) {
      console.warn(`⚠️ Storage error for key "${key}"`, e.message);
      return fallback;
    }
  };

  // ---------- Debounce ----------
  App.debounce =
    App.debounce ||
    function (fn, wait = 250) {
      let t;
      return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    };

  // ---------- Show / Hide ----------
  App.hideEl = function (el) {
    if (!el) return;
    el.setAttribute("hidden", "");
    el.classList.remove("is-open");
  };
  App.showEl = function (el) {
    if (!el) return;
    el.removeAttribute("hidden");
    el.classList.add("is-open");
  };

  // ---------- Branding ----------
  // Deterministic brand color (mirrors entities.js logic)
  function getDeterministicColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 40%, 60%)`;
  }
  App.deriveBrand = App.deriveBrand || function (entity = {}) {
    if (entity && typeof entity === "object") {
      if (entity.palette && typeof entity.palette === "object" && entity.palette.brand)
        return entity.palette.brand;
      if (entity.brandColor) return entity.brandColor;
      if (entity.color) return entity.color;
    }
    const seed = [entity?.name || entity?.title || "", ...(entity?.tags || [])].join(",") || entity?.id || entity?.kind || "";
    return getDeterministicColor(String(seed));
  };

  App.applyBrand = function (container, entity) {
    if (!container) return;
    const color = App.deriveBrand?.(entity || {}) || "";
    if (color) {
      const c = String(color);
      container.style.setProperty("--brand-color", c);
      container.style.setProperty("--brand", c);
      container.classList.add("has-brand");
    } else {
      container.style.removeProperty("--brand-color");
      container.style.removeProperty("--brand");
      container.classList.remove("has-brand");
    }
  };

  // ---------- Selection helper ----------
  App.setSelected = function (el, all) {
    if (!el || !all) return;
    Array.from(all).forEach((node) =>
      node.classList.toggle("selected", node === el)
    );
  };

  // ---------- Hash query (used by forms/navigation) ----------
  App.getHashQuery = function () {
    const h = global.location?.hash || "";
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
  };

  // ---------- Image helper ----------
  App.getPictureNode =
    App.getPictureNode ||
    function getPictureNode(entity, opts = {}) {
      const html =
        (global.getPictureHTML || globalThis.getPictureHTML)?.(
          entity || {},
          opts
        ) || "";
      const frag = global.document.createRange().createContextualFragment(html);
      return frag.firstElementChild || global.document.createElement("div");
    };

  // ---------- Navigation shims ----------
  App.navigateBackOrReturnDefault =
    App.navigateBackOrReturnDefault ||
    function (returnTo = "#storyboard") {
      const q = App.getHashQuery?.() || new URLSearchParams("");
      const fallback = q.get("return") || returnTo;
      App.router?.navigate?.(fallback);
    };

  App.goBackWithFallback =
    App.goBackWithFallback ||
    function (returnTo = "#storyboard", fallback = "#storyboard") {
      try {
        App.navigateBackOrReturnDefault?.(returnTo) ??
          App.router?.navigate(fallback);
      } catch {
        App.router?.navigate?.(fallback);
      }
    };

  // ---------- Chin open/close & focus visuals ----------
  App._closeChin = function () {
    const container = document.getElementById("chin-container");
    if (!container) return;
    container.querySelectorAll(".chin").forEach((p) => App.hideEl(p));
    App.hideEl(container);
    App.selectTopBarTab?.(null);
  };

  App._closeChin = (function (prev) {
    return function (...args) {
      prev?.apply(this, args);
      requestAnimationFrame(() => {
        global.document.activeElement?.blur();
        global.document.body.classList.remove("chin-open");
      });
    };
  })(App._closeChin);

  App._toggleChinContent = function (chin) {
    const container = document.getElementById("chin-container");
    if (!container) return;

    const panels = container.querySelectorAll(".chin");
    const target = chin
      ? container.querySelector(`[data-chin="${chin}"]`)
      : null;

    // Hide everything first
    panels.forEach((panel) => App.hideEl(panel));
    App.hideEl(container);
    document.body.classList.remove("chin-open");

    if (!target || target.classList.contains("is-open")) return;

    // Open requested panel
    App.showEl(container);
    App.showEl(target);
    document.body.classList.add("chin-open");

    const input = target.querySelector(".chin-search");
    if (input) input.focus();

    const c = target.dataset.chin;
    if (c === "stories" && typeof App.renderStoryList === "function")
      App.renderStoryList();
    if (c === "characters" && typeof App.renderCharacterList === "function")
      App.renderCharacterList();
    if (c === "worlds" && typeof App.renderWorldList === "function")
      App.renderWorldList();
  };

  // Ensure we close chin on ESC / outside click / route change
  App._ensureGlobalChinEvents = function () {
    if (App._chinEventsBound) return;
    App._chinEventsBound = true;

    window.addEventListener("hashchange", App._closeChin, { passive: true });
    document.addEventListener(
      "click",
      (e) => {
        // Do not close chin when interacting with storyboard selects or when
        // blur suppression is active (prevents native picker from instantly dismissing).
        if (typeof App !== "undefined" && App._suppressNextBlur) return;

        const storyboard = document.getElementById("storyboard-grid");
        if (storyboard && storyboard.contains(e.target)) return;

        const inside = e.target.closest?.("#chin-container, [data-open-chin]");
        if (!inside) App._closeChin();
      },
      { capture: true }
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") App._closeChin();
    });
  };

  // ---------- Profile layout sizing (left image column width) ----------
  App.setProfileLayoutSizing = function (ratio = 0.35) {
    try {
      const doc = global.document;
      const topBar = doc.getElementById("top-bar");
      const header = topBar?.closest("header") || doc.querySelector("header");
      const container = header?.classList.contains("container")
        ? header
        : header?.closest?.(".container") || header;
      const rect = container?.getBoundingClientRect?.();
      const vw = global.innerWidth || doc.documentElement.clientWidth || 1280;
      const refWidth = Math.max(0, rect?.width || vw);
      const leftWidth = Math.round(
        Math.max(260, Math.min(refWidth * ratio, Math.min(520, vw * 0.45)))
      );
      const containerMargin = Math.max(0, Math.round((vw - refWidth) / 2));
      doc.documentElement.style.setProperty(
        "--profile-left-width",
        `${leftWidth}px`
      );
      doc.documentElement.style.setProperty(
        "--container-margin",
        `${containerMargin}px`
      );
    } catch {
      /* ignore */
    }
  };
})(this);
