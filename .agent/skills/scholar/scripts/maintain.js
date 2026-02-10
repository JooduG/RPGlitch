#!/usr/bin/env node
import { maintainScholar } from "./memory_engine.js"

const IS_JSON = process.argv.includes("--json")

const robotLog = (...args) => {
    if (IS_JSON) console.error(...args)
    else console.log(...args)
}

async function main() {
    const args = process.argv.slice(2).filter((a) => a !== "--json")
    const scopeIndex = args.indexOf("--scope")
    const scope = scopeIndex !== -1 ? args[scopeIndex + 1] : "basics"

    try {
        await maintainScholar({ scope })
        if (IS_JSON) console.log(JSON.stringify({ status: "success", scope }))
        else console.log("✅ Maintenance Complete.")
    } catch (e) {
        if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
        else console.error("❌ Maintenance Failed:", e.message)
        process.exit(1)
    }
}

main().catch(console.error)
