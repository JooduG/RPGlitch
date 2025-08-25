/* eslint-env browser */

(function (global) {
  const App = global.App || (global.App = {});

  function showStoryboard() {
    App.showEl("storyboard-screen");
    App.showEl("chin-container");
    App.hideEl("profile-screen");
    App.hideEl("character-form-screen");
    App.hideEl("world-form-screen");
  }

  function parseHash() {
    const [path] = global.location.hash.slice(1).split("?");
    return path.split("/").filter(Boolean);
  }

  function handleRoute() {
    const [section, type, id] = parseHash();
    const isType = (t) => t === "character" || t === "world";

    if (section === "profile" && isType(type) && id) {
      // Check authorization before accessing profile (allow if no guard provided)
      if (typeof App.canAccessProfile === 'function' && !App.canAccessProfile(type, id)) {
        showStoryboard();
        return;
      }
      App.setTopBarRight?.("profile");
      App.hideEl("storyboard-screen");
      App.hideEl("character-form-screen");
      App.hideEl("world-form-screen");
      App.renderProfile?.(type, id);
    } else if (section === "form" && isType(type)) {
      // Check authorization before accessing form (allow if no guard provided)
      if (typeof App.canAccessForm === 'function' && !App.canAccessForm(type, id)) {
        showStoryboard();
        return;
      }
      App.setTopBarRight?.("form");
      App.hideEl("storyboard-screen");
      App.hideEl("profile-screen");
      App.renderForm?.(type, id || "new");
    } else {
      // Default to storyboard for '#', '#storyboard', or unknown routes
      App.setTopBarRight?.("storyboard");
      showStoryboard();
    }
  }

  // Wiring
  global.addEventListener("hashchange", handleRoute);

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      handleRoute();

      const doc = global.document;

      // Chin tab buttons: ensure base class
      doc.querySelectorAll("button[data-chin]").forEach((btn) => {
        btn.classList.add("chin-button");
      });


      // Prevent search form reload; convert button to clear
      doc.querySelectorAll('form[role="search"]').forEach((form) => {
        form.addEventListener("submit", (e) => e.preventDefault());
        const btn = form.querySelector("button");
        if (btn) {
          btn.type = "button";
          btn.addEventListener("click", () => {
            form.querySelectorAll('input[type="search"]').forEach((i) => {
              i.value = "";
            });
            App.refreshAllLists?.();
          });
        }
      });
    },
    { once: true }
  );

  // Router surface
  App.router = {
    navigate(hash) {
      global.location.hash = hash;
    },
    parseHash,
    handleRoute,
  };


})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
  const doc = global.document;
  const App = global.App || (global.App = {});

  function getButtonForChin(chinEl) {
    const name = chinEl?.dataset?.chin || (chinEl.id || "").replace(/^chin-/, "");
    if (!name) return null;
    return doc.querySelector(`button[data-chin="${CSS.escape(name)}"]`);
  }

  function syncButton(chinEl) {
    const btn = getButtonForChin(chinEl);
    if (!btn) return;
    const open = chinEl && !chinEl.hasAttribute("hidden");
    btn.classList.toggle("selected", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-selected", String(open));
  }

  function syncBodyFlag() {
    const anyOpen = !!doc.querySelector('.chin:not([hidden])');
    doc.body.classList.toggle('chin-open', anyOpen);
  }

  function observeChins() {
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'hidden') {
          syncButton(m.target);
        }
      }
      syncBodyFlag();
    });
    doc.querySelectorAll('.chin').forEach((chin) => {
      mo.observe(chin, { attributes: true, attributeFilter: ['hidden'] });
      syncButton(chin);
    });
    syncBodyFlag();
  }

  function bindTopBarButtons() {
    doc.querySelectorAll('button[data-chin]').forEach((btn) => {
      btn.classList.add('chin-button');
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-chin');
        const panel = doc.querySelector(`.chin[data-chin="${CSS.escape(name)}"], #chin-${CSS.escape(name)}`);
        if (!panel) return;
        const willOpen = panel.hasAttribute('hidden');
        if (willOpen) {
          App._toggleChinContent?.(name);
        } else {
          App._closeChin?.();
        }
        syncButton(panel);
        syncBodyFlag();
      });
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', () => {
      bindTopBarButtons();
      observeChins();
    }, { once: true });
  } else {
    bindTopBarButtons();
    observeChins();
  }
})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
  // removed: card click handling now in RPGlitch.js
})(typeof window !== "undefined" ? window : globalThis);
