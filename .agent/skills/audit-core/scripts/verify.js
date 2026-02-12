import fs from "fs"

function verifyFile(filepath) {
    /**
     * Scans a file for banned Svelte 4 legacy syntax.
     */
    try {
        const content = fs.readFileSync(filepath, "utf-8")
        const issues = []

        // Runes Compliance
        if (content.includes("export let")) {
            issues.push("CRITICAL: Found 'export let'. Use '$props()' instead.")
        }

        // Reactivity Check ($: label)
        // Regex looks for $: at the start of a line or after a newline/space
        if (/^\s*\$:\s/m.test(content)) {
            issues.push(
                "CRITICAL: Found '$:'. Use '$derived()' or '$effect()' instead."
            )
        }

        // Legacy Event Dispatcher
        if (content.includes("createEventDispatcher")) {
            issues.push(
                "CRITICAL: Found 'createEventDispatcher'. Use callback props instead."
            )
        }

        return issues
    } catch (err) {
        console.error(`Error reading file ${filepath}:`, err)
        process.exit(1)
    }
}

function main() {
    if (process.argv.length < 3) {
        console.log("Usage: node verify.js <file_path>")
        process.exit(1)
    }

    const targetFile = process.argv[2]

    if (!fs.existsSync(targetFile)) {
        console.log(`File not found: ${targetFile}`)
        process.exit(1)
    }

    const issues = verifyFile(targetFile)

    if (issues.length > 0) {
        console.log(`❌ Verification FAILED for ${targetFile}:`)
        issues.forEach((issue) => console.log(`  - ${issue}`))
        process.exit(1)
    } else {
        console.log(`✅ Verification PASSED for ${targetFile}`)
        process.exit(0)
    }
}

main()
