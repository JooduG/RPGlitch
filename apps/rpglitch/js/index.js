// apps/rpglitch/js/index.js

// --- [FIX 1: IMPORT BLOCK] ---
// Added all the missing functions that were causing 'no-undef' errors.
import { entities, getPictureHTML } from "./entities.js";
import {
  initViews,
  router,
  renderStoryScreen,
  renderMessage,
} from "./views.js";
import { db } from "./db.js";
import {
  log,
  error,
  initDebugMode,
  enableAutoUnlock,
  startUIWatchdog,
  installUIRecoveryHooks,
  installUIBlockerAttributeObserver,
  setChosen,
  handleAsyncError,
  chin,
  isHtmlErrorPage,
  dismissLoadingUI,
  _uiWatchdogStarted,
} from "./utils.js";
// --- [END FIX 1] ---

// =================================================================
// Plugin Loading Configuration
// =================================================================
const PLUGIN_POLL_INTERVAL_MS = 500;
const PLUGIN_WAIT_TIMEOUT_MS = 10000;
const PLUGIN_MAX_RETRIES = 3;

// =================================================================
// Custom Error Classes
// =================================================================
class PluginError extends Error {
  constructor(message) {
    super(message);
    this.name = "PluginError";
  }
}

// =================================================================
// App State Management
// =================================================================

