// apps/rpglitch/js/index.js
// Universal Stage - Streamlined Implementation

import { entities, getPictureHTML } from "./entities.js";
import { router, renderMessage, initViews } from "./views.js";
import { db } from "./db.js";
import { log, error } from "./utils.js";

// =================================================================
// Plugin Loading Configuration
// =================================================================
const PLUGIN_POLL_INTERVAL_MS = 500;
const PLUGIN_WAIT_TIMEOUT_MS = 10000;
const PLUGIN_MAX_RETRIES = 3;

class PluginError extends Error {
  constructor(message) {
    super(message);
    this.name = "PluginError";
  }
}

// =================================================================
// App State & Core Logic
// =================================================================

const App = {
  state: {
    // Universal Stage state
    storyTitle: "My Story",
    selectedAI: null,
    selectedWorld: null,
    selectedUser: null,
    mode: "storyboard", // "storyboard" | "gameplay"

    // Story runtime
    story: { byId: {}, allIds: [], activeId: null },
    messages: { byStoryId: {} },
    settings: {
      temperature: 0.7,
      top_p: 1.0,
      maxTokens: 512,
      stop: [],
      model: "default",
      historyLength: 10,
    },
    ui: {
      fsm: "idle", // idle, sending, streaming, done, error, aborted
      lastError: null,
      abortController: null,
    },
  },

  applyPatch(patch) {
    const merge = (target, source) => {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          merge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
      return target;
    };

    merge(App.state, patch);
    document.dispatchEvent(
      new CustomEvent("state:changed", { detail: { patch } })
    );
  },

  prompt: {
    build: async (storyId) => {
      const story = App.state.story.byId[storyId];
      let ch = null;
      if (story?.aiCharacterId) {
        try {
          ch = await entities.get("character", story.aiCharacterId);
        } catch (err) {
          error("Failed to load character for prompt:", err);
        }
      }

      const msgs = App.prompt.trimHistory(
        App.state.messages.byStoryId[storyId] || []
      );

      const characterPersona = [ch?.forever, ch?.past, ch?.present, ch?.future]
        .filter(Boolean)
        .join("\n\n");
      const characterName = ch?.name || "Character";

      const system = characterPersona || `You are ${characterName}.`;

      const params = {
        temperature: App.state.settings.temperature,
        top_p: App.state.settings.top_p,
        maxTokens: App.state.settings.maxTokens,
        stop: App.state.settings.stop,
        model: App.state.settings.model,
      };

      return { system, messages: msgs, params };
    },

    trimHistory: (msgs) => {
      const historyLength = App.state.settings.historyLength;
      if (msgs.length <= historyLength * 2) return msgs;
      return msgs.slice(-historyLength * 2);
    },
  },

  ai: {
    generateStream: async ({ payload, signal, onToken, onDone }) => {
      if (!window.ai || typeof window.ai !== "function") {
        throw new Error("Perchance AI plugin not available.");
      }

      let instruction = "";
      if (payload.system) instruction += payload.system + "\n\n";

      if (payload.messages && payload.messages.length > 0) {
        for (const msg of payload.messages) {
          const role =
            msg.role === "user"
              ? "User"
              : msg.role === "narrator"
                ? "Narrator"
                : "Character";
          instruction += `${role}: ${msg.text}\n\n`;
        }
        instruction += "Narrator: ";
      }

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
    requireActive: () => {
      if (!App.state.story.activeId) {
        throw new Error("No active story. Please create a new story.");
      }
      return App.state.story.activeId;
    },

    createFromSelection: async ({ storyTitle, aiCharacterId, userCharacterId, worldId }) => {
      try {
        const newStory = {
          aiCharacterId,
          userCharacterId,
          worldId,
          title: storyTitle || "Untitled Story",
          settingsSnapshot: { ...App.state.settings },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const storyId = await db.stories.add(newStory);
        newStory.id = storyId;

        App.applyPatch({
          story: {
            activeId: storyId,
            byId: { [storyId]: newStory },
          },
        });

        log(`Created story: ${storyId} - ${storyTitle}`);
        return storyId;
      } catch (err) {
        error("Failed to create story:", err);
        throw err;
      }
    },

    loadMessages: async (storyId) => {
      try {
        const messages = await db.messages
          .where("storyId")
          .equals(storyId)
          .sortBy("createdAt");

        App.applyPatch({
          messages: { byStoryId: { [storyId]: messages } },
        });

        return messages;
      } catch (err) {
        error("Failed to load messages:", err);
        return [];
      }
    },

    render: async (storyId) => {
      const feed = document.querySelector("#chat-feed");
      if (!feed) return;

      const messages = App.state.messages.byStoryId[storyId] || [];
      const story = App.state.story.byId[storyId];

      // Load characters for signature colors
      let aiCharacter = null;
      let userCharacter = null;
      if (story) {
        const [ai, user] = await Promise.all([
          story.aiCharacterId ? entities.get("character", story.aiCharacterId) : null,
          story.userCharacterId ? entities.get("character", story.userCharacterId) : null,
        ]);
        aiCharacter = ai;
        userCharacter = user;
      }

      // Clear and render
      feed.innerHTML = "";
      const noMessages = document.querySelector("#no-messages");
      if (messages.length === 0) {
        if (noMessages) {
          noMessages.hidden = false;
          feed.appendChild(noMessages);
        }
        return;
      }

      if (noMessages) noMessages.hidden = true;

      messages.forEach((msg) => {
        renderMessage(feed, msg.role, msg.text, msg.characterName, msg.type || "IC", {
          aiCharacter,
          userCharacter,
        });
      });

      feed.scrollTop = feed.scrollHeight;
    },

    send: async (userText) => {
      if (!userText) return;
      if (!["idle", "done", "error", "aborted"].includes(App.state.ui.fsm)) return;

      const storyId = App.story.requireActive();
      const story = App.state.story.byId[storyId];

      // Save user message
      await db.messages.add({
        storyId,
        role: "user",
        type: "IC",
        text: userText,
        characterName: null,
        createdAt: Date.now(),
      });

      await App.story.loadMessages(storyId);
      await App.story.render(storyId);

      // Show typing indicator
      const typingIndicator = document.querySelector("#typing-indicator");
      if (typingIndicator) {
        typingIndicator.textContent = "Typing...";
        typingIndicator.hidden = false;
      }

      // Generate AI response
      try {
        const payload = await App.prompt.build(storyId);
        const ctrl = new AbortController();
        App.applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

        const response = await App.ai.generateStream({
          payload,
          signal: ctrl.signal,
          onToken: (token) => {
            // Stream token update (simple version)
          },
          onDone: async () => {
            // Finalize message
          },
        });

        // Save narrator response
        await db.messages.add({
          storyId,
          role: "narrator",
          type: "IC",
          text: response,
          characterName: story.aiCharacterId ? (await entities.get("character", story.aiCharacterId))?.name : null,
          createdAt: Date.now(),
        });

        await db.stories.update(storyId, { updatedAt: Date.now() });
        await App.story.loadMessages(storyId);
        await App.story.render(storyId);

        App.applyPatch({ ui: { fsm: "done" } });
      } catch (err) {
        error("AI generation failed:", err);
        App.applyPatch({ ui: { fsm: "error", lastError: err.message } });
        alert("AI response failed. Please try again.");
      } finally {
        if (typingIndicator) typingIndicator.hidden = true;
      }
    },
  },
};

window.App = App;

// =================================================================
// Universal Stage Wiring
// =================================================================

let isInitialized = false;

async function initUniversalStage() {
  if (isInitialized) return;
  isInitialized = true;

  log("[Universal Stage] Initializing...");

  // ====== PHASE 2: TITLE SYNC ======
  const titleStoryboard = document.querySelector("#title-storyboard");
  const titleGameplay = document.querySelector("#title-gameplay");

  if (titleStoryboard && titleGameplay) {
    // Make title editable on click (contenteditable)
    titleStoryboard.setAttribute("contenteditable", "true");
    titleGameplay.setAttribute("contenteditable", "true");

    titleStoryboard.addEventListener("input", () => {
      const text = titleStoryboard.textContent.trim();
      titleGameplay.textContent = text;
      App.applyPatch({ storyTitle: text });
    });

    titleGameplay.addEventListener("input", () => {
      const text = titleGameplay.textContent.trim();
      titleStoryboard.textContent = text;
      App.applyPatch({ storyTitle: text });
    });
  }

  // ====== PHASE 3: ENTITY SELECTION ======
  initViews({
    onSelectionChanged: (selections) => {
      const { aiCharacter, userCharacter, world } = selections;
      App.applyPatch({
        selectedAI: aiCharacter,
        selectedUser: userCharacter,
        selectedWorld: world,
      });

      // Update Begin Story button state
      const beginButton = document.querySelector("#begin-story");
      if (beginButton) {
        const isReady = aiCharacter && userCharacter && world;
        beginButton.disabled = !isReady;
        beginButton.classList.toggle("disabled", !isReady);
      }
    },
    refreshAllLists: async () => {
      // Placeholder for list refresh logic if needed
      log("Refreshing lists requested by views");
    }
  });

  // ====== PHASE 4: BEGIN STORY ======
  const beginButton = document.querySelector("#begin-story");
  if (beginButton) {
    beginButton.addEventListener("click", async () => {
      await handleBeginStory();
    });
  }

  // ====== CHAT FORM ======
  const storyForm = document.querySelector("#story-form");
  if (storyForm) {
    const input = storyForm.querySelector('input[name="message"]');
    const submitBtn = storyForm.querySelector('button[type="submit"]');

    input?.addEventListener("input", () => {
      submitBtn.disabled = !input.value.trim();
    });

    storyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      input.value = "";
      submitBtn.disabled = true;
      await App.story.send(message);
    });
  }

  log("[Universal Stage] Initialized successfully!");
}



