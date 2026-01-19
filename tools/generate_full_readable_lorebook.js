import fs from "fs"
import path from "path"

const lorebookPath = path.resolve("ANEX_Lorebook.json")
const outputPath = path.resolve("ANEX_Lorebook_Readable.md")

/**
 * Formats text to be more readable and lint-compliant.
 * - Wraps XML-like content in code blocks.
 * - Escapes individual tags if they appear in text that isn't primarily code.
 * @param {string} text
 * @returns {string}
 */
function formatContent(text) {
    if (!text || text.trim() === "") return "(No Content)"

    // Heuristic: If it contains significantly structured XML/HTML tags, wrap it.
    // We look for closing tags </...> or self-closing tags <.../> or block structure <TAG>...</TAG>
    const hasXmlStructure =
        /<\/[a-zA-Z]+>|<[a-zA-Z]+[^>]*\/>/.test(text) ||
        /<([A-Z_]+)[^>]*>[\s\S]*?<\/\1>/i.test(text)

    // Also check if it looks like a Prompt template with {{...}} and tags inside
    const hasHandlebars = text.includes("{{") && text.includes("}}")

    if (hasXmlStructure || (hasHandlebars && text.includes("<"))) {
        return "```xml\n" + text + "\n```"
    }

    // If it has isolated tags but not a full structure, strictly escaping might be better to avoid MD033
    // But for readability, users often prefer code blocks if there is ANY code.
    // Let's being aggressive with code blocks for this specific "Developer/prompter" audience.
    if (text.includes("<") && text.includes(">")) {
        return "```xml\n" + text + "\n```"
    }

    return text
}

try {
    const rawData = fs.readFileSync(lorebookPath, "utf8")
    const lorebook = JSON.parse(rawData)

    let output = `# ANEX Lorebook Readable View\n\n`
    output += `> **Note:** This file is generated for readability. Edits here will NOT affect the JSON file.\n`
    output += `> **Generated from:** ${lorebookPath}\n\n`

    // Process Prompts
    if (lorebook.prompts && Array.isArray(lorebook.prompts)) {
        output += `## Prompts\n\n`
        lorebook.prompts.forEach((entry) => {
            // Use H3 for entries
            output += `### ${entry.name || "Untitled Prompt"}\n\n`
            if (entry.identifier)
                output += `**ID:** \`${entry.identifier}\`\n\n`

            output += formatContent(entry.content) + "\n\n"
            output += `---\n\n`
        })
    }

    // Process Entries
    if (lorebook.entries && typeof lorebook.entries === "object") {
        output += `## Lorebook Entries\n\n`

        // Convert object to array and sort by order or uid
        const entries = Object.values(lorebook.entries).sort((a, b) => {
            return (a.display_index || 0) - (b.display_index || 0)
        })

        entries.forEach((entry) => {
            const title = entry.comment || `Entry ${entry.uid}`
            // Use H3 for entries
            const header = entry.disable ? `~~${title}~~ (Disabled)` : title

            output += `### ${header}\n\n`

            if (entry.key && entry.key.length > 0) {
                output += `**Keywords:** \`${entry.key.join(", ")}\`\n\n`
            }

            output += formatContent(entry.content) + "\n\n"
            output += `---\n\n`
        })
    }

    fs.writeFileSync(outputPath, output)
    console.log(
        `Successfully generated ${outputPath} with fixed headers and formatting.`
    )
} catch (error) {
    console.error("Error processing lorebook:", error)
    process.exit(1)
}
