/**
 * RPGlitch Main Entry Point (Vite)
 * Delegates to AppBootstrap for full initialization.
 */
import Dexie from "dexie";
import DOMPurify from "dompurify";
import "./mesmer/scss/app.scss";

// 🚑 EMERGENCY POLYFILL: Expose to window for legacy code/perchance integration
// Must happen BEFORE any other code runs
window.Dexie = Dexie;
window.DOMPurify = DOMPurify;

// Import and run the full bootstrap sequence
// This handles: Freedom Protocol, DB init, seedPremades, Svelte mount, GameMaster
import "./gamemaster/bootstrap.js";

// AppBootstrap handles its own DOMContentLoaded check
// See bootstrap.js lines 129-135