async function handleBeginStory() {
  const { selectedAI, selectedUser, selectedWorld, storyTitle } = App.state;

  // Validate selections
  if (!selectedAI || !selectedUser || !selectedWorld) {
    alert("Please select an AI character, your character, and a world before beginning.");
    return;
  }

  try {
    // Create story in database
    const storyId = await App.story.createFromSelection({
      storyTitle,
      aiCharacterId: selectedAI.id,
      userCharacterId: selectedUser.id,
      worldId: selectedWorld.id,
    });

    // Switch to gameplay mode
    document.body.classList.remove("mode-storyboard");
    document.body.classList.add("mode-gameplay");
    App.applyPatch({ mode: "gameplay" });

    // Update portrait displays
    updatePortraits(selectedAI, selectedUser);

    // Generate opening message
    await generateOpeningMessage(storyId);
  } catch (err) {
    error("Failed to begin story:", err);
    alert("Could not start story. Please try again.");
  }
}



function updatePortraits(aiCharacter, userCharacter) {
  // AI Portrait
  const aiPortrait = document.querySelector("#gameplay-ai-portrait");
  if (aiPortrait) {
    const imgDiv = aiPortrait.querySelector(".portrait-image");
    const nameDiv = aiPortrait.querySelector(".portrait-name");

    if (imgDiv) {
      imgDiv.innerHTML = "";
      const picture = getPictureHTML(aiCharacter, { cover: false });
      if (picture) imgDiv.appendChild(picture);
    }

    if (nameDiv) nameDiv.textContent = aiCharacter.name || "AI";
  }

  // User Portrait
  const userPortrait = document.querySelector("#gameplay-user-portrait");
  if (userPortrait) {
    const imgDiv = userPortrait.querySelector(".portrait-image");
    const nameDiv = userPortrait.querySelector(".portrait-name");

    if (imgDiv) {
      imgDiv.innerHTML = "";
      const picture = getPictureHTML(userCharacter, { cover: false });
      if (picture) imgDiv.appendChild(picture);
    }

    if (nameDiv) nameDiv.textContent = userCharacter.name || "You";
  }
}

