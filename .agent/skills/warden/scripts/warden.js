#!/usr/bin/env node
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

/**
 * 🛡️ WARDEN: The Quality Assurance Specialist
 * Consolidates CSS analysis, HTML hinting, and repository diagnostics.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")

const COMMANDS = {
    /** 🔍 HTML Integrity */
    html: async () => {
        console.log("\n🔍 WARDEN: Auditing HTML Integrity...")
        try {
            execSync("node .agent/skills/warden/scripts/htmlhint.js", {
                stdio: "inherit",
            })
        } catch (e) {
            console.error("❌ HTML Audit failed")
            process.exit(1)
        }
    },

    /** 🎨 CSS / SCSS Architecture */
    css: async () => {
        console.log("\n🎨 WARDEN: Auditing CSS/SCSS Architecture...")
        try {
            // We can leverage the existing analyzer for now
            execSync("node .agent/skills/warden/scripts/analyze-css.js", {
                stdio: "inherit",
            })
        } catch (e) {
            console.error("❌ CSS Audit failed")
            process.exit(1)
        }
    },

    /** 🧪 General Diagnostics */
    rules: async () => {
        console.log("\n🧪 WARDEN: Running System Diagnostics...")
        // Check for Pillar documentation existence
        const pillars = [
            "01-prime-directive.md",
            "02-architecture.md",
            "03-tech-stack.md",
            "04-security.md",
            "05-hygiene.md",
        ]
        pillars.forEach((p) => {
            const abs = path.join(REPO_ROOT, ".agent/rules", p)
            if (fs.existsSync(abs)) console.log(`✅ Rule Found: ${p}`)
            else console.error(`❌ Missing Core Rule: ${p}`)
        })
    },

    /** ⚔️ Full Combat Audit */
    audit: async () => {
        await COMMANDS.html()
        await COMMANDS.css()
        await COMMANDS.rules()
        console.log("\n✅ WARDEN: Full audit complete. System is stable.")
    },
}

async function main() {
    const cmd = process.argv[2] || "audit"
    if (!COMMANDS[cmd]) {
        console.error("❌ Unknown command. Available: html, css, rules, audit")
        process.exit(1)
    }
    await COMMANDS[cmd]()
}

main().catch((err) => {
    console.error("❌ Warden Error:", err.message)
    process.exit(1)
})
