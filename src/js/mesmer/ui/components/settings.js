import { db } from "../../../scholar/db.js";
import { stories } from "../../../scholar/repository.js";
import { store as state, applyPatch } from "../../../gamemaster/index.js";
import { GameMaster } from "../../../gamemaster/index.js";
import { showAlert, handleConcludeStory } from "../core/orchestrator.js";
import { getPictureHTML } from "../core/utils.js";
import { ThemeService } from "../core/theme.js";
import { log, error, sanitizeHtml } from "../../../gamemaster/utils.js";

import { voiceService } from "../../audio/voice.js";
import { audioService } from "../../audio/service.js";

export const StoryOptionsController = {
  async init() {
    const modal = document.querySelector("#settings");
    if (!modal) return;

    // Inject Template Content if empty
    const contentContainer = modal.querySelector(".modal-content");
    if (
      contentContainer &&
      !contentContainer.querySelector(".settings-controls")
    ) {
      const tpl = document.getElementById("tpl-settings-modal");
      if (tpl) {
        contentContainer.innerHTML = ""; // Clear existing
        contentContainer.appendChild(tpl.content.cloneNode(true));
      }
    }

    // [NEW] Global Audio & Voice Settings Injection
    const settingsBody = contentContainer.querySelector(".settings-controls");
    // Check if our sections already exist to prevent duplicate injection
    if (
      settingsBody &&
      !settingsBody.querySelector(".settings-section-audio")
    ) {
      const audioSection = document.createElement("div");
      // Use 'settings-section' class for consistent styling if needed,
      // but strictly 'settings-section-audio' for identification
      audioSection.className = "settings-section settings-section-audio";
      audioSection.innerHTML = `
        <h3>Audio</h3>
        <div class="settings-panel settings-panel-grid">
            <label class="settings-label" for="setting-call-mode">
                <input type="checkbox" id="setting-call-mode" role="switch">
                Call Mode
            </label>
            <label class="settings-label" for="setting-notifications">
                <input type="checkbox" id="setting-notifications" role="switch">
                Notifications
            </label>
        </div>
        <hr>
      `;
      // Inject at the very top (prepend)
      settingsBody.prepend(audioSection);

      // 1. Call Mode Wiring
      const callToggle = audioSection.querySelector("#setting-call-mode");
      if (callToggle) {
        callToggle.checked = voiceService.callMode;
        callToggle.addEventListener("change", async (e) => {
          try {
            const isEnabled = e.target.checked;
            if (isEnabled) await voiceService.init();
            voiceService.setCallMode(isEnabled);
          } catch (err) {
            console.error("Call Mode Toggle Error:", err);
            e.target.checked = !e.target.checked; // Revert
          }
        });
      }

      // 2. Notifications Wiring
      const notifToggle = audioSection.querySelector("#setting-notifications");
      if (notifToggle) {
        notifToggle.checked = audioService.notificationsEnabled;
        notifToggle.addEventListener("change", (e) => {
          audioService.setNotifications(e.target.checked);
        });
      }
    }

    // ⚡ BOLT OPTIMIZATION: Event Delegation
    const libraryGrid = modal.querySelector("#library-grid");
    if (libraryGrid) {
      libraryGrid.addEventListener("click", async (e) => {
        const card = e.target.closest(".story-drawer-card");
        if (!card) return;
        e.preventDefault();

        const storyId = card.dataset.storyId;
        const storyState = card.dataset.storyState;
        const storyTitle = card.dataset.storyTitle;

        if (!storyId || !storyTitle) return;

        let confirmed = storyState === "concluded";
        if (!confirmed) {
          const { showConfirm } = await import("../core/orchestrator.js");
          confirmed = await showConfirm(
            "Load Story?",
            'Load "' + storyTitle + '"?',
          );
        }

        if (confirmed) {
          await StoryOptionsController.loadStory(storyId);
          StoryOptionsController.close();
        }
      });
    }

    const btn = document.querySelector("#btn-options");
    const resetBtn = modal.querySelector("#btn-reset-story");
    const storyInstructionsInput = modal.querySelector(
      "#setting-story-instructions",
    );

    const concludeBtn = modal.querySelector("#btn-conclude-story");
    const chatSettingsBtn = document.querySelector("#btn-settings-placeholder");

    // Open Options (Storyboard)
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        StoryOptionsController.open();
      });
    }

    // Open Options (Chat Screen)
    if (chatSettingsBtn) {
      chatSettingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        StoryOptionsController.open();
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) StoryOptionsController.close();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        StoryOptionsController.close();
      }
    });

    // Reset Data Action
    resetBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (
        await import("../core/orchestrator.js").then((m) =>
          m.showConfirm(
            "Reset All Data?",
            "Are you sure you want to reset ALL data? This will clear your current story and all settings.",
          ),
        )
      ) {
        await db.delete();
        await db.open();

        applyPatch({
          mode: "storyboard",
          story: { activeId: null, byId: {} },
          storyTitle: "My Story",
        });

        window.location.href = window.location.pathname;
      }
    });

    // Conclude Story Action
    if (concludeBtn) {
      concludeBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (state.story.activeId) {
          StoryOptionsController.close();
          await handleConcludeStory();
        }
      });
    }

    // 3. Render Library
    this.renderStories();

    // 4. Update Developer Mode Toggle
    if (state.settings.developerMode) {
      document.body.classList.add("mode-developer");
    }

    const devToggle = document.getElementById("setting-developer-mode");
    if (devToggle) {
      devToggle.checked = state.settings.developerMode;
      devToggle.onchange = (e) => {
        const isChecked = e.target.checked;
        log("[Settings] Developer Mode Toggled:", isChecked);
        applyPatch({ settings: { developerMode: isChecked } });

        if (isChecked) {
          document.body.classList.add("mode-developer");
        } else {
          document.body.classList.remove("mode-developer");
        }
      };
    } else {
      error(
        "[Settings] CRITICAL: Developer Toggle #setting-developer-mode not found!",
      );
    }

    // Visuals Wiring
    const btnVisualDraft = modal.querySelector("#btn-generate-visual-draft");
    if (btnVisualDraft) {
      btnVisualDraft.addEventListener("click", async (e) => {
        e.preventDefault();
        const inputField = document.querySelector(
          "#story-form [name='message']",
        );
        const draft = inputField ? inputField.value : "";

        if (!draft || !draft.trim()) {
          showAlert(
            "Visual Generation",
            "Please type a description in the chat box first!",
          );
          return;
        }

        StoryOptionsController.close();
        await GameMaster.generateVisualFromDraft(draft);
      });
    }

    // Request Photo
    const btnRequestPhoto = modal.querySelector("#btn-request-photo");
    if (btnRequestPhoto) {
      btnRequestPhoto.addEventListener("click", async (e) => {
        e.preventDefault();
        const story = state.story.byId[state.story.activeId];

        if (!story) {
          showAlert("Feature Unavailable", `No active story found.`);
          return;
        }

        StoryOptionsController.close();
        if (typeof GameMaster.requestVisual === "function") {
          await GameMaster.requestVisual();
        } else {
          error("GameMaster.requestVisual is not implemented.");
        }
      });
    }

    // Story Instructions
    if (storyInstructionsInput) {
      const s = await db.settings.get("app-settings");
      if (s && s.storyPrologueInstructions)
        storyInstructionsInput.value = s.storyPrologueInstructions;

      storyInstructionsInput.oninput = (e) => {
        const val = e.target.value;
        // Update State
        const newSettings = { ...state.settings };
        newSettings.storyPrologueInstructions = val;
        applyPatch({ settings: { storyPrologueInstructions: val } });

        // Update DB
        (async () => {
          const s = await db.settings.get("app-settings");
          const dbSettings = s || { id: "app-settings" };
          dbSettings.storyPrologueInstructions = val;
          await db.settings.put(dbSettings);
        })();
      };
    }
  },

  open() {
    const modal = document.querySelector("#settings");
    if (!modal) return;

    const developerModeToggle = modal.querySelector("#setting-developer-mode");
    if (developerModeToggle) {
      developerModeToggle.checked = !!state.settings.developerMode;
    }

    const storyInstructionsInput = modal.querySelector(
      "#setting-story-instructions",
    );
    if (storyInstructionsInput) {
      storyInstructionsInput.value =
        state.settings.storyPrologueInstructions || "";
    }

    const hasActiveStory = !!state.story.activeId;
    let isConcluded = false;
    if (hasActiveStory && state.story.byId[state.story.activeId]?.isConcluded) {
      isConcluded = true;
    }

    const lobbySection = modal.querySelector(".settings-section-lobby"); // Story Setup

    // Split sections for Story Mode
    const visualsSection = modal.querySelector(".settings-section-visuals");
    const sessionSection = modal.querySelector(".settings-section-session");

    const librarySection = modal.querySelector(".settings-section-library");
    const advancedSection = modal.querySelector(".settings-section-advanced");

    // VISIBILITY STATE MACHINE
    // ----------------------------------------------------------------
    // STATE A: LOBBY (!hasActiveStory)
    // - Audio
    // - Lobby Setup (Visible)
    // - Library (Visible)
    // - Advanced (Visible)
    // - Visuals (Hidden)
    // - Session (Hidden)

    // STATE B: STORY (hasActiveStory)
    // - Audio
    // - Visuals (Visible)
    // - Library (Visible - placed between)
    // - Session (Visible)
    // - Advanced (Visible)
    // - Lobby Setup (Hidden)

    if (lobbySection) lobbySection.hidden = hasActiveStory;

    // Game Controls
    if (visualsSection) visualsSection.hidden = !hasActiveStory || isConcluded;
    if (sessionSection) sessionSection.hidden = !hasActiveStory || isConcluded;

    if (librarySection) librarySection.hidden = false;
    if (advancedSection) advancedSection.hidden = false;
    if (librarySection) librarySection.hidden = false;

    const epilogueBtn = modal.querySelector("#btn-trigger-epilogue");
    if (epilogueBtn) {
      epilogueBtn.disabled = !hasActiveStory;
      epilogueBtn.onclick = async () => {
        // Close settings, then trigger
        const settingsModal = document.querySelector("#settings");
        if (settingsModal) {
          settingsModal.classList.remove("is-open");
          settingsModal.setAttribute("hidden", "");
        }

        // TRIGGER
        const { Orchestrator } = await import("../core/orchestrator.js");
        await Orchestrator.endStory();
      };
    }

    modal.removeAttribute("hidden");
    modal.classList.add("is-open");

    if (!hasActiveStory) {
      StoryOptionsController.renderStories();
    }
  },

  close() {
    const modal = document.querySelector("#settings");
    if (modal) {
      modal.classList.remove("is-open");
      setTimeout(() => {
        if (!modal.classList.contains("is-open")) {
          modal.setAttribute("hidden", "");
        }
      }, 300);
    }
  },

  async renderStories() {
    const grid = document.querySelector("#library-grid");
    if (!grid) return;

    grid.classList.add("drawer-grid");

    const tplLoading = document.getElementById("tpl-loading-library");
    if (tplLoading) {
      grid.innerHTML = "";
      grid.appendChild(tplLoading.content.cloneNode(true));
    } else {
      error('Template "tpl-loading-library" not found.');
      grid.innerHTML =
        '<div class="drawer-empty" aria-busy="true"><p class="muted">Loading library...</p></div>';
    }

    try {
      const storyList = await stories.list();

      if (storyList.length === 0) {
        // [FIX] Hide library section if empty
        const librarySection = document.querySelector(
          ".settings-section-library",
        );
        if (librarySection) librarySection.hidden = true;

        // Clear grid
        grid.innerHTML = "";
        return;
      }

      // Ensure visible if stories exist
      const librarySection = document.querySelector(
        ".settings-section-library",
      );
      if (librarySection) librarySection.hidden = false;

      grid.innerHTML = "";

      grid.innerHTML = "";

      // [OPTIMIZATION] Library import removed (no side effects)
      // TooltipService and ThemeService are now static imports

      // TooltipService.init();

      storyList.forEach((story) => {
        const card = document.createElement("button");
        card.className = "drawer-card story-drawer-card";
        card.type = "button";
        card.setAttribute("data-tooltip", story.title);

        card.dataset.storyId = story.id;
        card.dataset.storyState = story.state;
        card.dataset.storyTitle = story.title;

        if (story.signatureColor) {
          ThemeService.apply(card, story.signatureColor);
        }

        const dimEntity = {
          name: story.fractalName,
          type: "fractal",
          profilePictureUrl: story.fractalAvatar,
          signatureColor: story.signatureColor,
        };

        const pic = getPictureHTML(dimEntity, { cover: true });
        card.appendChild(pic);

        const labelContainer = document.createElement("div");
        labelContainer.className = "drawer-card-label";
        labelContainer.style.height = "auto";
        labelContainer.style.textAlign = "left";
        labelContainer.style.padding = "0.75rem";
        labelContainer.style.display = "flex";
        labelContainer.style.flexDirection = "column";
        labelContainer.style.gap = "0.25rem";

        const isConcluded = story.state === "concluded";
        const statusHtml = isConcluded
          ? `<span style="font-size:0.6em; text-transform:uppercase; opacity:0.7; letter-spacing:1px; color:var(--pico-muted-color);">Concluded</span>`
          : `<span style="font-size:0.6em; text-transform:uppercase; letter-spacing:1px; color:var(--signature-color);">Active</span>`;

        const dateStr = new Date(story.lastPlayed).toLocaleDateString(
          undefined,
          { month: "short", day: "numeric", year: "numeric" },
        );

        labelContainer.innerHTML = `
            <div style="font-weight:700; line-height:1.2; font-size:0.8rem; margin-bottom:0.25rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                ${sanitizeHtml(story.title)}
            </div>
            <div>
                ${statusHtml}
            </div>
            <div style="font-size:0.6em; opacity:0.5;">
                ${dateStr}
            </div>
        `;

        card.appendChild(labelContainer);
        grid.appendChild(card);
      });
    } catch (err) {
      error("Failed to load library:", err);
      grid.innerHTML = "<p><small>Error loading library.</small></p>";
    }
  },

  async loadStory(storyId) {
    try {
      await GameMaster.load(storyId);
      window.location.hash = "story";
      StoryOptionsController.close();
    } catch (err) {
      error("Failed to load story:", err);
      showAlert("Error", "Failed to load story. See console for details.");
    }
  },
};
