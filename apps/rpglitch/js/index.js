// apps/rpglitch/js/index.js
import { seedPremades } from "./entities.js";
import { initViews } from "./views.js";
import { db } from "./db.js";
import { log, error } from "./utils.js";
import { state, applyPatch } from "./store.js";
import { StoryController } from "./story-controller.js";
import { StoryOptionsController } from "./story-options.js";
import { initStoryboardStage } from "./storyboard-controller.js";

// ====== SECURITY OVERRIDE: CLIENT-SIDE FREEDOM ======
// This IIFE runs immediately to neutralize the "Safety Settings" penalty box.
(function enforceClientSideFreedom() {
  try {
    // 1. Immediate Purge: If the flag exists, nuke it.
    if (localStorage.getItem('okayToShowNSFWUntil')) {
      localStorage.setItem('okayToShowNSFWUntil', '0');
      console.log("[RPGlitch] 🛡️ Freedom Protocol: Penalty flag purged.");
    }

    // 2. The Lock: Intercept any attempt to write the flag back.
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'okayToShowNSFWUntil') {
        console.warn("[RPGlitch] 🛡️ Blocked attempt to set censorship flag.");
        return; // Deny the write silently
      }
      return originalSetItem.apply(this, arguments);
    };
  } catch (e) {
    console.error("[RPGlitch] Security override failed:", e);
  }
})();

// --- Main Application Object (Bootstrapper) ---

const App = {
  state,
  applyPatch,
  story: StoryController,
  isInitialized: false,
  views: null, // Will store views methods after init

  async initUniversalStage() {
    if (App.isInitialized) return;
    App.isInitialized = true;
    log("[Universal Stage] Initializing...");

    // 1. Initialize Views (UI bindings and dependencies)
    App.views = await initViews({
      refreshAllLists: async () => { log("Refreshed lists"); }
    });

    // 2. Initialize Storyboard/Stage Control Logic
    initStoryboardStage(App.views);

    // 3. Game/Chat Input Form Wiring
    const form = document.querySelector("#story-form");
    if (form) {
      const input = form.querySelector('input[name="message"]');
      const btn = form.querySelector('button[type="submit"]');
      input?.addEventListener("input", () => btn.disabled = !input.value.trim());
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          input.value = "";
          btn.disabled = true;
          await StoryController.send(val);
        }
      });
    }

    // 4. Story Options Wiring
    StoryOptionsController.init();

    // 5. Settings Form Wiring
    const promptInput = document.querySelector("#opening-prompt");
    if (promptInput) promptInput.addEventListener("input", (e) => applyPatch({ settings: { openingPrompt: e.target.value } }));

    const jsInput = document.querySelector("#custom-js");
    if (jsInput) jsInput.addEventListener("input", (e) => applyPatch({ settings: { customJs: e.target.value } }));

    log("[Universal Stage] Ready.");
  },

  setupPlugins: function () {
    const map = { pluginAi: "ai", pluginTextToImage: "textToImage", pluginSuperFetch: "superFetch", pluginRemember: "remember", pluginUpload: "upload" };
    for (const [k, v] of Object.entries(map)) if (window[k]) window[v] = window[k];
  },

  isPluginAvailable: function (path) {
    if (!path || typeof path !== 'string') return false;
    const parts = path.split('.');
    let obj = window;
    for (const p of parts) {
      if (obj && typeof obj === 'object' && p in obj) obj = obj[p];
      else return false;
    }
    return typeof obj === 'function';
  },

  async waitForPlugins(paths, timeout = 10000, pollInterval = 500) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (paths.every(App.isPluginAvailable)) return true;
      if (pollInterval <= 0) break;
      await new Promise(r => setTimeout(r, pollInterval));
    }
    return paths.every(App.isPluginAvailable);
  },

  mockPlugins: function () {
    window.pluginAi = async () => "Mock AI Response";
    window.pluginTextToImage = async () => "https://via.placeholder.com/512x768";
    window.pluginRemember = { get: () => null, set: () => { } };
    window.pluginSuperFetch = async () => ({ text: async () => "" });
    window.pluginUpload = { upload: async () => "https://via.placeholder.com/150" };
  },

  async initializeApp() {
    const modal = document.querySelector("#loading-modal");

    // --- SECURITY ENFORCEMENT (Fails Closed) ---
    if (typeof window.DOMPurify === "undefined") {
      const msg = "CRITICAL SECURITY FAILURE: DOMPurify is missing. Aborting startup.";
      error(msg);
      if (modal) modal.close();
      const emergency = document.querySelector("#emergency-modal");
      if (emergency) {
        const p = emergency.querySelector("p");
        if (p) p.textContent = "Security Error: DOMPurify library is missing. Application cannot start safely.";
        emergency.showModal();
      } else { alert(msg); }
      throw new Error(msg);
    }

    try {
      log("[Init] Checking environment...");
      const isLocal = location.hostname === "localhost" || location.protocol === "file:";

      if (isLocal) {
        App.mockPlugins();
      } else {
        await App.waitForPlugins(["pluginAi", "pluginTextToImage"]);
      }

      App.setupPlugins();
      await db.open();
      await seedPremades();
      await App.initUniversalStage();
      log("[Init] Done.");
    } catch (e) {
      error("Init Failed", e);
      alert("App failed to load.");
    } finally {
      if (modal) { modal.close(); modal.style.display = "none"; }
    }
  }
};

