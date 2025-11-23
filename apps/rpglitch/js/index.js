// apps/rpglitch/js/index.js
import { seedPremades, entities } from "./entities.js";
import { initViews, updatePortraits, updateStoryboardSelection } from "./views.js";
import { db } from "./db.js";
import { log, error } from "./utils.js";
import { state, applyPatch } from "./store.js";
import { StoryController } from "./story-controller.js";
import { StoryOptionsController } from "./story-options.js";

function updateWorldAmbience(worldEntity) {
  if (!worldEntity || !worldEntity.signatureColour) return;
  const colorMap = {
    pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
    orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
  };
  const rgb = colorMap[worldEntity.signatureColour] || colorMap.default;
  document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
}

function generateDynamicTitle(ai, user, world) {
  // Helper to pick random variation
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const prefixes = [
    "The Story of",
    "The Adventures of",
    "The Tale of",
    "The Legend of",
    "The Saga of",
    "Chronicles of",
    "The Journey of"
  ];

  // REORDERED: AI first, then User (matches Storyboard order: AI -> User)
  // This logic was explicitly requested to be preserved/ensured
  const chars = [ai, user].filter(Boolean);
  const hasWorld = !!world;
  const totalChars = chars.length;

  // 1. Select Prefix
  const prefix = pick(prefixes);

  // 2. Build Content String based on selection
  let content = "";

  // Case: 3 Entities (2 Chars + World) -> "The Story of Char & Char in World"
  if (totalChars === 2 && hasWorld) {
    content = `${chars[0].name} & ${chars[1].name} in ${world.name}`;
  }
  // Case: 2 Characters -> "The Story of Char & Char"
  else if (totalChars === 2 && !hasWorld) {
    content = `${chars[0].name} & ${chars[1].name}`;
  }
  // Case: 1 Character + 1 World -> "The Story of Char in World"
  else if (totalChars === 1 && hasWorld) {
    content = `${chars[0].name} in ${world.name}`;
  }
  // Case: 1 Entity (Character only) -> "The Story of Char"
  else if (totalChars === 1 && !hasWorld) {
    content = chars[0].name;
  }
  // Case: 1 Entity (World only) -> "The Story of World"
  else if (totalChars === 0 && hasWorld) {
    // Special phrasing for just a world usually sounds better
    const worldPrefixes = ["Adventures in", "Tales from", "The World of", "Journey to"];
    return `${pick(worldPrefixes)} ${world.name}`;
  }
  else {
    return "My New Story";
  }

  // 3. Combine
  return `${prefix} ${content}`;
}

// --- UI Logic Handlers ---

async function handleBeginStory() {
  const { selectedAI, selectedUser, selectedWorld, storyTitle } = state;
  if (!selectedAI || !selectedUser || !selectedWorld) return alert("Please select all entities.");

  try {
    const id = await StoryController.createFromSelection({
      storyTitle,
      aiCharacterId: selectedAI.id,
      userCharacterId: selectedUser.id,
      worldId: selectedWorld.id
    });

    document.body.classList.remove("mode-storyboard");
    document.body.classList.add("mode-gameplay");
    applyPatch({ mode: "gameplay" });

    updatePortraits(selectedAI, selectedUser);
    await StoryController.generateOpening(id);
  } catch (e) {
    error("Begin Story Failed", e);
    alert("Could not start story.");
  }
}

async function handleShuffle() {
  try {
    const chars = await entities.list('character');
    const worlds = await entities.list('world');

    if (chars.length < 1) {
      console.warn("Not enough characters to shuffle");
      return;
    }

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // Pick random entities
    const ai = pick(chars);
    let user = pick(chars);

    // Try to ensure they are different if possible
    if (chars.length > 1) {
      while (user.id === ai.id) {
        user = pick(chars);
      }
    }

    const world = worlds.length > 0 ? pick(worlds) : null;

    // Update UI and internal state via the helper
    updateStoryboardSelection({ aiCharacter: ai, userCharacter: user, world });

  } catch (e) {
    error("Shuffle failed:", e);
  }
}

