import { router } from './profile-router.js';
import { init as initDB, db } from './db.js'; // <-- ADDED THIS

import {
  applyBrand,
  debounce,
  chin,
  dismissLoadingUI,
  startUIWatchdog,
  installUIRecoveryHooks,
  installUIBlockerAttributeObserver,
  enableAutoUnlock,
  setSelected,
  deriveBrand,
  _uiWatchdogStarted,
  initDebugMode,
} from './utils.js';
import {
  entities,
  getPictureHTML,
} from './entities.js';

// =================================================================
// App State Management
// =================================================================

const App = {
  state: {
    characters: { byId: {}, allIds: [] },
    threads:    { byId: {}, allIds: [], activeId: null },
    messages:   { byThreadId: {} }, // { [threadId]: [{id, role, text, seed, meta, createdAt}] }
    settings:   { temperature: 0.7, top_p: 1.0, maxTokens: 512, stop: [], model: "default", historyLength: 10 },
    ui:         { fsm: "idle", promptPreviewOpen: false, lastError: null, title: "RPGlitch", selectedStoryboardCard: null }
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
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
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
    document.dispatchEvent(new CustomEvent('state:changed', { detail: { patch } }));
  },

  prompt: {
    build: (threadId) => {
      const thread = App.state.threads.byId[threadId];
      // Note: App.state.characters.byId will now contain entities of type 'character'
      const ch = Object.values(App.state.characters.byId).find(c => c.id === thread?.characterId && c.type === 'character');
      const msgs = App.prompt.trimHistory(App.state.messages.byThreadId[threadId] || []);
      const system = [ch?.persona, ch?.scenario].filter(Boolean).join("\n\n");

      const params = {
        temperature: App.state.settings.temperature,
        top_p:       App.state.settings.top_p,
        maxTokens:   App.state.settings.maxTokens,
        stop:        App.state.settings.stop,
        model:       App.state.settings.model
      };

      return { system, messages: msgs, params };
    },

    trimHistory: (msgs) => {
      // Conservative, token-budget-aware trimming:
      // - Always retain latest N user/assistant pairs (configurable).
      // - Optional summarizer hook can be added later (not in this cycle).
      const historyLength = App.state.settings.historyLength;
      if (msgs.length <= historyLength * 2) { // * 2 because we count user/assistant pairs
        return msgs;
      }

      // Keep the last 'historyLength' user/assistant pairs
      return msgs.slice(-historyLength * 2);
    }
  },

  threads: {
    requireActive: () => {
      // Placeholder for now. Will implement in a later step.
      // For now, return a dummy threadId or throw an error if no active thread.
      if (App.state.threads.activeId) {
        return App.state.threads.activeId;
      } else {
        // For testing purposes, let's create a dummy active thread if none exists
        const dummyThreadId = "dummy-thread-1";
        App.state.threads.activeId = dummyThreadId;
        App.state.threads.byId[dummyThreadId] = { id: dummyThreadId, characterId: "dummy-char-1", title: "Dummy Thread", settingsSnapshot: {}, createdAt: Date.now(), updatedAt: Date.now() };
        App.state.threads.allIds.push(dummyThreadId);
        console.warn("No active thread found, created a dummy one.");
        return dummyThreadId;
      }
    },

    createFromSelection: async ({ storyId, characterId, worldId }) => {
      try {
        const ch = Object.values(App.state.characters.byId).find(c => c.id === characterId && c.type === 'character');
        const title = `${ch?.name || "Character"} × ${storyId || "Story"}`;

        const threadId = await db.threads.add({
          characterId,
          title,
          settingsSnapshot: { ...App.state.settings },
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        App.applyPatch({ threads: { activeId: threadId }, ui: { title } });
        return threadId;
      } catch (error) {
        console.error('Failed to create thread:', error);
        alert('Could not create story thread. Please try again.');
        throw error;
      }
    }
  },

  ai: {
    generateStream: async ({ payload, signal, onToken, onDone }) => {
      if (!window.Perchance || !window.Perchance.plugins || !window.Perchance.plugins.aiText) {
        console.error("Perchance AI Text plugin not available.");
        throw new Error("Perchance AI Text plugin not available.");
      }

      console.log("Calling Perchance AI Text plugin with payload:", payload);
      await window.Perchance.plugins.aiText.generateStream({
        system: payload.system,
        messages: payload.messages,
        params: payload.params,
        signal: signal,
        onToken: onToken,
        onDone:  onDone
      });
    }
  },

  chat: {
    render: async (threadId) => {
      const chatFeed = document.querySelector("#chat-feed");
      const noMessagesEl = document.querySelector("#no-messages");
      if (!chatFeed || !noMessagesEl) return;

      // Clear existing messages using DOM API
      while (chatFeed.firstChild) {
        chatFeed.removeChild(chatFeed.firstChild);
      }

      const messages = App.state.messages.byThreadId[threadId] || [];
      
      if (messages.length === 0) {
        noMessagesEl.hidden = false;
        return;
      }

      noMessagesEl.hidden = true;
      messages.forEach(msg => {
        const messageEl = document.createElement("div");
        messageEl.classList.add("chat-message", `${msg.role}-message`);
        messageEl.textContent = msg.text;
        chatFeed.appendChild(messageEl);
      });

      chatFeed.scrollTop = chatFeed.scrollHeight;
    },

    send: async (userText) => {
      if (!userText) return;
      if (!["idle", "done", "error", "aborted"].includes(App.state.ui.fsm)) return;

      try {
        const threadId = App.threads.requireActive();
        await db.messages.add({ threadId, role: "user", text: userText, createdAt: Date.now() });

        const payload = App.prompt.build(threadId);
        const ctrl = new AbortController();
        App.state.applyPatch({ ui: { fsm: "sending", lastError: null, abortController: ctrl } });

        try {
          App.state.applyPatch({ ui: { fsm: "streaming" } });

          await App.ai.generateStream({
            payload,
            signal: ctrl.signal,
            onToken: (t) => App.chat._appendAssistantToken(threadId, t),
            onDone:  () => App.chat._finalizeAssistantMessage(threadId)
          });

          App.state.applyPatch({ ui: { fsm: "done" } });
        } catch (e) {
          const isAbort = e?.name === "AbortError";
          App.state.applyPatch({ ui: { fsm: isAbort ? "aborted" : "error", lastError: e?.message || String(e) } });
        }
      } catch (error) {
        console.error('Failed to save message:', error);
        alert('Could not save your message. Please try again.');
        App.state.applyPatch({ ui: { fsm: "error", lastError: "Failed to save message" } });
      }
    },

    stop: () => {
      if (App.state.ui.abortController) {
        App.state.ui.abortController.abort();
        App.state.applyPatch({ ui: { fsm: "aborted", abortController: null } });
        console.log("Chat stream aborted.");
      }
    },
    retry: async () => {
      const threadId = App.threads.requireActive();
      const messages = App.state.messages.byThreadId[threadId];
      if (messages && messages.length > 0) {
        const lastUserMessage = messages.findLast(msg => msg.role === "user");
        if (lastUserMessage) {
          // Remove any assistant messages after the last user message
          const lastUserMessageIndex = messages.lastIndexOf(lastUserMessage);
          App.state.messages.byThreadId[threadId] = messages.slice(0, lastUserMessageIndex + 1);
          await App.chat.send(lastUserMessage.text);
        }
      }
    },
    regenerate: async () => {
      const threadId = App.threads.requireActive();
      const messages = App.state.messages.byThreadId[threadId];
      if (messages && messages.length > 0) {
        // Find the last user message and remove it and subsequent assistant messages
        const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === "user");
        if (lastUserMessageIndex !== -1) {
          App.state.messages.byThreadId[threadId] = messages.slice(0, lastUserMessageIndex);
          const previousUserMessage = messages[lastUserMessageIndex];
          await App.chat.send(previousUserMessage.text);
        }
      }
    },
    continue: async () => {
      await App.chat.send("continue"); // Send a predefined 'continue' message
    },
    _appendAssistantToken: (threadId, token) => {
      let messages = App.state.messages.byThreadId[threadId] || [];
      let lastMessage = messages[messages.length - 1];

      if (!lastMessage || lastMessage.role !== "assistant") {
        lastMessage = { id: Date.now(), threadId, role: "assistant", text: "", createdAt: Date.now() };
        messages.push(lastMessage);
      }
      lastMessage.text += token;
      App.state.applyPatch({ messages: { byThreadId: { [threadId]: messages } } });
    },
    _finalizeAssistantMessage: (threadId) => {
      // No explicit action needed here for now, as tokens are appended directly.
      // This might be used for saving the final message to DB in the future.
      console.log(`Finalizing assistant message for thread ${threadId}.`);
    }
  }
};

// Expose App to the window for debugging and easy access
window.App = App;

// =================================================================

let _allItemsCache = {}; // Local cache for lists

const TEST_MODE = (() => {
  if (globalThis.__TEST__) {
    return true;
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

let _cardNavAttached = false;
let _suppressNextBlur = false;
let _optionsListenersAttached = false;
let _contentListenersAttached = false;
let _chinSearchBound = false;
let _bootBound = false;
let _bootStarted = false;


export function _getUIElements() {
  const doc = document;
  const ui = {}; // Initialize ui object inside the function

  ui.topBarLeft = doc.querySelector("#top-bar-left");
  ui.chinContainer = doc.querySelector("#chin-container");
  ui.topBarButtons = 
    ui.topBarLeft ? 
    ui.topBarLeft.querySelectorAll("button[data-chin]") : 
    [];
  ui.topBarRightStoryboard = 
    doc.querySelector("#top-bar-right-storyboard");
  ui.topBarRightForm = 
    doc.querySelector("#top-bar-right-form");
  ui.topBarRightProfile = 
    doc.querySelector("#top-bar-right-profile");

  // Option chin actions
  ui.uploadBackupInput = 
    doc.querySelector("#upload-backup");
  ui.uploadBackupTrigger = 
    doc.querySelector('[data-trigger="upload-backup"]');
  ui.downloadBackupButton = 
    doc.querySelector("#download-backup");
  ui.deleteAllDataButton = 
    doc.querySelector("#delete-all-data");

  // Story chin actions
  ui.newStoryButton = doc.querySelector("#new-story");
  ui.uploadStoryTrigger = 
    doc.querySelector('[data-trigger="upload-story"]');
  ui.uploadStoryInput = 
    doc.querySelector("#upload-story");

  // Character chin actions
  ui.newCharacterButton = 
    doc.querySelector("#new-character");
  ui.uploadCharacterTrigger = 
    doc.querySelector('[data-trigger="upload-character"]');
  ui.uploadCharacterInput = 
    doc.querySelector("#upload-character");

  // World chin actions
  ui.newWorldButton = doc.querySelector("#new-world");
  ui.uploadWorldTrigger = 
    doc.querySelector('[data-trigger="upload-world"]');
  ui.uploadWorldInput = 
    doc.querySelector("#upload-world");

  return ui;
}

export function _attachChinSearchHandlers() {
  if (_chinSearchBound) return;
  _chinSearchBound = true;
  const inputs = document.querySelectorAll(".chin-search");
  inputs.forEach((input) => {
    if (input._chinSearchBound) return; // idempotent
    const container = input.closest(".chin") || input.closest(".chin-widget");
    const list = container?.querySelector(".chin-grid");
    if (!list || input._chinSearchBound) return;

    const doFilter = () => {
      const term = input.value.toLowerCase();
      list.querySelectorAll("[data-title]").forEach((card) => {
        const title = (card.dataset.title || "").toLowerCase();
        const match = title.includes(term);
        card.hidden = !match;
      });
    };

    const handler = TEST_MODE ?
      doFilter :
      debounce(doFilter, 250);
    input.addEventListener("input", handler);
    input._chinSearchBound = true;
  });
}


// Migrated from localStorage to IndexedDB
async function saveStoryboardSelection() {
  const selects = {
    ai: document.querySelector("#storyboard-ai-select")?.value,
    user: document.querySelector("#storyboard-user-select")?.value,
    world: document.querySelector("#storyboard-world-select")?.value,
  };
  try {
    // Get existing settings or create new one
    let settings = await db.settings.get('app-settings');
    if (!settings) {
      settings = { id: 'app-settings' };
    }
    settings.storyboardSelection = selects;
    await db.settings.put(settings);
  } catch (e) {
    console.error("Failed to save storyboard selection:", e);
  }
}

async function loadStoryboardSelection() {
  try {
    const settings = await db.settings.get('app-settings');
    return settings?.storyboardSelection || {};
  } catch (e) {
    console.error("Failed to load storyboard selection:", e);
    return {};
  }
}

export function resetStoryboard() {
  // placeholder for future storyboard reset logic
}


/**
 * Gets all items, merging premade and custom.
 * Uses entities.list() for async db operations for all entity types (stories, characters, worlds).
 */
export async function getAllItems(key, refresh = false) {
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
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      alert(`Could not load ${type} data. Please refresh and try again.`);
      _allItemsCache[key] = [];
      return [];
    }
  }

  // Fallback to empty array if entities module is not available
  console.warn(`getAllItems: entities.list not available for type "${type}"`);
  _allItemsCache[key] = [];
  return [];
}

async function renderList(containerId, key) { // <-- MADE ASYNC
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;

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
      key === "stories" ?
      "Empty here—time to write your first story!" :
      key === "characters" ?
      "No characters found yet" :
      key === "worlds" ?
      "No worlds found yet" :
      "No items found";
    container.appendChild(message);
    return;
  }

  const tpl = document.querySelector("#chin-card-template");

  all.forEach((item) => {
    let card;

    if (tpl && tpl.content) {
      card = tpl.content.firstElementChild.cloneNode(true);
    } else {
      // Fallback: create card structure using DOM API
      card = document.createElement("div");
      card.className = "chin-card";

      const media = document.createElement("div");
      media.className = "media";

      const body = document.createElement("div");
      body.className = "body";

      const desc = document.createElement("p");
      desc.className = "description";
      body.appendChild(desc);

      card.appendChild(media);
      card.appendChild(body);

      const t = document.createElement("h4");
      t.className = "title";
      media.appendChild(t);

      const b = document.createElement("div");
      b.className = "badge";
      b.hidden = true;
      media.appendChild(b);
    }

    card.dataset.title = item.title || item.name || "Empty";
    if (item.id) {
      card.dataset.id = item.id;
      card.dataset.type = key.slice(0, -1);
      card.dataset.entityId = item.id;
      card.dataset.entityType = key.slice(0, -1);
    }
    if (item.isPremade) card.dataset.premade = "true";

    card.setAttribute("aria-label", item.title || "Open");

    const media = card.querySelector(".media");
    if (typeof getPictureHTML === "function") {
      const maybe = getPictureHTML(item, {
        cover: true
      });
      if (maybe instanceof Node) {
        media.prepend(maybe);
      } else if (typeof maybe === "string") {
        const t = document.createElement("template");
        t.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(maybe.trim()) : maybe.trim();
        const node = t.content.firstElementChild;
        if (node) media.prepend(node);
      }
    }

    applyBrand(card, item);
    try {
      applyBrand?.(media, item);
    } catch (e) {
      void e;
    }

    if (media) {
      const row = document.createElement("div");
      row.className = "chip-row";
      const chips = [];
      if (item.isPremade) chips.push("Premade");
      if (Array.isArray(item.tags)) chips.push(...item.tags.slice(0, 3));
      chips.forEach((txt) => {
        const span = document.createElement("span");
        span.className = "chip";
        const sm = document.createElement("small");
        sm.textContent = txt;
        span.appendChild(sm);
        row.appendChild(span);
      });
      media.appendChild(row);
    }

    const titleEl = card.querySelector(".title");
    if (titleEl) titleEl.textContent = item.title || item.name || "Empty";

    const badge = card.querySelector(".badge");
    if (badge) badge.hidden = !item.isPremade;

    const descEl = card.querySelector(".description");
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
}

async function renderDropdown(doc, selectId, key) { // <-- MADE ASYNC
  const select = doc.querySelector(`#${selectId}`);
  if (!select) return;
  const existingPlaceholder = select.querySelector('option[value=""]');
  const placeholderText = existingPlaceholder ?
    existingPlaceholder.textContent :
    select.dataset.placeholder || "";
  select.dataset.placeholder = placeholderText;
  const placeholder = existingPlaceholder ?
    existingPlaceholder.cloneNode(true) :
    doc.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderText;
  select.textContent = "";
  select.appendChild(placeholder);
  const items = await getAllItems(key); // <-- AWAITED
  const premadeGroup = doc.createElement("optgroup");
  premadeGroup.label = "Premade";
  const customGroup = doc.createElement("optgroup");
  customGroup.label = "Custom";
  let premadeCount = 0;
  let customCount = 0;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id || item.title;
    option.textContent = item.title || "";
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
}

export async function renderStoryList() { // <-- MADE ASYNC
  await renderList("chin-story-grid", "stories"); // <-- AWAITED
}

export async function renderCharacterList() { // <-- MADE ASYNC
  await renderList("chin-character-grid", "characters"); // <-- AWAITED
}

export async function renderWorldList() { // <-- MADE ASYNC
  await renderList("chin-world-grid", "worlds"); // <-- AWAITED
}

export async function refreshAllLists() { // <-- MADE ASYNC
  await Promise.all(DATA_KEYS.map((key) => getAllItems(key, true))); // <-- AWAITED
  await renderStoryList?.(); // <-- AWAITED
  await renderCharacterList?.(); // <-- AWAITED
  await renderWorldList?.(); // <-- AWAITED
}

export function _attachCardNavigation() {
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
      setSelected?.(
        card,
        container.querySelectorAll(".chin-card[data-type][data-id]")
      );
      const { 
        type, 
        id 
      } = card.dataset;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    container.addEventListener("keydown", (e) => {
      const card = e.target.closest(".chin-card[data-type][data-id]");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const { 
          type, 
          id 
        } = card.dataset;
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
          }, 1200);
        }
      }, {
        passive: true,
        capture: true
      }
    );

    function openSelectSafely(select) {
      if (!select) return;
      try {
        const inIframe = (() => {
          try {
            return window.top !== window;
          } catch {
            return true;
          }
        })();
        if (!inIframe && typeof select.showPicker === "function") {
          try {
            select.showPicker();
            return;
          } catch {
            // SecurityError or unsupported context – fall back
          }
        }
      } catch {
        /* ignore */
      }
      try {
        select.focus();
      } catch {
        /* noop */
      }
      try {
        select.click();
      } catch {
        /* noop */
      }
    }

    storyboard.addEventListener("click", async (e) => { // <-- MADE ASYNC
      if (e.target.closest("select, button, a, input, textarea")) return;

      const card = e.target.closest(".storyboard-card");
      if (!card) return;

      const select = card.querySelector("select");

      const all = storyboard.querySelectorAll(".storyboard-card");
      setSelected(card, all);

      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || select?.value || "";

      // Update App.state and persist selection
      if (type && id) {
        try {
          App.applyPatch({ ui: { selectedStoryboardCard: { type, id } } });
          // Deselect all other entities of the same type
          await db.entities.where({ type: type, isSelected: true }).modify({ isSelected: false });
          // Select the current entity
          await db.entities.update(id, { isSelected: true });
        } catch (error) {
          console.error('Failed to update selection:', error);
          // Don't show alert for selection errors - not critical to user workflow
        }
      } else {
        App.applyPatch({ ui: { selectedStoryboardCard: null } });
      }

      if (!id && select) {
        e.preventDefault();
        e.stopPropagation();

        _suppressNextBlur = true;

        requestAnimationFrame(() => {
          openSelectSafely(select);
          setTimeout(() => {
            _suppressNextBlur = false;
          }, 1200);
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
          openSelectSafely(select);
          setTimeout(() => {
            _suppressNextBlur = false;
          }, 1200);
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

    ["mousedown", "pointerdown", "click"].forEach((evt) => {
      storyboard.addEventListener(
        evt,
        (ev) => {
          if (ev.target.closest("select")) {
            ev.stopPropagation();
          }
        },
        true
      );
    });
  }

  _cardNavAttached = true;
}

async function updateStoryboardCard(target, entityOrKey, opts = {}) { // <-- MADE ASYNC
  let card, entity;

  if (target && target.tagName === "SELECT") {
    const select = target;
    card = select.closest(".storyboard-card");
    const type =
      card?.dataset?.type ||
      select.dataset.entityType ||
      select.dataset.type ||
      "";
    const id = select.value || "";
    // const key = entityOrKey; // No longer needed

    if (id) {
      try {
        // Get the single entity asynchronously
        entity = await entities.get(type, id); // <-- AWAITED
      } catch (error) {
        console.error(`Failed to load ${type}:`, error);
        alert(`Could not load ${type} details. Please try again.`);
        entity = null;
      }
    } else {
      entity = null;
    }
  } else {
    card =
      typeof target === "string" ? document.querySelector(target) : target;
    entity = entityOrKey || null;
  }

  if (!card) return;

  const left = card.querySelector(".storyboard-card-left");
  const descEl = card.querySelector(".storyboard-card-right .desc");
  const tag = card.querySelector("footer small");
  const select = card.querySelector("select");

  if (descEl && !descEl.dataset.placeholder) {
    descEl.dataset.placeholder = descEl.textContent || "";
  }

  const buildPictureNode = (ent, { preferTemplateForEmpty = true } = {}) => {
    const kind = (ent && ent.kind) || "";
    const isEmpty = !ent || !ent.imageUrl;

    const hasEntity = !!(ent && (ent.id || ent.title || ent.name));
    if (preferTemplateForEmpty && isEmpty && !hasEntity) {
      const id = kind ?
        `tpl-storyboard-picture-${kind}` :
        "tpl-storyboard-picture-default";
      const tpl =
        document.querySelector(`#${id}`) ||
        document.querySelector("#tpl-storyboard-picture-default");
      if (tpl && tpl.content && tpl.content.firstElementChild) {
        return tpl.content.firstElementChild.cloneNode(true);
      }
    }

    let out = null;
    try {
      if (typeof getPictureHTML === "function") {
        const maybe = getPictureHTML(ent || {
          kind
        }, {
          context: "storyboard",
          cover: true,
          neutralPlaceholder: !hasEntity,
        });
        if (maybe instanceof Node) {
          out = maybe;
        } else if (typeof maybe === "string") {
          const tpl = document.createElement("template");
          tpl.innerHTML = window.DOMPurify ?
            window.DOMPurify.sanitize(maybe.trim()) :
            maybe.trim();
          out = tpl.content.firstElementChild;
        }
      }
    } catch {
      /* empty */
    }

    if (!out) {
      const div = document.createElement("div");
      div.className = "picture picture--cover";
      out = div;
    }

    const img = out.querySelector?.("img");
    if (img) {
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.alt = img.alt || (ent?.kind ? `${ent.kind} image` : "image");
    }
    return out;
  };

  if (entity) {
    if (descEl) descEl.textContent = entity.description || "";
    if (tag) {
      tag.textContent = "";
      tag.style.display = "none";
    }
    if (left) {
      left.textContent = "";
      left.appendChild(buildPictureNode(entity));
      applyBrand?.(left, entity);
    }
    try {
      const footer = card.querySelector(".storyboard-card-right footer");
      if (footer) {
        footer.querySelectorAll(".chip").forEach((n) => n.remove());
        if (entity.isPremade) {
          const pill = document.createElement("span");
          pill.className = "chip";
          const sm = document.createElement("small");
          sm.textContent = "Premade";
          pill.appendChild(sm);
          footer.appendChild(pill);
        }
      }
    } catch {
      /* noop */
    }
    applyBrand(card, entity);
    card.dataset.entityType = card.dataset.type || entity.kind || "";
    card.dataset.entityId = entity.id;
    if (select && select.value !== String(entity.id)) {
      select.value = String(entity.id);
    }
    // Apply 'selected' class if this card is the active one
    if (App.state.ui.selectedStoryboardCard && App.state.ui.selectedStoryboardCard.id === entity.id && App.state.ui.selectedStoryboardCard.type === entity.type) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  } else {
    if (descEl) descEl.textContent = descEl.dataset.placeholder || "";
    if (tag) tag.textContent = "";
    if (left) {
      left.textContent = "";
      left.appendChild(buildPictureNode({
        kind: card.dataset.type
      }));
      card?.style?.removeProperty("--brand");
      left?.style?.removeProperty("--brand");
    }
    try {
      const footer = card.querySelector(".storyboard-card-right footer");
      if (footer) footer.querySelectorAll(".chip").forEach((n) => n.remove());
    } catch {
      /* noop */
    }
    card.classList.remove('selected'); // Remove selected class if no entity    delete card.dataset.entityType;
    delete card.dataset.entityId;

    if (select && select.value !== "") {
      select.value = "";
      select.dispatchEvent(new Event("change", {
        bubbles: true
      }));
    }
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
export async function _defaultStoryboardTitle() { // <-- MADE ASYNC
  const getTitle = async (id, key) => { // <-- MADE ASYNC
    const select = document.querySelector(`#${id}`);
    const value = select ? select.value : "";
    if (!value) return null;
    // Use the async getAllItems instead of synchronous access
    const items = await getAllItems(key); // <-- AWAITED
    const item = items.find(
      (i) => (i.id ?? i.title) === value
    );
    return item ? item.title || null : null;
  };
  // Await all title parts in parallel
  const [ai, user, world] = await Promise.all([ // <-- AWAITED
    getTitle("storyboard-ai-select", "characters"),
    getTitle("storyboard-user-select", "characters"),
    getTitle("storyboard-world-select", "worlds")
  ]);

  const subjects = [ai, user].filter(Boolean).join(" & ");

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
async function setDynamicTitle(title, { // <-- MADE ASYNC
  manual = false
} = {}) {
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
    { id: "storyboard-ai-select", key: "characters", savedValue: selections.ai },
    { id: "storyboard-user-select", key: "characters", savedValue: selections.user },
    { id: "storyboard-world-select", key: "worlds", savedValue: selections.world },
  ];

  await Promise.all(
    configs.map(async ({ id, key, savedValue }) => {
      await renderDropdown(document, id, key);
      const select = document.querySelector(`#${id}`);
      if (select) {
        if (savedValue && Array.from(select.options).some(o => o.value === savedValue)) {
          select.value = savedValue;
        }
        select.addEventListener("change", onStoryboardChange);
        // Trigger the initial update after setting the value
        await onStoryboardChange({ target: select });
      }
    })
  );
}

async function onStoryboardChange(e) { // <-- MADE ASYNC
  const select = e.target;
  await updateStoryboardCard(select); // <-- AWAITED
  await setDynamicTitle?.(); // <-- AWAITED
  await saveStoryboardSelection();
  if (typeof _suppressNextBlur !== "undefined") {
    _suppressNextBlur = false;
  }

  try {
    const card = select.closest(".storyboard-card");
    const left = card?.querySelector(".storyboard-card-left");
    const type = card?.dataset?.type || "";
    const id = select.value || "";
    if (type && id && typeof entities.get === "function") {
      const entity = await entities.get(type, id); // <-- AWAITED
      if (entity) {
        applyBrand?.(left, entity);
        (function applyCardBrandShim() {
          const brand = deriveBrand ? deriveBrand(entity) : null;
          if (brand && card && card.style)
            card.style.setProperty("--brand", brand);
        })();
      }
    }
  } catch {
    /* noop */
  }
}

export async function _attachStoryboardListeners() { // <-- MADE ASYNC
  await populateStoryboardSelects(); // <-- AWAITED
  _setupStoryboardTitle();
  const title = document.querySelector("#storyboard-dynamic-title");
  if (title) {
    title.addEventListener("input", () => {
      title.dataset.manual = "true";
    });
    title.addEventListener("dblclick", async () => { // <-- async
      title.dataset.manual = "false";
      await setDynamicTitle(); // <-- await
    });
  }
  const shuffleBtn = document.querySelector("#shuffle-btn");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", async () => { // <-- async
      [
        "storyboard-ai-select",
        "storyboard-user-select",
        "storyboard-world-select",
      ].forEach((id) => {
        const s = document.querySelector(`#${id}`);
        if (!s) return;
        const opts = Array.from(s.options).filter((o) => o.value);
        if (opts.length)
          s.value = opts[Math.floor(Math.random() * opts.length)].value;
        s.dispatchEvent(new Event("change", {
          bubbles: true
        }));
      });
      await setDynamicTitle?.(); // <-- await
    });
  }
  const storyboardScreen = document.querySelector("#storyboard-screen");
  const chatScreenContainer = document.querySelector("#chat-screen-container");

  async function beginStory() {
    const aiSelect = document.querySelector("#storyboard-ai-select");
    const userSelect = document.querySelector("#storyboard-user-select");
    const worldSelect = document.querySelector("#storyboard-world-select");

    if (aiSelect?.value && userSelect?.value && worldSelect?.value) {
      const storyTitleEl = document.querySelector("#storyboard-dynamic-title");
      const storyId = storyTitleEl?.textContent || "default-story";
      const characterId = aiSelect.value; // Correctly use the AI's character ID
      const worldId = worldSelect.value;
      const threadId = await App.threads.createFromSelection({ storyId, characterId, worldId });

      if (storyboardScreen) storyboardScreen.hidden = true;
      if (chatScreenContainer) chatScreenContainer.hidden = false;

      App.applyPatch({ ui: { fsm: "idle" } });
      await App.chat.render(threadId);
    } else {
      alert("Please select an AI character, your own character, and a world to begin the story.");
    }
  }

  const beginStoryBtn = document.querySelector("#begin-story");
  if (beginStoryBtn) {
    // Remove the old handler if it exists to prevent duplicate listeners
    if (beginStoryBtn._beginStoryHandler) {
      beginStoryBtn.removeEventListener('click', beginStoryBtn._beginStoryHandler);
    }
    // Attach the new handler and store its reference for the next time
    beginStoryBtn.addEventListener("click", beginStory);
    beginStoryBtn._beginStoryHandler = beginStory;
  }
  // Use for...of loop to handle async await inside
  const cards = document.querySelectorAll(".storyboard-card");
  for (const card of cards) { // <-- FOR...OF
    const type = card.dataset.entityType;
    const id = card.dataset.entityId || "";
    const entity = await entities.get?.(type, id); // <-- AWAITED
    updateStoryboardCard(card, entity);
  }
}

export function _attachOptionChinActions() {
  if (_optionsListenersAttached) return;
  const ui = _getUIElements();
  const {
    uploadBackupInput,
    downloadBackupButton,
    deleteAllDataButton,
  } = ui;

  // This trigger is now handled by the importAllData function
  // if (uploadBackupTrigger && uploadBackupInput) { ... }

  if (uploadBackupInput) {
    uploadBackupInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file && typeof importAllData === "function")
        importAllData(file);
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

export function _attachContentChinActions() {
  if (_contentListenersAttached) return;
  const ui = _getUIElements();

  const configs = [{
    key: "stories",
    newButton: ui.newStoryButton,
    uploadTrigger: ui.uploadStoryTrigger,
    uploadInput: ui.uploadStoryInput,
  }, {
    key: "characters",
    newButton: ui.newCharacterButton,
    uploadTrigger: ui.uploadCharacterTrigger,
    uploadInput: ui.uploadCharacterInput,
  }, {
    key: "worlds",
    newButton: ui.newWorldButton,
    uploadTrigger: ui.uploadWorldTrigger,
    uploadInput: ui.uploadWorldInput,
  }, ];

  configs.forEach(({
    key,
    newButton,
    uploadTrigger,
    uploadInput
  }) => {
    if (newButton) {
      newButton.addEventListener("click", () => {
        if (key === "stories") {
          resetStoryboard?.();
          router.navigate("#storyboard");
          return;
        }
        if (key === "characters" || key === "worlds") {
          router.navigate(`#form/${key.slice(0, -1)}/new`);
        }
      });
    }

    if (uploadTrigger && uploadInput) {
      uploadTrigger.addEventListener("click", () => uploadInput.click());
      uploadInput.addEventListener("change", async (e) => { // <-- MADE ASYNC
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => { // <-- MADE ASYNC
          try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) return;

            const type = key.replace(/s$/, "");
            if (type === 'character' || type === 'world' || type === 'story') {
              // Import into IndexedDB
              const validData = data.filter(item => item.name && item.type === type);
              await db.entities.bulkPut(validData.map(item => ({
                ...item,
                isCustom: item.isPremade ? 0 : 1, // 1 = custom, 0 = premade (numeric for IndexedDB)
                isPremade: item.isPremade || false,
                createdAt: item.createdAt || Date.now(),
                updatedAt: item.updatedAt || Date.now(),
              })));
              alert(`Successfully imported ${validData.length} ${type}(s).`);
            } else {
              console.warn(`Import for type "${type}" is not supported`);
              alert(`Import for type "${type}" is not supported.`);
            }
            await refreshAllLists(); // <-- AWAITED
          } catch (err) {
            console.error("Failed to import", err);
            alert(`Failed to import ${key}. Please check the file format and try again.`);
          }
          uploadInput.value = null;
        };
        reader.readAsText(file);
      });
    }
  });

  _contentListenersAttached = true;
}

let _settingsListenersAttached = false;

export function _attachSettingsListeners() {
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
    App.state.applyPatch({ settings: { temperature: parseFloat(e.target.value) } });
  });
  topPInput?.addEventListener("input", (e) => {
    App.state.applyPatch({ settings: { top_p: parseFloat(e.target.value) } });
  });
  maxTokensInput?.addEventListener("input", (e) => {
    App.state.applyPatch({ settings: { maxTokens: parseInt(e.target.value, 10) } });
  });
  stopInput?.addEventListener("input", (e) => {
    App.state.applyPatch({ settings: { stop: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } });
  });
  modelSelect?.addEventListener("change", (e) => {
    App.state.applyPatch({ settings: { model: e.target.value } });
  });
}

