import { log } from "../core/utils.js";
import { initDrawer, closeDrawer } from "./components/drawer/desktop.js";
import { setStorymodeEntities, setSendLock } from "./components/chat/feed.js";
import { updatePortraits, applyFractalAmbience } from "./image-gen-ui.js";
import { setAppBackground } from "./services/ui-utils.js";
import {
  updateLocalSelection,
  bindDrawerTrigger,
  renderEntityPreview,
  openDrawerFor,
  setChinCallbacks,
} from "./components/drawer/mobile.js";
import {
  renderProfilePage,
  closeProfileModal,
  setProfileCallbacks,
} from "./components/profile/controller.js";
import { events, EVENTS } from "../core/events.js";
import { bridge } from "../engine/physics/bridge.js";
import { ENTITY_TYPES } from "../core/constants.js";

// Shared Selection State (The Source of Truth)
const selectedEntities = {
  ai: null,
  user: null,
  fractal: null,
};

let _onSelectionChanged = null;

// --- EVENT WIRING (Decoupling) ---

function initEventBinds() {
  events.addEventListener(EVENTS.STORY_LOADED, async () => {
    // 1. Refresh Storymode Entities
    const state = await import("../core/state.js").then((m) => m.state);
    if (state.story.activeId) {
      const db = await import("../core/db.js").then((m) => m.db);
      const story = await db.stories.get(state.story.activeId);
      if (story) {
        // Determine source snapshot (End if concluded, else Start)
        // [FIX] Use the most recent state available
        let snapshot;

        if (story.isConcluded) {
          snapshot = story.snapshots.end;
        } else {
          // Fetch fresh state for active stories
          try {
            const { entities } = await import("../data/repo.js");
            const [ai, user, fractal] = await Promise.all([
              entities.get("character", story.aiId),
              entities.get("character", story.userId),
              entities.get("fractal", story.fractalId),
            ]);
            snapshot = { ai, user, fractal };
          } catch (err) {
            console.error(
              "Failed to fetch fresh story entities, falling back to start snapshot.",
              err,
            );
            snapshot = story.snapshots.start;
          }
        }

        setStorymodeEntities(snapshot.ai, snapshot.user, snapshot.fractal);
        updatePortraits(snapshot.ai, snapshot.user);

        if (snapshot.fractal) {
          applyFractalAmbience(snapshot.fractal);
        }

        // Sync Global Selection State to ensure Theme is applied
        // This fixes the bug where loading a story didn't change the UI theme
        updateStoryboardSelection({
          aiCharacter: snapshot.ai,
          userCharacter: snapshot.user,
          fractal: snapshot.fractal,
        });
      }
    }
  });

  events.addEventListener(EVENTS.CHAT_REFRESH, async (e) => {
    const { renderChat } = await import("./components/chat/feed.js");
    if (e.detail?.storyId) {
      await renderChat(e.detail.storyId);
    }
  });

  events.addEventListener(EVENTS.TYPING_STARTED, async (e) => {
    const { showTypingIndicator } = await import("./components/chat/feed.js");
    const feed = document.querySelector("#chat-feed");
    if (feed && e.detail) {
      showTypingIndicator(feed, e.detail.role, e.detail.characterId);
    }
  });

  events.addEventListener(EVENTS.TYPING_STOPPED, async () => {
    const { removeTypingIndicator } = await import("./components/chat/feed.js");
    const feed = document.querySelector("#chat-feed");
    if (feed) removeTypingIndicator(feed);
  });

  events.addEventListener(EVENTS.GENERATION_STARTED, async () => {
    const { setSendLock, setChatGeneratingState } =
      await import("./components/chat/feed.js");
    setSendLock(true);
    setChatGeneratingState(true);
  });

  events.addEventListener(EVENTS.GENERATION_COMPLETED, async () => {
    const { setSendLock, setChatGeneratingState } =
      await import("./components/chat/feed.js");
    setSendLock(false);
    setChatGeneratingState(false);

    // [NEXUS FIX] Reflex Ignition
    const { state } = await import("../core/state.js");
    if (state.story.activeId) {
      bridge.runBackgroundUpdate(
        state.story.activeId,
        ENTITY_TYPES.AI_CHARACTER,
        null,
      );
    }
  });
}