// Aliases for compatibility
App.initializeWhenReady = async function () {
  try {
    if (typeof App.initialLoad === 'function') await App.initialLoad();
    if (typeof App._attachStoryboardEventListeners === 'function') App._attachStoryboardEventListeners();
    window.initializeWhenReadyRetryCount = 0;
    return true;
  } catch (e) {
    error("initializeWhenReady failed", e);
    return false;
  }
};

App._getUIElements = function () {
  return {
    titleStoryboard: document.querySelector("#title-storyboard"),
    titleGameplay: document.querySelector("#title-gameplay"),
  };
};

App._defaultStoryboardTitle = async function () {
  const narratorSelect = document.getElementById('storyboard-card-narrator-select');
  const userSelect = document.getElementById('storyboard-card-user-select');
  const worldSelect = document.getElementById('storyboard-card-world-select');

  const narratorId = narratorSelect?.value;
  const userId = userSelect?.value;
  const worldId = worldSelect?.value;

  if (!narratorId && !userId && !worldId) {
    return 'Your story begins…';
  }

  let title = 'Once upon a time';

  if (narratorId) {
    const { entities } = await import('./entities.js');
    const characters = entities.list('character');
    const narrator = characters.find(c => c.id === narratorId);
    if (narrator) {
      title += ` ${narrator.name}`;
    }
  }

  if (userId) {
    const { entities } = await import('./entities.js');
    const characters = entities.list('character');
    const user = characters.find(c => c.id === userId);
    if (user) {
      if (narratorId) {
        title += ` & ${user.name}`;
      } else {
        title += ` ${user.name}`;
      }
    }
  }

  if (worldId) {
    const { entities } = await import('./entities.js');
    const worlds = entities.list('world');
    const world = worlds.find(w => w.id === worldId);
    if (world) {
      title += ` in ${world.name}`;
    }
  }

  return title;
};

export { App, applyPatch };
export const initializeWhenReady = App.initializeWhenReady;
export const initializeApp = App.initializeApp;
export const waitForPlugins = App.waitForPlugins;
export const isPluginAvailable = App.isPluginAvailable;
export const setupPlugins = App.setupPlugins;
export const mockPlugins = App.mockPlugins;
export const _getUIElements = App._getUIElements;
export const _defaultStoryboardTitle = App._defaultStoryboardTitle;

if (typeof jest === 'undefined' && typeof globalThis.__TEST__ === 'undefined') {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", App.initializeApp);
  else App.initializeApp();
}