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
  },

  open() {
    const modal = document.querySelector("#story-options");
    if (!modal) return;

    const directorModeToggle = modal.querySelector("#setting-director-mode");
    if (directorModeToggle) {
      directorModeToggle.checked = !!state.settings.directorMode;
    }

    modal.removeAttribute("hidden");
    // CRITICAL FIX: Add the class required by _layout-modal.scss
    modal.classList.add("is-open");

    // Only render stories if we have a list container (which we removed in the new template, 
    // but we might want to add back later or in a separate tab. For now, we skip it 
    // or we could add a "Load Story" button that opens a separate modal)
    // StoryOptionsController.renderStories(); 
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
    // Deprecated for now with new Settings Modal design
    // We can re-introduce this if we add a "Load Story" tab
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