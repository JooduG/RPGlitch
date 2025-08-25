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

  // ---------- Chin Management ----------
  App.chin = App.chin || {};

  App.chin.getButtons = function () {
    return document.querySelectorAll("#top-bar-left [data-chin]");
  };

  App.chin.getPanels = function () {
    return document.querySelectorAll("#chin-container .chin[data-chin]");
  };

  App.chin.open = function (name) {
    if (!name) return;
    const container = document.getElementById("chin-container");
    const panels = App.chin.getPanels();
    let target = null;
    panels.forEach((p) => {
      if (p.dataset.chin === name) {
        target = p;
        App.showEl(p);
      } else {
        App.hideEl(p);
      }
    });
    if (container) App.showEl(container);
    const buttons = App.chin.getButtons();
    buttons.forEach((btn) => {
      const active = btn.dataset.chin === name;
      btn.classList.toggle("selected", active);
      btn.setAttribute("aria-selected", String(active));
      btn.setAttribute("aria-expanded", String(active));
      btn.tabIndex = active ? 0 : -1;
    });
    document.body.classList.add("chin-open");
    if (target) {
      const focusEl =
        target.querySelector(
          "input, button, select, textarea, a[href], [tabindex]:not([tabindex='-1'])"
        ) || target;
      focusEl.focus();
    }
  };

  App.chin.close = function (name) {
    const panels = App.chin.getPanels();
    let changed = false;
    panels.forEach((p) => {
      if (!name || p.dataset.chin === name) {
        App.hideEl(p);
        changed = true;
      }
    });
    if (!name) {
      const container = document.getElementById("chin-container");
      if (container) App.hideEl(container);
    }
    const buttons = App.chin.getButtons();
    buttons.forEach((btn) => {
      if (!name || btn.dataset.chin === name) {
        btn.classList.remove("selected");
        btn.setAttribute("aria-selected", "false");
        btn.setAttribute("aria-expanded", "false");
        btn.tabIndex = -1;
      }
    });
    App.chin.sync();
    return changed;
  };

  App.chin.closeAll = function () {
    App.chin.close();
  };

  App.chin.sync = function () {
    const buttons = App.chin.getButtons();
    const panels = App.chin.getPanels();
    let anyOpen = false;
    buttons.forEach((btn, idx) => {
      const panel = Array.from(panels).find(
        (p) => p.dataset.chin === btn.dataset.chin
      );
      const open = panel && !panel.hasAttribute("hidden");
      btn.classList.toggle("selected", open);
      btn.setAttribute("aria-selected", String(open));
      btn.setAttribute("aria-expanded", String(open));
      btn.tabIndex = open ? 0 : -1;
      if (open) anyOpen = true;
    });
    if (!anyOpen && buttons[0]) buttons[0].tabIndex = 0;
    document.body.classList.toggle("chin-open", anyOpen);
  };

  App.chin.init = function () {
    const container = document.getElementById("chin-container");
    const buttons = App.chin.getButtons();

    buttons.forEach((btn, idx) => {
      if (btn._chinBound) return;
      btn.addEventListener("click", () => {
        const name = btn.dataset.chin;
        const panel = Array.from(App.chin.getPanels()).find(
          (p) => p.dataset.chin === name
        );
        const hidden = panel ? panel.hasAttribute("hidden") : true;
        if (hidden) App.chin.open(name);
        else App.chin.closeAll();
      });
      btn.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const all = Array.from(App.chin.getButtons());
        const next = (idx + dir + all.length) % all.length;
        all[next].focus();
      });
      btn._chinBound = true;
    });

    if (!App._chinObserver) {
      const obs = new MutationObserver(App.chin.sync);
      App.chin.getPanels().forEach((p) =>
        obs.observe(p, { attributes: true, attributeFilter: ["hidden"] })
      );
      if (container)
        obs.observe(container, { attributes: true, attributeFilter: ["hidden"] });
      App._chinObserver = obs;
    }

    if (!App._outsideChinClickBound) {
      document.addEventListener("click", (e) => {
        const c = document.getElementById("chin-container");
        const left = document.getElementById("top-bar-left");
        if (!c || c.hasAttribute("hidden")) return;
        if (c.contains(e.target) || left.contains(e.target)) return;
        App.chin.closeAll();
      });
      App._outsideChinClickBound = true;
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") App.chin.closeAll();
    });

    App.chin.sync();
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
