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
    // Defensive: ensure any loading overlays are dismissed on navigation
    try { App.dismissLoadingUI?.(); } catch (e) { void e; }
    const [section, type, id] = parseHash();
    const isType = (t) => t === "character" || t === "world";
    App.chin?.closeAll?.();
    try { App.log?.('router.handleRoute', { section, type, id }); } catch (e) { void e; }
    if (section === "profile" && isType(type) && id) {
      // Check authorization before accessing profile (allow if no guard provided)
      if (
        typeof App.canAccessProfile === "function" &&
        !App.canAccessProfile(type, id)
      ) {
        showStoryboard();
        return;
      }
      App.setTopBarRight?.("profile");
      App.hideEl("storyboard-screen");
      App.hideEl("character-form-screen");
      App.hideEl("world-form-screen");
      App.renderProfile?.(type, id);
      try { App.chin?.closeAll?.(); App.dismissLoadingUI?.(); App.unlockNow?.(); } catch (e) { void e; }
    } else if (section === "form" && isType(type)) {
      // Check authorization before accessing form (allow if no guard provided)
      if (
        typeof App.canAccessForm === "function" &&
        !App.canAccessForm(type, id)
      ) {
        showStoryboard();
        return;
      }
      App.setTopBarRight?.("form");
      App.hideEl("storyboard-screen");
      App.hideEl("profile-screen");
      App.renderForm?.(type, id || "new");
      try { App.chin?.closeAll?.(); App.dismissLoadingUI?.(); App.unlockNow?.(); } catch (e) { void e; }
    } else {
      // Default to storyboard for '#', '#storyboard', or unknown routes
      App.setTopBarRight?.("storyboard");
      showStoryboard();
      // Ensure a visible default chin when route is unknown (e.g., '#edit')
      try { App.chin?.open?.('stories'); App.log?.('router.defaultedToStories'); } catch (e) { void e; }
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
  // removed: card click handling now in RPGlitch.js
})(typeof window !== "undefined" ? window : globalThis);
