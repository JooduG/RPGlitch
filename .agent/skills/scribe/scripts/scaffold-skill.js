#!/usr/bin/env node

/**
 * File: .agent/skills/scribe/scripts/scaffold-skill.js
 * Purpose: Scaffolds skill directories (lean) and audits structure (strict).
 */

const fs = require("fs")
const path = require("path")

// --- CONFIGURATION ---
const SKILL_ROOT = path.join(".agent", "skills")
const TEMPLATE_PATH = path.join(__dirname, "../templates/SKILL.md")

// Strict Whitelist: Only these folders are allowed inside a skill directory
const ALLOWED_FOLDERS = ["knowledge", "scripts", "templates", "docs", "tests"]

// --- HELPER FUNCTIONS ---
function toKebabCase(str) {
    return str
        .match(
            /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
        )
        .map((x) => x.toLowerCase())
        .join("-")
}

function titleCase(str) {
    return str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

// --- 1. CREATION LOGIC ---
function createSkill(name, description = "New agentic skill.") {
    const handle = toKebabCase(name) // This is the "slug"
    const title = titleCase(handle)
    const targetDir = path.join(SKILL_ROOT, handle)

    if (fs.existsSync(targetDir)) {
        console.error(`❌ FAIL: Skill '${handle}' already exists.`)
        return
    }

    // 1. Read Template
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error(`❌ CRITICAL: Template not found at ${TEMPLATE_PATH}`)
        process.exit(1)
    }
    let content = fs.readFileSync(TEMPLATE_PATH, "utf8")

    // 2. Inject Data
    content = content.replace(/\[skill-slug\]/g, handle)
    content = content.replace(/\[Skill Title\]/g, title)
    content = content.replace(/\[Description\]/g, description)

    // 3. Write Structure (Lean Mode: No empty folders)
    console.log(`🔨 Constructing: ${handle}...`)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.join(targetDir, "SKILL.md"), content)

    console.log(`✅ PASS: Skill deployed at ${targetDir}`)
    console.log(`   📄 SKILL.md created`)
    console.log(
        `   (Subfolders 'scripts/' or 'knowledge/' were skipped. Create them only when needed.)`
    )
}

// --- 2. VERIFICATION LOGIC ---
function verifySkill(name) {
    const targetDir = path.join(SKILL_ROOT, name)
    const skillFile = path.join(targetDir, "SKILL.md")
    const issues = []
    const warnings = []

    // Rule 1: Directory name must be a slug (kebab-case)
    if (name !== toKebabCase(name)) {
        issues.push(`Dir name '${name}' should be '${toKebabCase(name)}'`)
    }

    // Rule 2: SKILL.md must exist
    if (!fs.existsSync(skillFile)) {
        issues.push("Missing SKILL.md")
    } else {
        // Rule 3: Frontmatter check
        const content = fs.readFileSync(skillFile, "utf8")
        if (!content.includes("description:"))
            issues.push("SKILL.md missing 'description'")
    }

    // Rule 4: Strict Folder Whitelist
    // We scan the directory for ANY other folder that isn't in ALLOWED_FOLDERS
    if (fs.existsSync(targetDir)) {
        const items = fs.readdirSync(targetDir, { withFileTypes: true })

        items.forEach((item) => {
            if (item.isDirectory()) {
                if (!ALLOWED_FOLDERS.includes(item.name)) {
                    issues.push(
                        `⛔ Illegal folder detected: '${item.name}/'. Allowed: ${ALLOWED_FOLDERS.join(", ")}`
                    )
                }
            }
        })
    }

    return {
        valid: issues.length === 0,
        issues,
        warnings,
    }
}

// --- 3. AUDIT LOGIC ---
function auditAll() {
    console.log("🔍 Auditing Agent Skills...")

    if (!fs.existsSync(SKILL_ROOT)) {
        console.error(`❌ FAIL: Skill root not found at ${SKILL_ROOT}`)
        return
    }

    const skills = fs
        .readdirSync(SKILL_ROOT, { withFileTypes: true })
        .filter(
            (dirent) => dirent.isDirectory() && !dirent.name.startsWith("_")
        )
        .map((dirent) => dirent.name)

    let validCount = 0

    console.log(`${"SKILL".padEnd(30)} | ${"STATUS".padEnd(10)} | ISSUES`)
    console.log("-".repeat(90))

    skills.forEach((skillName) => {
        const result = verifySkill(skillName)
        const status = result.valid ? "PASS" : "FAIL"

        // ANSI Colors: Green for Pass, Red for Fail
        const color = result.valid ? "\x1b[32m" : "\x1b[31m"
        const reset = "\x1b[0m"

        let outputStr = result.issues.join(", ")

        console.log(
            `${skillName.padEnd(30)} | ${color}${status.padEnd(10)}${reset} | ${outputStr}`
        )

        if (result.valid) validCount++
    })

    console.log("-".repeat(90))
    console.log(
        `Audit Complete: ${validCount}/${skills.length} skills compliant.`
    )

    if (validCount < skills.length) process.exit(1)
}

// --- MAIN DISPATCHER ---
const args = process.argv.slice(2)
if (args.length < 1) {
    console.log(
        "Usage: node scaffold-skill.js [create|audit] [name] [description]"
    )
    process.exit(1)
}

const command = args[0]

if (command === "create") {
    if (args.length < 2) {
        console.error("❌ FAIL: Usage: create <name> [description]")
        process.exit(1)
    }
    createSkill(args[1], args[2])
} else if (command === "audit") {
    auditAll()
} else {
    console.error(`❌ FAIL: Unknown command: ${command}`)
    process.exit(1)
}
