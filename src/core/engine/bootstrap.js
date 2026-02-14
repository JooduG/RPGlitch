// src/core/engine/bootstrap.js

import { db } from "@data/db.js"
import { seedPremades } from "@data/repository.js"
import { soundEffects } from "@media/audio/effects.js"
import { app } from "@state/app.svelte.js"
import { mount } from "svelte"
import App from "../../App.svelte"
import { GameMaster } from "./engine.js"
import { Session } from "./session.js"
import { initDebugMode, mockPlugins } from "./utils.js"

if (typeof window !== "undefined") window.GameMaster = GameMaster

// [REMOVED] Legacy localStorage interceptors migrated to Scholar/Dexie.

const waitForConfig = async () => {
    return new Promise((resolve) => {
        if (typeof window !== "undefined" && window.rpgLists) {
            resolve(true)
            return
        }
        let attempts = 0
        const check = () => {
            attempts++
            if (window.rpgLists) {
                resolve(true)
            } else if (attempts >= 50) {
                console.warn("[Gamemaster] rpgLists missing after 5s.")
                resolve(false)
            } else {
                setTimeout(check, 100)
            }
        }
        check()
    })
}

export const AppBootstrap = {
    async init() {
        console.info("[Gamemaster] 🚀 RPGlitch Starting...")
        try {
            console.info("[Gamemaster] Step 0: Pre-Flight...")
            await waitForConfig()

            console.info("[Gamemaster] Step 1: Stability Layer...")
            await initDebugMode()
            mockPlugins()

            console.info("[Gamemaster] Step 2: Data Layer (Opening DB)...")
            await db.open()
            console.info("[Gamemaster] Database Ready. Hydrating Stores...")

            // Async Hydration Gate
            await Promise.all([
                app.init(),
                Session.init(),
                soundEffects.initSettings(),
                seedPremades(),
            ])

            console.info("[Gamemaster] Stores Hydrated.")

            console.info("[Gamemaster] Step 3: UI Layer...")
            const target = document.getElementById("svelte-root")
            console.info(
                `[Gamemaster] Target #svelte-root: ${target ? "FOUND" : "MISSING"}`
            )
            if (target) {
                console.info("[Gamemaster] Calling mount()...")
                // Clear the static boot illusion before mounting
                target.innerHTML = ""
                mount(App, { target })
                console.info("[Gamemaster] ⚒️ Artificer UI Mounted.")
            } else {
                console.info(
                    "[Gamemaster] ⚠️ CANNOT MOUNT: #svelte-root not in DOM."
                )
            }
            console.info("[Gamemaster] 🏁 System Online.")
        } catch (err) {
            console.error("[Gamemaster] ❌ Critical Failure:", err)
            document.body.innerHTML = `<div style="color:red; padding:2rem;"><h1>SYSTEM HALTED</h1><pre>${err.stack || err}</pre></div>`
        }
    },
}

if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => AppBootstrap.init())
    } else {
        AppBootstrap.init()
    }
}
