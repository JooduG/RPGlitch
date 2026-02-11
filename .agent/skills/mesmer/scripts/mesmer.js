/**
 * MESMER: The Visual CLI
 * Guardian of the "Chalk Regime"
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")

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

const MESMER = {
    /** 🎭 Scan for Visual Violations */
    analyze: async () => {
        robotLog("\n🎭 MESMER: Scanning for Aesthetic Violations...")

        let violations = 0
        const issues = []

        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return
            const items = fs.readdirSync(dir)
            for (const item of items) {
                const fullPath = path.join(dir, item)
                const stat = fs.statSync(fullPath)

                if (stat.isDirectory()) {
                    scanDir(fullPath)
                } else if (/\.(svelte|scss|css)$/i.test(item)) {
                    const content = fs.readFileSync(fullPath, "utf-8")
                    const lines = content.split("\n")

                    lines.forEach((line, i) => {
                        // 1. Hex Code Violation (Rule 06)
                        if (
                            /#([0-9A-Fa-f]{3}){1,2}\b/.test(line) &&
                            !line.includes("url(")
                        ) {
                            // Allow hex in some contexts? No, Chalk Regime says vars only.
                            // Exception: explicit ignores or root definitions?
                            if (line.includes("var(")) return // Likely fallback

                            violations++
                            issues.push({
                                file: path.relative(REPO_ROOT, fullPath),
                                line: i + 1,
                                message:
                                    "Hex code found. Use var(--app-...) tokens.",
                                code: line.trim(),
                            })
                        }

                        // 2. Pixel Border Violation (Rule 06: No Borders)
                        if (/border:\s*[1-9]px/.test(line)) {
                            violations++
                            issues.push({
                                file: path.relative(REPO_ROOT, fullPath),
                                line: i + 1,
                                message:
                                    "Pixel border found. Use shadows for depth.",
                                code: line.trim(),
                            })
                        }
                    })
                }
            }
        }

        scanDir(path.join(REPO_ROOT, "src"))

        if (IS_JSON) {
            console.log(JSON.stringify({ violations, issues }))
        } else {
            if (violations === 0) {
                robotLog(
                    "✅ No aesthetic violations found. The Chalk Regime is intact."
                )
            } else {
                robotLog(`❌ Found ${violations} violations.`)
                issues.forEach((issue) => {
                    console.log(
                        `  - ${issue.file}:${issue.line} -> ${issue.message}`
                    )
                })
                process.exit(1)
            }
        }
    },

    /** 🎨 Scaffold New Theme Tokens */
    scaffold: async () => {
        robotLog("\n🎨 MESMER: Scaffolding Theme Tokens...")
        // To be implemented: Generates a new _theme.scss file from a palette object
        robotLog("Feature pending implementation.")
    },
}

async function main() {
    const args = process.argv.slice(2).filter((a) => a !== "--json")
    const cmd = args[0] || "analyze"
    if (MESMER[cmd]) {
        await MESMER[cmd]()
    } else {
        const msg = `Unknown command: ${cmd}`
        robotError(`❌ ${msg}`)
        process.exit(1)
    }
}

main()
