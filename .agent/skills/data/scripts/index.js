#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import * as PineconeEngine from "./pinecone-engine.js";
import * as SupabaseEngine from "./supabase-engine.js";

/**
 * 🔮 Librarian MCP Server v3.0.0
 * The Great Library: Owns Lore Integrity, Semantic Search, and Cold Storage.
 * -------------------------------------------------------------------------
 */
const server = new Server(
  {
    name: "data",
    version: "3.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ── Tool Definitions ────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_knowledge_base",
        description:
          "Search the RPSWARMtch technical knowledge base (rules, architecture, patterns) via Pinecone semantic search.",
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
        description:
          "Ingest files into the RPSWARMtch knowledge base (Pinecone). Chunks files by semantic boundaries and generates embeddings.",
        inputSchema: {
          type: "object",
          properties: {
            paths: {
              type: "array",
              items: { type: "string" },
              description:
                "File paths to ingest, relative to the repository root (e.g. ['.agent/rules', 'src/core'])",
            },
            namespace: {
              type: "string",
              description: "Target namespace for organization.",
              enum: ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
            },
          },
          required: ["paths", "namespace"],
        },
      },
      {
        name: "describe_knowledge_base",
        description: "Show the current state of the vector index (Pinecone).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "archive_log_entry",
        description: "Archive a development log or decision into cold storage (Supabase).",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", description: "The current conversation ID." },
            task_slug: {
              type: "string",
              description: "The short name of the task (e.g. 'data-consolidation').",
            },
            content: { type: "string", description: "The log entry or decision content." },
            metadata: { type: "object", description: "Optional metadata (tags, weights, etc)." },
          },
          required: ["session_id", "task_slug", "content"],
        },
      },
      {
        name: "query_cold_storage",
        description: "Retrieve archived logs or decisions from cold storage (Supabase).",
        inputSchema: {
          type: "object",
          properties: {
            task_slug: { type: "string", description: "Filter by task slug." },
            limit: { type: "number", default: 10 },
          },
        },
      },
    ],
  };
});

// ── Tool Handlers ───────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "read_knowledge_base":
        return await handleReadKB(args);
      case "write_knowledge_base":
        return await handleWriteKB(args);
      case "describe_knowledge_base":
        return await handleDescribeKB();
      case "archive_log_entry":
        return await handleArchive(args);
      case "query_cold_storage":
        return await handleQueryCold(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// ── Handlers ────────────────────────────────────────────────────────────

async function handleReadKB(args) {
  try {
    const matches = await PineconeEngine.queryKnowledgeBase(args);
    if (!matches || matches.length === 0) {
      return { content: [{ type: "text", text: "No relevant documentation found." }] };
    }
    const text = matches
      .filter(m => m && m.metadata)
      .map(
        (m) =>
          `[Source: ${m.metadata.source}] (Score: ${(m.score * 100).toFixed(0)}%)\n${m.metadata.content}`,
      )
      .join("\n\n---\n\n");
    return { content: [{ type: "text", text: text || "No readable content found." }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Search Error: ${err.message}` }],
      isError: true
    };
  }
}

async function handleWriteKB(args) {
  await PineconeEngine.writeToKnowledgeBase(args);
  return { content: [{ type: "text", text: "Knowledge base updated successfully." }] };
}

async function handleDescribeKB() {
  const stats = await PineconeEngine.describeIndexStats();
  return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
}

async function handleArchive(args) {
  const { error } = await SupabaseEngine.archiveLog(args);
  if (error) throw error;
  return { content: [{ type: "text", text: "Log archived successfully to cold storage." }] };
}

async function handleQueryCold(args) {
  const logs = await SupabaseEngine.queryLogs(args);
  const text =
    logs.length > 0
      ? logs.map((l) => `[${l.created_at}] ${l.task_slug}: ${l.content}`).join("\n---\n")
      : "No logs found in cold storage.";
  return { content: [{ type: "text", text }] };
}

// ── Bootstrap ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  
  // CLI Mode: Allow running tasks directly (e.g. for batch jobs in CI)
  if (args.length > 0) {
    console.error(`🔮 Librarian CLI: Executing task '${args[0]}'...`);
    if (args[0] === "upsert") {
      // Default: Upsert critical core logic and rules
      await handleWriteKB({ 
        paths: [".agent/rules", ".agent/skills", "src/core"], 
        namespace: "knowledge-base.meta" 
      });
      process.exit(0);
    }
    if (args[0] === "archive") {
      const content = await fs.promises.readFile(args[1], "utf8");
      await handleArchive({
        session_id: "manual-cli-archive",
        task_slug: "historical-cleanup",
        content
      });
      process.exit(0);
    }
    console.error(`❌ Unknown CLI command: ${args[0]}`);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Oracle MCP Server v3.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal MCP Error:", error);
  process.exit(1);
});
