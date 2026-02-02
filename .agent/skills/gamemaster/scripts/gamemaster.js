#!/usr/bin/env node
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

/**
 * GAMEMASTER: The Executive Operations CLI
 * -------------------------------------------------------------------------
 * The central nervous system of the .agent framework.
 * Handles: Synchronization, Hygiene, Bootstrapping, Reporting, and Archival.
 * -------------------------------------------------------------------------
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")

const IS_JSON = process.argv.includes("--json")

/** Log to stderr if in JSON mode, otherwise stdout */
const robotLog = (...args) => {
    if (IS_JSON) {
        console.error(...args)
    } else {
        console.log(...args)
    }
}

const robotError = (...args) => {
    console.error(...args)
}

const COMMANDS = {
    /** 🔄 Sync Protocol */
    sync: async (type = "all") => {
        robotLog(
            `\n🔄 GAMEMASTER: Initiating Sync Protocol [Mode: ${type.toUpperCase()}]...`
        )
        try {
            const flag = type === "all" ? "--all" : `--${type}`
            const jsonFlag = IS_JSON ? " --json" : ""

            // Execute the specialized sync script
            execSync(
                `node .agent/skills/gamemaster/scripts/sync.js ${flag}${jsonFlag}`,
                {
                    stdio: "inherit",
                    cwd: REPO_ROOT,
                }
            )

            if (IS_JSON)
                console.log(JSON.stringify({ status: "success", mode: type }))
        } catch (e) {
            if (IS_JSON) {
                console.log(JSON.stringify({ error: e.message, code: 1 }))
            } else {
                robotError("❌ Sync failed:", e.message)
            }
            process.exit(1)
        }
    },

    /** 🧹 Archive Protocol (Merged) */
    archive: async () => {
        robotLog("\n🧹 GAMEMASTER: Initiating Task Archival...")
        const tasksDir = path.join(REPO_ROOT, ".agent/tasks")
        const archiveDir = path.join(REPO_ROOT, ".agent/archive")

        if (!fs.existsSync(tasksDir)) {
            robotError(`❌ Tasks directory not found: ${tasksDir}`)
            return
        }
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true })
        }

        const files = fs.readdirSync(tasksDir)
        let movedCount = 0
        const movedFiles = []

        for (const file of files) {
            if (
                !file.endsWith(".md") ||
                file === "tracks.md" ||
                file === "README.md"
            )
                continue

            const srcPath = path.join(tasksDir, file)
            const content = fs.readFileSync(srcPath, "utf-8")

            // Heuristic: All boxes checked OR explicit [DONE] header
            const allTasks = (content.match(/- \[ \]/g) || []).length
            const isDoneHeader =
                content.includes("# [DONE]") || content.includes("Status: Done")

            if (allTasks === 0 || isDoneHeader) {
                const destPath = path.join(archiveDir, file)
                fs.renameSync(srcPath, destPath)
                robotLog(`   📦 Archived: ${file}`)
                movedFiles.push(file)
                movedCount++
            }
        }

        if (IS_JSON) {
            console.log(
                JSON.stringify({
                    status: "success",
                    archived: movedCount,
                    files: movedFiles,
                })
            )
        } else {
            robotLog(`✅ Archived ${movedCount} completed tasks.`)
        }
    },

    /** 🩺 Hygiene Protocol */
    hygiene: async () => {
        robotLog("\n🩺 GAMEMASTER: Initiating Hygiene Scan [Scope: src]...")
        let warningCount = 0
        let errorCount = 0
        const issues = []

        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return
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

                        // Rule 05: No console.logs in production code
                        if (/console\.log\(/.test(line)) {
                            const msg = `[WARN] console.log in ${path.relative(REPO_ROOT, fullPath)}:${i + 1}`
                            robotLog(msg)
                            issues.push({
                                type: "warning",
                                file: path.relative(REPO_ROOT, fullPath),
                                line: i + 1,
                                message: "console.log found",
                            })
                            warningCount++
                        }
                        // Rule 05: No blocking alerts
                        if (/\balert\(/.test(line)) {
                            const msg = `[ERROR] alert in ${path.relative(REPO_ROOT, fullPath)}:${i + 1}`
                            robotError(msg)
                            issues.push({
                                type: "error",
                                file: path.relative(REPO_ROOT, fullPath),
                                line: i + 1,
                                message: "alert found",
                            })
                            errorCount++
                        }
                    })
                }
            }
        }

        scanDir(path.join(REPO_ROOT, "src"))

        if (IS_JSON) {
            console.log(
                JSON.stringify({
                    status: errorCount > 0 ? "error" : "success",
                    warnings: warningCount,
                    errors: errorCount,
                    issues,
                })
            )
        } else {
            robotLog(`\n--- Hygiene Results ---`)
            robotLog(`Warnings (Logs): ${warningCount}`)
            robotLog(`Errors (Alerts): ${errorCount}`)
        }

        if (errorCount > 0) process.exit(1)
    },

    /** 🚀 Bootstrap / Self-Healing */
    bootstrap: async () => {
        robotLog("⚡ GAMEMASTER: Performing Deep Bootstrap...")

        // 1. Verify Pillars (Rules)
        const pillars = [
            ".agent/rules/01-prime-directive.md",
            ".agent/rules/02-architecture.md",
            ".agent/rules/03-tech-stack.md",
            ".agent/rules/04-security.md",
            ".agent/rules/05-hygiene.md",
        ]
        let missing = []

        for (const pillar of pillars) {
            if (!fs.existsSync(path.join(REPO_ROOT, pillar))) {
                robotError(`   ❌ MISSING PILLAR: ${pillar}`)
                missing.push(pillar)
            }
        }

        if (missing.length > 0) {
            if (IS_JSON) {
                console.log(
                    JSON.stringify({
                        error: "Environment Corrupt",
                        missing_pillars: missing,
                    })
                )
            } else {
                robotError("⚠️ Environment Corrupt. Halting.")
            }
            process.exit(1)
        }

        // 2. Config & Type Check
        if (!fs.existsSync(path.join(REPO_ROOT, ".agent/config.yaml"))) {
            const msg = "❌ Missing .agent/config.yaml"
            if (IS_JSON) console.log(JSON.stringify({ error: msg }))
            else robotError(msg)
            process.exit(1)
        }

        // 3. Execution Protocols
        await COMMANDS.sync("all")
        await COMMANDS.archive() // Added archival to bootstrap
        await COMMANDS.hygiene()

        if (IS_JSON) {
            console.log(JSON.stringify({ status: "ready" }))
        } else {
            robotLog("✅ Gamemaster Environment: READY.")
        }
    },

    /** 📊 Status Report */
    status: async () => {
        robotLog("\n📊 GAMEMASTER: Generating Status Report...")
        const tracksPath = path.join(REPO_ROOT, ".agent/tasks/tracks.md")

        if (!fs.existsSync(tracksPath)) {
            const msg = "❌ Missing .agent/tasks/tracks.md"
            if (IS_JSON) console.log(JSON.stringify({ error: msg }))
            else robotError(msg)
            return
        }

        const content = fs.readFileSync(tracksPath, "utf-8")
        const lines = content.split("\n")

        const summary = {
            active: [],
            completed: [],
        }

        let currentTrack = null

        for (const line of lines) {
            if (line.startsWith("##")) {
                const isComplete = line.includes("✅")
                // FIX: Added 'u' flag to regex for unicode emoji support
                const name = line
                    .replace(/##\s*[✅⭕🔁]\s*Track:\s*/u, "")
                    .trim()
                currentTrack = {
                    name,
                    path: "",
                    status: isComplete ? "completed" : "active",
                }
                if (isComplete) summary.completed.push(currentTrack)
                else summary.active.push(currentTrack)
            } else if (line.trim().startsWith("- Path:") && currentTrack) {
                currentTrack.path = line.replace("- Path:", "").trim()
            }
        }

        if (IS_JSON) {
            console.log(
                JSON.stringify({
                    active_count: summary.active.length,
                    completed_count: summary.completed.length,
                    tracks: [...summary.active, ...summary.completed],
                })
            )
        } else {
            robotLog("\n--- Track Summary ---")
            summary.active.forEach((t) => robotLog(`⭕ ${t.name}`))
            summary.completed.forEach((t) => robotLog(`✅ ${t.name}`))
            robotLog(
                `\nActive: ${summary.active.length} | Completed: ${summary.completed.length}`
            )
            robotLog("----------------------")
        }
    },
}

async function main() {
    // Filter out --json from args to get the actual command and its primary arg
    const args = process.argv.slice(2).filter((a) => a !== "--json")
    const cmd = args[0] || "bootstrap"
    const arg = args[1]

    if (!COMMANDS[cmd]) {
        const errorMsg = `Unknown command. Available: sync, archive, hygiene, bootstrap, status`
        if (IS_JSON) {
            console.log(JSON.stringify({ error: errorMsg, code: 2 }))
        } else {
            robotError(`❌ ${errorMsg}`)
        }
        process.exit(1)
    }

    await COMMANDS[cmd](arg)
}

main().catch((err) => {
    console.error("❌ Gamemaster Error:", err.message)
    process.exit(1)
})
