/**
 * RPGlitch Main Entry Point (Vite)
 * Orchestrates the app_bootstrap boot sequence
 * (hardening, theme tokens, seed premades, session sync, auto-resume, mount).
 */
import "@media/design.css";
import App from "@/App.svelte";
import { save_session_checkpoint, seed_premades, set_versionchange_quiesce } from "@data";
import { Audio, sweep_stale_ghosts } from "@media";
import { app, execution, install_freeze_watchdog, session } from "@state";
import { embeddings_engine, ensure_theme_tokens, install_environment_hardening, sanitize_to_fragment } from "@utils";
import { mount } from "svelte";

let has_initialized = false;

if (typeof set_versionchange_quiesce === "function") {
  set_versionchange_quiesce(() => {
    save_session_checkpoint({ story_id: session?.active_id ?? null, round: session?.round ?? 0, phase: execution?.phase ?? "idle" });
  });
}

export const reset_bootstrap_guard =
  import.meta.env.MODE === "test" ?
    () => {
      has_initialized = false;
    }
  : () => {};

export const app_bootstrap = {
  async init() {
    if (has_initialized) {
      console.warn("[Engine] app_bootstrap.init() called more than once. Guarding.");
      return;
    }
    has_initialized = true;

    try {
      install_environment_hardening();
      ensure_theme_tokens();

      await seed_premades();

      embeddings_engine?.load_model?.()?.catch?.((err) => console.warn("[Boot] Embeddings pre-download error:", err));

      await Promise.all([session.sync(), app.init(), Audio.init()]);
      await app?.load_entities?.();
      install_freeze_watchdog();

      if (session.active_id) {
        try {
          await session.refresh_feed?.();
          await sweep_stale_ghosts?.({ session });
          app?.set_view?.("storymode");
        } catch (syncErr) {
          console.warn("[Boot] Active story auto-resume failed:", syncErr);
        }
      }

      mount(App, { target: document.body });

      console.info("[Engine] >> System Online.");
    } catch (err) {
      console.error("[Engine] 🚫 Critical Failure:", err);

      const error_template = `
                <div style="background:var(--color-chalk); color:var(--color-crimson-red); padding:calc(var(--spacing-unit) * 8); font-family:var(--font-mono); height:100vh; overflow:auto;">
                    <h1 style="border-bottom: var(--spacing-unit) solid var(--color-crimson-red); padding-bottom: calc(var(--spacing-unit) * 2); margin-bottom: calc(var(--spacing-unit) * 4);">SYSTEM HALTED</h1>
                    <p style="color:var(--color-pure-white); opacity:var(--opacity-whisper);">The engine failed to ignite. Check the console or stack trace below:</p>
                    <pre id="user-content-error-stack" style="background:var(--color-glass-sunken); padding:calc(var(--spacing-unit) * 4); border-radius:var(--radius-sharp); color:var(--color-crimson-red); white-space: pre-wrap; word-break: break-all;"></pre>
                </div>
            `;
      const fragment = sanitize_to_fragment(error_template);

      const error_stack = fragment.querySelector("#user-content-error-stack");
      if (error_stack) {
        error_stack.textContent = /** @type {any} */ (err).stack || String(err);
      }

      document.body.replaceChildren(fragment);
    }
  },
};

if (import.meta.env.MODE !== "test") {
  app_bootstrap.init().then(() => {
    console.info("[Engine] Entry point active. Handing off to Bootstrap.");
  });
}
