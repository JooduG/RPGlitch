#!/usr/bin/env node
import {
    ingestScholar,
    maintainScholar,
    searchScholar,
} from "./memory_engine.js"

/**
 * 📚 Scholar CLI
 * -------------------------------------------------------------------------
 * The central interface for Memory and Research operations.
 * Usage:
 * node .agent/skills/scholar/scripts/scholar.js read "How do I..."
 * node .agent/skills/scholar/scripts/scholar.js write --path src/ --namespace knowledge-base.src
 * node .agent/skills/scholar/scripts/scholar.js maintain --scope all
 * -------------------------------------------------------------------------
 */

const IS_JSON = process.argv.includes("--json")

const robotLog = (...args) => {
    if (IS_JSON) console.error(...args)
    else console.log(...args)
}

const COMMANDS = {
    /** 🔍 Read (Search) */
    read: async (query) => {
        robotLog(`🔍 Scholar: Reading Memory for "${query}"...`)
        try {
            const matches = await searchScholar({ query })

            if (IS_JSON) {
                console.log(
                    JSON.stringify({
                        query,
                        count: matches.length,
                        results: matches.map((m) => ({
                            score: m.score,
                            source: m.metadata.source,
                            content: m.metadata.content,
                        })),
                    })
                )
            } else {
                if (matches.length === 0)
                    console.log("❌ No relevant context found.")
                matches.forEach((m, i) => {
                    console.log(
                        `\n--- [${i + 1}] Score: ${(m.score * 100).toFixed(1)}% | Source: ${m.metadata.source} ---`
                    )
                    console.log(
                        m.metadata.content.slice(0, 300).replace(/\n/g, " ") +
                            "..."
                    )
                })
            }
        } catch (e) {
            if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
            else console.error("❌ Search Error:", e.message)
            process.exit(1)
        }
    },

    /** 📥 Write (Ingest) */
    write: async () => {
        const pathIdx = process.argv.indexOf("--path")
        const nsIdx = process.argv.indexOf("--namespace")

        const paths =
            pathIdx !== -1 ? [process.argv[pathIdx + 1]] : ["src/data"]
        const namespace =
            nsIdx !== -1 ? process.argv[nsIdx + 1] : "knowledge-base.src"
        //     "knowledge-base.external", // Context7 (Libraries)
        //     "knowledge-base.src",      // Source Code (GitHub/Local)
        //     "knowledge-base.meta",     // Project Rules (DeepWiki/Local)

        robotLog(`📑 Scholar: Ingesting into ${namespace}...`)
        try {
            await ingestScholar({ paths, namespace })
            if (IS_JSON) console.log(JSON.stringify({ status: "success" }))
        } catch (e) {
            if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
            else console.error("❌ Ingestion Failed:", e.message)
            process.exit(1)
        }
    },

    /** 🧹 Maintain (Organize/Prune) */
    maintain: async () => {
        const args = process.argv.slice(2)
        const scopeIndex = args.indexOf("--scope")
        const scope = scopeIndex !== -1 ? args[scopeIndex + 1] : "basics"

        try {
            await maintainScholar({ scope })
            if (IS_JSON)
                console.log(JSON.stringify({ status: "success", scope }))
        } catch (e) {
            if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
            else console.error("❌ Maintenance Failed:", e.message)
            process.exit(1)
        }
    },
}

async function main() {
    const filteredArgs = process.argv.slice(2).filter((a) => a !== "--json")
    const cmd = filteredArgs[0]
    const arg = filteredArgs.slice(1).join(" ")

    if (!COMMANDS[cmd]) {
        if (IS_JSON) console.log(JSON.stringify({ error: "Unknown command" }))
        else
            console.error(
                "❌ Unknown command. Available: read, write, maintain"
            )
        process.exit(1)
    }
    await COMMANDS[cmd](arg)
}

main().catch(console.error)
