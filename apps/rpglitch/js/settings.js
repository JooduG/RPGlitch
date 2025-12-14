import { db } from "./core-db.js";
import { applyPatch, state } from "./app-state.js";
import { router } from "./ui-views.js";
import { StoryController } from "./manager-turns.js";
import { entities } from "./entity-crud.js";

export const StoryOptionsController = {
  init() {
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
    const directorModeToggle = modal.querySelector("#setting-director-mode");
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

    // Reset Data Action
    resetBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (
        confirm(
          "Are you sure you want to reset ALL data? This will clear your current story and all settings.",
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
          await StoryController.concludeStory();
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

        const enhanced = await StoryController.enhanceUserDraft(draft);
        if (enhanced && inputField) {
          inputField.value = enhanced;
          inputField.focus();
        }
      });
    }

    // Director Mode Wiring
    if (directorModeToggle) {
      directorModeToggle.checked = !!state.settings.directorMode;
      directorModeToggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        applyPatch({ settings: { directorMode: isChecked } });
        if (state.story.activeId) {
          router.handleRoute();
        }
      });
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
        await StoryController.generateVisualFromDraft(draft);
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
          ? await entities.get("fractal", story.worldId)
          : null;
        const isMessenger =
          fractal &&
          (fractal.name === "Messenger" ||
            (fractal.simulation &&
              fractal.simulation.directorMode === "TEXT_PROTOCOL"));

        if (!story || !isMessenger) {
          alert(
            `Feature unavailable. Exclusive to Messenger Mode. (Current ID: ${story?.worldId})`,
          );
          return;
        }

        StoryOptionsController.close();
        // We will implement requestVisual on StoryController next
        if (typeof StoryController.requestVisual === "function") {
          await StoryController.requestVisual();
        } else {
          console.error("StoryController.requestVisual is not implemented.");
        }
      });
    }

    // Custom JS Wiring
    if (customJsInput) {
      db.settings.get("app-settings").then((s) => {
        if (s && s.customJs) customJsInput.value = s.customJs;
      });

      customJsInput.addEventListener("input", (e) => {
        const val = e.target.value;
        applyPatch({ settings: { customJs: val } });
        db.settings.get("app-settings").then((s) => {
          const newSettings = s || { id: "app-settings" };
          newSettings.customJs = val;
          db.settings.put(newSettings);
        });
      });
    }
    // Story Instructions Wiring
    if (storyInstructionsInput) {
      db.settings.get("app-settings").then((s) => {
        if (s && s.storyOpeningInstructions)
          storyInstructionsInput.value = s.storyOpeningInstructions;
      });

      storyInstructionsInput.addEventListener("input", (e) => {
        const val = e.target.value;
        applyPatch({ settings: { storyOpeningInstructions: val } });
        db.settings.get("app-settings").then((s) => {
          const newSettings = s || { id: "app-settings" };
          newSettings.storyOpeningInstructions = val;
          db.settings.put(newSettings);
        });
      });
    }
  },

  open() {
    const modal = document.querySelector("#settings");
    if (!modal) return;

    const directorModeToggle = modal.querySelector("#setting-director-mode");
    if (directorModeToggle) {
      directorModeToggle.checked = !!state.settings.directorMode;
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
    const lobbySection = modal.querySelector(".settings-section-lobby");
    const gameSection = modal.querySelector(".settings-section-game");

    if (lobbySection) lobbySection.hidden = hasActiveStory;
    if (gameSection) gameSection.hidden = !hasActiveStory;

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
    const listContainer = document.querySelector("#saved-stories-list");
    if (!listContainer) return;

    listContainer.innerHTML = "<p><small>Loading...</small></p>";

    try {
      const stories = await db.stories.orderBy("updatedAt").reverse().toArray();

      if (stories.length === 0) {
        listContainer.innerHTML =
          "<p><small>No saved stories found.</small></p>";
        return;
      }

      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";
      ul.style.margin = "0";

      stories.forEach((story) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "0.5rem";
        li.style.padding = "0.5rem";
        li.style.border = "1px solid var(--muted-border-color)";
        li.style.borderRadius = "var(--border-radius)";

        const titleSpan = document.createElement("span");
        titleSpan.textContent = story.title || "Untitled Story";
        titleSpan.style.fontWeight = "bold";
        if (story.isConcluded) {
          const badge = document.createElement("small");
          badge.textContent = " (Concluded)";
          badge.style.color = "var(--muted-color)";
          badge.style.fontWeight = "normal";
          titleSpan.appendChild(badge);
        }

        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.gap = "0.5rem";

        const loadBtn = document.createElement("button");
        loadBtn.textContent = story.isConcluded ? "View" : "Load";
        loadBtn.classList.add("outline", "secondary");
        loadBtn.style.padding = "0.25rem 0.5rem";
        loadBtn.style.fontSize = "0.8rem";
        loadBtn.onclick = async (e) => {
          e.preventDefault();
          if (confirm(`Load story "${story.title}"?`)) {
            await StoryOptionsController.loadStory(story.id);
          }
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("outline", "contrast");
        deleteBtn.style.padding = "0.25rem 0.5rem";
        deleteBtn.style.fontSize = "0.8rem";
        deleteBtn.onclick = async (e) => {
          e.preventDefault();
          if (
            confirm(`Delete story "${story.title}"? This cannot be undone.`)
          ) {
            await db.stories.delete(story.id);
            await db.messages.where("storyId").equals(story.id).delete();
            StoryOptionsController.renderStories();
          }
        };

        actionsDiv.appendChild(loadBtn);
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(titleSpan);
        li.appendChild(actionsDiv);
        ul.appendChild(li);
      });

      listContainer.innerHTML = "";
      listContainer.appendChild(ul);
    } catch (err) {
      console.error("Failed to load stories:", err);
      listContainer.innerHTML = "<p><small>Error loading stories.</small></p>";
    }
  },

  async loadStory(storyId) {
    try {
      const story = await db.stories.get(storyId);
      if (!story) {
        alert("Story not found!");
        return;
      }

      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.title,
        mode: "gameplay",
      });

      StoryOptionsController.close();
      router.handleRoute();
    } catch (err) {
      console.error("Failed to load story:", err);
      alert("Failed to load story. See console for details.");
    }
  },
};
