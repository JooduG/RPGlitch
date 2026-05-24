/**
 * RPGlitch Main Entry Point (Vite)
 * Handles core library exposure and database initialization.
 */
import "@media/design.css";
import Dexie from "dexie";
import DOMPurify from "dompurify";
// 🚑 EMERGENCY POLYFILL: Expose to window for legacy code/perchance integration
// Must happen BEFORE any other code runs
Object.assign(window, { Dexie, DOMPurify });
// [DEV] Mock rpgLists for local development to bypass 5s bootstrap timeout
const win = /** @type {any} */ (window);
if (!win.rpgLists) {
  win.rpgLists = {
    sounds: [],
    voices: [],
    themes: [],
  };
  console.info("[Engine] Injected mock rpgLists for local dev.");
}
// 🚀 BOOTSTRAP
import { AppBootstrap } from "@engine/boot.js";
AppBootstrap.init().then(() => {
  console.info("[Engine] Entry point active. Handing off to Bootstrap.");
});
