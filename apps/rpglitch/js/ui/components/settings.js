import { db } from "../../core/db.js";
import { applyPatch, state } from "../../core/state.js";
import { TurnManager } from "../../engine/director.js";
import { entities } from "../../data/repo.js";

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

    const btn = document.querySelector("#btn-options");
    const closeBtn = modal.querySelector(".close");
    const resetBtn = modal.querySelector("#btn-reset-story");
    // Removed unused toggle var
    const customJsInput = modal.querySelector("#setting-custom-js");
    const storyInstructionsInput = modal.querySelector(
      "#setting-story-instructions",
    );

    const concludeBtn = modal.querySelector("#btn-conclude-story");

    // [FIX] Chat Screen Cog Button
    const chatSettingsBtn = document.querySelector("#btn-settings-placeholder");

    // Open Options (Storyboard)
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        StoryOptionsController.open();
      });
    }

    // [FIX] Open Options (Chat Screen)
    if (chatSettingsBtn) {
      // Remove the inline onclick from HTML in your head, or we overwrite it here
      chatSettingsBtn.onclick = (e) => {
        e.preventDefault();
        StoryOptionsController.open();
      };
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
          await TurnManager.concludeStory();
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
          alert("Please type a rough draft in the chat box first!");
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
    const devToggle = modal.querySelector("#setting-developer-mode");
    if (devToggle) {
      devToggle.checked = state.settings.developerMode;
      devToggle.onchange = (e) => {
        applyPatch({ settings: { developerMode: e.target.checked } });
      };
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
          alert("Please type a description in the chat box first!");
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
          alert(
            `Feature unavailable. Exclusive to Messenger Mode. (Current ID: ${story?.fractalId})`,
          );
          return;
        }

        StoryOptionsController.close();
        // We will implement requestVisual on TurnManager next
        if (typeof TurnManager.requestVisual === "function") {
          await TurnManager.requestVisual();
        } else {
          console.error("TurnManager.requestVisual is not implemented.");
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

    grid.innerHTML = "<p><small>Loading...</small></p>";

    try {
      // Use new Repo-level list (Enriched)
      const stories = await import("../../data/repo.js").then((m) =>
        m.stories.list(),
      );

      if (stories.length === 0) {
        grid.innerHTML =
          "<div class='empty-state' style='grid-column: 1 / -1; text-align: center; width: 100%; padding: 2rem; color: var(--muted-color);'><p>No stories found.</p></div>";
        return;
      }

      grid.innerHTML = ""; // Clear loader

      stories.forEach((story) => {
        // Create Card Element
        const card = document.createElement("article");
        card.className = "story-card";
        if (story.state === "concluded") card.classList.add("concluded");

        // Avatar Handling
        let avatarHtml = `<div class="story-avatar placeholder"></div>`;
        if (story.fractalAvatar) {
          avatarHtml = `<div class="story-avatar"><img src="${story.fractalAvatar}" loading="lazy" alt="World" /></div>`;
        }

        const dateStr = new Date(story.lastPlayed).toLocaleDateString();

        card.innerHTML = `
          <div class="story-card-media">
            ${avatarHtml}
            ${story.state === "concluded" ? '<span class="badge">Concluded</span>' : ""}
          </div>
          <div class="story-card-content">
            <h5>${story.title}</h5>
            <small>${story.fractalName}</small>
            <div class="meta">
              <span>${dateStr}</span>
            </div>
          </div>
        `;

        // Click Action
        card.onclick = async () => {
          if (story.state === "concluded") {
            // Just load it, skipping logic that assumes it's active
            await StoryOptionsController.loadStory(story.id);
            StoryOptionsController.close();
          } else {
            if (
              await import("../orchestrator.js").then((m) =>
                m.showConfirm("Load Story?", `Load "${story.title}"?`),
              )
            ) {
              await StoryOptionsController.loadStory(story.id);
              StoryOptionsController.close();
            }
          }
        };

        grid.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to load library:", err);
      grid.innerHTML = "<p><small>Error loading library.</small></p>";
    }
  },

  async loadStory(storyId) {
    try {
      await TurnManager.load(storyId);
      window.location.hash = "story";
      StoryOptionsController.close();
    } catch (err) {
      console.error("Failed to load story:", err);
      alert("Failed to load story. See console for details.");
    }
  },
};
