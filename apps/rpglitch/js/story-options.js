// apps/rpglitch/js/story-options.js
import { db } from "./core-db.js"; // Renamed import
import { StoryController } from "./manager-turns.js"; // Renamed import
import { applyPatch, state } from "./app-state.js"; // Renamed import
import { escapeHtml } from "./core-utils.js"; // Renamed import
import { router } from "./ui-views.js"; // Added import for re-rendering after toggle

export const StoryOptionsController = {
  init() {
    const modal = document.querySelector("#story-options");
    const btn = document.querySelector("#btn-options");
    const closeBtn = modal?.querySelector(".close-modal");
    const newStoryBtn = modal?.querySelector("#btn-new-story");
    const resetBtn = modal?.querySelector("#settings-reset");
    const directorModeToggle = modal?.querySelector("#director-mode-toggle"); // New element

    if (!modal || !btn) return;

    // Open Options
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      StoryOptionsController.open();
    });

    // Close Options
    closeBtn?.addEventListener("click", () => StoryOptionsController.close());
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

    // --- DIRECTOR MODE WIRING (NEW) ---
    if (directorModeToggle) {
      directorModeToggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;

        // 1. Update persistent and runtime state
        applyPatch({
          settings: {
            directorMode: isChecked
          }
        });

        // 2. Force a full re-render of the chat feed to show/hide thoughts immediately
        // This is crucial for the "Lobotomy Reversal" effect.
        if (state.story.activeId) {
          // If in a story, re-render the story screen (which calls StoryController.render)
          router.handleRoute();
        }
      });
    }
  },

  open() {
    const modal = document.querySelector("#story-options");
    if (!modal) return;

    // Check current state and sync checkbox (CRITICAL for persistency)
    const directorModeToggle = modal.querySelector("#director-mode-toggle");
    if (directorModeToggle) {
      directorModeToggle.checked = !!state.settings.directorMode;
    }

    modal.removeAttribute("hidden");
    // Trigger rendering of story list every time we open
    StoryOptionsController.renderStories();
  },

  close() {
    const modal = document.querySelector("#story-options");
    if (modal) modal.setAttribute("hidden", "");
  },

  async renderStories() {
    const list = document.querySelector("#story-list");
    if (!list) return;

    list.innerHTML = '<div aria-busy="true">Loading...</div>';

    try {
      const stories = await db.stories.orderBy("updatedAt").reverse().toArray();
      list.innerHTML = "";

      if (stories.length === 0) {
        const p = document.createElement("p");
        p.textContent = "No saved stories.";
        p.className = "muted";
        p.style.textAlign = "center";
        p.style.padding = "2rem 0";
        list.appendChild(p);
        return;
      }

      stories.forEach(s => {
        const div = document.createElement("div");
        div.className = "story-item card";

        const info = document.createElement("div");
        const date = new Date(s.updatedAt).toLocaleDateString();
        info.innerHTML = `<strong>${escapeHtml(s.storyTitle || "Untitled")}</strong><br><small class="muted">${date}</small>`;

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "0.5rem";

        const loadBtn = document.createElement("button");
        loadBtn.className = "primary small";
        loadBtn.textContent = "Load";
        loadBtn.onclick = async () => {
          await StoryController.load(s.id);
          StoryOptionsController.close();
        };

        const delBtn = document.createElement("button");
        delBtn.className = "secondary outline danger small";
        delBtn.textContent = "Delete";
        delBtn.onclick = async (e) => {
          e.stopPropagation();
          if (confirm("Delete this story?")) {
            await db.stories.delete(s.id);
            await db.messages.where("storyId").equals(s.id).delete();
            StoryOptionsController.renderStories(); // Refresh list
          }
        };

        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);
        div.appendChild(info);
        div.appendChild(actions);
        list.appendChild(div);
      });

    } catch (e) {
      list.textContent = "Failed to load stories.";
      console.error(e);
    }
  },

  startNew() {
    // Reset UI to storyboard mode
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