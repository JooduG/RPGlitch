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
import {
  showAlert,
  showConfirm,
  showPrompt,
  showErrorModal,
} from "./services/modals.js";

const selectedEntities = {
  ai: null,
  user: null,
  fractal: null,
};

let _onSelectionChanged = null;
let turnComponents = { text: false, image: false };

const finalizeTurn = async (component, context = null) => {
  if (component === "text") turnComponents.text = true;
  if (component === "image") turnComponents.image = true;

  if (turnComponents.text) {
    const { state } = await import("../core/state.js");

    if (state.story.isConcluded) {
      log("🛑 [REFLEX] Story Concluded. Skipping Physics Update.");
      turnComponents = { text: false, image: false };
      return;
    }

    let entityId = null;

    if (context?.characterId) {
      entityId = context.characterId;
    } else {
      const story = state.story.byId[state.story.activeId];
      if (story) {
        if (context?.role === "user") {
          entityId = story.userId;
        } else if (context?.role === "fractal") {
          entityId = story.fractalId;
        } else {
          entityId = story.aiId;
        }
      }
    }

    if (!entityId) {
      log("⚠️ [REFLEX] Physics skipped: Entity ID missing.");
      turnComponents = { text: false, image: false };
      return;
    }

    log(
      `⚡ [REFLEX] Atomic Turn Complete. Physics update handled by director.js.`,
    );

    turnComponents = { text: false, image: false };
  }
};

