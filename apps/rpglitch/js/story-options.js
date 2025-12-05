import { db } from "./core-db.js";
import { applyPatch, state } from "./app-state.js";
import { router } from "./ui-views.js";

export const StoryOptionsController = {
  init() {
    const modal = document.querySelector("#story-options");
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
    const newStoryBtn = modal.querySelector("#btn-new-story");
    const resetBtn = modal.querySelector("#btn-reset-story");
    const directorModeToggle = modal.querySelector("#setting-director-mode");
    const customJsInput = modal.querySelector("#setting-custom-js");
    const storyInstructionsInput = modal.querySelector("#setting-story-instructions");

    if (!btn) return;

    // Open Options
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      StoryOptionsController.open();
    });

    // Close Options
    closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      StoryOptionsController.close();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) StoryOptionsController.close();
    });

    // New Story Action
    newStoryBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      StoryOptionsController.startNew();
    });

    // Reset Data Action
    resetBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        await db.delete();
        window.location.reload();
      }
    });

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

    // Custom JS Wiring
    if (customJsInput) {
      // Load saved custom JS
      db.settings.get("app-settings").then(s => {
        if (s && s.customJs) customJsInput.value = s.customJs;
      });

      customJsInput.addEventListener("input", (e) => {
        const val = e.target.value;
        applyPatch({ settings: { customJs: val } });
        // Debounced save to DB would be ideal here, but simple patch is fine for now
        db.settings.get("app-settings").then(s => {
          const newSettings = s || { id: "app-settings" };
          newSettings.customJs = val;
          db.settings.put(newSettings);
        });
      });
    }

    // Story Instructions Wiring
    if (storyInstructionsInput) {
      db.settings.get("app-settings").then(s => {
        if (s && s.storyOpeningInstructions) storyInstructionsInput.value = s.storyOpeningInstructions;
      });

      storyInstructionsInput.addEventListener("input", (e) => {
        const val = e.target.value;
        applyPatch({ settings: { storyOpeningInstructions: val } });
        db.settings.get("app-settings").then(s => {
          const newSettings = s || { id: "app-settings" };
          newSettings.storyOpeningInstructions = val;
          db.settings.put(newSettings);
        });
      });
    }
  },

  open() {
    const modal = document.querySelector("#story-options");
    if (!modal) return;

    const directorModeToggle = modal.querySelector("#setting-director-mode");
    if (directorModeToggle) {
      directorModeToggle.checked = !!state.settings.directorMode;
    }

    const storyInstructionsInput = modal.querySelector("#setting-story-instructions");
    if (storyInstructionsInput) {
      storyInstructionsInput.value = state.settings.storyOpeningInstructions || "";
    }

    modal.removeAttribute("hidden");
    // CRITICAL FIX: Add the class required by _layout-modal.scss
    modal.classList.add("is-open");

    StoryOptionsController.renderStories();
  },

  close() {
    const modal = document.querySelector("#story-options");
    if (modal) {
      modal.classList.remove("is-open");
      // Wait for animation to finish before hiding
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
        listContainer.innerHTML = "<p><small>No saved stories found.</small></p>";
        return;
      }

      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";
      ul.style.margin = "0";

      stories.forEach(story => {
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

        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.gap = "0.5rem";

        const loadBtn = document.createElement("button");
        loadBtn.textContent = "Load";
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
          if (confirm(`Delete story "${story.title}"? This cannot be undone.`)) {
            await db.stories.delete(story.id);
            // Also delete messages
            await db.messages.where("storyId").equals(story.id).delete();
            StoryOptionsController.renderStories(); // Refresh list
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

      // Update state
      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.title,
        mode: "gameplay"
      });

      // Close modal
      StoryOptionsController.close();

      // Trigger router to load messages and UI
      router.handleRoute();

    } catch (err) {
      console.error("Failed to load story:", err);
      alert("Failed to load story. See console for details.");
    }
  },

  startNew() {
    document.body.classList.remove("mode-gameplay");
    document.body.classList.add("mode-storyboard");
    applyPatch({
      mode: "storyboard",
      story: { activeId: null, byId: {} },
      storyTitle: "My Story"
    });
    StoryOptionsController.close();
  }
};