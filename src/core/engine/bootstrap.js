// src/core/engine/bootstrap.js
import { seed_premades } from "@data/repository.js";
import { runtime } from "@state/runtime.svelte.js";
import { mount } from "svelte";
import App from "../../App.svelte";
let has_initialized = false;
/**
 * AppBootstrap handles the initial sequence of the application.
 */
export const AppBootstrap = {
  async init() {
    if (has_initialized) {
      console.warn("[Engine] AppBootstrap.init() called more than once. Guarding.");
      return;
    }
    has_initialized = true;
    try {
      // 1. Seed Premades (Entities/Stories)
      await seed_premades();
      // 2. Sync Runtime State (Hydrate from DB)
      await runtime.sync();
      // 3. Mount Svelte App
      mount(App, {
        target: document.getElementById("main-app-container") || document.body,
      });
      // 4. Tear down boot illusion — it lives in #svelte-root which is NOT the
      //    mount target, so Svelte never cleans it up. Remove it explicitly.
      document.getElementById("svelte-root")?.remove();
      console.info("[Engine] 🏁 System Online.");
    } catch (err) {
      console.error("[Engine] ❌ Critical Failure:", err);
      document.body.innerHTML = `
                <div style="background:var(--bg-base); color:var(--color-danger); padding:var(--spacing-xl); font-family:var(--font-mono); height:100vh; overflow:auto;">
                    <h1 style="border-bottom: 2px solid var(--color-danger); padding-bottom: var(--spacing-s); margin-bottom: var(--spacing-m);">SYSTEM HALTED</h1>
                    <p style="color:var(--color-white); opacity:0.8;">The engine failed to ignite. Check the console or stack trace below:</p>
                    <pre id="error-stack" style="background:var(--surface-sunken); padding:var(--spacing-m); border-radius:var(--border-radius-m); color:var(--color-danger); white-space: pre-wrap; word-break: break-all;"></pre>
                </div>
            `;
      // Use textContent for safety
      const error_stack = document.getElementById("error-stack");
      if (error_stack) {
        error_stack.textContent = err.stack || String(err);
      }
    }
  },
};