const App = {
  state: {
    characters: { byId: {}, allIds: [] },
    story: { byId: {}, allIds: [], activeId: null },
    messages: { byStoryId: {} }, // { [storyId]: [{id, role, text, seed, meta, createdAt}] }
    settings: {
      temperature: 0.7,
      top_p: 1.0,
      maxTokens: 512,
      stop: [],
      model: "default",
      historyLength: 10,
    },
    ui: {
      fsm: "idle",
      promptPreviewOpen: false,
      lastError: null,
      title: "RPGlitch",
      chosenStoryboardCard: null,
    },
  },

  /**
   * Updates the global App.state by merging a patch and emits a state:changed event.
   * @param {object} patch - A partial state object to merge into the current state.
   */
  applyPatch(patch) {
    // Simple deep merge for nested objects.
    // This is a basic implementation. For more complex needs, a library like lodash.merge would be used.
    const merge = (target, source) => {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} });
          }
          merge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
      return target;
    };

    merge(App.state, patch);

    // Emit a custom event to notify components that the state has changed.
    // This allows different parts of the UI to re-render themselves based on the new state.
    document.dispatchEvent(
      new CustomEvent("state:changed", { detail: { patch } })
    );
  },

  prompt: {
    build: async (storyId) => {
      const story = App.state.story.byId[storyId];

      // Load character from database (not from state, which isn't populated)
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

      // Build system prompt with IC/OOC instructions
      const characterPersona = [ch?.persona, ch?.scenario]
        .filter(Boolean)
        .join("\n\n");
      const characterName = ch?.name || "Character";

      log(`Building prompt for character: ${characterName}`);
      const icOocInstructions = `
CRITICAL RESPONSE FORMAT:
You must respond in ONE of these two formats ONLY:

FORMAT 1 (Character Only - DEFAULT):
${characterName}: [Your character's dialogue or actions]

FORMAT 2 (Narrator + Character):
Narrator: [Scene description, atmosphere, or NPC actions]
${characterName}: [Your character's response or dialogue]

RULES:
- Use FORMAT 1 by default (just character speaking/acting)
- Use FORMAT 2 when scene description is needed BEFORE character speaks
- NEVER send ONLY "Narrator:" - if using Narrator, you MUST follow with "${characterName}:"
- NEVER send more than 2 segments (Narrator + Character)
- Character name is ALWAYS "${characterName}" (not "Character")

EXAMPLES:
✓ GOOD (Format 1): ${characterName}: Welcome, traveler. What brings you to my shop?
✓ GOOD (Format 2): Narrator: The old wizard gestures toward dusty shelves lined with glowing artifacts.
${characterName}: Careful what you touch. Some items here... bite.
✗ BAD: Character: Hello (WRONG - use "${characterName}")
✗ BAD: Narrator: The room darkens. (MISSING character response)
✗ BAD: Three segments (TOO MANY)
`;

      const system = [characterPersona, icOocInstructions]
        .filter(Boolean)
        .join("\n\n");

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
      // Conservative, token-budget-aware trimming:
      // - Always retain latest N director/narrator pairs (configurable).
      // - Optional summarizer hook can be added later (not in this cycle).
      const historyLength = App.state.settings.historyLength;
      if (msgs.length <= historyLength * 2) {
        // * 2 because we count director/narrator pairs
        return msgs;
      }

      // Keep the last 'historyLength' director/narrator pairs
      return msgs.slice(-historyLength * 2);
    },
  },

  ai: {
    generateStream: async ({ payload, signal, onToken, onDone }) => {
      // Check for the Perchance AI plugin (it's a callable function, not an object)
      if (!window.ai || typeof window.ai !== "function") {
        error("Perchance AI plugin (window.ai) not available.");
        throw new Error("Perchance AI plugin not available.");
      }

      log("Calling Perchance AI plugin with payload:", payload);

      try {
        // Build the instruction from system + messages
        let instruction = "";

        if (payload.system) {
          instruction += payload.system + "\n\n";
        }

        // Format messages as a conversation
        if (payload.messages && payload.messages.length > 0) {
          for (const msg of payload.messages) {
            // Capitalize role for prompt formatting (user -> User, narrator -> Narrator, etc.)
            const role = msg.role
              ? msg.role.charAt(0).toUpperCase() +
              msg.role.slice(1).toLowerCase()
              : "Narrator";
            instruction += `${role}: ${msg.text}\n\n`;
          }
          instruction += "Narrator: ";
        }

        // Call the Perchance AI plugin
        // The plugin is a function: ai(instruction, options)
        const result = await window.ai(instruction, {
          temperature: payload.params?.temperature,
          top_p: payload.params?.top_p,
          max_tokens: payload.params?.maxTokens,
          model: payload.params?.model,
          signal,
        });

        // Simulate streaming by calling onToken with the full result
        if (onToken && typeof onToken === "function") {
          onToken(result);
        }

        // Call onDone when complete
        if (onDone && typeof onDone === "function") {
          onDone();
        }

        return result;
      } catch (err) {
        error("AI generation error:", err);
        throw err;
      }
    },
  },

  story: {
    /**
     * Parse user input to determine message type (IC vs OOC)
     * @param {string} text - Raw user input
     * @param {Object} userCharacter - User's selected character
     * @returns {Object} - {type: "IC"|"OOC", text: string, characterName?: string}
     */
    parseUserInput: (text, userCharacter) => {
      // Check for /director prefix (OOC command)
      if (text.startsWith("/director ")) {
        return {
          type: "OOC",
          text: text.substring(10).trim(), // Remove "/director "
        };
      }

      // Shortcut: /continue
      if (text === "/continue") {
        return {
          type: "OOC",
          text: "Continue the story",
        };
      }

      // Shortcut: /retry
      if (text === "/retry") {
        return {
          type: "OOC",
          text: "Retry the last response",
        };
      }

      // Default: In-Character
      return {
        type: "IC",
        text: text,
        characterName: userCharacter?.name || "Character",
      };
    },

    /**
     * Parse narrator response to determine if 1 or 2 messages
     * Format 1: "CharacterName: dialogue"
     * Format 2: "Narrator: description\nCharacterName: dialogue"
     * @param {string} text - AI generated text
     * @param {Object} aiCharacter - AI's selected character
     * @returns {Array} - Array of 1 or 2 message objects: [{type, text, characterName}]
     */
    parseNarratorResponse: (text, aiCharacter) => {
      const trimmedText = text.trim();
      const characterName = aiCharacter?.name || "Character";

      // Check if response starts with "Narrator:"
      if (trimmedText.startsWith("Narrator:")) {
        // Format 2: Look for character response after narrator
        // Pattern: "Narrator: ...\nCharacterName: ..."
        const narratorPattern =
          /^Narrator:\s*([\s\S]*?)(?=\n\s*[A-Za-z\s'-]+:\s*|$)/;
        const narratorMatch = trimmedText.match(narratorPattern);

        if (narratorMatch) {
          const narratorText = narratorMatch[1].trim();
          const remainingText = trimmedText
            .substring(narratorMatch[0].length)
            .trim();

          // Look for character response
          const characterPattern = new RegExp(
            `^([A-Za-z\\s'-]+):\\s*([\\s\\S]+)$`
          );
          const characterMatch = remainingText.match(characterPattern);

          if (characterMatch) {
            // Found both narrator and character - return 2 messages
            return [
              {
                type: "OOC",
                text: narratorText,
                characterName: null,
              },
              {
                type: "IC",
                text: characterMatch[2].trim(),
                characterName: characterMatch[1].trim(),
              },
            ];
          } else {
            // Only narrator found (should be rare based on our rules)
            return [
              {
                type: "OOC",
                text: narratorText,
                characterName: null,
              },
            ];
          }
        }
      }

      // Format 1: Character only (default)
      // Pattern: "CharacterName: dialogue"
      const characterPattern = new RegExp(`^([A-Za-z\\s'-]+):\\s*([\\s\\S]+)$`);
      const characterMatch = trimmedText.match(characterPattern);

      if (characterMatch) {
        return [
          {
            type: "IC",
            text: characterMatch[2].trim(),
            characterName: characterMatch[1].trim(),
          },
        ];
      }

      // Fallback: treat entire response as character dialogue
      return [
        {
          type: "IC",
          text: trimmedText,
          characterName: characterName,
        },
      ];
    },

    requireActive: () => {
      if (!App.state.story.activeId) {
        error("No active story found. Please create a new story first.");
        throw new Error("No active story. Please create a new story.");
      }
      return App.state.story.activeId;
    },

    loadActive: async () => {
      try {
        // Guard clause: check if database is initialized
        if (!db || !db.stories) {
          log("Database not initialized, skipping story loading.");
          return null;
        }

        // Load the most recent story from database
        const stories = await db.stories
          .orderBy("updatedAt")
          .reverse()
          .toArray();

        if (stories.length === 0) {
          log("No stories found in database.");
          return null;
        }

        const activeStory = stories[0]; // Most recently updated story

        // Load story into state
        App.applyPatch({
          story: {
            activeId: activeStory.id,
            byId: { [activeStory.id]: activeStory },
            allIds: [activeStory.id],
          },
        });

        log(`Loaded active story: ${activeStory.id} - ${activeStory.title}`);

        // Load messages for this story
        await App.story.loadMessages(activeStory.id);

        return activeStory.id;
      } catch (err) {
        error("Failed to load active story:", err);
        return null;
      }
    },

    createFromSelection: async ({
      storyTitle,
      aiCharacterId,
      userCharacterId,
      worldId,
    }) => {
      try {
        const ch = Object.values(App.state.characters.byId).find(
          (c) => c.id === aiCharacterId && c.type === "character"
        );
        const title = storyTitle || `${ch?.name || "Character"} × Story`;
        const newStory = {
          aiCharacterId,
          userCharacterId,
          worldId,
          title,
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
          ui: { title },
        });
        return storyId;
      } catch (err) {
        error("Failed to create story:", err);
        alert("Could not create story. Please try again.");
        throw err;
      }
    },

    loadMessages: async (storyId) => {
      try {
        // Load all messages for this story from database
        const messages = await db.messages
          .where("storyId")
          .equals(storyId)
          .sortBy("createdAt");

        // Update state with loaded messages
        App.applyPatch({
          messages: {
            byStoryId: {
              [storyId]: messages,
            },
          },
        });

        log(`Loaded ${messages.length} messages for story ${storyId}`);
        return messages;
      } catch (err) {
        error("Failed to load messages:", err);
        return [];
      }
    },

    render: async (storyId) => {
      const storyFeed = document.querySelector("#story-feed");
      if (!storyFeed) return;

      // Clear existing messages
      storyFeed.innerHTML = "";

      const messages = App.state.messages.byStoryId[storyId] || [];
      const noMessagesEl = document.querySelector("#no-messages");

      if (messages.length === 0) {
        if (noMessagesEl) noMessagesEl.hidden = false;
        return;
      }

      if (noMessagesEl) noMessagesEl.hidden = true;

      messages.forEach((msg) => {
        renderMessage(
          storyFeed,
          msg.role,
          msg.text,
          msg.characterName,
          msg.type
        );
      });

      storyFeed.scrollTop = storyFeed.scrollHeight;
    },

    send: async (userText) => {
      if (!userText) return;
      if (!["idle", "done", "error", "aborted"].includes(App.state.ui.fsm))
        return;

      const storyId = App.story.requireActive();

      // Get user's character for IC messages
      // Note: We need to determine which character is the user's
      // For now, we'll get this from the storyboard selection
      const userCharacterSelect = document.querySelector(
        "#storyboard-card-user-select"
      );
      const userCharacterId = userCharacterSelect?.value;
      let userCharacter = null;
      if (userCharacterId) {
        try {
          userCharacter = await entities.get("character", userCharacterId);
        } catch (err) {
          error("Failed to load user character:", err);
        }
      }

      // Parse user input (IC vs OOC)
      const parsed = App.story.parseUserInput(userText, userCharacter);

      // Save user message with robust error handling
      try {
        await db.messages.add({
          storyId,
          role: "user",
          type: parsed.type,
          text: parsed.text,
          characterName: parsed.characterName || null,
          createdAt: Date.now(),
        });
      } catch (err) {
        error("Failed to save user message:", err);
        alert("Could not save your message. Please try again.");
        App.applyPatch({
          ui: { fsm: "error", lastError: "Failed to save message" },
        });
        return;
      }

      // Reload messages with robust error handling
      try {
        await App.story.loadMessages(storyId);
      } catch (err) {
        error("Failed to reload messages:", err);
        // Non-fatal: message was saved, but state might be stale
        // Continue anyway - the message will load on next page refresh
      }

      // Build prompt and generate AI response
      try {
        const payload = await App.prompt.build(storyId);
        const ctrl = new AbortController();
        App.applyPatch({
          ui: { fsm: "sending", lastError: null, abortController: ctrl },
        });

        try {
          App.applyPatch({ ui: { fsm: "streaming" } });
          await App.ai.generateStream({
            payload,
            signal: ctrl.signal,
            onToken: (t) => App.story._appendAssistantToken(storyId, t),
            onDone: async () =>
              await App.story._finalizeAssistantMessage(storyId),
          });

          App.applyPatch({ ui: { fsm: "done" } });
        } catch (e) {
          const isAbort = e?.name === "AbortError";
          App.applyPatch({
            ui: {
              fsm: isAbort ? "aborted" : "error",
              lastError: e?.message || String(e),
            },
          });
        }
      } catch (err) {
        error("Failed to generate AI response:", err);
        App.applyPatch({
          ui: { fsm: "error", lastError: "Failed to generate response" },
        });
      }
    },

    stop: () => {
      if (App.state.ui.abortController) {
        App.state.ui.abortController.abort();
        App.state.applyPatch({ ui: { fsm: "aborted", abortController: null } });
        log("Story stream aborted.");
      }
    },
    retry: async () => {
      const storyId = App.story.requireActive();
      const messages = App.state.messages.byStoryId[storyId];
      if (messages && messages.length > 0) {
        const lastUserMessage = messages.findLast((msg) => msg.role === "user");
        if (lastUserMessage) {
          // Remove any narrator messages after the last user message
          const lastUserMessageIndex = messages.lastIndexOf(lastUserMessage);
          App.state.messages.byStoryId[storyId] = messages.slice(
            0,
            lastUserMessageIndex + 1
          );
          await App.story.send(lastUserMessage.text);
        }
      }
    },
    regenerate: async () => {
      const storyId = App.story.requireActive();
      const messages = App.state.messages.byStoryId[storyId];
      if (messages && messages.length > 0) {
        // Find the last user message and remove it and subsequent narrator messages
        const lastUserMessageIndex = messages.findLastIndex(
          (msg) => msg.role === "user"
        );
        if (lastUserMessageIndex !== -1) {
          App.state.messages.byStoryId[storyId] = messages.slice(
            0,
            lastUserMessageIndex
          );
          const previousUserMessage = messages[lastUserMessageIndex];
          await App.story.send(previousUserMessage.text);
        }
      }
    },
    continue: async () => {
      await App.story.send("continue"); // Send a predefined 'continue' message
    },
    _appendAssistantToken: (storyId, token) => {
      let messages = App.state.messages.byStoryId[storyId] || [];
      let lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "narrator") {
        lastMessage = {
          id: Date.now(),
          storyId,
          role: "narrator",
          type: null, // Will be determined when finalized
          text: "",
          characterName: null,
          createdAt: Date.now(),
        };
        messages.push(lastMessage);
      }
      lastMessage.text += token;
      App.applyPatch({
        messages: { byStoryId: { [storyId]: messages } },
      });
    },
    _finalizeAssistantMessage: async (storyId) => {
      try {
        const messages = App.state.messages.byStoryId[storyId] || [];
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage || lastMessage.role !== "narrator") {
          error("No narrator message to finalize");
          return;
        }

        // Parse narrator response to determine IC/OOC (returns array of 1 or 2 messages)
        const story = App.state.story.byId[storyId];
        const aiCharacterId = story?.aiCharacterId; // The AI's character
        let aiCharacter = null;
        if (aiCharacterId) {
          try {
            aiCharacter = await entities.get("character", aiCharacterId);
          } catch (err) {
            error("Failed to load AI character:", err);
          }
        }

        const parsedMessages = App.story.parseNarratorResponse(
          lastMessage.text,
          aiCharacter
        );

        // Save each parsed message to database
        const baseTimestamp = lastMessage.createdAt || Date.now();
        for (let i = 0; i < parsedMessages.length; i++) {
          const parsed = parsedMessages[i];
          await db.messages.add({
            storyId,
            role: "narrator",
            type: parsed.type,
            text: parsed.text,
            characterName: parsed.characterName,
            createdAt: baseTimestamp + i, // Slightly increment timestamp to maintain order
          });
        }

        // Update story's updatedAt timestamp
        await db.stories.update(storyId, { updatedAt: Date.now() });

        log(
          `Finalized and saved ${parsedMessages.length} message(s) for story ${storyId}`
        );

        // Reload messages from database to update UI with properly parsed messages
        await App.story.loadMessages(storyId);
        await App.story.render(storyId);
      } catch (err) {
        error("Failed to save narrator message:", err);
        // Don't throw - UI should still show the message even if save fails
      }
    },
  },
};

