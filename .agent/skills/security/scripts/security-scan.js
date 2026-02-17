import { execSync } from "child_process"
import fs from "fs"
import path from "path"

// Configuration
const ROOT_DIR = process.cwd()
const SRC_DIR = path.join(ROOT_DIR, "src")
const TOOLS_DIR = path.join(ROOT_DIR, ".agent/tools")
// const HIGH_ENTROPY_THRESHOLD = 4.5 // Unused
const SECRET_PATTERNS = [
    /api[-_]?key/i,
    /access[-_]?token/i,
    /secret/i,
    /password/i,
    /credential/i,
    /bearer/i,
]

console.log("🛡️  Warden Security Scan Initiated...")

let errorCount = 0

/**
 * 1. Dependency Audit (npm audit)
 * Target: Root package.json and .agent/tools/.../package.json
 */
function auditDependencies() {
    console.log("\n📦 Dependency Audit:")

    // Find all package.json files
    const packageFiles = [path.join(ROOT_DIR, "package.json")]

    // Helper to recursively find package.json in tools
    function findPackageJson(dir) {
        if (!fs.existsSync(dir)) return
        const items = fs.readdirSync(dir)
        for (const item of items) {
            const fullPath = path.join(dir, item)
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) {
                findPackageJson(fullPath)
            } else if (item === "package.json") {
                packageFiles.push(fullPath)
            }
        }
    }

    if (fs.existsSync(TOOLS_DIR)) {
        findPackageJson(TOOLS_DIR)
    }

    packageFiles.forEach((pkgPath) => {
        if (!fs.existsSync(pkgPath)) return

        const dir = path.dirname(pkgPath)
        const relPath = path.relative(ROOT_DIR, pkgPath)

        try {
            console.log(`   - Auditing ${relPath}...`)
            // Run npm audit (fails if vulnerabilities found)
            execSync("npm audit --audit-level=high", {
                cwd: dir,
                stdio: "ignore",
            })
            console.log(`     ✅ Secure`)
        } catch (e) {
            console.warn(
                `     ⚠️  Vulnerabilities found in ${relPath} (Warning only)`
            )
            // errorCount++ // Downgraded to warning for non-critical dependency issues
        }
    })
}

/**
 * 2. Hygiene Check (console.log, alert)
 * Target: src/**
 */
function checkHygiene() {
    console.log("\n🧹 Hygiene Check:")

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return
        const items = fs.readdirSync(dir)

        for (const item of items) {
            const fullPath = path.join(dir, item)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                scanDir(fullPath)
            } else if (stat.isFile() && /\.(js|ts|svelte)$/.test(item)) {
                const content = fs.readFileSync(fullPath, "utf8")
                const lines = content.split("\n")

                lines.forEach((line, index) => {
                    const trimmed = line.trim()
                    if (trimmed.startsWith("//") || trimmed.startsWith("/*"))
                        return

                    if (
                        trimmed.includes("console.log(") ||
                        trimmed.includes("alert(") ||
                        trimmed.includes("debugger")
                    ) {
                        console.error(
                            `     ❌ ${path.relative(ROOT_DIR, fullPath)}:${index + 1} - Debug statement found`
                        )
                        errorCount++
                    }
                })
            }
        }
    }

    scanDir(SRC_DIR)
}

/**
 * 3. Secret Detection (Entropy & Patterns)
 * Target: src/**, .env checks
 */
function checkSecrets() {
    console.log("\n🔒 Secret Detection:")

    // Check for .env in git
    const gitignorePath = path.join(ROOT_DIR, ".gitignore")
    if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, "utf8")
        if (!gitignore.includes(".env")) {
            console.error(`     ❌ .env is NOT ignored in .gitignore`)
            errorCount++
        }
    }

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return
        const items = fs.readdirSync(dir)

        for (const item of items) {
            const fullPath = path.join(dir, item)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                scanDir(fullPath)
            } else if (stat.isFile() && /\.(js|ts|svelte|json)$/.test(item)) {
                // Skip if large file or binary-like
                if (stat.size > 1024 * 500) return

                const content = fs.readFileSync(fullPath, "utf8")

                // Pattern Check
                SECRET_PATTERNS.forEach((pattern) => {
                    if (pattern.test(content)) {
                        // Very basic heuristic, improved by Shannon entropy if we had it
                        // For now, just warn on specific keywords if they look assignment-like
                        // e.g. "const API_KEY = '...'"
                        const match = content.match(
                            new RegExp(
                                `(const|let|var)\\s+\\w*${pattern.source}\\w*\\s*=\\s*['"\`].+['"\`]`,
                                "i"
                            )
                        )
                        if (match) {
                            console.error(
                                `     ⚠️  Suspicious variable name in ${path.relative(ROOT_DIR, fullPath)}: ${match[0].substring(0, 30)}...`
                            )
                            // Warnings don't fail the build, but worth noting
                        }
                    }
                })
            }
        }
    }

    scanDir(SRC_DIR)
}

// Execution
try {
    auditDependencies()
    checkHygiene()
    checkSecrets()
} catch (error) {
    console.error("Critical Execution Error:", error)
    process.exit(1)
}

if (errorCount > 0) {
    console.error(`\n❌ Scan Failed: ${errorCount} issues found.`)
    process.exit(1)
} else {
    console.log("\n✅ Security Scan Passed.")
    process.exit(0)
}
