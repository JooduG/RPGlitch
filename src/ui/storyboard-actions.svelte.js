/**
 * Storyboard Actions Module
 * Direct function calls for Perchance sandbox compatibility.
 * (CustomEvents are blocked in Perchance's sandbox)
 */
import { app } from "@state/app.svelte.js";
import { session } from "@state/session.svelte.js";
import { pickRandom } from "@ui/utils/helpers.js";
export const storyboard = {
  /**
   * Shuffle all selected entities randomly.
   */
  async shuffle() {
    if (!app.ai_list.length) {
      await app.load_entities(); // Ensure we have lists
    }
    if (!app.ai_list.length) return;
    // 1. Random AI
    app.selected_ai = pickRandom(app.ai_list);
    // 2. Random User (Cannot be same as AI)
    let available_users = app.user_list;
    if (app.selected_ai) {
      available_users = app.user_list.filter((u) => u.id !== app.selected_ai.id);
    }
    if (available_users.length) {
      app.selected_user = pickRandom(available_users);
    } else {
      // If no other users, pick the AI itself (fallback) or first user
      if (app.user_list.length) {
        app.selected_user = app.user_list[0];
      }
    }
    // 3. Random Fractal
    if (app.fractal_list.length) {
      app.selected_fractal = pickRandom(app.fractal_list);
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
