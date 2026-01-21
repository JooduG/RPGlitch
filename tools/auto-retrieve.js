import { Pinecone } from "@pinecone-database/pinecone"
import "dotenv/config"

const INDEX_NAME = "lorebook-hybrid"

// Trigger words that indicate the user might benefit from auto-retrieval
const TRIGGER_PATTERNS = [
    /\bhow\s+(do\s+i|to)\b/i,
    /\bwhat\s+(is|are)\b/i,
    /\bexplain\b/i,
    /\bskill\b/i,
    /\brule\b/i,
    /\bsvel(te|ge)?\b/i,
    /\bmigration\b/i,
    /\barchitecture\b/i,
    /\bwarden\b/i,
    /\bscholar\b/i,
    /\bgamemaster\b/i,
    /\bcomponent\b/i,
    /\bchrono\b/i,
    /\becho\b/i,
    /\bartificer\b/i,
    /\bmesmer\b/i,
    /\bprocess\b/i,
    /\bruntime\b/i,
    /\binterface\b/i,
    /\bprotocol\b/i,
]

/**
 * Checks if the user message contains trigger keywords
 */
export function shouldAutoRetrieve(message) {
    return TRIGGER_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Retrieves context from the knowledge base for a user message
 * @param {string} query - User's message
 * @returns {Promise<string>} - Formatted context string (empty if no results)
 */
export async function autoRetrieve(query) {
    if (!process.env.PINECONE_API_KEY) {
        console.warn(
            "[autoRetrieve] Missing PINECONE_API_KEY, skipping retrieval"
        )
        return ""
    }

    try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
        const index = pc.index(INDEX_NAME)

        // Generate embedding
        const embedding = await pc.inference.embed(
            "multilingual-e5-large",
            [query],
            { inputType: "query" }
        )

        // Query Meta, External, and Source namespaces
        const [metaRes, extRes, srcRes] = await Promise.all([
            index.namespace("knowledge-base.meta").query({
                vector: embedding.data[0].values,
                topK: 2,
                includeMetadata: true,
            }),
            index.namespace("knowledge-base.external").query({
                vector: embedding.data[0].values,
                topK: 2,
                includeMetadata: true,
            }),
            index.namespace("knowledge-base.src").query({
                vector: embedding.data[0].values,
                topK: 2,
                includeMetadata: true,
            }),
        ])

        const allMatches = [
            ...metaRes.matches,
            ...extRes.matches,
            ...srcRes.matches,
        ]
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)

        // Check for external keywords to add guidance
        const externalGuide = query
            .toLowerCase()
            .match(/\b(svelte|dexie|pico|vite|vitest|playwright)\b/i)
            ? `\n[EXTERNAL DOCS RECOMMENDED] This query mentions external libraries. 
Use mcp_context7_querydocs or mcp_svelte_getdocumentation for official docs.\n`
            : ""

        if (allMatches.length === 0) {
            return externalGuide
        }

        // Format results
        let context =
            "[RAG NOTIFICATION: The following context was automatically injected from the project knowledge base. You MUST mention the specific sources used in your response to the user.]\n\n"
        context += "📊 SOURCES FOUND:\n"
        allMatches.forEach((m, idx) => {
            context += `- [${idx + 1}] ${m.metadata?.source || "Unknown"}\n`
        })
        context += "\n" + externalGuide
        allMatches.forEach((match, i) => {
            const content = match.metadata?.content || ""
            const source = match.metadata?.source || "Unknown"
            const snippet = content.slice(0, 500)

            context += `\n[${i + 1}] Source: ${source} (Relevance: ${(match.score * 100).toFixed(1)}%)\n`
            context += `${snippet}...\n`
        })

        return context
    } catch (error) {
        console.error("[autoRetrieve] Error:", error.message)
        return ""
    }
}

// CLI Usage: node tools/auto-retrieve.js "your message"
if (process.argv[1].endsWith("auto-retrieve.js")) {
    const message = process.argv[2]
    if (!message) {
        console.error('Usage: node tools/auto-retrieve.js "your message"')
        process.exit(1)
    }

    if (shouldAutoRetrieve(message)) {
        console.log("✅ Trigger detected, retrieving context...\n")
        autoRetrieve(message).then((context) => {
            if (context) {
                console.log(context)
            } else {
                console.log("No relevant context found.")
            }
        })
    } else {
        console.log("❌ No trigger words detected, skipping retrieval.")
    }
}
