/**
 * RPGlitch Main Entry Point (Vite)
 * Handles core library exposure and database initialization.
 */
import "@theme/app.scss"
import Dexie from "dexie"
import DOMPurify from "dompurify"

// 🚑 EMERGENCY POLYFILL: Expose to window for legacy code/perchance integration
// Must happen BEFORE any other code runs
Object.assign(window, { Dexie, DOMPurify })

// [DEV] Mock rpgLists for local development to bypass 5s bootstrap timeout
if (!window.rpgLists) {
    window.rpgLists = {
        sounds: [],
        voices: [],
        themes: [],
    }
    console.info("[RPGlitch] Injected mock rpgLists for local dev.")
}

// --- DATABASE INITIALIZATION ---
// The Dexie database must be opened before any component tries to query it.
import "./core/engine/bootstrap.js"

console.info("[RPGlitch] Entry point active. Handing off to Bootstrap.")
