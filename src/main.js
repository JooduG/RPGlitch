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

// --- DATABASE INITIALIZATION ---
// The Dexie database must be opened before any component tries to query it.
import { init as initDb } from "@data/database/db.js"
import { seedPremades } from "@data/database/repository.js"

// --- SVELTE APP MOUNT ---
import { mount } from "svelte"
import App from "./App.svelte"
;(async () => {
    try {
        await initDb()
        await seedPremades()
        console.log("[RPGlitch] Database initialized and seeded.")

        // Mount Svelte app to the root element
        const target = document.getElementById("svelte-root")
        if (target) {
            mount(App, { target })
            console.log("[RPGlitch] Svelte app mounted.")
        } else {
            console.error("[RPGlitch] CRITICAL: #svelte-root not found!")
        }
    } catch (e) {
        console.error("[RPGlitch] CRITICAL: Initialization failed.", e)
    }
})()
