import { log } from "../../../gamemaster/utils.js";
import { entities } from "../../../scholar/repository.js";
import { GameMaster } from "../../../gamemaster/index.js";
import { initDrawer } from "../components/drawer/desktop.js";
import { setStorymodeEntities, setSendLock } from "../components/chat/feed.js";
import {
  updatePortraits,
  applyFractalAmbience,
} from "../components/visuals/generator.js";

import { setMobileDrawerCallbacks } from "../components/drawer/mobile.js";
import { setProfileCallbacks } from "../components/profile/controller.js";
import {
  showAlert,
  showConfirm,
  showPrompt,
  showErrorModal,
} from "../core/modal.js";
import { audioService } from "../../audio/service.js";
import { initStoryboardStage } from "../storyboard.js";
import { StoryOptionsController } from "../components/settings.js";
import { events, EVENTS } from "../../../gamemaster/index.js";
import { initChatInput } from "../components/chat/input.js";

// [NEW] Internal Modules
import { Router } from "./router.js";
import { SelectionManager } from "./selection.js";

export const Orchestrator = {
  /**
   * Called when a new story is created and loaded.
   * Trigger the Prologue sequence.
   */
  initStory: async (storyId) => {
    log("[Orchestrator] Initializing Story:", storyId);
    await GameMaster.generatePrologue(storyId);
  },

  /**
   * Called when the user clicks "Conclude Story".
   * Trigger the Epilogue sequence.
   */
  endStory: async () => {
    log("[Orchestrator] Triggering Epilogue");
    await GameMaster.triggerEpilogue();
  },

  submitInput: async (text) => {
    await GameMaster.send(text);
  },

  reroll: async () => {
    await GameMaster.regenerate();
  },

  // Proxy to SelectionManager (Backward Compatibility)
  setOnSelectionChanged: (handler) => {
    SelectionManager.setOnSelectionChanged(handler);
  },

  updateStoryboardSelection: (newSelection) => {
    SelectionManager.update(newSelection);
  },
};

let turnComponents = { text: false, image: false };