// --- ERROR HANDLING ---

const errorModalHtml = `
  <dialog id="error-modal" class="modal">
    <article class="modal-content">
      <header>
        <h3>The Engine Stalled</h3>
        <button type="button" class="close" aria-label="Close">
          <svg class="icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </header>
      <div class="modal-body">
        <p id="error-msg">A connection error occurred.</p>
      </div>
      <footer>
        <button id="btn-err-retry-vanilla" class="secondary">Retry (Vanilla)</button>
        <button id="btn-err-retry-spicy" class="contrast">Retry (Spicy)</button>
      </footer>
    </article>
  </dialog>
`;

export function showErrorModal(errorType, message = "Something went wrong.") {
  const existing = document.getElementById("error-modal");
  if (existing) existing.remove();

  document.body.insertAdjacentHTML("beforeend", errorModalHtml);
  const modal = document.getElementById("error-modal");
  const msgEl = modal.querySelector("#error-msg");

  if (errorType === "network") {
    msgEl.textContent = "The connection to the AI was lost or timed out.";
  } else {
    msgEl.textContent = message;
  }

  // VANILLA RETRY: Just try again, no fancy changes.
  modal.querySelector("#btn-err-retry-vanilla").onclick = async () => {
    modal.remove();
    const { TurnManager } = await import("../engine/director.js");
    if (typeof TurnManager.regenerate === "function") {
      TurnManager.regenerate("VANILLA");
    }
  };

  // SPICY RETRY: Use the standard variance system to "shake it loose".
  modal.querySelector("#btn-err-retry-spicy").onclick = async () => {
    modal.remove();
    const { TurnManager } = await import("../engine/director.js");
    if (typeof TurnManager.regenerate === "function") {
      TurnManager.regenerate(); // Default behavior (Variance)
    }
  };

  document.body.appendChild(modal);
  modal.showModal();
}

/**
 * Shows a confirmation modal.
 * @param {string} title
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const tpl = document.getElementById("tpl-confirm-modal");
    if (!tpl) {
      // Fallback if template missing (should not happen)
      return resolve(window.confirm(`${title}\n\n${message}`));
    }
    const clone = tpl.content.cloneNode(true);

    const dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.style.zIndex = "10000"; // Topmost
    dialog.appendChild(clone);

    document.body.appendChild(dialog);
    dialog.showModal();

    const h3 = dialog.querySelector("h3");
    const p = dialog.querySelector("p");

    if (h3) h3.textContent = title;
    if (p) p.textContent = message;

    const btnCancel = dialog.querySelector("#btn-confirm-cancel");
    const btnOk = dialog.querySelector("#btn-confirm-ok");

    const cleanup = (result) => {
      dialog.remove();
      resolve(result);
    };

    if (btnCancel) btnCancel.onclick = () => cleanup(false);
    if (btnOk) btnOk.onclick = () => cleanup(true);

    // Close on backdrop click (optional, but standard for modals)
    dialog.onclick = (e) => {
      if (e.target === dialog) cleanup(false);
    };
  });
}

/**
 * Shows an alert modal.
 * @param {string} title
 * @param {string} message
 * @returns {Promise<void>}
 */
export function showAlert(title, message) {
  return new Promise((resolve) => {
    const tpl = document.getElementById("tpl-alert-modal");
    if (!tpl) {
      window.alert(`${title}\n\n${message}`);
      return resolve();
    }
    const clone = tpl.content.cloneNode(true);

    const dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.style.zIndex = "10001";
    dialog.appendChild(clone);

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector("h3").textContent = title;
    dialog.querySelector("p").textContent = message;

    const btnOk = dialog.querySelector("#btn-alert-ok");

    const cleanup = () => {
      dialog.remove();
      resolve();
    };

    if (btnOk) btnOk.onclick = cleanup;
    dialog.onclick = (e) => {
      if (e.target === dialog) cleanup();
    };
  });
}

/**
 * Shows a prompt modal.
 * @param {string} title
 * @param {string} message
 * @param {string} [defaultValue='']
 * @returns {Promise<string|null>} value or null if cancelled
 */
