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

        if (IS_JSON) {
            console.log(JSON.stringify(report))
        } else {
            if (report.passed) {
                robotLog("✅ Audit Complete.")
            } else {
                robotError("❌ Audit Failed.")
            }
        }

        if (!report.passed) process.exit(1)
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
