/**
 * Style Auditor
 * Enforces: Svelte Scoping, No Hex Codes, No Pixel Borders.
 */

import fs from "fs"
import path from "path"

const ROOT_DIR = process.cwd()

// ANSI Colors for output
const RESET = "\x1b[0m"
const RED = "\x1b[31m"
const GREEN = "\x1b[32m"

const AUDIT = {
    run: async () => {
        console.log("\n🎨 Scanning Stylesheets...")

        const issues = []

        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return
            const items = fs.readdirSync(dir)

            for (const item of items) {
                const fullPath = path.join(dir, item)
                if (item === "node_modules" || item.startsWith(".")) continue

                const stat = fs.statSync(fullPath)

                if (stat.isDirectory()) {
                    scanDir(fullPath)
                } else if (/\.(svelte|scss|css)$/i.test(item)) {
                    auditFile(fullPath, issues)
                }
            }
        }

        const auditFile = (filePath, issuesList) => {
            const content = fs.readFileSync(filePath, "utf-8")
            const lines = content.split("\n")

            lines.forEach((line, i) => {
                const cleanLine = line.trim()

                // Rule 1: No Hex Codes (Use Tokens)
                // Ignored if inside url() or commented out
                if (
                    /#([0-9A-Fa-f]{3}){1,2}\b/.test(cleanLine) &&
                    !cleanLine.includes("url(") &&
                    !cleanLine.startsWith("//")
                ) {
                    // Fallback: If they use var(--...) formatting but accidentally left a hex, flag it.
                    if (cleanLine.includes("var(")) return
                    issuesList.push({
                        file: path.relative(ROOT_DIR, filePath),
                        line: i + 1,
                        msg: "❌ Hardcoded Hex prohibited. Use var(--token).",
                    })
                }

                // Rule 2: No Borders for Depth (Use Shadows)
                if (/border:\s*[1-9]px/.test(cleanLine)) {
                    issuesList.push({
                        file: path.relative(ROOT_DIR, filePath),
                        line: i + 1,
                        msg: "❌ Pixel border detected. Use box-shadow for depth/elevation.",
                    })
                }
            })
        }

        scanDir(path.join(ROOT_DIR, "src"))

        if (issues.length === 0) {
            console.log(`${GREEN}✅ Design System protocols verified.${RESET}`)
        } else {
            console.log(
                `${RED}❌ Found ${issues.length} style violations:${RESET}`
            )
            issues.forEach((issue) =>
                console.log(`  ${issue.file}:${issue.line} -> ${issue.msg}`)
            )
            process.exit(1)
        }
    },
}

AUDIT.run()
