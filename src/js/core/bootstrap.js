// apps/rpglitch/js/index.js
import { seedPremades } from "../data/repo.js";
import { initViews } from "../ui/orchestrator.js";
import { db } from "./db.js";
import { log, error, initDebugMode, mockPlugins } from "./utils.js";
import { state, applyPatch } from "./state.js";
import { TurnManager } from "../engine/director.js";
import { StoryOptionsController } from "../ui/components/settings.js";
import { initStoryboardStage, SetupManager } from "../ui/setup.js";
import { initChatInput } from "../ui/components/chat/input.js";
import { initUIHandlers } from "../ui/handlers.js";

// ====== SECURITY OVERRIDE: CLIENT-SIDE FREEDOM ======
(function enforceClientSideFreedom() {
  try {
    if (localStorage.getItem("okayToShowNSFWUntil")) {
      localStorage.setItem("okayToShowNSFWUntil", "0");
      log("[RPGlitch] 🛡️ Freedom Protocol: Penalty flag purged.");
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
  story: TurnManager,
  isInitialized: false,
  views: null,

  async initUniversalStage() {
    if (App.isInitialized) return;
    App.isInitialized = true;
    log("[Universal Stage] Initializing...");

    window.TurnManager = TurnManager;
    window.SetupManager = SetupManager;
    window.StoryOptionsController = StoryOptionsController;

    // Initialize UI Handlers (Replacement for inline HTML attributes)
    initUIHandlers();

    try {
      // 0. Load Settings from DB
      try {
        const savedSettings = await db.settings.get("app-settings");
        if (savedSettings) {
          applyPatch({ settings: savedSettings });
          log("[Universal Stage] Settings loaded from DB.");
        }
      } catch (e) {
        console.warn("[Universal Stage] Failed to load settings", e);
      }

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

      // 2. Initialize Storyboard Stage
      initStoryboardStage(App.views);

      // 2.5 Restore Active Story (Persistence)
      try {
        const activeStorySetting = await db.settings.get("active_story");
        if (activeStorySetting && activeStorySetting.value) {
          const lastActiveId = activeStorySetting.value;
          await TurnManager.load(parseInt(lastActiveId, 10));
          log(`[Universal Stage] Restored active story: ${lastActiveId}`);
        }
      } catch (restoreErr) {
        console.warn("[Universal Stage] Could not restore story:", restoreErr);
      }

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
      // (Handled by StoryOptionsController.init())

      log("[Universal Stage] Ready.");
      // Skeleton removed in finally block
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
    // Proactively initialize to prevent early "undefined" warnings from services
    window.rpgLists = window.rpgLists || {};

    const start = Date.now();
    // Wait for window.rpgLists to populated with actual data (keys)
    // The left panel should inject it.
    while (
      Object.keys(window.rpgLists).length === 0 &&
      Date.now() - start < timeout
    ) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (Object.keys(window.rpgLists).length > 0) {
      log(
        "[RPGlitch] Config loaded successfully:",
        Object.keys(window.rpgLists),
      );
    } else {
      console.warn("[RPGlitch] ⚠️ Config timeout. Using internal defaults.");
    }
  },

  // mockPlugins moved to core-utils.js

  async initializeApp() {
    const modal = document.querySelector("#boot-skeleton");

    if (typeof window.DOMPurify === "undefined") {
      const msg =
        "CRITICAL SECURITY FAILURE: DOMPurify is missing. Aborting startup.";
      error(msg);
      if (modal) modal.close();
      import("../ui/orchestrator.js").then((m) =>
        m.showAlert("Critical Error", msg),
      );
      throw new Error(msg);
    }

    try {
      log("[Init] Checking environment...");
      const isLocal =
        location.hostname === "localhost" || location.protocol === "file:";

      await initDebugMode();

      if (isLocal) {
        mockPlugins();
        // Skip wait for config if local to avoid artificial delay
        window.rpgLists = window.rpgLists || {};
      } else {
        await App.waitForPlugins(["pluginAi", "pluginTextToImage"]);
      }

      App.setupPlugins();
      await App.waitForConfig(isLocal ? 100 : 2000);
      await db.open();

      // Always run the seeder to replenish deleted factory items
      await seedPremades();

      await App.initUniversalStage();

      log("[Init] Done.");
    } catch (e) {
      error("Init Failed", e);

      // Auto-recovery for schema conflicts
      if (e.message && e.message.includes("changing primary key")) {
        // alert("Database schema conflict detected. Resetting database..."); // Optional: silent execution preferred for UX?
        // Let's be transparent but quick.
        console.warn(
          "[RPGlitch] Nuke protocol initiated due to schema conflict.",
        );
        try {
          await db.delete();
          location.reload();
          return;
        } catch (delErr) {
          error("Failed to delete DB during recovery", delErr);
        }
      }

      import("../ui/orchestrator.js").then((m) =>
        m.showAlert("Boot Error", "App failed to load: " + (e.message || e)),
      );

      const emergencyModal = document.getElementById("emergency-modal");
      if (emergencyModal) emergencyModal.showModal();
    } finally {
      if (modal) {
        modal.classList.add("fade-out");
        setTimeout(() => {
          modal.remove();
        }, 500);
      }
    }
  },
};

// --- EXPOSE APP TO WINDOW ---
// This ensures tests and debuggers can see the App object
// even after esbuild bundles it into an IIFE.
window.App = App;

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
