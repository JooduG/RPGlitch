import { execSync } from "child_process"

/**
 * Smart Router for Knowledge Retrieval
 * Routes queries between local Pinecone (Meta/Src) and External Docs (Context7/Svelte)
 */

const LIBRARY_REGISTRY = {
    svelte: {
        id: "/sveltejs/svelte",
        mcp: "mcp_svelte_getdocumentation",
        description: "Core Svelte 5 documentation and runes.",
        aliases: ["svelte", "svelge", "svlt"],
    },
    dexie: {
        id: "/dexie/dexie.js",
        mcp: "mcp_context7_querydocs",
        description: "IndexedDB wrapper and reactive queries.",
    },
    pico: {
        id: "/picocss/pico",
        mcp: "mcp_context7_querydocs",
        description: "Semantic CSS framework and design tokens.",
    },
    vite: {
        id: "/vitejs/vite",
        mcp: "mcp_context7_querydocs",
        description: "Build tool and dev server configuration.",
    },
    supabase: {
        id: "/supabase/supabase",
        mcp: "mcp_supabase-mcp-server_search_docs",
        description: "Database and authentication documentation.",
    },
}

async function routeQuery(query) {
    const q = query.toLowerCase()
    let source = "local" // Default to local

    // Identify which external libraries are mentioned (check name and aliases)
    const mentionedLibs = Object.keys(LIBRARY_REGISTRY).filter(
        (lib) =>
            q.includes(lib) ||
            (LIBRARY_REGISTRY[lib].aliases &&
                LIBRARY_REGISTRY[lib].aliases.some((alias) =>
                    q.includes(alias)
                ))
    )
    const hasExternal =
        mentionedLibs.length > 0 ||
        KEYWORDS_EXTERNAL.some((word) => q.includes(word))
    const hasInternal = KEYWORDS_INTERNAL.some((word) => q.includes(word))

    if (hasExternal && !hasInternal) {
        source = "external"
    } else if (hasExternal && hasInternal) {
        source = "hybrid"
    }

    console.log(
        `🎯 Routing query: "${query}" -> SOURCE: ${source.toUpperCase()}`
    )

    const results = {
        notification:
            "[RAG NOTIFICATION: The following results are retrieved from your knowledge base. Please cite these sources in your response.]",
        local: null,
        external: null,
        routing: source,
        recommendations: [],
    }

    // 1. Local Search (Meta Layer)
    if (source === "local" || source === "hybrid") {
        try {
            const outputMeta = execSync(
                `node tools/consult-meta.js "${query.replace(/"/g, '\\"')}" knowledge-base.meta`,
                { encoding: "utf-8" }
            )
            results.local = outputMeta
        } catch (e) {
            console.error("❌ Meta search failed:", e.message)
        }
    }

    // 2. External Search (External Namespace)
    if (source === "external" || source === "hybrid") {
        try {
            const outputExt = execSync(
                `node tools/consult-meta.js "${query.replace(/"/g, '\\"')}" knowledge-base.external`,
                { encoding: "utf-8" }
            )
            if (results.local) {
                results.local += `\n--- EXTERNAL DOCS ---\n${outputExt}`
            } else {
                results.local = outputExt
            }
        } catch (e) {
            console.error("❌ External search failed:", e.message)
        }
    }

    // 3. Generate Specific Tool Recommendations
    if (source === "external" || source === "hybrid") {
        let guide = `[DEEP RESEARCH RECOMMENDED] If the above snippets are insufficient, use these authoritative tools:\n`

        mentionedLibs.forEach((lib) => {
            const reg = LIBRARY_REGISTRY[lib]
            guide += `- For ${lib.toUpperCase()}: Use ${reg.mcp} with ID: "${reg.id}"\n`
            results.recommendations.push({ lib, ...reg })
        })

        if (mentionedLibs.length === 0) {
            guide += `- Generic: Use mcp_context7_querydocs or search_web for general queries.\n`
        }

        results.external = guide
    }

    return results
}

// CLI Interface
if (
    process.argv[1] &&
    (process.argv[1].endsWith("consult-knowledge.js") ||
        process.argv[1].endsWith("consult-knowledge"))
) {
    const query = process.argv.slice(2).join(" ")
    if (!query) {
        console.error('Usage: node tools/consult-knowledge.js "<query>"')
        process.exit(1)
    }

    routeQuery(query).then((res) => {
        if (res.local) {
            console.log("\n--- LOCAL KNOWLEDGE ---")
            console.log(res.local)
        }
        if (res.external) {
            console.log("\n--- EXTERNAL KNOWLEDGE ---")
            console.log(res.external)
        }
    })
}

export { routeQuery }
