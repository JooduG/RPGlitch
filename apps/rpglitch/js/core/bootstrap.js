// apps/rpglitch/js/index.js
import { seedPremades } from "../data/repo.js";
import { initViews } from "../ui/orchestrator.js";
import { db } from "./db.js";
import { log, error, initDebugMode, mockPlugins } from "./utils.js";
import { state, applyPatch } from "./state.js";
import { StoryController } from "../engine/director.js";
import { StoryOptionsController } from "../ui/components/settings.js";
import { initStoryboardStage, StoryboardController } from "../ui/setup.js";
import { initChatInput } from "../ui/components/chat/input.js";

// ====== SECURITY OVERRIDE: CLIENT-SIDE FREEDOM ======
(function enforceClientSideFreedom() {
  try {
    if (localStorage.getItem("okayToShowNSFWUntil")) {
      localStorage.setItem("okayToShowNSFWUntil", "0");
      console.log("[RPGlitch] 🛡️ Freedom Protocol: Penalty flag purged.");
    }
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "okayToShowNSFWUntil") {
        console.warn("[RPGlitch] 🛡️ Blocked attempt to set censorship flag.");
        return;
      }
      return originalSetItem.apply(this, arguments);
    };
  } catch (e) {
    console.error("[RPGlitch] Security override failed:", e);
  }
})();

// --- Main Application Object Bootstrapper ---

const App = {
  state,
  applyPatch,
  story: StoryController,
  isInitialized: false,
  views: null,

  async initUniversalStage() {
    if (App.isInitialized) return;
    App.isInitialized = true;
    log("[Universal Stage] Initializing...");

    window.StoryController = StoryController;
    window.StoryboardController = StoryboardController;
    window.StoryOptionsController = StoryOptionsController;

    try {
      console.log("[Universal Stage] Initializing Views...");
      // 1. Initialize Views
      App.views = await initViews({
        refreshAllLists: async () => {
          log("Refreshed lists");
        },
        onSelectionChanged: (sel) => {
          applyPatch({
            selectedAI: sel.aiCharacter,
            selectedUser: sel.userCharacter,
            selectedFractal: sel.fractal,
          });
        },
      });
      console.log("[Universal Stage] Views Initialized.");

      console.log("[Universal Stage] Initializing Storyboard Stage...");
      // 2. Initialize Storyboard Stage
      initStoryboardStage(App.views);
      console.log("[Universal Stage] Storyboard Stage Initialized.");

      // --- CLOCK UPDATE ---
      setInterval(() => {
        const clock = document.getElementById("phone-clock");
        if (clock && !clock.hidden) {
          clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }
      }, 1000);

      // --- KEYBOARD SHORTCUTS ---
      // 3. Bind Chat Input Events
      initChatInput();

      // 4. Story Options Wiring
      StoryOptionsController.init();

      // 5. Settings Form Wiring
      const directorToggle = document.querySelector("#setting-director-mode");
      if (directorToggle) {
        directorToggle.checked = state.settings.directorMode;
        directorToggle.addEventListener("change", (e) =>
          applyPatch({ settings: { directorMode: e.target.checked } }),
        );
      }

      log("[Universal Stage] Ready.");

      const loadingModal = document.getElementById("loading-modal");
      if (loadingModal) loadingModal.close();
      console.log("[Universal Stage] Loading modal closed.");
    } catch (e) {
      console.error("[Universal Stage] Initialization failed:", e);
      const emergencyModal = document.getElementById("emergency-modal");
      if (emergencyModal) emergencyModal.showModal();
    }
  },

  setupPlugins: function () {
    const map = {
      pluginAi: "ai",
      pluginTextToImage: "textToImage",
      pluginSuperFetch: "superFetch",
      pluginRemember: "remember",
      pluginUpload: "upload",
    };
    for (const [k, v] of Object.entries(map))
      if (window[k]) window[v] = window[k];
  },

  isPluginAvailable: function (path) {
    if (!path || typeof path !== "string") return false;
    const parts = path.split(".");
    let obj = window;
    for (const p of parts) {
      if (obj && typeof obj === "object" && p in obj) obj = obj[p];
      else return false;
    }
    return typeof obj === "function";
  },

  async waitForPlugins(paths, timeout = 10000, pollInterval = 500) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (paths.every(App.isPluginAvailable)) return true;
      if (pollInterval <= 0) break;
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    return paths.every(App.isPluginAvailable);
  },

  async waitForConfig(timeout = 5000) {
    const start = Date.now();
    // Wait for window.rpgLists (injected by left panel)
    while (!window.rpgLists && Date.now() - start < timeout) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (window.rpgLists) {
      console.log(
        "[RPGlitch] Config loaded successfully:",
        Object.keys(window.rpgLists),
      );
    } else {
      console.warn("[RPGlitch] ⚠️ Config timeout. Using internal defaults.");
    }
  },

  // mockPlugins moved to core-utils.js

  async initializeApp() {
    const modal = document.querySelector("#loading-modal");

    if (typeof window.DOMPurify === "undefined") {
      const msg =
        "CRITICAL SECURITY FAILURE: DOMPurify is missing. Aborting startup.";
      error(msg);
      if (modal) modal.close();
      alert(msg);
      throw new Error(msg);
    }

    try {
      log("[Init] Checking environment...");
      const isLocal =
        location.hostname === "localhost" || location.protocol === "file:";

      await initDebugMode();

      if (isLocal) {
        mockPlugins();
      } else {
        await App.waitForPlugins(["pluginAi", "pluginTextToImage"]);
      }

      App.setupPlugins();
      await App.waitForConfig(2000);
      await db.open();

      // Always run the seeder to replenish deleted factory items
      await seedPremades();

      await App.initUniversalStage();

      log("[Init] Done.");
    } catch (e) {
      error("Init Failed", e);
      alert("App failed to load.");
    } finally {
      if (modal) {
        modal.close();
        modal.style.display = "none";
      }
    }
  },
};

App.initializeWhenReady = async function () {
  try {
    if (typeof App.initialLoad === "function") await App.initialLoad();
    if (typeof App._attachStoryboardEventListeners === "function")
      App._attachStoryboardEventListeners();
    window.initializeWhenReadyRetryCount = 0;
    return true;
  } catch (e) {
    error("initializeWhenReady failed", e);
    return false;
  }
};

export { App, applyPatch };
export const initializeWhenReady = App.initializeWhenReady;
export const initializeApp = App.initializeApp;
export const waitForPlugins = App.waitForPlugins;
export const isPluginAvailable = App.isPluginAvailable;
export const setupPlugins = App.setupPlugins;
export const mockPluginsOriginal = mockPlugins;

if (typeof jest === "undefined" && typeof globalThis.__TEST__ === "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", App.initializeApp);
  else App.initializeApp();
}
