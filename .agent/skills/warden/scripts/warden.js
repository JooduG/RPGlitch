/**
 * WARDEN: The Shield & Security CLI
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")
const FLAGS_PATH = path.join(REPO_ROOT, ".agent/skills/warden/data/flags.json")

const WARDEN = {
    audit: async () => {
        console.log("\n🛡️ WARDEN: Initiating Security Audit...")

        // 1. Check Penance
        if (fs.existsSync(FLAGS_PATH)) {
            const flags = JSON.parse(fs.readFileSync(FLAGS_PATH, "utf-8"))
            if (flags.shame_debt_turns > 0) {
                console.warn(
                    `⚠️ PENANCE ACTIVE: ${flags.shame_debt_turns} turns remaining.`
                )
            }
        }

        // 2. Check Freedom Protocol
        const bootstrapPath = path.join(
            REPO_ROOT,
            "src/gamemaster/bootstrap.js"
        )
        if (fs.existsSync(bootstrapPath)) {
            const content = fs.readFileSync(bootstrapPath, "utf-8")
            if (!content.includes("localStorage")) {
                console.error(
                    "❌ FREEDOM PROTOCOL BROKEN: Storage overrides missing."
                )
            }
        }

        console.log("✅ Audit Complete.")
    },
}

async function main() {
    const cmd = process.argv[2] || "audit"
    if (WARDEN[cmd]) await WARDEN[cmd]()
}

main()
