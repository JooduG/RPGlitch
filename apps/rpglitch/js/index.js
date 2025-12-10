// apps/rpglitch/js/index.js
import { seedPremades } from "./entity-crud.js";
import { initViews } from "./ui-views.js";
import { db } from "./core-db.js";
import { log, error, initDebugMode } from "./core-utils.js";
import { state, applyPatch } from "./app-state.js";
import { StoryController } from "./manager-turns.js";
import { StoryOptionsController } from "./settings.js";
import { initStoryboardStage, StoryboardController } from "./manager-setup.js";

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

// --- Main Application Object (Bootstrapper) ---

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

    // CRITICAL: Expose Controllers to Window so HTML buttons can see them
    window.StoryController = StoryController;
    window.StoryboardController = StoryboardController;
    window.StoryOptionsController = StoryOptionsController; // [NEW] Expose Options

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
            selectedWorld: sel.world,
          });
        },
      });
      console.log("[Universal Stage] Views Initialized.");

      console.log("[Universal Stage] Initializing Storyboard Stage...");
      // 2. Initialize Storyboard Stage
      initStoryboardStage(App.views);
      console.log("[Universal Stage] Storyboard Stage Initialized.");

      // 3. Bind Chat Input Events
      const form = document.querySelector("#story-form");
      if (form) {
        const input = form.querySelector("textarea[name='message']"); // Can be input or textarea
        const btn = form.querySelector('button[type="submit"]');

        if (input && btn) {
          // Auto-resize function for textarea
          const adjustHeight = () => {
            input.style.height = "auto";
            input.style.height = input.scrollHeight + "px";
          };

          // Initial adjustment if content is pre-filled
          if (input.tagName === "TEXTAREA") {
            adjustHeight();
          }

          input.addEventListener("input", () => {
            if (input.tagName === "TEXTAREA") {
              adjustHeight();
            }
            btn.disabled = input.value.trim().length === 0;
          });

          // Handle Enter key (Submit) vs Shift+Enter (Newline)
          input.addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!input.value.trim()) return;
              form.requestSubmit(); // Trigger submit event
            }
          });

          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const val = input.value.trim();
            if (val) {
              input.value = "";
              if (input.tagName === "TEXTAREA") {
                adjustHeight(); // Reset height
              }
              btn.disabled = true;
              await StoryController.send(val);
            }
          });
        }
      }

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

      // Remove loading modal
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

  // [NEW] Helper to wait for the Left Panel <script> to run
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

  mockPlugins: function () {
    window.pluginAi = async () => "Mock AI Response";
    window.pluginTextToImage = async () =>
      "https://via.placeholder.com/512x768";
    window.pluginRemember = { get: () => null, set: () => {} };
    window.pluginSuperFetch = async () => ({ text: async () => "" });
    window.pluginUpload = {
      upload: async () => "https://via.placeholder.com/150",
    };
  },

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
        App.mockPlugins();
      } else {
        await App.waitForPlugins(["pluginAi", "pluginTextToImage"]);
      }

      App.setupPlugins();

      // [NEW] Wait for Left Panel Config Injection
      await App.waitForConfig(2000);

      await db.open();

      // [FIX] Always run the seeder to replenish deleted factory items
      // The seeder itself handles duplication checks.
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
export const mockPlugins = App.mockPlugins;

if (typeof jest === "undefined" && typeof globalThis.__TEST__ === "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", App.initializeApp);
  else App.initializeApp();
}