// Expose App to the window for debugging and easy access
window.App = App;

// =================================================================

let _allItemsCache = {}; // Local cache for lists

const TEST_MODE = (() => {
  if (typeof globalThis.__TEST__ === "boolean") {
    return globalThis.__TEST__;
  }
  try {
    return /jsdom/i.test(globalThis?.navigator?.userAgent || "");
  } catch {
    return false;
  }
})();

const MAX_INIT_RETRIES = TEST_MODE ? 1 : 40;
const INIT_BACKOFF_MS = TEST_MODE ? 0 : 250;
const DATA_KEYS = ["stories", "characters", "worlds"];

// UI Timing Constants
const BLUR_SUPPRESS_DURATION_MS = 1200;
const UI_WATCHDOG_MAX_ATTEMPTS = 24;
let _cardNavAttached = false;
let _suppressNextBlur = false;
let _optionsListenersAttached = false;
let _contentListenersAttached = false;
let _bootBound = false;
let _bootStarted = false;

// Cache for storyboard picture templates (populated in initializeWhenReady)
let templates = {};

// Function to cache templates
function _cacheTemplates() {
  const templateIds = [
    "tpl-storyboard-picture-character",
    "tpl-storyboard-picture-world",
    "tpl-storyboard-picture-default",
    "tpl-placeholder-icon-character",
    "tpl-placeholder-icon-world",
    "tpl-placeholder-icon-default",
  ];
  templateIds.forEach((id) => {
    const tpl = document.querySelector(`#${id}`);
    if (tpl) {
      templates[id] = tpl;
    }
  });
  log?.("Templates cached:", Object.keys(templates));
}

export function _getUIElements() {
  const doc = document;
  const ui = {}; // Initialize ui object inside the function

  ui.topBarLeft = doc.querySelector("#top-bar-left");
  ui.chinContainer = doc.querySelector("#chin-container");
  ui.topBarButtons = ui.topBarLeft
    ? ui.topBarLeft.querySelectorAll("button[data-chin]")
    : [];
  ui.topBarRightStoryboard = doc.querySelector("#top-bar-right-storyboard");
  ui.topBarRightForm = doc.querySelector("#top-bar-right-form");
  ui.topBarRightProfile = doc.querySelector("#top-bar-right-profile");

  // Option chin actions
  ui.uploadBackupInput = doc.querySelector("#upload-backup");
  ui.uploadBackupTrigger = doc.querySelector('[data-trigger="upload-backup"]');
  ui.downloadBackupButton = doc.querySelector("#download-backup");
  ui.deleteAllDataButton = doc.querySelector("#delete-all-data");

  // Story chin actions
  ui.newStoryButton = doc.querySelector("#new-story");
  ui.uploadStoryTrigger = doc.querySelector('[data-trigger="upload-story"]');
  ui.uploadStoryInput = doc.querySelector("#upload-story");

  // Character chin actions
  ui.newCharacterButton = doc.querySelector("#new-character");
  ui.uploadCharacterTrigger = doc.querySelector(
    '[data-trigger="upload-character"]'
  );
  ui.uploadCharacterInput = doc.querySelector("#upload-character");

  // World chin actions
  ui.newWorldButton = doc.querySelector("#new-world");
  ui.uploadWorldTrigger = doc.querySelector('[data-trigger="upload-world"]');
  ui.uploadWorldInput = doc.querySelector("#upload-world");

  return ui;
}

// Migrated from localStorage to IndexedDB
async function saveStoryboardSelection() {
  const selects = {
    narrator: document.querySelector("#storyboard-card-narrator-select")?.value,
    user: document.querySelector("#storyboard-card-user-select")?.value,
    world: document.querySelector("#storyboard-card-world-select")?.value,
  };
  try {
    // Get existing settings or create new one
    let settings = await db.settings.get("app-settings");
    if (!settings) {
      settings = { id: "app-settings" };
    }
    settings.storyboardSelection = selects;
    await db.settings.put(settings);
  } catch (e) {
    error("Failed to save storyboard selection:", e);
  }
}

async function loadStoryboardSelection() {
  try {
    const settings = await db.settings.get("app-settings");
    return settings?.storyboardSelection || {};
  } catch (e) {
    error("Failed to load storyboard selection:", e);
    return {};
  }
}

/**
 * Gets all items, merging premade and custom.
 * Uses entities.list() for async db operations for all entity types (stories, characters, worlds).
 */
async function getAllItems(key, refresh = false) {
  if (!refresh && Array.isArray(_allItemsCache[key]))
    return [..._allItemsCache[key]];
  const type = key.replace(/s$/, ""); // 'characters' -> 'character', 'stories' -> 'story'
  if (entities && typeof entities.list === "function") {
    try {
      if (refresh) {
        delete _allItemsCache[key];
      }
      const items = await entities.list(type);
      _allItemsCache[key] = items;
      return items;
    } catch (err) {
      error(`Failed to load ${type}:`, err);
      alert(`Could not load ${type} data. Please refresh and try again.`);
      _allItemsCache[key] = [];
      return [];
    }
  }

  // Fallback to empty array if entities module is not available
  log(`getAllItems: entities.list not available for type "${type}"`);
  _allItemsCache[key] = [];
  return [];
}

async function renderList(containerId, key) {
  // <-- MADE ASYNC
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;
  container.setAttribute("aria-busy", "true");
  container
    .querySelectorAll('img.entity-image[src^="blob:"]')
    .forEach((img) => {
      URL.revokeObjectURL(img.src);
    });

  container.textContent = "";
  const all = await getAllItems(key); // <-- AWAITED
  const frag = document.createDocumentFragment();
  if (all.length === 0) {
    const message = document.createElement("p");
    message.className = "chin-empty";
    message.textContent =
      key === "stories"
        ? "Empty here—time to write your first story!"
        : key === "characters"
          ? "No characters found yet"
          : key === "worlds"
            ? "No worlds found yet"
            : "No items found";
    container.appendChild(message);
    container.setAttribute("aria-busy", "false");
    return;
  }

  const tpl = document.querySelector("#unified-card-template");
  all.forEach((item) => {
    let card;

    if (tpl && tpl.content) {
      card = tpl.content.firstElementChild.cloneNode(true);
    } else {
      // Fallback: create card structure using DOM API
      card = document.createElement("div");
      card.className = "card";
      const media = document.createElement("div");
      media.className = "card-media";
      const body = document.createElement("div");
      body.className = "card-body";
      const title = document.createElement("h4");
      title.className = "card-title";
      body.appendChild(title);
      const desc = document.createElement("p");
      desc.className = "card-description";
      body.appendChild(desc);
      const footer = document.createElement("div");
      footer.className = "card-footer";
      card.appendChild(media);
      card.appendChild(body);
      card.appendChild(footer);
    }

    card.dataset.title = item.name || "Empty";
    if (item.id) {
      card.dataset.id = item.id;
      card.dataset.type = key.slice(0, -1);
      card.dataset.entityId = item.id;
      card.dataset.entityType = key.slice(0, -1);
    }
    if (item.isPremade) card.dataset.premade = "true";
    card.setAttribute("aria-label", item.name || "Open");
    const media = card.querySelector(".card-media");
    if (typeof getPictureHTML === "function") {
      const maybe = getPictureHTML(item, {
        cover: true,
        templates: templates, // Pass the templates object
      });
      if (maybe instanceof Node) {
        media.prepend(maybe);
      } else if (typeof maybe === "string") {
        const t = document.createElement("template");
        t.innerHTML = window.DOMPurify
          ? window.DOMPurify.sanitize(maybe.trim())
          : maybe.trim();
        const node = t.content.firstElementChild;
        if (node) media.prepend(node);
      }
    }

    // Signature color is handled by CSS custom properties in getPictureHTML

    // Append chips to media (image area) for proper absolute positioning overlay
    // const footer = card.querySelector(".card-footer");
    // if (media) {
    //   const row = document.createElement("div");
    //   row.className = "chip-row";
    //   const chips = [];
    //   if (item.isPremade) chips.push("Premade");
    //   if (Array.isArray(item.tags)) chips.push(...item.tags.slice(0, 3));
    //   chips.forEach((txt) => {
    //     const span = document.createElement("span");
    //     span.className = "chip";
    //     const sm = document.createElement("small");
    //     sm.textContent = txt;
    //     span.appendChild(sm);
    //     row.appendChild(span);
    //   });
    //   Append to media instead of footer so chips overlay the image
    //   media.appendChild(row);
    // }

    const titleEl = card.querySelector(".card-title");
    if (titleEl) titleEl.textContent = item.name || "Empty";

    const descEl = card.querySelector(".card-description");
    if (descEl) {
      descEl.textContent = item.description ? item.description : "";
      descEl.classList.add("muted");
    }

    card.addEventListener("click", (ev) => {
      if (ev.target.closest("button, a, input, select, textarea")) return;
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || card.dataset.id;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || card.dataset.id;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    frag.appendChild(card);
  });
  container.appendChild(frag);
  container.setAttribute("aria-busy", "false");
}

async function renderDropdown(doc, selectId, key) {
  // <-- MADE ASYNC
  const select = doc.querySelector(`#${selectId}`);
  if (!select) return;

  select.setAttribute("aria-busy", "true");

  const existingPlaceholder = select.querySelector('option[value=""]');
  const placeholderText = existingPlaceholder
    ? existingPlaceholder.textContent
    : select.dataset.placeholder || "";
  select.dataset.placeholder = placeholderText;
  const placeholder = existingPlaceholder
    ? existingPlaceholder.cloneNode(true)
    : doc.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderText;
  placeholder.selected = true; // Make it the default selected option
  select.prepend(placeholder); // Add as the first child
  const items = await getAllItems(key); // <-- AWAITED
  const premadeGroup = doc.createElement("optgroup");
  premadeGroup.label = "Premade";
  const customGroup = doc.createElement("optgroup");
  customGroup.label = "Custom";
  let premadeCount = 0;
  let customCount = 0;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id || item.name;
    option.textContent = item.name || "";
    if (item.isPremade) {
      premadeGroup.appendChild(option);
      premadeCount += 1;
    } else {
      customGroup.appendChild(option);
      customCount += 1;
    }
  });
  if (premadeCount > 0) select.appendChild(premadeGroup);
  if (customCount > 0) select.appendChild(customGroup);

  select.setAttribute("aria-busy", "false");
}

