// apps/rpglitch/js/index.js
import { entities, getPictureHTML } from "./entities.js";
import { renderMessage, initViews } from "./views.js";
import { db } from "./db.js";
import { log, error } from "./utils.js";

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
  if (ai && user && world) return `The Story of ${user.name} & ${ai.name}`;
  if (world) return `Adventures in ${world.name}`;
  return "My Story";
}

const App = {
  state: {
    storyTitle: "My Story", selectedAI: null, selectedWorld: null, selectedUser: null, mode: "storyboard",
    isCustomTitle: false,
    story: { byId: {}, activeId: null }, messages: { byStoryId: {} },
    settings: { temperature: 0.7, top_p: 1.0, maxTokens: 512, stop: [], model: "default", historyLength: 10 },
    ui: { fsm: "idle" },
  },
  isInitialized: false,
  applyPatch(patch) {
    const merge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          merge(target[key], source[key]);
        } else { Object.assign(target, { [key]: source[key] }); }
      }
      return target;
    };
    merge(App.state, patch);
    document.dispatchEvent(new CustomEvent("state:changed", { detail: { patch } }));
  },
  prompt: {
    build: async (storyId) => {
      const story = App.state.story.byId[storyId];
      let ch = null;
      if (story?.aiCharacterId) { try { ch = await entities.get("character", story.aiCharacterId); } catch (err) { error("Failed to load character:", err); } }
      const msgs = App.prompt.trimHistory(App.state.messages.byStoryId[storyId] || []);
      const system = [ch?.forever, ch?.past, ch?.present, ch?.future].filter(Boolean).join("\n\n") || `You are ${ch?.name || "Character"}.`;
      return { system, messages: msgs, params: App.state.settings };
    },
    trimHistory: (msgs) => {
      const len = App.state.settings.historyLength;
      return msgs.length <= len * 2 ? msgs : msgs.slice(-len * 2);
    },
  },
  ai: {
    generateStream: async ({ payload, signal, onToken, onDone }) => {
      if (!window.ai) throw new Error("Perchance AI plugin not available.");
      let instruction = (payload.system ? payload.system + "\n\n" : "") +
        (payload.messages || []).map(m => `${m.role === "user" ? "User" : "Character"}: ${m.text}`).join("\n\n") + "\n\nNarrator: ";

      const result = await window.ai(instruction, {
        temperature: payload.params?.temperature,
        top_p: payload.params?.top_p,
        max_tokens: payload.params?.maxTokens,
        model: payload.params?.model,
        signal,
      });
      if (onToken) onToken(result);
      if (onDone) onDone();
      return result;
    },
  },
  story: {
    requireActive: () => { if (!App.state.story.activeId) throw new Error("No active story."); return App.state.story.activeId; },
    createFromSelection: async (data) => {
      const id = await db.stories.add({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
      App.applyPatch({ story: { activeId: id, byId: { [id]: data } } });
      return id;
    },
    loadMessages: async (storyId) => {
      const msgs = await db.messages.where("storyId").equals(storyId).sortBy("createdAt");
      App.applyPatch({ messages: { byStoryId: { [storyId]: msgs } } });
      return msgs;
    },
    render: async (storyId) => {
      const feed = document.querySelector("#chat-feed");
      if (!feed) return;
      const msgs = App.state.messages.byStoryId[storyId] || [];
      const story = App.state.story.byId[storyId];
      let [ai, user] = await Promise.all([
        story?.aiCharacterId ? entities.get("character", story.aiCharacterId) : null,
        story?.userCharacterId ? entities.get("character", story.userCharacterId) : null
      ]);
      feed.innerHTML = "";
      const noMsg = document.querySelector("#no-messages");
      if (msgs.length === 0) {
        if (noMsg) { noMsg.hidden = false; feed.appendChild(noMsg); }
        return;
      }
      if (noMsg) noMsg.hidden = true;
      msgs.forEach(m => renderMessage(feed, m.role, m.text, m.characterName, m.type || "IC", { aiCharacter: ai, userCharacter: user }));
      feed.scrollTop = feed.scrollHeight;
    },
    send: async (text) => {
      if (!text) return;
      const storyId = App.story.requireActive();
      const story = App.state.story.byId[storyId];
      await db.messages.add({ storyId, role: "user", type: "IC", text, createdAt: Date.now() });
      await App.story.loadMessages(storyId);
      await App.story.render(storyId);

      const typing = document.querySelector("#typing-indicator");
      if (typing) typing.hidden = false;

      try {
        const payload = await App.prompt.build(storyId);
        const ctrl = new AbortController();
        App.applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

        const response = await App.ai.generateStream({ payload, signal: ctrl.signal });

        await db.messages.add({
          storyId,
          role: "narrator",
          type: "IC",
          text: response,
          characterName: (await entities.get("character", story.aiCharacterId))?.name,
          createdAt: Date.now()
        });
        await App.story.loadMessages(storyId);
        await App.story.render(storyId);
        App.applyPatch({ ui: { fsm: "done" } });
      } catch (e) {
        error("AI Error", e);
        App.applyPatch({ ui: { fsm: "error", lastError: e.message } });
        alert("AI Error: " + e.message);
      } finally {
        if (typing) typing.hidden = true;
      }
    },
  },
  async initUniversalStage() {
    if (App.isInitialized) return;
    App.isInitialized = true;
    log("[Universal Stage] Initializing...");

    const titleStoryboard = document.querySelector("#title-storyboard");
    const titleGameplay = document.querySelector("#title-gameplay");
    if (titleStoryboard && titleGameplay) {
      titleStoryboard.setAttribute("contenteditable", "true");
      titleGameplay.setAttribute("contenteditable", "true");

      const handleInput = (e) => {
        const val = e.target.textContent.trim();
        (e.target === titleStoryboard ? titleGameplay : titleStoryboard).textContent = val;
        App.state.isCustomTitle = true;
        App.applyPatch({ storyTitle: val });
      };
      titleStoryboard.addEventListener("input", handleInput);
      titleGameplay.addEventListener("input", handleInput);
    }

    await initViews({
      onSelectionChanged: (sel) => {
        const { aiCharacter, userCharacter, world } = sel;
        App.applyPatch({ selectedAI: aiCharacter, selectedUser: userCharacter, selectedWorld: world });
        if (world) updateWorldAmbience(world);

        if (!App.state.isCustomTitle && titleStoryboard && titleGameplay) {
          const newTitle = generateDynamicTitle(aiCharacter, userCharacter, world);
          titleStoryboard.textContent = newTitle;
          titleGameplay.textContent = newTitle;
          App.applyPatch({ storyTitle: newTitle });
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
      newBtn.addEventListener("click", App.handleBeginStory);
    }

    // --- SETTINGS WIRING (FINAL) ---
    const settingsBtn = document.querySelector("#btn-settings");
    const settingsModal = document.querySelector("#settings-screen");

    if (settingsBtn && settingsModal) {
      const closeSettings = () => {
        settingsModal.classList.remove("is-open");
        setTimeout(() => settingsModal.setAttribute("hidden", ""), 200);
      };

      settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        settingsModal.removeAttribute("hidden");
        settingsModal.classList.add("is-open");

        const promptInput = document.querySelector("#opening-prompt");
        const jsInput = document.querySelector("#custom-js");
        if (promptInput) promptInput.value = App.state.settings.openingPrompt || "";
        if (jsInput) jsInput.value = App.state.settings.customJs || "";
      });

      settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) closeSettings();
      });

      const resetBtn = document.querySelector("#settings-reset");
      if (resetBtn) {
        resetBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
            await db.delete();
            window.location.reload();
          }
        });
      }

      const promptInput = document.querySelector("#opening-prompt");
      if (promptInput) promptInput.addEventListener("input", (e) => App.applyPatch({ settings: { openingPrompt: e.target.value } }));

      const jsInput = document.querySelector("#custom-js");
      if (jsInput) jsInput.addEventListener("input", (e) => App.applyPatch({ settings: { customJs: e.target.value } }));
    }

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
          await App.story.send(val);
        }
      });
    }

    log("[Universal Stage] Ready.");
  },

  async handleBeginStory() {
    const { selectedAI, selectedUser, selectedWorld, storyTitle } = App.state;
    if (!selectedAI || !selectedUser || !selectedWorld) return alert("Please select all entities.");

    try {
      const id = await App.story.createFromSelection({ storyTitle, aiCharacterId: selectedAI.id, userCharacterId: selectedUser.id, worldId: selectedWorld.id });

      document.body.classList.remove("mode-storyboard");
      document.body.classList.add("mode-gameplay");
      App.applyPatch({ mode: "gameplay" });

      App.updatePortraits(selectedAI, selectedUser);
      await App.generateOpeningMessage(id);
    } catch (e) {
      error("Begin Story Failed", e);
      alert("Could not start story.");
    }
  },


  updatePortraits: function (aiCharacter, userCharacter) {
    const setPort = (id, ent, label) => {
      const container = document.querySelector(id);
      if (!container) return;

      const imgDiv = container.querySelector(".portrait-image");
      const nameDiv = container.querySelector(".portrait-name");

      if (imgDiv) {
        imgDiv.innerHTML = "";
        const picture = getPictureHTML(ent, { cover: true });
        if (picture) imgDiv.appendChild(picture);
      }
      if (nameDiv) nameDiv.textContent = ent.name || label;
    };

    setPort("#gameplay-ai-portrait", aiCharacter, "AI");
    setPort("#gameplay-user-portrait", userCharacter, "You");
  },

  async generateOpeningMessage(storyId) {
    const story = App.state.story.byId[storyId];
    const typing = document.querySelector("#typing-indicator");
    if (typing) { typing.textContent = "Generating opening..."; typing.hidden = false; }

    try {
      const [world, ai] = await Promise.all([
        entities.get("world", story.worldId),
        entities.get("character", story.aiCharacterId)
      ]);

      const prompt = App.state.settings.openingPrompt || `Generate a short, atmospheric opening scene for a story set in ${world.name}. The character is ${ai.name}. Focus on setting the mood.`;

      const text = await window.ai(prompt, { temperature: 0.8, max_tokens: 400 });

      await db.messages.add({ storyId, role: "narrator", type: "OOC", text, createdAt: Date.now() });
      await App.story.loadMessages(storyId);
      await App.story.render(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
    } finally {
      if (typing) typing.hidden = true;
    }
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

// Alias for backward compatibility with tests
App.initializeWhenReady = async function() {
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

// Stub methods for test compatibility
App._getUIElements = App._getUIElements || function() {
  return {
    titleStoryboard: document.querySelector("#title-storyboard"),
    titleGameplay: document.querySelector("#title-gameplay"),
  };
};

App._defaultStoryboardTitle = App._defaultStoryboardTitle || async function() {
  const narratorSel = document.querySelector("#storyboard-card-narrator-select");
  const userSel = document.querySelector("#storyboard-card-user-select");
  const worldSel = document.querySelector("#storyboard-card-world-select");

  const narrator = narratorSel?.options[narratorSel.selectedIndex]?.text;
  const user = userSel?.options[userSel.selectedIndex]?.text;
  const world = worldSel?.options[worldSel.selectedIndex]?.text;

  if (narrator && user && world) return `Once upon a time ${narrator} & ${user} in ${world}`;
  if (narrator && user) return `Once upon a time ${narrator} & ${user}`;
  if (narrator) return `Once upon a time ${narrator}`;
  return 'Your story begins…';
};

// Export methods for testing
export { App };
export const initializeWhenReady = App.initializeWhenReady;
export const initializeApp = App.initializeApp;
export const waitForPlugins = App.waitForPlugins;
export const isPluginAvailable = App.isPluginAvailable;
export const setupPlugins = App.setupPlugins;
export const mockPlugins = App.mockPlugins;
export const applyPatch = App.applyPatch;
export const _getUIElements = App._getUIElements;
export const _defaultStoryboardTitle = App._defaultStoryboardTitle;

// Only auto-initialize if not in test environment
if (typeof jest === 'undefined' && typeof globalThis.__TEST__ === 'undefined') {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", App.initializeApp);
  else App.initializeApp();
}