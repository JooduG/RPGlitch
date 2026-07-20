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

// Suppress benign ResizeObserver loop warnings (browser-level, not a real error)
// This prevents Perchance from surfacing it as a code error when dropdowns open.
const _e = window.addEventListener;
window.addEventListener = (type, listener, opts) => {
  if (type === "error") {
    const wrapped = (e) => {
      if (e.message && e.message.includes("ResizeObserver loop")) return;
      return listener.call(window, e);
    };
    return _e.call(window, type, wrapped, opts);
  }
  return _e.call(window, type, listener, opts);
};

// 🚀 BOOTSTRAP
import { AppBootstrap } from "@engine";
AppBootstrap.init().then(() => {
  console.info("[Engine] Entry point active. Handing off to Bootstrap.");
});
