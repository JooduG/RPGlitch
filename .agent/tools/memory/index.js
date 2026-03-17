#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { searchScholar, ingestScholar } from "./memory_engine.js"

/**
 * 🔌 Memory MCP Server v2.0.0
 * Exposes the Knowledge Base to the AI Agent ecosystem.
 * Tools: read, write, describe.
 */

const server = new Server({ name: "memory", version: "2.0.0" }, { capabilities: { tools: {} } })

// ── Tool Definitions ────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "read_knowledge_base",
                description: "Search the RPGlitch technical knowledge base (rules, architecture, patterns). Use this to verify best practices or recall implementation details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query (e.g. 'How to use Svelte 5 runes')",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "write_knowledge_base",
                description: "Ingest files into the RPGlitch knowledge base (Pinecone). Chunks files by semantic boundaries, generates embeddings, and upserts vectors. Uses Prune-on-Write to replace stale vectors automatically.",
                inputSchema: {
                    type: "object",
                    properties: {
                        paths: {
                            type: "array",
                            items: { type: "string" },
                            description: "File paths to ingest, relative to the repository root (e.g. ['src/data', '.agent/rules'])",
                        },
                        namespace: {
                            type: "string",
                            description: "Target namespace: 'knowledge-base.meta' (rules/config), 'knowledge-base.external' (library docs), or 'knowledge-base.src' (source code)",
                            enum: ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
                        },
                    },
                    required: ["paths", "namespace"],
                },
            },
            {
                name: "describe_knowledge_base",
                description: "Show the current state of the knowledge base: which namespaces exist, how many vectors each contains, and index dimensions. Use this to audit what is indexed.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    }
})

// ── Tool Handlers ───────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    try {
        switch (name) {
            case "read_knowledge_base":
                return await handleRead(args)
            case "write_knowledge_base":
                return await handleWrite(args)
            case "describe_knowledge_base":
                return await handleDescribe()
            default:
                throw new Error(`Unknown tool: ${name}`)
        }
    } catch (err) {
        return {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true,
        }
    }
})

// ── Read (Search) ───────────────────────────────────────────────────────

async function handleRead({ query }) {
    const matches = await searchScholar({ query, topK: 3 })

    if (matches.length === 0) {
        return {
            content: [{ type: "text", text: "No relevant documentation found." }],
        }
    }

    const text = matches.map((m) => `[Source: ${m.metadata.source}] (Score: ${(m.score * 100).toFixed(0)}%)\n${m.metadata.content}`).join("\n\n---\n\n")

    return { content: [{ type: "text", text }] }
}

// ── Write (Ingest) ──────────────────────────────────────────────────────

async function handleWrite({ paths, namespace }) {
    await ingestScholar({ paths, namespace })
    return {
        content: [
            {
                type: "text",
                text: `Ingestion complete. ${paths.length} path(s) processed into namespace "${namespace}".`,
            },
        ],
    }
}

// ── Describe (Index Stats) ──────────────────────────────────────────────

async function handleDescribe() {
    // Import Pinecone indirectly to avoid initializing at boot if key is missing
    const { Pinecone } = await import("@pinecone-database/pinecone")
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pc.index("knowledge-library")
    const stats = await index.describeIndexStats()

    const namespaces = stats.namespaces || {}
    const lines = [`Index: knowledge-library`, `Dimensions: ${stats.dimension}`, `Total Vectors: ${stats.totalRecordCount}`, ``]

    for (const [ns, info] of Object.entries(namespaces)) {
        lines.push(`  ${ns}: ${info.recordCount} vectors`)
    }

    if (Object.keys(namespaces).length === 0) {
        lines.push("  (no namespaces found)")
    }

    return { content: [{ type: "text", text: lines.join("\n") }] }
}

// ── Bootstrap ───────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error("Memory MCP Server v2.0.0 running on stdio")
}

main().catch((error) => {
    console.error("Fatal MCP Error:", error)
    process.exit(1)
})
