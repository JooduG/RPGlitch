// apps/rpglitch/js/index.js
import { entities, getPictureHTML } from "./entities.js";
import { router, renderMessage, initViews } from "./views.js";
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
  if (ai && user && world) {
    return `The Story of ${user.name} & ${ai.name}`;
  } else if (world) {
    return `Adventures in ${world.name}`;
  } else {
    return "My Story";
  }
}

const App = {
  state: {
    storyTitle: "My Story", selectedAI: null, selectedWorld: null, selectedUser: null, mode: "storyboard",
    isCustomTitle: false,
    story: { byId: {}, activeId: null }, messages: { byStoryId: {} },
    settings: { temperature: 0.7, top_p: 1.0, maxTokens: 512, stop: [], model: "default", historyLength: 10 },
    ui: { fsm: "idle" },
  },
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
      }
      finally { if (typing) typing.hidden = true; }
    }
  }
};
window.App = App;

let isInitialized = false;

async function initUniversalStage() {
  if (isInitialized) return;
  isInitialized = true;
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
    newBtn.addEventListener("click", handleBeginStory);
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
}

async function handleBeginStory() {
  const { selectedAI, selectedUser, selectedWorld, storyTitle } = App.state;
  if (!selectedAI || !selectedUser || !selectedWorld) return alert("Please select all entities.");

  try {
    const id = await App.story.createFromSelection({ storyTitle, aiCharacterId: selectedAI.id, userCharacterId: selectedUser.id, worldId: selectedWorld.id });

    document.body.classList.remove("mode-storyboard");
    document.body.classList.add("mode-gameplay");
    App.applyPatch({ mode: "gameplay" });

    updatePortraits(selectedAI, selectedUser);
    await generateOpeningMessage(id);
  } catch (e) {
    error("Begin Story Failed", e);
    alert("Could not start story.");
  }
}

function updatePortraits(aiCharacter, userCharacter) {
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
}

async function generateOpeningMessage(storyId) {
  const story = App.state.story.byId[storyId];
  const typing = document.querySelector("#typing-indicator");
  if (typing) { typing.textContent = "Generating opening..."; typing.hidden = false; }

  try {
    const [world, ai] = await Promise.all([
      entities.get("world", story.worldId),
      entities.get("character", story.aiCharacterId)
    ]);

    const prompt = `Generate a short, atmospheric opening scene for a story set in ${world.name}. 
        The character is ${ai.name}. 
        World Context: ${world.forever}
        Character Context: ${ai.forever}
        Focus on setting the mood.`;

    const text = await window.ai(prompt, { temperature: 0.8, max_tokens: 400 });

    await db.messages.add({ storyId, role: "narrator", type: "OOC", text, createdAt: Date.now() });
    await App.story.loadMessages(storyId);
    await App.story.render(storyId);
  } catch (e) {
    error("Opening Gen Failed", e);
  } finally {
    if (typing) typing.hidden = true;
  }
}

function setupPlugins() {
  const map = { pluginAi: "ai", pluginTextToImage: "textToImage", pluginSuperFetch: "superFetch", pluginRemember: "remember", pluginUpload: "upload" };
  for (const [k, v] of Object.entries(map)) if (window[k]) window[v] = window[k];
}

function isPluginAvailable(path) {
  if (!path || typeof path !== 'string') return false;
  const parts = path.split('.');
  let obj = window;
  for (const p of parts) {
    if (obj && typeof obj === 'object' && p in obj) obj = obj[p];
    else return false;
  }
  return typeof obj === 'function';
}

async function waitForPlugins(paths) {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    if (paths.every(isPluginAvailable)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

function mockPlugins() {
  window.pluginAi = async () => "Mock AI Response";
  window.pluginTextToImage = async () => "https://via.placeholder.com/512x768";
  window.pluginRemember = { get: () => null, set: () => { } };
  window.pluginSuperFetch = async () => ({ text: async () => "" });
  window.pluginUpload = { upload: async () => "https://via.placeholder.com/150" };
}

async function initializeApp() {
  const modal = document.querySelector("#loading-modal");
  try {
    log("[Init] Checking environment...");
    const isLocal = location.hostname === "localhost" || location.protocol === "file:";

    if (isLocal) {
      mockPlugins();
    } else {
      await waitForPlugins(["pluginAi", "pluginTextToImage"]);
    }

    setupPlugins();
    await db.open();
    await initUniversalStage();
    log("[Init] Done.");
  } catch (e) {
    error("Init Failed", e);
    alert("App failed to load.");
  } finally {
    if (modal) { modal.close(); modal.style.display = "none"; }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeApp);
else initializeApp();