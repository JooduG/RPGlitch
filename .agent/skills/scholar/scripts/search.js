#!/usr/bin/env node
import { searchScholar } from "./research_engine.js"

const IS_JSON = process.argv.includes("--json")

const robotLog = (...args) => {
    if (IS_JSON) console.error(...args)
    else console.log(...args)
}

async function main() {
    const args = process.argv.slice(2).filter((a) => a !== "--json")
    const query = args.join(" ")

    if (!query) {
        console.error("❌ Error: Query required.")
        process.exit(1)
    }

    robotLog(`🔍 Searching Memory for "${query}"...`)

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
                    m.metadata.content.slice(0, 300).replace(/\n/g, " ") + "..."
                )
            })
        }
    } catch (e) {
        if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
        else console.error("❌ Search Error:", e.message)
        process.exit(1)
    }
}

main().catch(console.error)
