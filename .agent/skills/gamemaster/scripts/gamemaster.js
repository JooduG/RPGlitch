#!/usr/bin/env node
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

/**
 *  GAMEMASTER: The Executive Operations CLI
 *  Merges legacy sync, hygiene, and bootstrap logic into the central Executive pillar.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")

const COMMANDS = {
    /** 🔄 Sync Protocol */
    sync: async (type = "all") => {
        console.log(
            `\n🔄 GAMEMASTER: Initiating Sync Protocol [Mode: ${type.toUpperCase()}]...`
        )
        try {
            // We leverage the existing sync logic but can optimize it later
            const flag = type === "all" ? "--all" : `--${type}`
            execSync(`node .agent/skills/gamemaster/scripts/sync.js ${flag}`, {
                stdio: "inherit",
            })
        } catch (e) {
            console.error("❌ Sync failed:", e.message)
            process.exit(1)
        }
    },

    /** 🩺 Hygiene Protocol (Improved) */
    hygiene: async () => {
        console.log("\n🩺 GAMEMASTER: Initiating Hygiene Scan [Scope: src]...")
        let warningCount = 0
        let errorCount = 0

        const scanDir = (dir) => {
            const items = fs.readdirSync(dir)
            for (const item of items) {
                const fullPath = path.join(dir, item)
                const stat = fs.statSync(fullPath)

                if (stat.isDirectory()) {
                    scanDir(fullPath)
                } else if (/\.(js|ts|svelte)$/i.test(item)) {
                    const content = fs.readFileSync(fullPath, "utf-8")
                    const lines = content.split("\n")

                    lines.forEach((line, i) => {
                        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return // Skip comments

                        // Updated logic to check for console.log/alert but respect ignores if implemented later
                        // For now, strict check as per Warden/Hygiene protocol
                        if (/console\.log\(/.test(line)) {
                            console.warn(
                                `[WARN] console.log in ${path.relative(REPO_ROOT, fullPath)}:${i + 1}`
                            )
                            warningCount++
                        }
                        if (/\balert\(/.test(line)) {
                            console.error(
                                `[ERROR] alert in ${path.relative(REPO_ROOT, fullPath)}:${i + 1}`
                            )
                            errorCount++
                        }
                    })
                }
            }
        }

        scanDir(path.join(REPO_ROOT, "src"))
        console.log(`\n--- Hygiene Results ---`)
        console.log(`Warnings (Logs): ${warningCount}`)
        console.log(`Errors (Alerts): ${errorCount}`)

        if (errorCount > 0) process.exit(1)
    },

    /** 🚀 Bootstrap / Self-Healing */
    bootstrap: async () => {
        console.log("⚡ GAMEMASTER: Performing Deep Bootstrap...")

        // 1. Pillar Existence Check (Logic from on_start.ps1)
        const pillars = [
            ".agent/rules/01-prime-directive.md",
            ".agent/rules/02-architecture.md",
            ".agent/rules/03-tech-stack.md",
            ".agent/rules/04-security.md",
            ".agent/rules/05-hygiene.md",
        ]
        let missing = 0
        console.log("🔍 Verifying Pillar Integrity...")
        for (const pillar of pillars) {
            if (fs.existsSync(path.join(REPO_ROOT, pillar))) {
                // console.log(`  ✅ Found: ${pillar}`) // Quiet mode
            } else {
                console.error(`  ❌ MISSING PILLAR: ${pillar}`)
                missing++
            }
        }
        if (missing > 0) {
            console.error("⚠️ Environment Corrupt. Halting.")
            process.exit(1)
        }

        // 2. Config & Type Check (Logic from on_startup.sh)
        if (!fs.existsSync(path.join(REPO_ROOT, ".agent/config.yaml"))) {
            console.error("❌ Missing .agent/config.yaml")
            process.exit(1)
        }

        // 3. Execution Protocols
        await COMMANDS.sync("all")
        await COMMANDS.hygiene()

        console.log("✅ Gamemaster Environment: READY.")
    },
}

async function main() {
    const cmd = process.argv[2] || "bootstrap"
    const arg = process.argv[3]

    if (!COMMANDS[cmd]) {
        console.error("❌ Unknown command. Available: sync, hygiene, bootstrap")
        process.exit(1)
    }

    await COMMANDS[cmd](arg)
}

main().catch((err) => {
    console.error("❌ Conductor Error:", err.message)
    process.exit(1)
})
