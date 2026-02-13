#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { searchScholar, ingestScholar } from "./memory_engine.js"

const server = new Server(
    { name: "scholar", version: "3.0.0" },
    { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "read_knowledge_base",
                description:
                    "Search the RPGlitch technical knowledge base (rules, architecture, patterns).",
                inputSchema: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"],
                },
            },
            {
                name: "write_knowledge_base",
                description: "Ingest files into the knowledge base (Pinecone).",
                inputSchema: {
                    type: "object",
                    properties: {
                        paths: { type: "array", items: { type: "string" } },
                        namespace: { type: "string" },
                    },
                    required: ["paths", "namespace"],
                },
            },
        ],
    }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    try {
        if (name === "read_knowledge_base") {
            const matches = await searchScholar(args)
            return {
                content: [
                    { type: "text", text: JSON.stringify(matches, null, 2) },
                ],
            }
        }
        if (name === "write_knowledge_base") {
            await ingestScholar(args)
            return { content: [{ type: "text", text: "Ingestion complete." }] }
        }
    } catch (err) {
        return {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true,
        }
    }
})

const transport = new StdioServerTransport()
await server.connect(transport)
