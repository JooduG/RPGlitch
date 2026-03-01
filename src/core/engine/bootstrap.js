// src/core/engine/bootstrap.js

import { seedPremades } from "@data/repository.js"
import { runtime } from "@state/runtime.svelte.js"
import { mount } from "svelte"
import App from "../../App.svelte"

let isInitialized = false

/**
 * AppBootstrap handles the initial sequence of the application.
 */
export const AppBootstrap = {
    async init() {
        if (isInitialized) {
            console.warn("[Engine] AppBootstrap.init() called more than once. Guarding.")
            return
        }
        isInitialized = true

        try {
            // 1. Seed Premades (Entities/Stories)
            await seedPremades()

            // 2. Sync Runtime State (Hydrate from DB)
            await runtime.sync()

            // 3. Mount Svelte App
            mount(App, {
                target: document.getElementById("main-app-container") || document.body,
            })

            console.info("[Engine] 🏁 System Online.")
        } catch (err) {
            console.error("[Engine] ❌ Critical Failure:", err)
            document.body.innerHTML = `
                <div style="color:#ef4444; padding:2rem; font-family:monospace; background:#000; height:100vh;">
                    <h1 style="border-bottom:1px solid #ef4444; padding-bottom:1rem;">SYSTEM HALTED</h1>
                    <p>A critical failure occurred during initialization.</p>
                    <pre style="background:#111; padding:1rem; overflow:auto;">${err.stack || err}</pre>
                </div>
            `
        }
    },
}