const finalizeTurn = async (component, context = null) => {
  if (component === "text") turnComponents.text = true;
  if (component === "image") turnComponents.image = true;

  if (turnComponents.text) {
    const { store: state } = await import("../../../gamemaster/index.js");

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
  audioService.init();

  events.addEventListener(EVENTS.STORY_LOADED, async () => {
    const state = await import("../../../gamemaster/index.js").then(
      (m) => m.store,
    );
    if (!state.story.activeId) return;

    const db = await import("../../../scholar/db.js").then((m) => m.db);
    const story = await db.stories.get(state.story.activeId);
    if (!story) return;

    let snapshot;
    if (story.isConcluded) {
      snapshot = story.snapshots.end;
    } else {
      try {
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

    SelectionManager.update({
      aiCharacter: snapshot.ai,
      userCharacter: snapshot.user,
      fractal: snapshot.fractal,
    });
  });

  events.addEventListener(EVENTS.CHAT_REFRESH, async (e) => {
    document
      .querySelectorAll(".status-hud")
      .forEach((hud) => hud.classList.add("status-hud--stale"));
    const { renderChat } = await import("../components/chat/feed.js");
    if (e.detail?.storyId) await renderChat(e.detail.storyId);
  });

  events.addEventListener(EVENTS.TYPING_STARTED, async (e) => {
    const { showTypingIndicator } = await import("../components/chat/feed.js");
    const feed = document.querySelector("#chat-feed");
    if (feed && e.detail) {
      showTypingIndicator(feed, e.detail, e.detail.characterId);
    }
  });

  events.addEventListener(EVENTS.TYPING_STOPPED, async () => {
    const { removeTypingIndicator } =
      await import("../components/chat/feed.js");
    const feed = document.querySelector("#chat-feed");
    if (feed) removeTypingIndicator(feed);
  });

  events.addEventListener(EVENTS.GENERATION_STARTED, async () => {
    const { setSendLock, setChatGeneratingState } =
      await import("../components/chat/feed.js");
    setSendLock(true);
    setChatGeneratingState(true);
    // [STRICT SYNC] Force Input UI Update -> input.js listens to event, but we double check
    if (window._chatInput && window._chatInput.updateUIState) {
      window._chatInput.updateUIState();
    }
  });

  events.addEventListener(EVENTS.GENERATION_COMPLETED, async (e) => {
    // 1. Resolve Voice Service & State FIRST
    const { voiceService } = await import("../../audio/voice.js");
    voiceService.init();

    // 2. Resolve UI Controllers
    const { setChatGeneratingState } =
      await import("../components/chat/feed.js");

    // 3. Update States
    setChatGeneratingState(false);

    // [STRICT SYNC] Force Input UI Update
    if (window._chatInput && window._chatInput.updateUIState) {
      window._chatInput.updateUIState();
    }

    audioService.play("notification");

    // [FIX] Resolve Voice ID & Biometrics from Character Entity
    let voiceId = null;
    let rateMod = 1.0;

    // Default pitch
    let pitchMod = 1.0;

    if (e.detail?.characterId) {
      try {
        const char = await entities.get("character", e.detail.characterId);

        if (char) {
          // 1. Identity
          if (char.voiceId) voiceId = char.voiceId;

          // 2. Base Personality (Set Global Base)
          voiceService.setRate(char.voiceRate || 1.0);
          voiceService.setPitch(char.voicePitch || 1.0);

          // 3. Biometric Modulation (Physics -> Voice)
          const dyn = char.dynamics || { velocity: 50, entropy: 50 };

          // Velocity (Speed) -> Rate
          // 0 (Slow) -> 100 (Fast). Center 50. Range: +/- 0.25
          rateMod = 1.0 + (dyn.velocity - 50) / 200;

          // Entropy (Chaos) -> Pitch
          // [DISABLED per User Request: Natural voices ignore pitch modulation to avoid artifacts]
          pitchMod = 1.0;

          // SPEAK
          // [FIX] Only Auto-Speak if Call Mode is Active
          if (voiceService.callMode) {
            voiceService.speak(
              e.detail?.text || "",
              voiceId,
              { rate: rateMod, pitch: pitchMod },
              // CALLBACK: End of Speech
              () => {
                // --- CALL MODE LOOP ---
                // If Call Mode is active, the VoiceService.onend will trigger listen() automatically if configured,
                // or we can explicitly handle the loop here for robustness.

                if (voiceService.callMode) {
                  // Ensure UI is cleanly handled.
                  // input.js should already be locked.

                  // Explicitly Loop:
                  voiceService.listen(
                    (text) => {
                      // onPartial: Update UI
                      const input = document.querySelector(
                        'textarea[name="message"]',
                      );
                      if (input) {
                        input.value = text;
                        input.dispatchEvent(new Event("input"));
                      }
                    },
                    (text) => {
                      // onFinal: Auto-Send
                      const input = document.querySelector(
                        'textarea[name="message"]',
                      );
                      if (input) {
                        input.value = text;
                        input.dispatchEvent(new Event("input"));

                        // Auto-Send Logic
                        if (text && text.trim().length > 0) {
                          import("../../../gamemaster/index.js").then(
                            ({ GameMaster }) => {
                              GameMaster.send(text);
                              input.value = "";
                            },
                          );
                        }
                      }
                    },
                    () => {
                      // onEnd: No action needed
                    },
                  );
                }
              },
            );
          }
        }
      } catch (err) {
        console.warn("[Orchestrator] Voice fetch failed:", err);
      }
    } else {
      // Fallback for non-character agents (e.g. Narrator)
      voiceService.speak(e.detail?.text || "");
    }

    finalizeTurn("text", e.detail);
  });

  events.addEventListener(EVENTS.MESSAGE_RECEIVED, (e) => {
    if (e.detail?.type === "IMAGE") finalizeTurn("image");
  });

  // --- STATE-DRIVEN UI MANAGEMENT ---
  events.addEventListener(EVENTS.STATE_CHANGED, (e) => {
    const { patch } = e.detail;

    // 1. Mode Management (Lobby vs Game)
    if (patch.mode) {
      document.body.classList.remove("storyboard", "storymode");
      document.body.classList.add(patch.mode);
      log(`[Orchestrator] Mode switched to: ${patch.mode}`);
    }

    // 2. Developer Mode
    if (patch.settings && patch.settings.developerMode !== undefined) {
      document.body.classList.toggle(
        "mode-developer",
        patch.settings.developerMode,
      );
    }
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

    const { GameMaster } = await import("../../../gamemaster/index.js");

    try {
      await GameMaster.triggerEpilogue();
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    }
  }
};

window.addEventListener("app-error", (e) => {
  showErrorModal(e.detail?.type || "generic", e.detail?.error?.message);
});

export const initViews = async (deps = {}) => {
  if (deps.onSelectionChanged)
    SelectionManager.setOnSelectionChanged(deps.onSelectionChanged);

  const setOnSelectionChanged = (handler) => {
    SelectionManager.setOnSelectionChanged(handler);
  };

  // 1. Wire Events
  initEventBinds();

  // 2. Initialize Components
  initDrawer();
  initChatInput();

  // Initialize Selection Triggers
  SelectionManager.initTriggers();

  setMobileDrawerCallbacks({
    onUpdateSelection: SelectionManager.update,
  });

  setProfileCallbacks({
    onUpdateSelection: SelectionManager.update,
  });

  // 3. Initialize Domain Managers
  initStoryboardStage(Orchestrator);
  StoryOptionsController.init();

  // 4. Remove Boot Skeleton
  const skeleton = document.querySelector("#boot-skeleton");
  if (skeleton) {
    log("[Orchestrator] Hiding Boot Skeleton...");
    skeleton.classList.add("fade-out");
    setTimeout(() => {
      skeleton.style.display = "none";
      skeleton.remove();
    }, 600);
  }

  // 5. Initialize Router (handles initial route and hash events)
  Router.init();

  // 6. Global UI Prep
  document.querySelectorAll("button[data-chin]").forEach((btn) => {
    btn.classList.add("entity-drawer-button");
  });
  document.querySelectorAll('form[role="search"]').forEach((form) => {
    form.addEventListener("submit", (e) => e.preventDefault());
  });

  return {
    setOnSelectionChanged,
    updateStoryboardSelection: SelectionManager.update,
  };
};

export {
  setStorymodeEntities,
  updatePortraits,
  setSendLock,
  showAlert,
  showConfirm,
  showPrompt,
  showErrorModal,
};
