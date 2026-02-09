// src/core/engine/bootstrap.js

import { db } from "@data/db.js"
import { seedPremades } from "@data/repository.js"
import { mount } from "svelte"
import App from "../../App.svelte"
import { GameMaster } from "./engine.js"
import { initDebugMode, mockPlugins } from "./utils.js"

if (typeof window !== "undefined") window.GameMaster = GameMaster

if (typeof window !== "undefined") {
    try {
        const _lsSet = localStorage.setItem
        localStorage.setItem = function (key, val) {
            if (
                key &&
                (key.includes("blocked") ||
                    key.includes("policy") ||
                    key.includes("flag"))
            ) {
                return
            }
            return _lsSet.apply(this, arguments)
        }
        Object.keys(localStorage).forEach((key) => {
            if (key.includes("blocked") || key.includes("policy")) {
                localStorage.removeItem(key)
            }
        })
        console.info("[Shield] Freedom Protocol Active.")
    } catch (e) {
        console.warn("[Shield] Storage intercept failed.")
    }
}

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
                console.warn("[Bootstrap] rpgLists missing after 5s.")
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
        console.info("[Bootstrap] 🚀 RPGlitch Starting...")
        try {
            console.info("[Bootstrap] Step 0: Pre-Flight...")
            await waitForConfig()

            console.info("[Bootstrap] Step 1: Stability Layer...")
            await initDebugMode()
            mockPlugins()

            console.info("[Bootstrap] Step 2: Data Layer (Opening DB)...")
            await db.open()
            console.info("[Bootstrap] Database Ready. Seeding content...")
            await seedPremades()

            console.info("[Bootstrap] Step 3: UI Layer...")
            const target = document.getElementById("svelte-root")
            console.info(
                `[Bootstrap] Target #svelte-root: ${target ? "FOUND" : "MISSING"}`
            )
            if (target) {
                console.info("[Bootstrap] Calling mount()...")
                // Clear the static boot illusion before mounting
                target.innerHTML = ""
                mount(App, { target })
                console.info("[Bootstrap] ⚒️ Artificer UI Mounted.")
            } else {
                console.info(
                    "[Bootstrap] ⚠️ CANNOT MOUNT: #svelte-root not in DOM."
                )
            }
            console.info("[Bootstrap] 🏁 System Online.")
        } catch (err) {
            console.error("[Bootstrap] ❌ Critical Failure:", err)
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
