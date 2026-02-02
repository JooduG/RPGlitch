// File: .agent/skills/warden/scripts/verify_ui.js
import { chromium } from "playwright"

const URL = "http://localhost:5173" // Default Vite port

;(async () => {
    console.log("🛡️ Warden: Verifying UI State...")
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
        await page.goto(URL, { waitUntil: "networkidle" })

        // 1. Check Title
        const title = await page.title()
        console.log(`✅ Title: ${title}`)

        // 2. Check Critical Element (e.g., #app or main container)
        const app = await page.$("#app")
        if (app) console.log("✅ #app mounted successfully")
        else throw new Error("#app not found")

        // 3. Check for Console Errors
        page.on("console", (msg) => {
            if (msg.type() === "error")
                console.error(`❌ Console Error: ${msg.text()}`)
        })
    } catch (error) {
        console.error("❌ Verification Failed:", error.message)
        process.exit(1)
    } finally {
        await browser.close()
    }
})()
