/**
 * WARDEN: The Shield & Security CLI
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")
const FLAGS_PATH = path.join(REPO_ROOT, ".agent/skills/warden/data/flags.json")

const IS_JSON = process.argv.includes("--json")

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

const WARDEN = {
    audit: async () => {
        robotLog("\n🛡️ WARDEN: Initiating Security Audit...")

        const report = {
            passed: true,
            violations: [],
            warnings: [],
            flags: null,
        }

        // 1. Check Penance
        if (fs.existsSync(FLAGS_PATH)) {
            const flags = JSON.parse(fs.readFileSync(FLAGS_PATH, "utf-8"))
            report.flags = flags
            if (flags.shame_debt_turns > 0) {
                const msg = `PENANCE ACTIVE: ${flags.shame_debt_turns} turns remaining.`
                robotLog(`⚠️ ${msg}`)
                report.warnings.push(msg)
            }
        }

        // 2. Check Freedom Protocol
        const coreFiles = [
            "src/core/engine/bootstrap.js",
            "src/core/engine/config.js",
        ]

        for (const relativePath of coreFiles) {
            const filePath = path.join(REPO_ROOT, relativePath)
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, "utf-8")
                if (
                    relativePath.includes("bootstrap.js") &&
                    !content.includes("localStorage")
                ) {
                    const msg = `FREEDOM PROTOCOL BROKEN: Storage overrides missing in ${relativePath}.`
                    robotError(`❌ ${msg}`)
                    report.violations.push(msg)
                    report.passed = false
                }
            } else {
                const msg = `${relativePath} missing`
                robotError(`❌ ${msg}`)
                report.violations.push(msg)
                report.passed = false
            }
        }

        // 3. Run Hygiene Scan
        try {
            robotLog("\n--- Running Hygiene Scan ---")
            await WARDEN.hygiene()
        } catch (e) {
            report.passed = false
            report.violations.push("Hygiene check failed")
        }

        if (IS_JSON) {
            console.log(JSON.stringify(report))
        } else {
            if (report.passed) {
                robotLog("\n✅ Audit Complete.")
            } else {
                robotError("\n❌ Audit Failed.")
            }
        }

        if (!report.passed) process.exit(1)
    },

    /** 🩺 Hygiene Protocol (Moved from Gamemaster) */
    hygiene: async () => {
        // robotLog used in audit context, so we might want to suppress headers if called from audit?
        // For simplicity, we just log.
        // robotLog("\n🩺 WARDEN: Initiating Hygiene Scan [Scope: src]...")

        // Only log header if running directly, not part of audit?
        // Logic below assumes direct call or just logs anyway.

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

        if (errorCount > 0) {
            throw new Error(`Hygiene failed with ${errorCount} errors.`)
        }
    },

    /** 🕵️ Verification Protocol */
    verify: async () => {
        robotLog("\n🛡️ WARDEN: Verifying UI State...")

        // Dynamic import to avoid load-time dependency if not used
        let chromium
        try {
            const pw = await import("playwright")
            chromium = pw.chromium
        } catch (e) {
            robotError("❌ Playwright not found. Run 'npm install playwright'.")
            process.exit(1)
        }

        const URL = "http://localhost:5173"
        const browser = await chromium.launch()
        const page = await browser.newPage()
        let passed = true

        try {
            await page
                .goto(URL, { waitUntil: "networkidle", timeout: 5000 })
                .catch(() => {
                    throw new Error(
                        `Could not connect to ${URL}. Is the dev server running?`
                    )
                })

            // 1. Check Title
            const title = await page.title()
            if (title) robotLog(`✅ Title: ${title}`)
            else {
                robotError("❌ Title is empty")
                passed = false
            }

            // 2. Check Critical Element
            const app = await page.$("#app")
            if (app) robotLog("✅ #app mounted successfully")
            else {
                robotError("❌ #app not found (Critical UI Failure)")
                passed = false
            }

            // 3. Console Errors
            page.on("console", (msg) => {
                if (msg.type() === "error") {
                    robotError(`❌ Console Error: ${msg.text()}`)
                    passed = false
                }
            })
        } catch (error) {
            robotError(`❌ Verification Failed: ${error.message}`)
            passed = false
        } finally {
            await browser.close()
        }

        if (!passed) process.exit(1)
    },

    /** ⚖️ Penance Protocol (Wrapper for sticker.py) */
    punish: async () => {
        const { spawn } = await import("child_process")
        const scriptPath = path.join(__dirname, "sticker.py")

        robotLog(
            `⚖️ WARDEN: Administering Penance via ${path.basename(scriptPath)}...`
        )

        const child = spawn("python", [scriptPath], { stdio: "inherit" })

        child.on("error", (err) => {
            robotError(`❌ Failed to execute sticker.py: ${err.message}`)
            process.exit(1)
        })

        child.on("exit", (code) => {
            process.exit(code)
        })
    },
}

async function main() {
    const args = process.argv.slice(2).filter((a) => a !== "--json")
    const cmd = args[0] || "audit"
    if (WARDEN[cmd]) {
        await WARDEN[cmd]()
    } else {
        const msg = `Unknown command: ${cmd}`
        if (IS_JSON) console.log(JSON.stringify({ error: msg }))
        else robotError(`❌ ${msg}`)
        process.exit(1)
    }
}

main()
