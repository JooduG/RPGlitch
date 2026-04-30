/**
 * RPGlitch Main Entry Point (Vite)
 * Handles core library exposure and database initialization.
 */
import "@theme/app.css";
import Dexie from "dexie";
import DOMPurify from "dompurify";
// ðŸš‘ EMERGENCY POLYFILL: Expose to window for legacy code/perchance integration
// Must happen BEFORE any other code runs
Object.assign(window, { Dexie, DOMPurify });
// [DEV] Mock rpgLists for local development to bypass 5s bootstrap timeout
if (!window.rpgLists) {
  window.rpgLists = {
    sounds: [],
    voices: [],
    themes: [],
  };
  console.info("[Engine] Injected mock rpgLists for local dev.");
}
// ðŸš€ BOOTSTRAP
import { AppBootstrap } from "./core/bootstrap.js";
AppBootstrap.init().then(() => {
  console.info("[Engine] Entry point active. Handing off to Bootstrap.");
});