export function showPrompt(title, message, defaultValue = "") {
  return new Promise((resolve, reject) => {
    const tpl = document.getElementById("tpl-prompt-modal");
    if (!tpl) {
      const val = window.prompt(`${title}\n\n${message}`, defaultValue);
      return val !== null ? resolve(val) : reject();
    }
    const clone = tpl.content.cloneNode(true);

    const dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.style.zIndex = "10002";
    dialog.appendChild(clone);

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector("h3").textContent = title;
    dialog.querySelector("p").textContent = message;

    const input = dialog.querySelector("input");
    if (input) {
      input.value = defaultValue;
      // Focus input
      requestAnimationFrame(() => input.focus());

      // Enter key to submit
      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          cleanup(input.value);
        }
      };
    }

    const btnCancel = dialog.querySelector("#btn-prompt-cancel");
    const btnOk = dialog.querySelector("#btn-prompt-ok");

    const cleanup = (val) => {
      dialog.remove();
      if (val !== undefined) resolve(val);
      else reject(); // Cancel behavior
    };

    if (btnCancel) btnCancel.onclick = () => cleanup(undefined);
    if (btnOk) btnOk.onclick = () => cleanup(input ? input.value : "");
    dialog.onclick = (e) => {
      if (e.target === dialog) cleanup(undefined);
    };
  });
}

export async function handleConcludeStory() {
  const confirmed = await showConfirm(
    "Conclude Story?",
    "Are you sure? The AI will write an epilogue and the story will be archived.",
  );

  if (confirmed) {
    // [UX] Lock UI immediately
    const form = document.querySelector("#story-form");
    if (form) form.style.display = "none";

    // Call Engine
    const { TurnManager } = await import("../engine/director.js");
    await TurnManager.concludeStory();
  }
}

window.addEventListener("app-error", (e) => {
  showErrorModal(e.detail?.type || "generic", e.detail?.error?.message);
});

// Initialize Bindings
initEventBinds();

// --- EXPORTS ---

export { setStorymodeEntities, updatePortraits, setSendLock };

// --- CORE ROUTING ---
function showStoryboard() {
  document.body.classList.remove("profile-view-active");
  document.body.classList.remove("storymode");
  document.body.classList.add("mode-storyboard");
  closeProfileModal();
}

function showStoryScreen() {
  document.body.classList.remove("profile-view-active");
  document.body.classList.remove("mode-storyboard");
  document.body.classList.add("storymode");
  closeProfileModal();
}

function parseHash() {
  const [path] = location.hash.slice(1).split("?");
  return path.split("/").filter(Boolean);
}

function handleRoute() {
  const [section, entityType, id] = parseHash();
  const isType = (t) => t === "character" || t === "fractal";

  closeDrawer();

  // [AIRLOCK] Lock user in story if storymode is active
  const isStorymodeActive = document.body.classList.contains("storymode");
  if (isStorymodeActive) {
    if (section !== "story" && section !== "profile") {
      console.warn("🚫 Access Denied: Story in progress.");
      location.hash = "#story";
      return;
    }
  }

  if (section === "profile" && isType(entityType) && id) {
    if (
      !document.body.classList.contains("storymode") &&
      !document.body.classList.contains("mode-storyboard")
    ) {
      document.body.classList.add("mode-storyboard");
    }
    renderProfilePage(entityType, id);
    try {
      closeDrawer();
    } catch (e) {
      void e;
    }
  } else if (section === "story") {
    showStoryScreen();
  } else {
    showStoryboard();
  }
}

window.addEventListener("hashchange", handleRoute);
document.addEventListener(
  "DOMContentLoaded",
  () => {
    handleRoute();
    document
      .querySelectorAll("button[data-chin]")
      .forEach((btn) => btn.classList.add("entity-drawer-button"));
    document.querySelectorAll('form[role="search"]').forEach((form) => {
      form.addEventListener("submit", (e) => e.preventDefault());
    });
  },
  { once: true },
);

