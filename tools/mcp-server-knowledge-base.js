#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

const server = new Server(
    {
        name: "knowledge-base",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_knowledge_base",
                description:
                    "Search the RPGlitch technical knowledge base (rules, architecture, skills, constraints). " +
                    "Use this when you need to recall how to implement features, understand architectural patterns, " +
                    "or verify best practices for Svelte 5, database migrations, styling, etc. " +
                    "Returns relevant documentation chunks with source citations.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description:
                                "Your question or search query (e.g., 'How do I create a Svelte 5 component?', 'What are the rules for database migrations?')",
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
        const query = request.params.arguments?.query

        if (!query || typeof query !== "string") {
            throw new Error("Query parameter is required and must be a string")
        }

        try {
            // Execute consult-knowledge.js and capture output
            const { stdout, stderr } = await execAsync(
                `node tools/consult-knowledge.js "${query.replace(/"/g, '\\"')}"`,
                {
                    cwd: process.cwd(),
                    maxBuffer: 1024 * 1024, // 1MB buffer
                }
            )

            if (stderr && !stderr.includes("DEBUG:")) {
                console.error("Warning from consult-meta:", stderr)
            }

            return {
                content: [
                    {
                        type: "text",
                        text: stdout || "No results found.",
                    },
                ],
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error searching knowledge base: ${error.message}`,
                    },
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
    console.error("Knowledge Base MCP server running on stdio")
}

main().catch((error) => {
    console.error("Fatal error in main():", error)
    process.exit(1)
})
