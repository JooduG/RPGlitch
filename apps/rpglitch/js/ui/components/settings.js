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
    if (contentContainer && !contentContainer.querySelector(".settings-body")) {
      const tpl = document.getElementById("tpl-settings-modal");
      if (tpl) {
        contentContainer.innerHTML = ""; // Clear existing
        contentContainer.appendChild(tpl.content.cloneNode(true));
      }
    }

    // ⚡ BOLT OPTIMIZATION: Event Delegation
    // Replaced multiple individual listeners with a single document-level delegate on the grid.
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

let confirmed = storyState === 'concluded';
if (!confirmed) {
  const { showConfirm } = await import('../orchestrator.js');
  confirmed = await showConfirm('Load Story?', 'Load "' + storyTitle + '"?');
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
    // Removed unused toggle var
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
        // If in game, prepare to switch back to storyboard

        await db.delete();
        await db.open(); // Re-open after delete

        // Reset state
        applyPatch({
          mode: "storyboard",
          story: { activeId: null, byId: {} },
          storyTitle: "My Story",
        });

        // Force clean reload (strip hash/query to ensure back to lobby)
        window.location.href = window.location.pathname;
      }
    });

    // Conclude Story Action
    if (concludeBtn) {
      concludeBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (state.story.activeId) {
          StoryOptionsController.close(); // Close immediately per user request involved interactions
          await handleConcludeStory();
        }
      });
    }

    // Ghostwriter Wiring
    const ghostBtn = modal.querySelector("#btn-ghostwriter");
    if (ghostBtn) {
      ghostBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const inputField = document.querySelector(
          "#story-form [name='message']",
        );
        const draft = inputField ? inputField.value : "";

        if (!draft || !draft.trim()) {
          showAlert(
            "Ghostwriter",
            "Please type a rough draft in the chat box first!",
          );
          return;
        }

        StoryOptionsController.close();

        const enhanced = await TurnManager.enhanceUserDraft(draft);
        if (enhanced && inputField) {
          inputField.value = enhanced;
          inputField.focus();
        }
      });
    }

    // 3. Render Library (Always, for both modes)
    this.renderStories();

    // 4. Update Developer Mode Toggle
    // [FIX] Force Sync on Init (in case body class was lost)
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

        // Immediate UI Update
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

    // [NEW] Request Photo Update Wiring
    const btnRequestPhoto = modal.querySelector("#btn-request-photo");
    if (btnRequestPhoto) {
      btnRequestPhoto.addEventListener("click", async (e) => {
        e.preventDefault();
        const story = state.story.byId[state.story.activeId];

        // [FIX] Fetch real entity to check type/name (bypassing UUID mismatch)
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
            `Feature unavailable. Exclusive to Messenger Mode. (Current ID: ${story?.fractalId})`,
          );
          return;
        }

        StoryOptionsController.close();
        // We will implement requestVisual on TurnManager next
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
        // Use async IIFE for event handler logic if needed, but db.put is fire-and-forget or we can just async the handler
        (async () => {
          const s = await db.settings.get("app-settings");
          const newSettings = s || { id: "app-settings" };
          newSettings.customJs = val;
          await db.settings.put(newSettings);
        })();
      });
    }
    // Story Instructions Wiring
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

    // State-Based Visibility Logic
    const hasActiveStory = !!state.story.activeId;

    // Check if the current active story is actually concluded (Read-Only Mode)
    let isConcluded = false;
    if (hasActiveStory && state.story.byId[state.story.activeId]?.isConcluded) {
      isConcluded = true;
    }

    const lobbySection = modal.querySelector(".settings-section-lobby");
    const gameSection = modal.querySelector(".settings-section-storymode");
    const librarySection = modal.querySelector(".settings-section-library");

    // 1. STORY CONFIG (Lobby) -> Only if NO Active Story
    if (lobbySection) lobbySection.hidden = hasActiveStory;

    // 2. GAME ACTIONS -> Only if Active Start AND NOT Concluded
    if (gameSection) gameSection.hidden = !hasActiveStory || isConcluded;

    // 3. LIBRARY -> Always Visible
    if (librarySection) librarySection.hidden = false;

    // Update Conclude Button State (Redundant check but keeps safety)
    const concludeBtn = modal.querySelector("#btn-conclude-story");
    if (concludeBtn) {
      concludeBtn.disabled = !hasActiveStory;
    }

    modal.removeAttribute("hidden");
    modal.classList.add("is-open");

    // Only render stories if in lobby mode (Saved Stories is in lobby section)
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

    // 🎨 PALETTE UX: Refined Loading State
    // Ensure grid has drawer styling first
    grid.classList.add("drawer-grid");

    // Add pulsing skeleton loader
    grid.innerHTML = `
      <div class="drawer-empty" aria-busy="true">
        <p class="muted">Loading library...</p>
      </div>
    `;

    try {
      const stories = await import("../../data/repo.js").then((m) =>
        m.stories.list(),
      );

      if (stories.length === 0) {
        // [🎨 PALETTE UX: Refined Empty State]
        const tpl = document.getElementById("tpl-empty-library");
        if (tpl) {
          grid.innerHTML = "";
          grid.appendChild(tpl.content.cloneNode(true));
        } else {
          // Fallback if template is missing
          grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'><small>Your library is empty.</small></p>";
        }
        return;
      }

      grid.innerHTML = ""; // Clear loader

      const { getPictureHTML, TooltipService } =
        await import("../services/ui-utils.js").then(async (m) => {
          // We might need to handle circular deps or just dynamic import.
          // ui-utils doesn't export getVisualState usually?
          // Wait, desktop.js imported getVisualState from models.js.
          // Let's import that too.
          await import("../../data/models.js");
          return { ...m };
        });

      // Initialize global tooltips
      TooltipService.init();

      // We need ThemeService for applying color? Or just manual?
      // Drawer uses ThemeService.apply(card, color). Let's import it.
      const { ThemeService } = await import("../services/theme.js");

      stories.forEach((story) => {
        // --- Create Drawer Card ---
        const card = document.createElement("button");
        card.className = "drawer-card story-drawer-card";
        card.type = "button"; // accessible
        card.setAttribute("data-tooltip", story.title); // [Tooltip]

        // ⚡ BOLT OPTIMIZATION: Data Attributes
        card.dataset.storyId = story.id;
        card.dataset.storyState = story.state;
        card.dataset.storyTitle = story.title;

        // 1. Signature Color
        if (story.signatureColor) {
          ThemeService.apply(card, story.signatureColor);
        }

        // 2. Picture (Fractal)
        // We need a mock entity structure for getPictureHTML
        const dimEntity = {
          name: story.fractalName,
          type: "fractal",
          profilePictureUrl: story.fractalAvatar,
          signatureColor: story.signatureColor,
        };

        const pic = getPictureHTML(dimEntity, { cover: true });
        card.appendChild(pic);

        // 3. Label (Title + Tags)
        // Drawer cards usually have a bottom label.
        // We want: Title (colored), Status, Date.
        // The default .drawer-card-label is just text. We might need Custom HTML inside.

        const labelContainer = document.createElement("div");
        labelContainer.className = "drawer-card-label";
        // Override styles for this specific use case if needed, or use inline for now.
        labelContainer.style.height = "auto";
        labelContainer.style.textAlign = "left";
        labelContainer.style.padding = "0.75rem";
        labelContainer.style.display = "flex";
        labelContainer.style.flexDirection = "column";
        labelContainer.style.gap = "0.25rem";

        // Status Badge
        const isConcluded = story.state === "concluded";
        const statusHtml = isConcluded
          ? `<span style="font-size:0.6em; text-transform:uppercase; opacity:0.7; letter-spacing:1px; color:var(--pico-muted-color);">Concluded</span>`
          : `<span style="font-size:0.6em; text-transform:uppercase; letter-spacing:1px; color:var(--signature-color);">Active</span>`;

        // Date
        const dateStr = new Date(story.lastPlayed).toLocaleDateString(
          undefined,
          { month: "short", day: "numeric", year: "numeric" },
        );

        // Title (Signature Color)
        // We use var(--signature-color) which is set by ThemeService on the card.
        // .drawer-card-label default sets color to var(--signature-color)!

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

        // Click Action REMOVED in favor of delegation
        // card.onclick = ...

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