export function updateStoryboardSelection(newSelection) {
  // Update Source of Truth
  if (newSelection.aiCharacter !== undefined)
    selectedEntities.ai = newSelection.aiCharacter;
  if (newSelection.userCharacter !== undefined)
    selectedEntities.user = newSelection.userCharacter;
  if (newSelection.fractal !== undefined) {
    selectedEntities.fractal = newSelection.fractal;
    log("[UI] Selecting Fractal:", newSelection.fractal);
    setAppBackground(selectedEntities.fractal?.signatureColor);
    applyFractalAmbience(selectedEntities.fractal);

    // THEME INJECTION LOGIC
    // 1. Clear any existing theme classes (start with "theme-")
    const toRemove = [...document.body.classList].filter((c) =>
      c.startsWith("theme-"),
    );
    document.body.classList.remove(...toRemove);

    // 2. Inject new theme if it exists
    const newTheme = selectedEntities.fractal?.simulation?.cssTheme;
    if (newTheme) {
      document.body.classList.add(newTheme);
      log(`[UI] Applied theme: ${newTheme}`);
    }
  }

  // Propagate to Chin Module
  updateLocalSelection(selectedEntities);

  // Render Updates
  const updateSlot = (key, entity, btnId, previewId, type, titleOverride) => {
    const previewEl = document.querySelector(previewId);
    const btn = document.querySelector(btnId);

    if (entity) {
      if (previewEl) {
        const onEdit = () => {
          const container = btn ? btn.closest(".entity-card") : null;
          openDrawerFor(type, key, previewId, btn, container, titleOverride);
        };

        const isFractal = type === "fractal";
        renderEntityPreview(
          previewId,
          entity,
          btn,
          type,
          onEdit,
          isFractal,
          key,
        );

        previewEl.hidden = false;
        previewEl.classList.remove("fade-in");
        void previewEl.offsetWidth; // Force reflow
        previewEl.classList.add("fade-in");
      }

      if (btn) {
        btn.hidden = true;
        btn.classList.remove("shimmer");
      }
    } else {
      if (previewEl) {
        previewEl.hidden = true;
        previewEl.classList.remove("fade-in");
      }
      if (btn) {
        btn.hidden = false;
        btn.classList.add("shimmer");
      }
    }
  };

  updateSlot(
    "aiCharacter",
    selectedEntities.ai,
    "#btn-select-ai",
    "#ai-character-preview",
    "character",
    "Select AI Character",
  );
  updateSlot(
    "userCharacter",
    selectedEntities.user,
    "#btn-select-user",
    "#user-character-preview",
    "character",
    "Select User Character",
  );
  updateSlot(
    "fractal",
    selectedEntities.fractal,
    "#btn-select-fractal",
    "#fractal-preview",
    "fractal",
    "Select Fractal",
  );

  if (_onSelectionChanged) {
    _onSelectionChanged({
      aiCharacter: selectedEntities.ai,
      userCharacter: selectedEntities.user,
      fractal: selectedEntities.fractal,
    });
  }
}

// --- INITIALIZATION ---
export async function initViews(deps = {}) {
  if (deps.onSelectionChanged) {
    _onSelectionChanged = deps.onSelectionChanged;
  } else {
    initViews.setOnSelectionChanged = (handler) => {
      _onSelectionChanged = handler;
    };
  }

  initDrawer();

  bindDrawerTrigger(
    "#btn-select-ai",
    "character",
    "#ai-character-preview",
    "aiCharacter",
    "Select AI Character",
  );
  bindDrawerTrigger(
    "#btn-select-user",
    "character",
    "#user-character-preview",
    "userCharacter",
    "Select User Character",
  );
  bindDrawerTrigger(
    "#btn-select-fractal",
    "fractal",
    "#fractal-preview",
    "fractal",
    "Select Fractal",
  );

  // [CLEANUP] Storymode bindings moved to image-gen-ui.js where entity state is reliable
  // bindPortraitClick("#storymode-ai-portrait", "aiCharacter");
  // bindPortraitClick("#storymode-user-portrait", "userCharacter");
  // bindPortraitClick("#phone-ai-portrait", "aiCharacter");
  // bindPortraitClick("#phone-user-portrait", "userCharacter");

  // Wire up callbacks to break circular dependencies
  setChinCallbacks({ onUpdateSelection: updateStoryboardSelection });
  setProfileCallbacks({ onUpdateSelection: updateStoryboardSelection });

  // Initial Sync
  updateLocalSelection(selectedEntities);

  return {
    setOnSelectionChanged: (handler) => {
      _onSelectionChanged = handler;
    },
    updateStoryboardSelection,
    renderProfilePage,
  };
}