async function renderStoryList() {
  // <-- MADE ASYNC
  await renderList("chin-story-grid", "stories"); // <-- AWAITED
}

async function renderCharacterList() {
  // <-- MADE ASYNC
  await renderList("chin-character-grid", "characters"); // <-- AWAITED
}

async function renderWorldList() {
  // <-- MADE ASYNC
  await renderList("chin-world-grid", "worlds"); // <-- AWAITED
}

async function refreshAllLists() {
  // <-- MADE ASYNC
  await Promise.all(DATA_KEYS.map((key) => getAllItems(key, true))); // <-- AWAITED
  await renderStoryList?.(); // <-- AWAITED
  await renderCharacterList?.(); // <-- AWAITED
  await renderWorldList?.(); // <-- AWAITED
}

function _attachCardNavigation() {
  if (_cardNavAttached) return;
  if (typeof _suppressNextBlur === "undefined") {
    _suppressNextBlur = false;
  }

  const container = document.querySelector("#chin-container");
  if (container) {
    container.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, select, textarea")) return;
      const card = e.target.closest(".chin-card[data-type][data-id]");
      if (!card) return;
      setChosen?.(
        card,
        container.querySelectorAll(".chin-card[data-type][data-id]")
      );
      const { type, id } = card.dataset;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    container.addEventListener("keydown", (e) => {
      const card = e.target.closest(".chin-card[data-type][data-id]");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const { type, id } = card.dataset;
        if (type && id) router.navigate(`#profile/${type}/${id}`);
      }
    });
  }

  const storyboard = document.querySelector("#storyboard-grid");
  if (storyboard && !storyboard._bound) {
    storyboard._bound = true;
    storyboard.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest(".storyboard-card")) {
          _suppressNextBlur = true;
          setTimeout(() => {
            _suppressNextBlur = false;
          }, BLUR_SUPPRESS_DURATION_MS);
        }
      },
      {
        passive: true,
        capture: true,
      }
    );

    storyboard.addEventListener("click", async (e) => {
      // <-- MADE ASYNC
      if (e.target.closest("select, button, a, input, textarea")) return;
      const card = e.target.closest(".storyboard-card");
      if (!card) return;
      const select = card.querySelector("select");
      const all = storyboard.querySelectorAll(".storyboard-card");
      setChosen(card, all);
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || select?.value || "";

      // Update App.state and persist selection
      if (type && id) {
        try {
          App.applyPatch({ ui: { chosenStoryboardCard: { type, id } } });
          // Deselect all other entities of the same type
          await db.entities
            .where({ type: type, isChosen: true })
            .modify({ isChosen: false });
          // Select the current entity
          await db.entities.update(id, { isChosen: true });
        } catch (err) {
          error("Failed to update selection:", err);
          // Don't show alert for selection errors - not critical to user workflow
        }
      } else {
        App.applyPatch({ ui: { chosenStoryboardCard: null } });
      }

      if (!id && select) {
        _suppressNextBlur = true;
        requestAnimationFrame(() => {
          setTimeout(() => {
            _suppressNextBlur = false;
          }, BLUR_SUPPRESS_DURATION_MS);
        });
        return;
      }

      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    storyboard.addEventListener("keydown", (e) => {
      const card = e.target.closest(".storyboard-card");
      if (!card) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const select = card.querySelector("select");
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || select?.value || "";
      if (!id && select) {
        _suppressNextBlur = true;
        requestAnimationFrame(() => {
          setTimeout(() => {
            _suppressNextBlur = false;
          }, BLUR_SUPPRESS_DURATION_MS);
        });
        return;
      }

      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    storyboard.querySelectorAll(".storyboard-card").forEach((c) => {
      if (!c.hasAttribute("tabindex")) c.tabIndex = 0;
      c.setAttribute("role", "group");
      const select = c.querySelector("select");
      if (select && !select.hasAttribute("aria-label")) {
        select.setAttribute("aria-label", "Select entity");
      }

      if (!c._navBound) {
        c.addEventListener("click", (ev) => {
          if (ev.target.closest("select, button, a, input, textarea")) return;
          const type = c.dataset.entityType || c.dataset.type;
          const id =
            c.dataset.entityId || c.querySelector("select")?.value || "";
          if (type && id) router.navigate?.(`#profile/${type}/${id}`);
        });
        c.addEventListener("keydown", (ev) => {
          if (ev.key !== "Enter" && ev.key !== " ") return;
          ev.preventDefault();
          const type = c.dataset.entityType || c.dataset.type;
          const id =
            c.dataset.entityId || c.querySelector("select")?.value || "";
          if (type && id) router.navigate?.(`#profile/${type}/${id}`);
        });
        c._navBound = true;
      }
    });
  }
  _cardNavAttached = true;
}

// ========== Storyboard Card Helpers ==========

/**
 * Resolves card element and entity data from target (select or card element).
 *
 * @param {HTMLElement|string} target - Either a select element or card element/selector
 * @param {Object} entityOrKey - Entity object or key for lookup
 * @returns {Promise<{card: HTMLElement|null, entity: Object|null}>} Card and entity objects
 *
 * Error handling: Uses handleAsyncError to show user alert on entity load failure.
 * Returns null entity on error (does not throw).
 */
async function _resolveCardAndEntity(target, entityOrKey) {
  let card, entity;

  if (target && target.tagName === "SELECT") {
    const select = target;
    card = select.closest(".card");
    const type =
      card?.dataset?.type ||
      select.dataset.entityType ||
      select.dataset.type ||
      "";
    const id = select.value || "";

    if (id) {
      entity = await handleAsyncError(
        async () => await entities.get(type, id),
        {
          errorMessage: `Could not load ${type} details. Please try again.`,
          context: `load ${type}`,
          fallback: null,
        }
      );
    } else {
      entity = null;
    }
  } else {
    card = typeof target === "string" ? document.querySelector(target) : target;
    entity = entityOrKey || null;
  }

  return { card, entity };
}

/**
 * Ensures card has proper DOM structure (creates elements if missing).
 * Implements race condition prevention using promise-based locking.
 *
 * @param {HTMLElement} card - The storyboard card element
 * @returns {Promise<{media: HTMLElement, body: HTMLElement, titleEl: HTMLElement, descEl: HTMLElement, footer: HTMLElement}>} Card element references
 *
 * Error handling: Does not throw. Returns existing structure or builds new one.
 * Race condition safe: Multiple concurrent calls will await the same initialization promise.
 */
async function _ensureCardStructure(card) {
  // Guard against race condition: if already initializing, wait for completion
  if (card._isInitializing) {
    return await card._initPromise;
  }

  const cardId = card.id;
  const cardType = card.dataset?.type;
  const selectId = cardId ? `${cardId}-select` : null;
  let media = card.querySelector(".card-media");
  let body = card.querySelector(".card-body");
  let titleEl = card.querySelector(".card-title");
  let descEl = card.querySelector(".card-description");
  let footer = card.querySelector(".card-footer");

  // Build structure if empty
  if (!media || !body || !titleEl || !descEl || !footer) {
    card._isInitializing = true;

    // Wrap setup logic in promise to prevent race conditions
    card._initPromise = (async () => {
      try {
        card.innerHTML = "";

        const newMedia = document.createElement("div");
        newMedia.className = "card-media";
        card.appendChild(newMedia);

        const newBody = document.createElement("div");
        newBody.className = "card-body";
        card.appendChild(newBody);

        const newTitleEl = document.createElement("select");
        newTitleEl.className = "card-title";
        if (selectId) newTitleEl.id = selectId;
        newTitleEl.dataset.entityType = cardType;
        newTitleEl.dataset.type = cardType;
        if (card.id === "storyboard-card-narrator") {
          newTitleEl.dataset.placeholder = "Select AI Character";
        } else if (card.id === "storyboard-card-user") {
          newTitleEl.dataset.placeholder = "Select Your Character";
        } else if (card.id === "storyboard-card-world") {
          newTitleEl.dataset.placeholder = "Select World";
        }
        newBody.appendChild(newTitleEl);

        const newDescEl = document.createElement("p");
        newDescEl.className = "card-description";
        newBody.appendChild(newDescEl);

        const newFooter = document.createElement("div");
        newFooter.className = "card-footer";
        newBody.appendChild(newFooter);

        const dataKey = cardType === "world" ? "worlds" : "characters";
        await renderDropdown(document, selectId || newTitleEl.id, dataKey);
        newTitleEl.addEventListener("change", onStoryboardChange);

        return {
          media: newMedia,
          body: newBody,
          titleEl: newTitleEl,
          descEl: newDescEl,
          footer: newFooter,
        };
      } catch (err) {
        error("Failed to build card structure:", err);
        card.innerHTML = "";
        return {
          media: null,
          body: null,
          titleEl: null,
          descEl: null,
          footer: null,
        };
      }
    })();

    try {
      const resolvedElements = await card._initPromise;
      media = resolvedElements.media;
      body = resolvedElements.body;
      titleEl = resolvedElements.titleEl;
      descEl = resolvedElements.descEl;
      footer = resolvedElements.footer;
    } finally {
      // Cleanup: prevent memory leak by removing temporary properties
      card._isInitializing = false;
      delete card._initPromise;
    }
  }

  if (descEl && !descEl.dataset.placeholder) {
    descEl.dataset.placeholder = descEl.textContent || "";
  }

  return { media, body, titleEl, descEl, footer };
}

/**
 * Builds a picture node from entity data or placeholder template.
 * Pure function - does not query DOM directly, uses provided templates.
 *
 * @param {Object} ent - Entity object with kind, imageUrl, id, and name
 * @param {Object} options - Options object
 * @param {boolean} options.preferTemplateForEmpty - Use template for empty states (default: true)
 * @param {Object} options.templates - Map of template IDs to template elements (REQUIRED)
 * @returns {HTMLElement} Picture node (either from template, getPictureHTML, or fallback div)
 *
 * Error handling: Does not throw. Returns fallback div if all attempts fail.
 * Pure function: No DOM queries, only uses provided templates parameter.
 */
// _buildPictureNode removed - use getPictureHTML directly

/**
 * Populates a storyboard card with entity data.
 *
 * @param {HTMLElement} card - The storyboard card element
 * @param {Object} entity - Entity object with description, isPremade, kind, id
 * @param {Object} elements - Card DOM element references
 * @param {Object} templates - Template elements map for picture generation
 *
 * Error handling: Does not throw. Silently handles missing elements.
 */
function _populateCardWithEntity(card, entity, elements, templates) {
  const { media, descEl, footer } = elements;
  if (descEl) descEl.textContent = entity.description || "";
  if (media) {
    media.textContent = "";
    const picture = getPictureHTML(entity, {
      cover: true,
      neutralPlaceholder: !entity?.id && !entity?.name,
    });
    if (picture) {
      media.appendChild(picture);
    }
  }

  if (footer) {
    footer.querySelectorAll(".tag-chip").forEach((n) => n.remove());
    if (entity.isPremade) {
      const pill = document.createElement("span");
      pill.className = "chip";
      pill.className = "tag-chip";
      if (entity.signatureColour) {
        pill.style.setProperty("--signature", `var(--signature-${entity.signatureColour.toLowerCase()})`);
      }
      const sm = document.createElement("small");
      sm.textContent = "Premade";
      pill.appendChild(sm);
      footer.appendChild(pill);
    }
  }

  if (entity.signatureColour && entity.signatureColour !== 'default') {
    card.style.setProperty("--signature", `var(--pico-${entity.signatureColour.toLowerCase()})`);
    if (entity.signatureColour) {
      card.style.setProperty("--signature", `var(--signature-${entity.signatureColour.toLowerCase()})`);
    } else {
      card.style.removeProperty("--signature");
    }

    card.dataset.entityType = card.dataset.type || entity.kind || "";
    card.dataset.entityId = entity.id;
    const select = card.querySelector("select");
    if (select && select.value !== String(entity.id)) {
      select.value = String(entity.id);
    }

    const isChosen =
      App.state.ui.chosenStoryboardCard &&
      App.state.ui.chosenStoryboardCard.id === entity.id &&
      App.state.ui.chosenStoryboardCard.type === entity.type;
    card.classList.toggle("chosen", isChosen);
    card.classList.add("selected");
  }}

  /**
   * Clears a storyboard card to empty state.
   *
   * @param {HTMLElement} card - The storyboard card element
   * @param {Object} elements - Card DOM element references
   * @param {Object} templates - Template elements map for placeholder picture
   *
   * Error handling: Does not throw. Silently handles missing elements.
   */
  function _clearCard(card, elements, templates) {
    const { media, titleEl, descEl, footer } = elements;

    // Set placeholder text for the title (select element)
    if (titleEl) {
      titleEl.value = ""; // Ensure no option is selected
      const placeholderOption = titleEl.querySelector('option[value=""]');
      if (placeholderOption) {
        placeholderOption.textContent = titleEl.dataset.placeholder || "";
      }
    }

    // Set descriptive placeholder for the description
    if (descEl) {
      let placeholderText = "";
      switch (card.id) {
        case "storyboard-card-narrator":
          placeholderText = "Select the AI character for your story.";
          break;
        case "storyboard-card-user":
          placeholderText = "Select your character to play the story.";
          break;
        case "storyboard-card-world":
          placeholderText = "Select a world to set the scene.";
          break;
        default:
          placeholderText = "Select an entity.";
      }
      descEl.textContent = placeholderText;
      descEl.classList.add("placeholder-text");
    }

    if (media) {
      media.textContent = "";
      const picture = getPictureHTML(
        { type: card.dataset.type },
        { cover: true, neutralPlaceholder: true }
      );
      if (picture) {
        media.appendChild(picture);
      }
      card?.style?.removeProperty("--signature");
    }
    if (footer) footer.querySelectorAll(".tag-chip").forEach((n) => n.remove());
    card.classList.remove("chosen");
    card.classList.remove("selected");
    delete card.dataset.entityType;
    delete card.dataset.entityId;
    const select = card.querySelector("select");
    if (select && select.value !== "") {
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // Main: Update storyboard card (orchestrates helpers)
  async function updateStoryboardCard(target, entityOrKey, opts = {}) {
    const { card, entity } = await _resolveCardAndEntity(target, entityOrKey);
    if (!card) return;
    const elements = await _ensureCardStructure(card);

    // Use cached templates for performance (populated in initializeWhenReady)
    if (entity) {
      _populateCardWithEntity(card, entity, elements, templates);
    } else {
      _clearCard(card, elements, templates);
    }
  }

  const titlePrompts = [
    "Once upon a time",
    "The tale of",
    "Chronicles of",
    "Legend speaks of",
    "Adventures of",
  ];

  function randPrompt() {
    return titlePrompts[Math.floor(Math.random() * titlePrompts.length)];
  }

  // THIS FUNCTION IS NOW ASYNC
  async function _defaultStoryboardTitle() {
    // <-- MADE ASYNC
    const getTitle = async (id, key) => {
      // <-- MADE ASYNC
      const select = document.querySelector(`#${id}`);
      const value = select ? select.value : "";
      if (!value) return null;
      // Use the async getAllItems instead of synchronous access
      const items = await getAllItems(key); // <-- AWAITED
      const item = items.find((i) => (i.id ?? i.name) === value);
      return item ? item.name || null : null;
    };
    // Await all title parts in parallel
    const [narrator, user, world] = await Promise.all([
      // <-- AWAITED
      getTitle("storyboard-card-narrator-select", "characters"),
      getTitle("storyboard-card-user-select", "characters"),
      getTitle("storyboard-card-world-select", "worlds"),
    ]);

    const subjects = [narrator, user].filter(Boolean).join(" & ");
    let title;
    if (subjects && world) {
      title = `${randPrompt()} ${subjects} in ${world}`;
    } else if (subjects) {
      title = `${randPrompt()} ${subjects}`;
    } else if (world) {
      title = `${randPrompt()} a story in ${world}`;
    } else {
      title = "Your story begins…";
    }
    return title.length > 80 ? `${title.slice(0, 77)}…` : title;
  }

  // THIS FUNCTION IS NOW ASYNC
  async function setDynamicTitle(
    title,
    {
      // <-- MADE ASYNC
      manual = false,
    } = {}
  ) {
    const el = document.querySelector("#storyboard-dynamic-title");
    if (!el) return;
    if (!el.dataset.manual || el.dataset.manual === "false" || manual) {
      // Await the default title if no title is provided
      el.textContent = title || (await _defaultStoryboardTitle?.()) || ""; // <-- AWAITED
      el.dataset.manual = manual ? "true" : "false";
    }
  }

  function _setupStoryboardTitle() {
    const titleEl = document.querySelector("#storyboard-dynamic-title");
    if (!titleEl) return;
    if (titleEl.dataset.editable) return;
    titleEl.dataset.editable = "true";

    titleEl.setAttribute("role", "textbox");
    titleEl.setAttribute("aria-multiline", "false");
    if (!titleEl.hasAttribute("aria-label")) {
      titleEl.setAttribute("aria-label", "Storyboard title");
    }

    titleEl.autocapitalize = "off";
    titleEl.autocorrect = "off";
    titleEl.spellcheck = false;
    titleEl.setAttribute("autocomplete", "off");
    titleEl.setAttribute("autocapitalize", "off");
    titleEl.setAttribute("autocorrect", "off");
    titleEl.setAttribute("spellcheck", "false");

    const finishEditing = () => {
      titleEl.contentEditable = "false";
    };

    titleEl.addEventListener("click", () => {
      titleEl.contentEditable = "true";
      titleEl.dataset.manual = "true";
      const sel = getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(titleEl);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      titleEl.focus();
    });

    titleEl.addEventListener("blur", finishEditing);
    titleEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        titleEl.blur();
      }
    });
  }

  async function populateStoryboardSelects() {
    const selections = await loadStoryboardSelection();
    const configs = [
      {
        id: "storyboard-card-narrator-select",
        key: "characters",
        savedValue: selections.narrator,
      },
      {
        id: "storyboard-card-user-select",
        key: "characters",
        savedValue: selections.user,
      },
      {
        id: "storyboard-card-world-select",
        key: "worlds",
        savedValue: selections.world,
      },
    ];

    await Promise.all(
      configs.map(async ({ id, key, savedValue }) => {
        const select = document.querySelector(`#${id}`);
        if (select) {
          if (
            savedValue &&
            Array.from(select.options).some((o) => o.value === savedValue)
          ) {
            select.value = savedValue;
          }

          // Trigger the initial update after setting the value
          await onStoryboardChange({ target: select });
        }
      })
    );
  }

  async function onStoryboardChange(e) {
    // <-- MADE ASYNC

    const select = e.target;
    await updateStoryboardCard(select); // <-- AWAITED
    await setDynamicTitle?.(); // <-- AWAITED
    await saveStoryboardSelection();
    if (typeof _suppressNextBlur !== "undefined") {
      _suppressNextBlur = false;
    }
  }

  async function _attachStoryboardListeners() {
    // <-- MADE ASYNC

    await populateStoryboardSelects(); // <-- AWAITED
    _setupStoryboardTitle();
    const title = document.querySelector("#storyboard-dynamic-title");
    if (title) {
      title.addEventListener("input", () => {
        title.dataset.manual = "true";
      });

      title.addEventListener("dblclick", async () => {
        // <-- async
        title.dataset.manual = "false";
        await setDynamicTitle(); // <-- await
      });
    }
    const shuffleBtn = document.querySelector("#shuffle-btn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", async () => {
        // <-- async

        [
          "storyboard-card-narrator-select",
          "storyboard-card-user-select",
          "storyboard-card-world-select",
        ].forEach((id) => {
          const s = document.querySelector(`#${id}`);
          if (!s) return;
          const opts = Array.from(s.options).filter((o) => o.value);
          if (opts.length)
            s.value = opts[Math.floor(Math.random() * opts.length)].value;
          s.dispatchEvent(
            new Event("change", {
              bubbles: true,
            })
          );
        });
        await setDynamicTitle?.(); // <-- await
      });
    }

    async function beginStory() {
      const narratorSelect = document.querySelector(
        "#storyboard-card-narrator-select"
      );
      const userSelect = document.querySelector("#storyboard-card-user-select");
      const worldSelect = document.querySelector("#storyboard-card-world-select");

      if (narratorSelect?.value && userSelect?.value && worldSelect?.value) {
        const storyTitleEl = document.querySelector("#storyboard-dynamic-title");
        const storyTitle = storyTitleEl?.textContent || "default-story";
        const aiCharacterId = narratorSelect.value;
        const worldId = worldSelect.value;
        const userCharacterId = userSelect.value;

        const [narratorChar, userChar] = await Promise.all([
          entities.get("character", aiCharacterId),
          entities.get("character", userCharacterId),
        ]);

        const storyId = await App.story.createFromSelection({
          storyTitle,
          aiCharacterId,
          userCharacterId,
          worldId,
        });

        const story = {
          ...App.state.story.byId[storyId],
          messages: App.state.messages.byStoryId[storyId] || [],
        };

        await renderStoryScreen(story, narratorChar, userChar);
        router.navigate("#story");

        App.applyPatch({ ui: { fsm: "idle" } });
      } else {
        alert(
          "Please select a Narrator character, your own character, and a world to begin the story."
        );
      }
    }
    const beginStoryBtn = document.querySelector("#begin-story");
    if (beginStoryBtn) {
      // Remove the old handler if it exists to prevent duplicate listeners
      if (beginStoryBtn._beginStoryHandler) {
        beginStoryBtn.removeEventListener(
          "click",
          beginStoryBtn._beginStoryHandler
        );
      }

      // Attach the new handler and store its reference for the next time
      beginStoryBtn.addEventListener("click", beginStory);
      beginStoryBtn._beginStoryHandler = beginStory;
    }

    // Use for...of loop to handle async await inside
    const cards = document.querySelectorAll(".storyboard-card");
    for (const card of cards) {
      // <-- FOR...OF
      const type = card.dataset.entityType;
      const id = card.dataset.entityId || "";
      const entity = await entities.get?.(type, id); // <-- AWAITED
      updateStoryboardCard(card, entity);
    }
  }

  function _attachOptionChinActions() {
    if (_optionsListenersAttached) return;
    const ui = _getUIElements();
    const { uploadBackupInput, downloadBackupButton, deleteAllDataButton } = ui;

    // This trigger is now handled by the importAllData function
    // if (uploadBackupTrigger && uploadBackupInput) { ... }

    if (uploadBackupInput) {
      uploadBackupInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && typeof importAllData === "function") importAllData(file);
      });
    }

    if (downloadBackupButton) {
      downloadBackupButton.addEventListener("click", () => {
        if (typeof exportAllData === "function") exportAllData();
      });
    }

    if (deleteAllDataButton) {
      deleteAllDataButton.addEventListener("click", () => {
        if (typeof deleteAllData === "function") deleteAllData();
      });
    }

    _optionsListenersAttached = true;
  }

  function _attachContentChinActions() {
    if (_contentListenersAttached) return;
    const ui = _getUIElements();

    const configs = [
      {
        key: "stories",
        newButton: ui.newStoryButton,
        uploadTrigger: ui.uploadStoryTrigger,
        uploadInput: ui.uploadStoryInput,
      },
      {
        key: "characters",
        newButton: ui.newCharacterButton,
        uploadTrigger: ui.uploadCharacterTrigger,
        uploadInput: ui.uploadCharacterInput,
      },
      {
        key: "worlds",
        newButton: ui.newWorldButton,
        uploadTrigger: ui.uploadWorldTrigger,
        uploadInput: ui.uploadWorldInput,
      },
    ];

    configs.forEach(({ key, newButton, uploadTrigger, uploadInput }) => {
      if (newButton) {
        newButton.addEventListener("click", () => {
          if (key === "stories") {
            router.navigate("#storyboard");
            return;
          }
          if (key === "characters" || key === "worlds") {
            router.navigate(`#profile/${key.slice(0, -1)}/new`);
          }
        });
      }

      if (uploadTrigger && uploadInput) {
        uploadTrigger.addEventListener("click", () => uploadInput.click());
        uploadInput.addEventListener("change", async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          // Validate file type
          if (
            !file.type ||
            (!file.type.includes("json") && !file.name.endsWith(".json"))
          ) {
            alert(`Invalid file type. Please upload a JSON file.`);
            uploadInput.value = null;
            return;
          }

          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const text = ev.target.result;

              // Check if result looks like HTML error page
              if (isHtmlErrorPage(text)) {
                error(
                  "Received HTML instead of JSON. File may be corrupted or is not a valid JSON file."
                );
                alert(
                  `Invalid file format. Expected JSON but received HTML. Please check the file and try again.`
                );
                uploadInput.value = null;
                return;
              }

              const data = JSON.parse(text);
              if (!Array.isArray(data)) {
                alert(`Invalid file format. Expected an array of ${key}.`);
                uploadInput.value = null;
                return;
              }

              const type = key.replace(/s$/, "");
              if (type === "character" || type === "world" || type === "story") {
                // Import into IndexedDB
                const validData = data.filter(
                  (item) => item.name && item.type === type
                );
                if (validData.length === 0) {
                  alert(`No valid ${type}s found in the file.`);
                  uploadInput.value = null;
                  return;
                }

                await db.entities.bulkPut(
                  validData.map((item) => ({
                    ...item,
                    isCustom: item.isPremade ? 0 : 1, // 1 = custom, 0 = premade (numeric for IndexedDB)
                    isPremade: item.isPremade || false,
                    createdAt: item.createdAt || Date.now(),
                    updatedAt: item.updatedAt || Date.now(),
                  }))
                );
                alert(`Successfully imported ${validData.length} ${type}(s).`);
              } else {
                log(`Import for type "${type}" is not supported`);
                alert(`Import for type "${type}" is not supported.`);
              }
              await refreshAllLists(); // <-- AWAITED
            } catch (err) {
              error("Failed to import", err);
              if (err instanceof SyntaxError) {
                alert(
                  `Invalid JSON format in file. Please check the file and try again.\n\nError: ${err.message}`
                );
              } else {
                alert(
                  `Failed to import ${key}. Please check the file format and try again.`
                );
              }
            }
            uploadInput.value = null;
          };
          reader.onerror = () => {
            error("Failed to read file");
            alert(`Failed to read file. Please try again.`);
            uploadInput.value = null;
          };
          reader.readAsText(file);
        });
      }
    });

    _contentListenersAttached = true;
  }

  let _settingsListenersAttached = false;

  function _attachSettingsListeners() {
    if (_settingsListenersAttached) return;
    _settingsListenersAttached = true;

    const settings = App.state.settings;

    const temperatureInput = document.querySelector("#setting-temperature");
    const topPInput = document.querySelector("#setting-top_p");
    const maxTokensInput = document.querySelector("#setting-max-tokens");
    const stopInput = document.querySelector("#setting-stop");
    const modelSelect = document.querySelector("#setting-model");

    // Initialize UI with current settings
    if (temperatureInput) temperatureInput.value = settings.temperature;
    if (topPInput) topPInput.value = settings.top_p;
    if (maxTokensInput) maxTokensInput.value = settings.maxTokens;
    if (stopInput) stopInput.value = settings.stop.join(", ");
    if (modelSelect) modelSelect.value = settings.model;

    // Attach event listeners
    temperatureInput?.addEventListener("input", (e) => {
      App.state.applyPatch({
        settings: { temperature: parseFloat(e.target.value) },
      });
    });
    topPInput?.addEventListener("input", (e) => {
      App.state.applyPatch({ settings: { top_p: parseFloat(e.target.value) } });
    });
    maxTokensInput?.addEventListener("input", (e) => {
      App.state.applyPatch({
        settings: { maxTokens: parseInt(e.target.value, 10) },
      });
    });
    stopInput?.addEventListener("input", (e) => {
      App.state.applyPatch({
        settings: {
          stop: e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
    });
    modelSelect?.addEventListener("change", (e) => {
      App.state.applyPatch({ settings: { model: e.target.value } });
    });
  }

  function _attachStoryFormListener() {
    const storyForm = document.querySelector("#story-form");
    if (storyForm && !storyForm._submitListenerAttached) {
      const input = storyForm.querySelector('input[name="message"]');
      const submitButton = storyForm.querySelector('button[type="submit"]');
      const storyFeed = document.querySelector("#story-feed");

      if (!input || !submitButton || !storyFeed) {
        error("Story UI elements not found, cannot attach listener.");
        return;
      }

      input.addEventListener("input", () => {
        submitButton.disabled = !input.value.trim();
      });

      storyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (message) {
          // Render the user's message immediately
          const userCharacter = await entities.get(
            "character",
            App.state.story.byId[App.state.story.activeId].userId
          );
          const storyFeed = document.querySelector("#story-feed");
          renderMessage(
            storyFeed,
            "user",
            message,
            userCharacter?.name || "You",
            "IC"
          );

          // Disable input and send to AI
          input.value = "";
          submitButton.disabled = true;
          await App.story.send(message);
        }
      });
      storyForm._submitListenerAttached = true;
    }
  }

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

  /**
   * Waits for Perchance plugins to be fully loaded and callable.
   * @param {string[]} requiredPluginPaths - Plugin paths (e.g., 'ai', 'textToImage', 'ai.generateStream')
   * @param {number} timeout - Maximum wait time in milliseconds
   * @param {number} retryCount - Current retry attempt (for internal recursion)
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<boolean>} True if all plugins loaded, false if timeout
   */
  /**
   * Checks if a plugin path is available on the window object.
   * Supports nested paths like 'ai.generateStream' or root paths like 'pluginAi'.
   * @param {string} path - Dot-separated path (e.g., 'ai.generateStream', 'pluginAi')
   * @returns {boolean} True if the path exists and is valid, false otherwise
   * @example
   * isPluginPathAvailable('ai.generateStream') // true if window.ai.generateStream exists and is a function
   * isPluginPathAvailable('pluginAi') // true if window.pluginAi exists
   */
  function isPluginPathAvailable(path) {
    // Validate input
    if (typeof path !== "string" || !path.trim()) {
      return false;
    }

    // Prevent potentially dangerous paths
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

    // For plugin functions (pluginAi, pluginTextToImage, etc.), verify they're callable
    // These are exposed as functions by Perchance, not objects
    if (parts.length === 1 && parts[0].startsWith("plugin")) {
      return typeof obj === "function";
    }

    // For method paths (more than one part), verify it's callable
    if (parts.length > 1) {
      return typeof obj === "function";
    }

    return true;
  }

  async function waitForPlugins(
    requiredPluginPaths,
    timeout = PLUGIN_WAIT_TIMEOUT_MS,
    retryCount = 0,
    maxRetries = PLUGIN_MAX_RETRIES
  ) {
    // Skip plugin waiting in test mode
    if (TEST_MODE) {
      log("[RPGlitch] Test mode detected, skipping plugin wait");
      return true;
    }

    const startTime = Date.now();

    log(
      `[RPGlitch] Waiting for plugins (attempt ${retryCount + 1}/${maxRetries + 1
      }):`,
      requiredPluginPaths
    );

    while (Date.now() - startTime < timeout) {
      if (requiredPluginPaths.every(isPluginPathAvailable)) {
        log("[RPGlitch] All plugins loaded successfully:", requiredPluginPaths);
        return true;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, PLUGIN_POLL_INTERVAL_MS)
      ); // Wait before checking again
    }

    if (retryCount < maxRetries) {
      log(
        `[RPGlitch] Plugins not available, retrying (${retryCount + 1
        }/${maxRetries})...`
      );
      return waitForPlugins(
        requiredPluginPaths,
        timeout,
        retryCount + 1,
        maxRetries
      );
    }

    const available = requiredPluginPaths.filter(isPluginPathAvailable);
    const missing = requiredPluginPaths.filter(
      (path) => !isPluginPathAvailable(path)
    );
    log(
      `[RPGlitch] Plugin timeout after a total of ${(retryCount + 1) * PLUGIN_WAIT_TIMEOUT_MS
      }ms (retries: ${retryCount}). Available: ${available.join(", ") || "none"
      } | Missing: ${missing.join(", ") || "none"}`
    );
    return false;
  }

  async function initializeWhenReady() {
    // <-- MADE ASYNC
    try {
      // Wait for required Perchance plugins to load.
      // We wait for the `plugin*` names because they are guaranteed to be exposed
      // by the Perchance HTML panel. The `setupPlugins` call below creates the
      // standard aliases (`ai`, `textToImage`, etc.) after they are loaded.
      const pluginsLoaded = await waitForPlugins([
        "pluginAi",
        "pluginTextToImage",
        "pluginSuperFetch",
        "pluginRemember",
        "pluginUpload",
      ]);

      if (!pluginsLoaded) {
        error(
          "[RPGlitch] Required plugins failed to load. Application may not function correctly."
        );
        alert(
          `Required plugins failed to load. Please refresh the page and try again.`
        );
        // STOP EXECUTION
        throw new PluginError("Required plugins failed to load. Please refresh.");
      }

      // Setup plugins to map Perchance names to standard names
      setupPlugins();

      // Initialize database first
      try {
        // --- [FIX 2: DATABASE INIT] ---
        // The call was `initDB()`, which doesn't exist.
        // The correct call is `db.open()`.
        await db.open();
        // --- [END FIX 2] ---
        log("[RPGlitch] Database initialized.");
      } catch (err) {
        error("[RPGlitch] Failed to initialize database:", err);
        alert(
          `Database initialization failed. Please refresh the page. Error: ${err.message}`
        );
        throw err; // Stop initialization
      }

      // Initialize debug mode from IndexedDB
      await initDebugMode();

      // Listen for state changes to re-render the story
      document.addEventListener("state:changed", async (event) => {
        // <-- MADE ASYNC
        const { patch } = event.detail;
        // Check if messages for the active story or the active story itself changed
        if (patch.messages?.byStoryId || patch.story?.activeId !== undefined) {
          const activeStoryId = App.state.story.activeId;
          if (activeStoryId) {
            await App.story.render(activeStoryId);
          }
        }
      });

      // Check if settings are initialized (indicates a fresh or cleared DB)
      const currentSettings = await db.settings.get("settings");
      if (!currentSettings) {
        log("[RPGlitch] Initializing default settings.");
        // Initialize default settings
        await db.settings.add({
          id: "settings",
          temperature: App.state.settings.temperature,
          top_p: App.state.settings.top_p,
          maxTokens: App.state.settings.maxTokens,
          stop: App.state.settings.stop,
          model: App.state.settings.model,
          historyLength: App.state.settings.historyLength,
        });
      }

      // Load chosen storyboard card from DB
      const chosenEntity = await db.entities
        .where("isChosen")
        .equals(true)
        .first();
      if (chosenEntity) {
        App.applyPatch({
          ui: {
            chosenStoryboardCard: {
              type: chosenEntity.type,
              id: chosenEntity.id,
            },
          },
        });
      }

      log("[RPGlitch] initializeWhenReady start", {
        // <-- ADDED
        retry: window.initializeWhenReadyRetryCount || 0,
      });
    } catch {
      /* ignore */
    }

    try {
      initViews({ refreshAllLists });

      _getUIElements();

      // Cache storyboard picture templates once for performance
      templates = {
        "tpl-storyboard-picture-character": document.querySelector(
          "#tpl-storyboard-picture-character"
        ),
        "tpl-storyboard-picture-world": document.querySelector(
          "#tpl-storyboard-picture-world"
        ),
        "tpl-storyboard-picture-default": document.querySelector(
          "#tpl-storyboard-picture-default"
        ),
      };

      _attachStoryFormListener?.();
      if (!TEST_MODE) chin.init?.();
      _attachOptionChinActions?.();
      _attachContentChinActions?.();
      _attachSettingsListeners?.(); // <-- ADDED
      _attachCardNavigation?.();
      await refreshAllLists?.(); // <-- AWAITED
      await _attachStoryboardListeners?.(); // <-- AWAITED
      try {
        dismissLoadingUI?.();
      } catch {
        void 0;
      }

      // --- [FIX 3: ASYNC BOOTSTRAP] ---
      try {
        startUIWatchdog?.();
      } catch {
        void 0;
      }
      try {
        installUIRecoveryHooks?.();
      } catch {
        void 0;
      }
      try {
        installUIBlockerAttributeObserver?.();
      } catch {
        void 0;
      }
      try {
        enableAutoUnlock?.();
      } catch {
        void 0;
      }
      try {
        let attempts = 0;
        const maxAttempts = UI_WATCHDOG_MAX_ATTEMPTS;
        const rearm = () => {
          attempts++;
          if (_uiWatchdogStarted || attempts > maxAttempts) {
            clearInterval(timer);
            return;
          }
          try {
            startUIWatchdog?.();
          } catch {
            void 0;
          }
          try {
            installUIRecoveryHooks?.();
          } catch {
            void 0;
          }
          try {
            installUIBlockerAttributeObserver?.();
          } catch {
            void 0;
          }
          try {
            enableAutoUnlock?.();
          } catch {
            void 0;
          }
        };
        const timer = setInterval(rearm, 250);
        setTimeout(rearm, 0);
      } catch {
        void 0;
      }

      // Note: Click handlers for chin control are already attached by chin.init()
      // Do not attach duplicate handlers here as it breaks toggle behavior

      window.initializeWhenReadyRetryCount = 0;
      try {
        log("[RPGlitch] initializeWhenReady success");
      } catch {
        /* ignore */
      }
      return true;
    } catch (err) {
      // If this is a plugin loading failure, stop immediately without retrying
      if (err instanceof PluginError) {
        error(
          "[RPGlitch] Plugin loading failed, stopping initialization:",
          err.message
        );
        throw err; // Re-throw to ensure initialization stops
      }

      const retryCount = (window.initializeWhenReadyRetryCount || 0) + 1;
      window.initializeWhenReadyRetryCount = retryCount;
      try {
        error(
          `❗ App initialization failed (attempt ${retryCount}/${MAX_INIT_RETRIES})`,
          err && (err.stack || err),
          err
        );
      } catch {
        /* ignore */
      }
      if (TEST_MODE) {
        return false;
      }
      if (retryCount < MAX_INIT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, INIT_BACKOFF_MS));
        return initializeWhenReady();
      }
      error(
        `❌ App initialization failed after ${MAX_INIT_RETRIES} attempts.`,
        err
      );
      throw err;
    }
  }

  async function importAllData(file) {
    // <-- MADE ASYNC
    if (!file) return;

    // Validate file type
    if (
      !file.type ||
      (!file.type.includes("json") && !file.name.endsWith(".json"))
    ) {
      alert(`Invalid file type. Please upload a JSON file.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      // <-- MADE ASYNC
      try {
        const text = e.target.result;

        // Check if result looks like HTML error page
        if (isHtmlErrorPage(text)) {
          error(
            "Received HTML instead of JSON. File may be corrupted or server returned an error page."
          );
          alert(
            `Invalid file format. Expected JSON but received HTML. The file may be corrupted or incomplete.`
          );
          return;
        }

        const data = JSON.parse(text);

        // 1. Validate version
        if (data.version !== 1) {
          log(
            "Imported data version mismatch. Attempting to import anyway."
          );
          // In a real application, you might want to handle migrations here.
        }

        // 2. Import characters (entities)
        if (Array.isArray(data.characters)) {
          // Clear existing characters and add new ones. This is a simple conflict resolution strategy.
          await db.entities.where("type").equals("character").delete();
          await db.entities.bulkAdd(data.characters);
        }

        // 3. Import stories
        if (Array.isArray(data.stories)) {
          await db.stories.clear();
          await db.stories.bulkAdd(data.stories);
        }

        // 4. Import messages
        if (Array.isArray(data.messages)) {
          await db.messages.clear();
          await db.messages.bulkAdd(data.messages);
        }

        // 5. Import settings
        if (data.settings) {
          // Assuming settings is a singleton, clear and add
          await db.settings.clear();
          await db.settings.add(data.settings);
        }

        await refreshAllLists();
        alert(`Backup imported successfully!`);
      } catch (err) {
        error("Failed to import backup", err);
        if (err instanceof SyntaxError) {
          alert(
            `Invalid JSON format in backup file. Please check the file and try again.\n\nError: ${err.message}`
          );
        } else {
          alert(`Failed to import backup. Please check the file and try again.`);
        }
      } finally {
        const ui = _getUIElements();
        if (ui.uploadBackupInput) ui.uploadBackupInput.value = null;
      }
    };
    reader.onerror = () => {
      error("Failed to read backup file");
      alert(`Failed to read backup file. Please try again.`);
      const ui = _getUIElements();
      if (ui.uploadBackupInput) ui.uploadBackupInput.value = null;
    };
    reader.readAsText(file);
  }

  async function exportAllData() {
    // <-- MADE ASYNC
    try {
      const data = {
        version: 1, // Add version
      };

      // Get characters from Dexie (filtered from entities)
      data.characters = await db.entities
        .where("type")
        .equals("character")
        .toArray();

      // Get stories from Dexie
      data.stories = await db.stories.toArray();

      // Get messages from Dexie
      data.messages = await db.messages.toArray();

      // Get settings from Dexie (assuming it's a singleton with key 'settings')
      data.settings = await db.settings.get("settings"); // Assuming 'settings' is the key for the singleton settings object

      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rpglitch-backup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      error("Failed to export backup:", err);
      alert("Failed to export backup. Please try again.");
    }
  }

  async function deleteAllData() {
    try {
      // Confirm before destructive action
      if (
        !confirm(
          "Are you sure you want to delete ALL data? This cannot be undone."
        )
      ) {
        return;
      }

      // Delete all entities from IndexedDB (includes stories, characters, worlds)
      await db.entities.clear();
      await db.stories.clear();
      await db.messages.clear();

      await refreshAllLists();
      alert(`All data has been deleted.`);
    } catch (err) {
      error("Failed to delete data:", err);
      alert(`Failed to delete data. Please try again.`);
    }
  }

  // Export functions for testing and external use
  export { waitForPlugins, initializeWhenReady, _defaultStoryboardTitle };

  try {
    if (!_bootBound) {
      _bootBound = true;
      const boot = async () => {
        // <-- MADE ASYNC
        try {
          if (TEST_MODE) return;
          if (_bootStarted) return;
          _bootStarted = true;
          await initializeWhenReady?.();
        } catch (err) {
          error("RPGlitch boot failed:", err);
        }
      };
      if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
      ) {
        setTimeout(boot, 0);
      } else {
        document.addEventListener("DOMContentLoaded", boot, {
          once: true,
        });
        window.addEventListener("load", boot, {
          once: true,
        });
      }
    }
  } catch {
    /* empty */
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      _cacheTemplates(); // Cache templates here
      router.handleRoute();
      // This is now redundant with the _bootBound logic, but safe.
      // We'll rely on the _bootBound logic.
    },
    {
      once: true,
    }
  );