export function _attachChatFormListener() {
  const chatForm = document.querySelector("#chat-form");
  if (chatForm && !chatForm._submitListenerAttached) {
    const input = chatForm.querySelector('input[name="message"]');
    const submitButton = chatForm.querySelector('input[type="submit"]');
    const chatFeed = document.querySelector("#chat-feed");

    if (!input || !submitButton || !chatFeed) {
      console.error("Chat UI elements not found, cannot attach listener.");
      return;
    }

    input.addEventListener("input", () => {
      submitButton.disabled = !input.value.trim();
    });

    chatForm.addEventListener("submit", async (e) => { // <-- MADE ASYNC
      e.preventDefault();
      const message = input.value.trim();
      if (message) {
        await App.chat.send(message); // Call App.chat.send to process the message
        input.value = "";
        submitButton.disabled = true;
        chatFeed.scrollTop = chatFeed.scrollHeight;
      }
    });
    chatForm._submitListenerAttached = true;
  }
}

export async function initializeWhenReady() { // <-- MADE ASYNC
  try {
    // Initialize database first
    try {
      await initDB();
      console.log('[RPGlitch] Database initialized.');
    } catch (error) {
      console.error('[RPGlitch] Failed to initialize database:', error);
      alert('Database initialization failed. Please refresh the page. Error: ' + error.message);
      throw error; // Stop initialization
    }

    // Initialize debug mode from IndexedDB
    await initDebugMode();

    // Listen for state changes to re-render the chat
    document.addEventListener('state:changed', async (event) => { // <-- MADE ASYNC
      const { patch } = event.detail;
      // Check if messages for the active thread or the active thread itself changed
      if (patch.messages?.byThreadId || patch.threads?.activeId !== undefined) {
        const activeThreadId = App.state.threads.activeId;
        if (activeThreadId) {
          await App.chat.render(activeThreadId);
        }
      }
    });

    // Check if settings are initialized (indicates a fresh or cleared DB)
    const currentSettings = await db.settings.get('settings');
    if (!currentSettings) {
      console.log('[RPGlitch] Initializing default settings.');
      // Initialize default settings
      await db.settings.add({
        id: 'settings',
        temperature: App.state.settings.temperature,
        top_p: App.state.settings.top_p,
        maxTokens: App.state.settings.maxTokens,
        stop: App.state.settings.stop,
        model: App.state.settings.model,
        historyLength: App.state.settings.historyLength,
      });
    }

    // Load selected storyboard card from DB
    const selectedEntity = await db.entities.where('isSelected').equals(true).first();
    if (selectedEntity) {
      App.applyPatch({ ui: { selectedStoryboardCard: { type: selectedEntity.type, id: selectedEntity.id } } });
    }

    console.log('[RPGlitch] initializeWhenReady start', { // <-- ADDED
      retry: window.initializeWhenReadyRetryCount || 0
    });
  } catch { /* ignore */ }

  try {
    _getUIElements();
    _attachChatFormListener?.();
    if (!TEST_MODE) chin.init?.();
    _attachOptionChinActions?.();
    _attachContentChinActions?.();
    _attachSettingsListeners?.(); // <-- ADDED
    _attachCardNavigation?.();
    _attachChinSearchHandlers();
    await refreshAllLists?.(); // <-- AWAITED
    await _attachStoryboardListeners?.(); // <-- AWAITED
    try {
      dismissLoadingUI?.();
    } catch {
      void 0;
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
    try {
      let attempts = 0;
      const maxAttempts = 24;
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
    window.initializeWhenReadyRetryCount = 0;
    try {
      console.log('[RPGlitch] initializeWhenReady success');
    } catch { /* ignore */ }
    return true;
  } catch (error) {
    const retryCount = (window.initializeWhenReadyRetryCount || 0) + 1;
    window.initializeWhenReadyRetryCount = retryCount;
    try {
      console.error(`❗ App initialization failed (attempt ${retryCount}/${MAX_INIT_RETRIES})`, error && (error.stack || error), error);
    } catch { /* ignore */ }
    if (TEST_MODE) {
      return false;
    }
    if (retryCount < MAX_INIT_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, INIT_BACKOFF_MS));
      return initializeWhenReady();
    }
    console.error(`❌ App initialization failed after ${MAX_INIT_RETRIES} attempts.`, error);
    throw error;
  }
}

