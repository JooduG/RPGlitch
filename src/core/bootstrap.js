// src/core/bootstrap.js
import { sanitizeToFragment } from "@core/security.js";
import { seed_premades } from "@data/repository.js";
import { Audio } from "@media/audio-engine.svelte.js";
import { app } from "@state/app.svelte.js";
import { runtime } from "@state/runtime.svelte.js";
import App from "@ui/App.svelte";
import { mount } from "svelte";

let has_initialized = false;

/**
 * FOR TESTING ONLY: Reset the initialization guard.
 */
export const reset_bootstrap_guard =
  import.meta.env.MODE === "test"
    ? () => {
        has_initialized = false;
      }
    : () => {};

/**
 * AppBootstrap handles the initial sequence of the application.
 */
export const AppBootstrap = {
  async init() {
    if (has_initialized) {
      app.log("[Engine] AppBootstrap.init() called more than once. Guarding.", "system");
      return;
    }
    has_initialized = true;

    try {
      // 1. Seed Premades (Entities/Stories) - Must happen before sync to ensure data exists.
      await seed_premades();

      // Parallel Initialization: Reduce critical path for LCP.
      await Promise.all([runtime.sync(), app.init(), Audio.init()]);

      // 5. Mount Svelte App
      mount(App, {
        target: document.getElementById("main-app-container") || document.body,
      });

      // 6. Tear down boot illusion
      document.getElementById("svelte-root")?.remove();
      app.log("[Engine] >> System Online.", "system");
    } catch (err) {
      console.error("[Engine] 🚫 Critical Failure:", err);
      app.log(
        `[Engine] 🚫 Critical Failure: ${err instanceof Error ? err.message : String(err)}`,
        "error",
      );

      const error_template = `
                <div style="background:var(--background-base); color:var(--color-red); padding:var(--spacing-8); font-family:var(--font-family-mono); height:100vh; overflow:auto;">
                    <h1 style="border-bottom: calc(var(--spacing-pixel) * 2) solid var(--color-red); padding-bottom: var(--spacing-2); margin-bottom: var(--spacing-4);">SYSTEM HALTED</h1>
                    <p style="color:var(--color-white); opacity:var(--opacity-substantial);">The engine failed to ignite. Check the console or stack trace below:</p>
                    <pre id="error-stack" style="background:var(--glass-sunken); padding:var(--spacing-4); border-radius:var(--radius-subtle); color:var(--color-red); white-space: pre-wrap; word-break: break-all;"></pre>
                </div>
            `;
      const fragment = sanitizeToFragment(error_template);
      document.body.replaceChildren(fragment);

      // Use textContent for safety
      const error_stack = document.getElementById("error-stack");
      if (error_stack) {
        error_stack.textContent = /** @type {any} */ (err).stack || String(err);
      }
    }
  },
};
