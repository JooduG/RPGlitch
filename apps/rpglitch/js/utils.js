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
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), wait);
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
    for (let i = 0; i < seed.length; i++)
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 40%, 60%)`;
  }
  App.deriveBrand =
    App.deriveBrand ||
    function (entity = {}) {
      if (entity && typeof entity === "object") {
        if (
          entity.palette &&
          typeof entity.palette === "object" &&
          entity.palette.brand
        )
          return entity.palette.brand;
        if (entity.brandColor) return entity.brandColor;
        if (entity.color) return entity.color;
      }
      const seed =
        [entity?.name || entity?.title || "", ...(entity?.tags || [])].join(
          ","
        ) ||
        entity?.id ||
        entity?.kind ||
        "";
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

  // ---------- Chin controls ----------
  App.chin = (function (doc) {
    const container = () => doc.getElementById("chin-container");

    function getButtons() {
      return container()?.querySelectorAll("[data-chin]") || doc.querySelectorAll("header [data-chin]");
    }

    function getPanels() {
      return container()?.querySelectorAll(".chin[data-chin]") || doc.querySelectorAll(".chin[data-chin]");
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
      const cont = container();
      if (anyOpen) {
        cont?.removeAttribute("hidden");
        doc.body.classList.add("chin-open");
      } else {
        cont?.setAttribute("hidden", "");
        doc.body.classList.remove("chin-open");
      }
    }

    function closeAll() {
      getPanels().forEach((p) => p.setAttribute("hidden", ""));
      return sync();
    }

    function close(name) {
      const panel = [...getPanels()].find((p) => p.dataset.chin === name);
      if (panel) panel.setAttribute("hidden", "");
      sync();
    }

    function open(name) {
      if (!name) return;
      const panels = getPanels();
      panels.forEach((p) => {
        if (p.dataset.chin === name) {
          p.removeAttribute("hidden");
          const focusTarget =
            p.querySelector("[tabindex], button, input, select, textarea, a") ||
            p;
          focusTarget.focus?.();
        } else {
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

    function init() {
      const buttons = getButtons();
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const name = btn.dataset.chin;
          const panel = [...getPanels()].find((p) => p.dataset.chin === name);
          const hidden = panel?.hasAttribute("hidden");
          if (hidden) open(name);
          else close(name);
        });
      });
      if (!App._chinEscBound) {
        doc.addEventListener("keydown", (e) => {
          if (e.key === "Escape") App.chin.closeAll();
        });
        App._chinEscBound = true;
      }
      const observer = new MutationObserver(sync);
      getPanels().forEach((p) =>
        observer.observe(p, { attributes: true, attributeFilter: ["hidden"] })
      );
      const cont = container();
      if (cont)
        observer.observe(cont, { attributes: true, attributeFilter: ["hidden"] });
      sync();
    }

    return { getButtons, getPanels, open, close, closeAll, toggle, sync, init };
  })(global.document);

  App._toggleChinContent = function (name) {
    App.chin.toggle(name);
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