const initEventBinds = () => {
  events.addEventListener(EVENTS.STORY_LOADED, async () => {
    const state = await import("../core/state.js").then((m) => m.state);
    if (!state.story.activeId) return;

    const db = await import("../core/db.js").then((m) => m.db);
    const story = await db.stories.get(state.story.activeId);
    if (!story) return;

    let snapshot;
    if (story.isConcluded) {
      snapshot = story.snapshots.end;
    } else {
      try {
        const { entities } = await import("../data/repo.js");
        const [ai, user, fractal] = await Promise.all([
          entities.get("character", story.aiId),
          entities.get("character", story.userId),
          entities.get("fractal", story.fractalId),
        ]);
        snapshot = { ai, user, fractal };
      } catch (err) {
        snapshot = story.snapshots.start;
      }
    }

    setStorymodeEntities(snapshot.ai, snapshot.user, snapshot.fractal);
    updatePortraits(snapshot.ai, snapshot.user);
    if (snapshot.fractal) applyFractalAmbience(snapshot.fractal);

    updateStoryboardSelection({
      aiCharacter: snapshot.ai,
      userCharacter: snapshot.user,
      fractal: snapshot.fractal,
    });
  });

  events.addEventListener(EVENTS.CHAT_REFRESH, async (e) => {
    document
      .querySelectorAll(".status-hud")
      .forEach((hud) => hud.classList.add("status-hud--stale"));
    const { renderChat } = await import("./components/chat/feed.js");
    if (e.detail?.storyId) await renderChat(e.detail.storyId);
  });

  events.addEventListener(EVENTS.TYPING_STARTED, async (e) => {
    const { showTypingIndicator } = await import("./components/chat/feed.js");
    const feed = document.querySelector("#chat-feed");
    if (feed && e.detail) {
      // Pass the entire detail object (which may contain role, characterId, signatureColor)
      // to match showTypingIndicator(container, typeOrOptions, entityId) structure
      showTypingIndicator(feed, e.detail, e.detail.characterId);
    }
  });

  events.addEventListener(EVENTS.TYPING_STOPPED, async () => {
    const { removeTypingIndicator } = await import("./components/chat/feed.js");
    const feed = document.querySelector("#chat-feed");
    if (feed) removeTypingIndicator(feed);
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

  events.addEventListener(EVENTS.GENERATION_COMPLETED, async (e) => {
    const { setSendLock, setChatGeneratingState } =
      await import("./components/chat/feed.js");
    setSendLock(false);
    setChatGeneratingState(false);
    finalizeTurn("text", e.detail);
  });

  events.addEventListener(EVENTS.MESSAGE_RECEIVED, (e) => {
    if (e.detail?.type === "IMAGE") finalizeTurn("image");
  });
};

export const handleConcludeStory = async () => {
  const confirmed = await showConfirm(
    "Conclude Story?",
    "Are you sure? The AI will write an epilogue and the story will be archived.",
  );

  if (confirmed) {
    const form = document.querySelector("#story-form");
    if (form) form.style.display = "none";

    const { TurnManager } = await import("../engine/director.js");
    // const { showTypingIndicator, removeTypingIndicator } = await import("./components/chat/feed.js"); // Handled via events
    const feed = document.querySelector("#chat-feed");

    if (feed) {
      // Event driven typing indicator will handle this
    }

    try {
      await TurnManager.concludeStory();
    } finally {
      // if (feed) removeTypingIndicator(feed); // Handled via events
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    }
  }
};

window.addEventListener("app-error", (e) => {
  showErrorModal(e.detail?.type || "generic", e.detail?.error?.message);
});

initEventBinds();

export {
  setStorymodeEntities,
  updatePortraits,
  setSendLock,
  showAlert,
  showConfirm,
  showPrompt,
  showErrorModal,
};

const showStoryboard = () => {
  document.body.classList.remove("profile-view-active", "storymode");
  document.body.classList.add("mode-storyboard");
  closeProfileModal();
};

const showStoryScreen = () => {
  document.body.classList.remove("profile-view-active", "mode-storyboard");
  document.body.classList.add("storymode");
  closeProfileModal();
};

const parseHash = () => {
  const [path] = location.hash.slice(1).split("?");
  return path.split("/").filter(Boolean);
};

const handleRoute = () => {
  const [section, entityType, id] = parseHash();
  const isType = (t) => t === "character" || t === "fractal";

  closeDrawer();

  if (document.body.classList.contains("storymode")) {
    if (section !== "story" && section !== "profile") {
      log("🚫 Access Denied: Story in progress.");
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
    closeDrawer();
  } else if (section === "story") {
    showStoryScreen();
  } else {
    showStoryboard();
  }
};

window.addEventListener("hashchange", handleRoute);
document.addEventListener(
  "DOMContentLoaded",
  () => {
    handleRoute();
    document
      .querySelectorAll("button[data-chin]")
      .forEach((btn) => btn.classList.add("entity-drawer-button"));
    document
      .querySelectorAll('form[role="search"]')
      .forEach((form) =>
        form.addEventListener("submit", (e) => e.preventDefault()),
      );
  },
  { once: true },
);

export const updateStoryboardSelection = (newSelection) => {
  if (newSelection.aiCharacter !== undefined)
    selectedEntities.ai = newSelection.aiCharacter;
  if (newSelection.userCharacter !== undefined)
    selectedEntities.user = newSelection.userCharacter;
  if (newSelection.fractal !== undefined) {
    selectedEntities.fractal = newSelection.fractal;
    log("[UI] Selecting Fractal:", newSelection.fractal);
    setAppBackground(selectedEntities.fractal?.signatureColor);
    applyFractalAmbience(selectedEntities.fractal);

    const toRemove = [...document.body.classList].filter((c) =>
      c.startsWith("theme-"),
    );
    document.body.classList.remove(...toRemove);

    const newTheme = selectedEntities.fractal?.simulation?.cssTheme;
    if (newTheme) {
      document.body.classList.add(newTheme);
      log(`[UI] Applied theme: ${newTheme}`);
    }
  }

  updateLocalSelection(selectedEntities);

  const updateSlot = (key, entity, btnId, previewId, type, titleOverride) => {
    const previewEl = document.querySelector(previewId);
    const btn = document.querySelector(btnId);

    if (entity) {
      if (previewEl) {
        const onEdit = () => {
          const container = btn ? btn.closest(".entity-card") : null;
          openDrawerFor(type, key, previewId, btn, container, titleOverride);
        };

        renderEntityPreview(
          previewId,
          entity,
          btn,
          type,
          onEdit,
          type === "fractal",
          key,
        );
        previewEl.hidden = false;
        previewEl.classList.remove("fade-in");
        void previewEl.offsetWidth;
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
};

export const initViews = async (deps = {}) => {
  if (deps.onSelectionChanged) _onSelectionChanged = deps.onSelectionChanged;

  const setOnSelectionChanged = (handler) => {
    _onSelectionChanged = handler;
  };

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

  setChinCallbacks({
    onUpdateSelection: updateStoryboardSelection,
  });

  setProfileCallbacks({
    onUpdateSelection: updateStoryboardSelection,
  });

  return {
    setOnSelectionChanged,
    updateStoryboardSelection,
  };
};
