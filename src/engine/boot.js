import { seed_premades } from "@data";
import { Audio } from "@media";
import App from "../App.svelte";
import { sanitizeToFragment } from "@platform";
import { app, runtime } from "@state";
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
      app.log(`[Engine] 🚫 Critical Failure: ${err instanceof Error ? err.message : String(err)}`, "error");

      const error_template = `
                <div style="background:var(--color-chalk); color:var(--color-crimson-red); padding:calc(var(--spacing-spacing-unit) * 8); font-family:var(--font-mono); height:100vh; overflow:auto;">
                    <h1 style="border-bottom: var(--spacing-border-width-thick) solid var(--color-crimson-red); padding-bottom: calc(var(--spacing-spacing-unit) * 2); margin-bottom: calc(var(--spacing-spacing-unit) * 4);">SYSTEM HALTED</h1>
                    <p style="color:var(--color-pure-white); opacity:var(--opacity-whisper);">The engine failed to ignite. Check the console or stack trace below:</p>
                    <pre id="error-stack" style="background:var(--color-glass-sunken); padding:calc(var(--spacing-spacing-unit) * 4); border-radius:var(--radius-sharp); color:var(--color-crimson-red); white-space: pre-wrap; word-break: break-all;"></pre>
                </div>
            `;
      const fragment = sanitizeToFragment(error_template);

      // Use textContent for safety
      const error_stack = fragment.querySelector("pre");
      if (error_stack) {
        error_stack.textContent = /** @type {any} */ (err).stack || String(err);
      }

      document.body.replaceChildren(fragment);
    }
  },
};