export async function importAllData(file) { // <-- MADE ASYNC
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => { // <-- MADE ASYNC
    try {
      const data = JSON.parse(e.target.result);

      // 1. Validate version
      if (data.version !== 1) {
        console.warn("Imported data version mismatch. Attempting to import anyway.");
        // In a real application, you might want to handle migrations here.
      }

      // 2. Import characters (entities)
      if (Array.isArray(data.characters)) {
        // Clear existing characters and add new ones. This is a simple conflict resolution strategy.
        await db.entities.where('type').equals('character').delete();
        await db.entities.bulkAdd(data.characters);
      }

      // 3. Import threads
      if (Array.isArray(data.threads)) {
        await db.threads.clear();
        await db.threads.bulkAdd(data.threads);
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
      alert('Backup imported successfully!');
    } catch (err) {
      console.error("Failed to import backup", err);
      alert('Failed to import backup. Please check the file and try again.');
    } finally {
      const ui = _getUIElements();
      if (ui.uploadBackupInput) ui.uploadBackupInput.value = null;
    }
  };
  reader.readAsText(file);
}

export async function exportAllData() { // <-- MADE ASYNC
  try {
    const data = {
      version: 1, // Add version
    };

    // Get characters from Dexie (filtered from entities)
    data.characters = await db.entities.where('type').equals('character').toArray();

    // Get threads from Dexie
    data.threads = await db.threads.toArray();

    // Get messages from Dexie
    data.messages = await db.messages.toArray();

    // Get settings from Dexie (assuming it's a singleton with key 'settings')
    data.settings = await db.settings.get('settings'); // Assuming 'settings' is the key for the singleton settings object

    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rpglitch-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export backup:', error);
    alert('Failed to export backup. Please try again.');
  }
}

export async function deleteAllData() {
  try {
    // Confirm before destructive action
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      return;
    }

    // Delete all entities from IndexedDB (includes stories, characters, worlds)
    await db.entities.clear();
    await db.threads.clear();
    await db.messages.clear();

    await refreshAllLists();
    alert('All data has been deleted.');
  } catch (error) {
    console.error('Failed to delete data:', error);
    alert('Failed to delete data. Please try again.');
  }
}

try {
  if (!_bootBound) {
    _bootBound = true;
    const boot = async () => { // <-- MADE ASYNC
      try {
        if (TEST_MODE) return;
        if (_bootStarted) return;
        _bootStarted = true;
        await initializeWhenReady?.();
      } catch (err) {
        console.error("RPGlitch boot failed:", err);
      }
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(boot, 0);
    } else {
      document.addEventListener("DOMContentLoaded", boot, {
        once: true
      });
      window.addEventListener("load", boot, {
        once: true
      });
    }
  }
} catch { /* empty */ }

document.addEventListener(
  "DOMContentLoaded",
  () => {
    // This is now redundant with the _bootBound logic, but safe.
    // We'll rely on the _bootBound logic.
  },
  {
    once: true
  }
);
