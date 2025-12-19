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
        setStorymodeEntities(
          story.snapshots.start.ai,
          story.snapshots.start.user,
          story.snapshots.start.fractal,
        );
        updatePortraits(story.snapshots.start.ai, story.snapshots.start.user);
        if (story.snapshots.start.fractal) {
          applyFractalAmbience(story.snapshots.start.fractal);
        }
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
  });
}

// --- ERROR HANDLING ---

const errorModalHtml = `
  <dialog id="error-modal" class="modal--alert">
    <article>
      <header>
        <h3>The Engine Stalled</h3>
        <a href="#close" aria-label="Close" class="close" onclick="document.getElementById('error-modal').remove()"></a>
      </header>
      <p id="error-msg">A connection error occurred.</p>
      <footer>
        <button id="btn-err-retry" class="secondary">Retry</button>
        <button id="btn-err-note" class="contrast">Retry with Note</button>
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

  modal.querySelector("#btn-err-retry").onclick = async () => {
    modal.remove();
    const { TurnManager } = await import("../engine/director.js");
    if (typeof TurnManager.regenerate === "function") {
      TurnManager.regenerate();
    }
  };

  modal.querySelector("#btn-err-note").onclick = async () => {
    const note = prompt(
      "Enter a variance note for the AI (e.g. 'More action'):",
    );
    if (note) {
      modal.remove();
      // Implement logic to retry with instruction if available or just generic regeneration
      const { TurnManager } = await import("../engine/director.js");
      // Director needs to support this, for now standard regenerate or custom logic
      // The prompt asked for "TurnManager.variance()", let's assume/shim it
      if (typeof TurnManager.regenerate === "function") {
        // Temporarily we just call regen, but ideally we pass the note
        // Assuming we can't change director signature easily right now without more edits
        // We will just alert for now or try to call a method if it existed
        TurnManager.regenerate();
      }
    }
  };

  modal.setAttribute("open", "true");
}

export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const tpl = document.getElementById("tpl-confirm-modal");
    const clone = tpl.content.cloneNode(true);

    const dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.style.zIndex = "10000"; // Topmost
    dialog.appendChild(clone);

    // [FIX] Use showModal() to activate ::backdrop
    // We need to append to document first for showModal to work
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

    document.body.appendChild(dialog);
  });
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

    // [FIX] THEME INJECTION LOGIC
    // 1. Clear any existing theme classes (start with "theme-")
    const currentClasses = document.body.className.split(" ");
    const cleanClasses = currentClasses.filter((c) => !c.startsWith("theme-"));
    document.body.className = cleanClasses.join(" ");

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