async function generateOpeningMessage(storyId) {
  const story = App.state.story.byId[storyId];
  if (!story) return;

  const typingIndicator = document.querySelector("#typing-indicator");
  if (typingIndicator) {
    typingIndicator.textContent = "Starting story...";
    typingIndicator.hidden = false;
  }

  try {
    // Load world and AI character for context
    const [world, aiCharacter] = await Promise.all([
      story.worldId ? entities.get("world", story.worldId) : null,
      story.aiCharacterId ? entities.get("character", story.aiCharacterId) : null,
    ]);

    const worldContext = world
      ? [world.forever, world.past, world.present, world.future].filter(Boolean).join("\n\n")
      : "";

    const characterContext = aiCharacter
      ? [aiCharacter.forever, aiCharacter.past, aiCharacter.present, aiCharacter.future]
        .filter(Boolean)
        .join("\n\n")
      : "";

    const prompt = `You are beginning a new story. Generate an engaging opening scene.

World Context:
${worldContext}

Character Context (${aiCharacter?.name || "Character"}):
${characterContext}

Generate a vivid opening scene that sets the stage for the adventure. Describe the setting, atmosphere, and introduce the character naturally.`;

    const result = await window.ai(prompt, {
      temperature: 0.8,
      max_tokens: 300,
    });

    // Save opening message
    await db.messages.add({
      storyId,
      role: "narrator",
      type: "OOC",
      text: result,
      characterName: null,
      createdAt: Date.now(),
    });

    await App.story.loadMessages(storyId);
    await App.story.render(storyId);
  } catch (err) {
    error("Failed to generate opening:", err);
    alert("Could not generate opening message. Please try typing to start the story.");
  } finally {
    if (typingIndicator) typingIndicator.hidden = true;
  }
}

