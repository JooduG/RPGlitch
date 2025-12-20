/**
 * apps/rpglitch/js/ui-handlers.js
 * Centralized UI event handlers to replace inline HTML attributes.
 * Uses event delegation to handle elements injected from templates.
 */

export function initUIHandlers() {
  console.log("[UI Handlers] Initializing...");

  // 1. Static Elements (Always in DOM)
  const btnSettings = document.getElementById("btn-settings-placeholder");
  if (btnSettings) {
    btnSettings.addEventListener("click", () => {
      const settingsModal = document.getElementById("settings");
      if (settingsModal) settingsModal.removeAttribute("hidden");
    });
  }

  // 2. Global Event Delegation
  document.addEventListener("click", (e) => {
    const target = e.target;

    // A. Settings Modal Close Button
    // Looks for .close inside #settings
    if (target.matches(".close") || target.closest(".close")) {
      const settingsModal = target.closest("#settings");
      if (settingsModal) {
        e.preventDefault(); // Prevent href="#" navigation
        settingsModal.setAttribute("hidden", "");
        return;
      }
    }
  });

  // 3. Form Submission Prevention
  document.addEventListener("submit", (e) => {
    // Blocks form submission for the Profile Page form
    const form = e.target;
    if (form.closest(".profile-layout")) {
      e.preventDefault();
      return false;
    }
  });
}
