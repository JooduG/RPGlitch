#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { searchScholar } from "./research_engine.js"

/**
 * 🔌 Scholar MCP Server
 * Exposes the Knowledge Base to the AI Agent ecosystem.
 */

const server = new Server(
    { name: "knowledge-base", version: "2.0.0" },
    { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_knowledge_base",
                description:
                    "Search the RPGlitch technical knowledge base (rules, architecture, patterns). Use this to verify best practices or recall implementation details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description:
                                "The search query (e.g. 'How to use Svelte 5 runes')",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "search_knowledge_base") {
        const { query } = request.params.arguments
        try {
            // Direct call for speed
            const matches = await searchScholar({ query, topK: 3 })

            if (matches.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No relevant documentation found.",
                        },
                    ],
                }
            }

            const text = matches
                .map(
                    (m) =>
                        `[Source: ${m.metadata.source}] (Score: ${(m.score * 100).toFixed(0)}%)\n${m.metadata.content}`
                )
                .join("\n\n---\n\n")

            return { content: [{ type: "text", text }] }
        } catch (err) {
            return {
                content: [
                    { type: "text", text: `Search failed: ${err.message}` },
                ],
                isError: true,
            }
        }
    }
    throw new Error(`Unknown tool: ${request.params.name}`)
})

async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error("Scholar MCP Server running on stdio")
}

main().catch((error) => {
    console.error("Fatal MCP Error:", error)
    process.exit(1)
})
