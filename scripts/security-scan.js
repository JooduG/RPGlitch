import fs from "fs"
import path from "path"

/**
 * Modern Node.js Security & Hygiene Scanner
 * Ported from legacy Warden security_scan.sh
 */

const TARGET_DIR = path.resolve(process.cwd(), "src")
const EXCLUDE_DIRS = ["node_modules", ".git", "dist", ".svelte-kit"]

const RULES = [
    {
        name: "Secrets Detection",
        pattern: /API_KEY|SECRET|TOKEN/i,
        severity: "HIGH",
        message: "Potential secret found (API_KEY, SECRET, or TOKEN).",
    },
    {
        name: "Dangerous Functions",
        pattern: /eval\(|document\.write\(|innerHTML\s*=/i,
        severity: "CRITICAL",
        message:
            "Dangerous function usage (eval, document.write, or innerHTML).",
    },
]

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")
    const findings = []

    lines.forEach((line, index) => {
        RULES.forEach((rule) => {
            if (rule.pattern.test(line)) {
                findings.push({
                    file: path.relative(process.cwd(), filePath),
                    line: index + 1,
                    rule: rule.name,
                    severity: rule.severity,
                    message: rule.message,
                    snippet: line.trim(),
                })
            }
        })
    })

    return findings
}

function walk(dir, callback) {
    const files = fs.readdirSync(dir)
    files.forEach((file) => {
        const filePath = path.join(dir, file)
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                walk(filePath, callback)
            }
        } else if (stats.isFile()) {
            if (/\.(js|ts|svelte|html|scss)$/.test(file)) {
                callback(filePath)
            }
        }
    })
}

console.log("🛡️ Meridian: Initiating Security & Hygiene Scan...")

const allFindings = []
walk(TARGET_DIR, (filePath) => {
    const findings = scanFile(filePath)
    allFindings.push(...findings)
})

if (allFindings.length === 0) {
    console.log("✅ No security or hygiene issues found in src/")
} else {
    console.warn(`⚠️ Found ${allFindings.length} potential issues:\n`)
    allFindings.forEach((f) => {
        console.log(`[${f.severity}] ${f.file}:${f.line} - ${f.rule}`)
        console.log(`   Message: ${f.message}`)
        console.log(`   Context: ${f.snippet}\n`)
    })
}
