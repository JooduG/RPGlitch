/**
 * RPGlitch Main Entry Point (Vite)
 * Handles core library exposure, the composition root (state bridges), and the
 * app_bootstrap boot sequence (seed premades, runtime sync, auto-resume, mount).
 */
import "@media/design.css";
import Dexie from "dexie";
import DOMPurify from "dompurify";
// Expose core libs to the global scope (Perchance integration).
// Must happen BEFORE any other code runs
Object.assign(window, { Dexie, DOMPurify });

// Install runtime error hardening (ResizeObserver loop suppression + Perchance
// sandbox-frame error silencing) before any app code creates observers.
install_environment_hardening();
ensure_theme_tokens();

// 🚀 BOOTSTRAP
// Composition root: publish the state layer's accessors and stream handlers into
// the @utils bridges (state_bridge / stream_bridge) so non-@state modules
// (@intelligence, @data, ...) can read state without importing @state directly —
// that preserves the downward import rule. Must run before app_bootstrap.init().
import { app, runtime, simulation_state, simulation_log } from "@state";
import { seed_premades, session_driver, set_versionchange_quiesce } from "@data";
import { Audio, sweep_stale_ghosts, ensure_theme_tokens } from "@media";
import { install_environment_hardening, sanitize_to_fragment, save_session_checkpoint } from "@platform";
import { mount } from "svelte";
import { embeddings_engine, reconcile_vector_caps } from "@intelligence";
import App from "@/App.svelte";
import { register_state_accessors, register_stream_handlers, state_bridge } from "@utils";

register_state_accessors({ app, runtime, simulation_state, simulation_log, session_driver });
register_stream_handlers({
  start: (id, role) => app.start_stream(id, role),
  update: (chunk) => app.update_stream(chunk),
  end: () => app.end_stream(),
  is_active: () => app.streaming.active,
});

/************************************************************************************
 * BOOT SEQUENCE (app_bootstrap)
 * ----------------------------------------------------------------------------------
 * The initial sequence of the application: seed premades, parallel service init,
 * auto-resume the active story, then mount the Svelte app. Formerly src/engine/boot.js.
 ************************************************************************************/

let has_initialized = false;

// Quiesce hook: when Dexie fires versionchange (another tab upgraded the schema)
// IndexedDB is unavailable here, so stash a reload-safe checkpoint of the active
// session pointer before the forced reload. runtime.sync() restores it on boot.
// Guarded against environments where the persistence layer hasn't exposed the
// hook (e.g. partial @data mocks in unit tests) — a boot hook registration must
// never be able to take down module evaluation.
if (typeof set_versionchange_quiesce === "function") {
  set_versionchange_quiesce(() => {
    save_session_checkpoint({
      story_id: state_bridge.runtime?.story_id ?? state_bridge.session_driver?.active_id ?? null,
      round: state_bridge.runtime?.round ?? 0,
      phase: state_bridge.simulation_state?.phase ?? "idle",
    });
  });
}

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
 * app_bootstrap handles the initial sequence of the application.
 */
export const app_bootstrap = {
  async init() {
    if (has_initialized) {
      state_bridge.app.log("[Engine] app_bootstrap.init() called more than once. Guarding.", "system");
      return;
    }
    has_initialized = true;

    try {
      // 1. Seed Premades (Entities/Stories) - Must happen before sync to ensure data exists.
      await seed_premades();

      // Trigger asset pre-downloads on boot without blocking DOM mount
      embeddings_engine?.load_model?.()?.catch?.((err) => console.warn("[Boot] Embeddings pre-download error:", err));
      Audio?.voice?.load_model?.()?.catch?.((err) => console.warn("[Boot] Voice pre-download error:", err));

      // Parallel Initialization: Reduce critical path for LCP.
      await Promise.all([state_bridge.runtime.sync(), state_bridge.app.init(), Audio.init()]);

      // Auto-resume active story session & hydrate simulation log feed on page reload
      const runtime = state_bridge.runtime;
      if (runtime.story_id) {
        try {
          await state_bridge.simulation_log?.refresh?.();
          await sweep_stale_ghosts?.();
          await state_bridge.app?.load_entities?.();
          state_bridge.app.stories_version++;
          state_bridge.app?.set_view?.("storymode");
        } catch (syncErr) {
          console.warn("[Boot] Active story auto-resume failed:", syncErr);
        }
      }

      // Vector hygiene: entities saved under looser caps may still hold over-cap
      // past memory pool. Trim once on load (origin/premade vectors are kept)
      // so memory stays bounded going forward.
      for (const { entity, type } of [
        { entity: runtime.active_ai, type: "character" },
        { entity: runtime.active_user, type: "character" },
        { entity: runtime.active_fractal, type: "fractal" },
      ]) {
        if (!entity) continue;
        try {
          if (reconcile_vector_caps(entity)) {
            await runtime.update_entity(type, entity.id, { past: entity.past, future: entity.future });
          }
        } catch (err) {
          console.warn("[Boot] Vector reconciliation failed for", entity.id, err);
        }
      }

      // 5. Mount Svelte App
      mount(App, {
        target: document.getElementById("main-app-container") || document.body,
      });

      // 6. Tear down boot illusion
      document.getElementById("svelte-root")?.remove();
      state_bridge.app.log("[Engine] >> System Online.", "system");
    } catch (err) {
      console.error("[Engine] 🚫 Critical Failure:", err);
      state_bridge.app.log(`[Engine] 🚫 Critical Failure: ${err instanceof Error ? err.message : String(err)}`, "error");

      const error_template = `
                <div style="background:var(--color-chalk); color:var(--color-crimson-red); padding:calc(var(--spacing-unit) * 8); font-family:var(--font-mono); height:100vh; overflow:auto;">
                    <h1 style="border-bottom: var(--spacing-unit) solid var(--color-crimson-red); padding-bottom: calc(var(--spacing-unit) * 2); margin-bottom: calc(var(--spacing-unit) * 4);">SYSTEM HALTED</h1>
                    <p style="color:var(--color-pure-white); opacity:var(--opacity-whisper);">The engine failed to ignite. Check the console or stack trace below:</p>
                    <pre id="user-content-error-stack" style="background:var(--color-glass-sunken); padding:calc(var(--spacing-unit) * 4); border-radius:var(--radius-sharp); color:var(--color-crimson-red); white-space: pre-wrap; word-break: break-all;"></pre>
                </div>
            `;
      const fragment = sanitize_to_fragment(error_template);

      // Use textContent for safety
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
