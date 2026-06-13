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
// [DEV] Mock environment setups (if needed in future)
// 🚀 BOOTSTRAP
import { AppBootstrap } from "@engine";
AppBootstrap.init().then(() => {
  console.info("[Engine] Entry point active. Handing off to Bootstrap.");
});