// =================================================================
// Plugin Setup
// =================================================================

function setupPlugins() {
  const pluginMap = {
    pluginAi: "ai",
    pluginTextToImage: "textToImage",
    pluginSuperFetch: "superFetch",
    pluginRemember: "remember",
    pluginUpload: "upload",
  };
  for (const [perchanceName, standardName] of Object.entries(pluginMap)) {
    if (window[perchanceName]) {
      window[standardName] = window[perchanceName];
    }
  }
}

function isPluginPathAvailable(path) {
  if (typeof path !== "string" || !path.trim()) return false;
  if (
    path.includes("__proto__") ||
    path.includes("constructor") ||
    path.includes("prototype")
  ) {
    return false;
  }

  const parts = path.split(".");
  let obj = window;

  for (const part of parts) {
    if (obj && typeof obj === "object" && part in obj) {
      obj = obj[part];
    } else {
      return false;
    }
  }

  return typeof obj === "function";
}

async function waitForPlugins(
  requiredPluginPaths,
  timeout = PLUGIN_WAIT_TIMEOUT_MS,
  retryCount = 0,
  maxRetries = PLUGIN_MAX_RETRIES
) {
  const startTime = Date.now();

  log(`[RPGlitch] Waiting for plugins (attempt ${retryCount + 1}/${maxRetries + 1}):`, requiredPluginPaths);

  while (Date.now() - startTime < timeout) {
    if (requiredPluginPaths.every(isPluginPathAvailable)) {
      log("[RPGlitch] All plugins loaded successfully");
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, PLUGIN_POLL_INTERVAL_MS));
  }

  if (retryCount < maxRetries) {
    return waitForPlugins(requiredPluginPaths, timeout, retryCount + 1, maxRetries);
  }

  const missing = requiredPluginPaths.filter((path) => !isPluginPathAvailable(path));
  log(`[RPGlitch] Plugin timeout. Missing: ${missing.join(", ")}`);
  return false;
}

// =================================================================
// Initialization
// =================================================================

function mockPlugins() {
  window.pluginAi = async (prompt) => {
    console.log("[Mock AI] Generating for:", prompt);
    return "This is a mock AI response for local testing.";
  };
  window.pluginTextToImage = async (prompt) => {
    console.log("[Mock Image] Generating for:", prompt);
    return "https://via.placeholder.com/150";
  };
  window.pluginRemember = {
    get: (key) => {
      console.log("[Mock Remember] Get:", key);
      return null;
    },
    set: (key, val) => {
      console.log("[Mock Remember] Set:", key, val);
    },
  };
  window.pluginSuperFetch = async (url) => {
    console.log("[Mock Fetch] Fetching:", url);
    return { text: async () => "Mock Fetch Result" };
  };
  window.pluginUpload = {
    upload: async (file) => {
      console.log("[Mock Upload] Uploading:", file);
      return "https://via.placeholder.com/150";
    }
  };
}

async function initializeApp() {
  try {
    log("[RPGlitch] Starting initialization...");
    console.log("[RPGlitch] Protocol:", window.location.protocol);
    console.log("[RPGlitch] Hostname:", window.location.hostname);

    // Wait for plugins
    const isLocal = window.location.protocol === "file:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    console.log("[RPGlitch] isLocal detected as:", isLocal);

    let pluginsLoaded = false;

    if (isLocal) {
      log("[RPGlitch] Local environment detected. Mocking plugins...");
      mockPlugins();
      pluginsLoaded = true;
    } else {
      pluginsLoaded = await waitForPlugins(["pluginAi", "pluginTextToImage", "pluginRemember"]);
    }

    if (!pluginsLoaded) {
      error("[RPGlitch] Required plugins failed to load");
      alert("Required plugins failed to load. Please refresh the page.");
      throw new PluginError("Required plugins failed to load");
    }

    console.log("[RPGlitch] Plugins loaded/mocked. Setting up...");
    setupPlugins();
    console.log("[RPGlitch] Plugins setup complete.");

    // Open database
    console.log("[RPGlitch] Opening database...");
    await db.open();
    console.log("[RPGlitch] Database initialized");

    // Initialize Universal Stage
    await initUniversalStage();

    // Hide loading modal
    const loadingModal = document.querySelector("#loading-modal");
    if (loadingModal) loadingModal.close();

    log("[RPGlitch] Initialization complete!");
  } catch (err) {
    error("[RPGlitch] Initialization failed:", err);
    alert("Application failed to initialize. Please refresh the page.");
  }
}

// Boot on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
