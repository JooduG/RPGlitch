import { db } from "../../core/db.js";
import { applyPatch, state } from "../../core/state.js";
import { TurnManager } from "../../engine/director.js";
import { entities } from "../../data/repo.js";
import { showAlert, handleConcludeStory } from "../orchestrator.js";
import { log, error, sanitizeHtml } from "../../core/utils.js";

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
        <h3>Audio & Accessibility</h3>
        <div class="settings-panel">
            <label class="settings-label" for="setting-call-mode">
                <input type="checkbox" id="setting-call-mode" role="switch">
                Hands-Free Call Mode
            </label>
            <label class="settings-label" for="setting-notifications">
                <input type="checkbox" id="setting-notifications" role="switch">
                Notification Sounds
            </label>
        </div>
        <hr>
      `;
      // Inject at the very top (prepend)
      settingsBody.prepend(audioSection);

      // Bind Listeners (Dynamic Imports to avoid circular deps)
      Promise.all([
        import("../../services/voice-service.js"),
        import("../../services/audio-service.js"),
      ]).then(([{ voiceService }, { audioService }]) => {
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
        const notifToggle = audioSection.querySelector(
          "#setting-notifications",
        );
        if (notifToggle) {
          notifToggle.checked = audioService.notificationsEnabled;
          notifToggle.addEventListener("change", (e) => {
            audioService.setNotifications(e.target.checked);
          });
        }
      });
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
          const { showConfirm } = await import("../orchestrator.js");
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
    const closeBtn = modal.querySelector(".close");
    const resetBtn = modal.querySelector("#btn-reset-story");
    const customJsInput = modal.querySelector("#setting-custom-js");
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

    // Close Options
    closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      StoryOptionsController.close();
    });

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
        await import("../orchestrator.js").then((m) =>
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
        await TurnManager.generateVisualFromDraft(draft);
      });
    }

    // Request Photo
    const btnRequestPhoto = modal.querySelector("#btn-request-photo");
    if (btnRequestPhoto) {
      btnRequestPhoto.addEventListener("click", async (e) => {
        e.preventDefault();
        const story = state.story.byId[state.story.activeId];

        const fractal = story
          ? await entities.get("fractal", story.fractalId)
          : null;
        const isMessenger =
          fractal &&
          (fractal.name === "Messenger" ||
            (fractal.simulation &&
              fractal.simulation.directorMode === "TEXT_PROTOCOL"));

        if (!story || !isMessenger) {
          showAlert(
            "Feature Unavailable",
            `Feature unavailable. Exclusive to Messenger Mode.`,
          );
          return;
        }

        StoryOptionsController.close();
        if (typeof TurnManager.requestVisual === "function") {
          await TurnManager.requestVisual();
        } else {
          error("TurnManager.requestVisual is not implemented.");
        }
      });
    }

    // Custom JS Wiring
    if (customJsInput) {
      const s = await db.settings.get("app-settings");
      if (s && s.customJs) customJsInput.value = s.customJs;

      customJsInput.addEventListener("input", (e) => {
        const val = e.target.value;
        applyPatch({ settings: { customJs: val } });
        (async () => {
          const s = await db.settings.get("app-settings");
          const newSettings = s || { id: "app-settings" };
          newSettings.customJs = val;
          await db.settings.put(newSettings);
        })();
      });
    }
    // Story Instructions
    if (storyInstructionsInput) {
      const s = await db.settings.get("app-settings");
      if (s && s.storyOpeningInstructions)
        storyInstructionsInput.value = s.storyOpeningInstructions;

      storyInstructionsInput.addEventListener("input", (e) => {
        const val = e.target.value;
        applyPatch({ settings: { storyOpeningInstructions: val } });
        (async () => {
          const s = await db.settings.get("app-settings");
          const newSettings = s || { id: "app-settings" };
          newSettings.storyOpeningInstructions = val;
          await db.settings.put(newSettings);
        })();
      });
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
        state.settings.storyOpeningInstructions || "";
    }

    const hasActiveStory = !!state.story.activeId;
    let isConcluded = false;
    if (hasActiveStory && state.story.byId[state.story.activeId]?.isConcluded) {
      isConcluded = true;
    }

    const lobbySection = modal.querySelector(".settings-section-lobby");
    const gameSection = modal.querySelector(".settings-section-storymode");
    const librarySection = modal.querySelector(".settings-section-library");

    if (lobbySection) lobbySection.hidden = hasActiveStory;
    if (gameSection) gameSection.hidden = !hasActiveStory || isConcluded;
    if (librarySection) librarySection.hidden = false;

    const concludeBtn = modal.querySelector("#btn-conclude-story");
    if (concludeBtn) {
      concludeBtn.disabled = !hasActiveStory;
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
      const stories = await import("../../data/repo.js").then((m) =>
        m.stories.list(),
      );

      if (stories.length === 0) {
        const tpl = document.getElementById("tpl-empty-library");
        if (tpl) {
          grid.innerHTML = "";
          grid.appendChild(tpl.content.cloneNode(true));
        } else {
          grid.innerHTML =
            "<p style='grid-column: 1 / -1; text-align: center;'><small>Your library is empty.</small></p>";
        }
        return;
      }

      grid.innerHTML = "";

      const { getPictureHTML, TooltipService } =
        await import("../services/ui-utils.js").then(async (m) => {
          await import("../../data/models.js");
          return { ...m };
        });

      TooltipService.init();

      const { ThemeService } = await import("../services/theme.js");

      stories.forEach((story) => {
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
      await TurnManager.load(storyId);
      window.location.hash = "story";
      StoryOptionsController.close();
    } catch (err) {
      error("Failed to load story:", err);
      showAlert("Error", "Failed to load story. See console for details.");
    }
  },
};
