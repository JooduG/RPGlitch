/**
 * Storyboard Actions Module
 * Direct function calls for Perchance sandbox compatibility.
 * (CustomEvents are blocked in Perchance's sandbox)
 */
import { app } from "@state/app.svelte.js";
import { session } from "@state/session.svelte.js";
export const storyboard = {
  /**
   * Shuffle all selected entities randomly.
   */
  randomize() {
    if (!app.ai_list.length) return;
    // 1. Random AI
    app.selected_ai =
      app.ai_list[Math.floor(Math.random() * app.ai_list.length)];
    // 2. Random User (Cannot be same as AI)
    let available_users = app.user_list;
    if (app.selected_ai) {
      available_users = app.user_list.filter(
        (u) => u.id !== app.selected_ai.id,
      );
    }
    if (available_users.length) {
      app.selected_user =
        available_users[Math.floor(Math.random() * available_users.length)];
    } else {
      // If no other users, pick the AI itself (fallback) or first user
      app.selected_user = app.user_list[0];
    }
    // 3. Random Fractal
    if (app.fractal_list.length) {
      app.selected_fractal =
        app.fractal_list[Math.floor(Math.random() * app.fractal_list.length)];
    }
    // Ensure title updates on randomize
    if (typeof app.reroll_title === "function") {
      app.reroll_title();
    }
  },
  /**
   * Begin the story with current selections.
   */
  async begin() {
    // 🛡️ LOBBY BYPASS LOGIC
    if (app.settings.dev_mode) {
      app.log("Lobby Bypass Triggered (DEV_MODE)", "system");
      const selection = {
        ai: app.selected_ai || { id: "dev_ai", name: "Dev AI" },
        user: app.selected_user || { id: "dev_user", name: "Dev User" },
        fractal: app.selected_fractal || {
          id: "dev_fractal",
          name: "Dev Fractal",
        },
      };
      await session.start(selection);
      return;
    }
    if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;
    await session.start({
      ai: app.selected_ai,
      user: app.selected_user,
      fractal: app.selected_fractal,
    });
  },
};