// --- Main Application Object (Bootstrapper) ---

const App = {
  state,
  applyPatch,
  story: StoryController,
  isInitialized: false,

  async initUniversalStage() {
    if (App.isInitialized) return;
    App.isInitialized = true;
    log("[Universal Stage] Initializing...");

    const titleStoryboard = document.querySelector("#title-storyboard");
    const titleGameplay = document.querySelector("#title-gameplay");

    if (titleStoryboard && titleGameplay) {
      titleStoryboard.setAttribute("contenteditable", "true");
      titleGameplay.setAttribute("contenteditable", "true");
      titleStoryboard.title = "Double-click to re-roll title";
      titleGameplay.title = "Double-click to re-roll title";

      // 1. Handle Manual Edits
      const handleInput = (e) => {
        const val = e.target.textContent.trim();
        // Sync the other title element immediately
        (e.target === titleStoryboard ? titleGameplay : titleStoryboard).textContent = val;

        // Lock the title so auto-generation stops
        applyPatch({ isCustomTitle: true, storyTitle: val });
      };

      // 2. Handle Reset / Re-roll (Double Click)
      const handleReset = () => {
        const { selectedAI, selectedUser, selectedWorld } = state;
        const newTitle = generateDynamicTitle(selectedAI, selectedUser, selectedWorld);

        titleStoryboard.textContent = newTitle;
        titleGameplay.textContent = newTitle;

        // Unlock the title so auto-generation resumes on selection change
        applyPatch({ isCustomTitle: false, storyTitle: newTitle });
      };

      titleStoryboard.addEventListener("input", handleInput);
      titleGameplay.addEventListener("input", handleInput);

      titleStoryboard.addEventListener("dblclick", handleReset);
      titleGameplay.addEventListener("dblclick", handleReset);
    }

    await initViews({
      onSelectionChanged: (sel) => {
        const { aiCharacter, userCharacter, world } = sel;
        applyPatch({ selectedAI: aiCharacter, selectedUser: userCharacter, selectedWorld: world });
        if (world) updateWorldAmbience(world);

        // Only auto-generate if the user hasn't manually edited the title
        if (!state.isCustomTitle && titleStoryboard && titleGameplay) {
          const newTitle = generateDynamicTitle(aiCharacter, userCharacter, world);
          titleStoryboard.textContent = newTitle;
          titleGameplay.textContent = newTitle;
          applyPatch({ storyTitle: newTitle });
        }

        const btn = document.querySelector("#begin-story");
        if (btn) {
          const ready = aiCharacter && userCharacter && world;
          btn.disabled = !ready;
          btn.classList.toggle("disabled", !ready);
        }
      },
      refreshAllLists: async () => { log("Refreshed lists"); }
    });

    const beginBtn = document.querySelector("#begin-story");
    if (beginBtn) {
      const newBtn = beginBtn.cloneNode(true);
      beginBtn.parentNode.replaceChild(newBtn, beginBtn);
      newBtn.addEventListener("click", handleBeginStory);
    }

    // NEW: Shuffle Button Wiring
    const shuffleBtn = document.querySelector("#btn-shuffle");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleShuffle();
      });
    }

    // --- STORY OPTIONS WIRING ---
    StoryOptionsController.init();

    // Wire settings inputs (Reset handled by Controller)
    const promptInput = document.querySelector("#opening-prompt");
    if (promptInput) promptInput.addEventListener("input", (e) => applyPatch({ settings: { openingPrompt: e.target.value } }));

    const jsInput = document.querySelector("#custom-js");
    if (jsInput) jsInput.addEventListener("input", (e) => applyPatch({ settings: { customJs: e.target.value } }));

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

    // --- SECURITY ENFORCEMENT ---
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
  return 'Your story begins…';
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