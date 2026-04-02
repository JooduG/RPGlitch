#!/usr/bin/env node

/**
 * @file .agent/skills/data/scripts/knowledge.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔮 KNOWLEDGE ENGINE — The Sovereign Memory Module
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Orchestrates the project's "Living Memory" (Pinecone) and "Cold Storage"
 * (Supabase). Manages semantic retrieval and historical archival.
 *
 * RESPONSIBILITIES
 * - Logic       : Semantic search (Vector) and decision archival (Relational).
 * - Persistence : Unified storage boundary for agentic memory.
 * - Integration : Acts as both an MCP Server and a standalone CLI.
 */

import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import ignore from "ignore";
import url from "node:url";

export class KnowledgeEngine {
  // --- PRIVATE CONFIG (#) ---
  #pinecone_config = {
    index_name: "knowledge-library",
    api_key: process.env.PINECONE_API_KEY,
    batch_size: 50,
    cached_host: null,
  };

  #supabase_config = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  };

  // --- CORE ENGINE: PINECONE (VECTOR) ---

  async #get_pinecone_host() {
    if (this.#pinecone_config.cached_host) return this.#pinecone_config.cached_host;

    console.error("📡 Fetching Pinecone index host...");
    const response = await fetch("https://api.pinecone.io/indexes", {
      headers: { "Api-Key": this.#pinecone_config.api_key },
    });
    const data = await response.json();
    const index = data.indexes.find((i) => i.name === this.#pinecone_config.index_name);

    if (!index) throw new Error(`Index ${this.#pinecone_config.index_name} not found`);
    this.#pinecone_config.cached_host = index.host;
    return this.#pinecone_config.cached_host;
  }

  async query_knowledge_base({
    query,
    namespaces = ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
    top_k = 5,
  }) {
    const host = await this.#get_pinecone_host();

    // 1. Generate Query Embedding
    const embed_res = await fetch("https://api.pinecone.io/embed", {
      method: "POST",
      headers: {
        "Api-Key": this.#pinecone_config.api_key,
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2024-07",
      },
      body: JSON.stringify({
        model: "multilingual-e5-large",
        parameters: { input_type: "query", truncate: "END" },
        inputs: [{ text: query }],
      }),
    });
    const embed_data = await embed_res.json();
    if (!embed_data.data?.[0]) throw new Error("Embedding failed");
    const vector = embed_data.data[0].values;

    // 2. Parallel Namespace Query
    const query_promises = namespaces.map(async (ns) => {
      try {
        const res = await fetch(`https://${host}/query`, {
          method: "POST",
          headers: { "Api-Key": this.#pinecone_config.api_key, "Content-Type": "application/json" },
          body: JSON.stringify({ namespace: ns, vector, topK: top_k, includeMetadata: true }),
        });
        const data = await res.json();
        return { ns, matches: data.matches || [] };
      } catch (err) {
        console.warn(`⚠️ Namespace ${ns} query failed: ${err.message}`);
        return { ns, matches: [] };
      }
    });

    const results = await Promise.all(query_promises);

    // 3. Flatten and Sort
    return results
      .filter((res) => res?.matches)
      .flatMap((res) => res.matches.map((m) => ({ ...m, namespace: res.ns })))
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k * 2);
  }

  async write_knowledge_base({ paths, namespace = "knowledge-base.meta", root = process.cwd() }) {
    const host = await this.#get_pinecone_host();
    let gitignore_filter = ignore();
    try {
      const git_content = await fs.readFile(path.join(root, ".gitignore"), "utf-8");
      gitignore_filter.add(git_content);
    } catch {
      /* No .gitignore */
    }

    const files = [];
    const walk = async (dir) => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const full_path = path.join(dir, item);
        const rel_path = path.relative(root, full_path).replace(/\\/g, "/");
        if (
          gitignore_filter.ignores(rel_path) ||
          rel_path.includes(".git/") ||
          rel_path.includes("node_modules/")
        )
          continue;

        const stat = await fs.stat(full_path);
        if (stat.isDirectory()) await walk(full_path);
        else if (/\.(md|txt|json|js|ts|svelte)$/i.test(item)) files.push(full_path);
      }
    };

    for (const p of paths) {
      const abs = path.resolve(root, p.trim());
      try {
        const stat = await fs.stat(abs);
        if (stat.isDirectory()) await walk(abs);
        else files.push(abs);
      } catch {
        console.warn(`⚠️ Skipping invalid path: ${p}`);
      }
    }

    console.error(`📑 Processing ${files.length} files for namespace: ${namespace}`);

    const all_chunks = [];
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      const rel_path = path.relative(root, file).replace(/\\/g, "/");

      // Prune existing vectors for this file in this namespace
      await fetch(`https://${host}/vectors/delete`, {
        method: "POST",
        headers: { "Api-Key": this.#pinecone_config.api_key, "Content-Type": "application/json" },
        body: JSON.stringify({ namespace, filter: { source: { $eq: rel_path } } }),
      });

      const ext = path.extname(file);
      const segments =
        ext === ".md"
          ? content.split(/^#+\s/gm).filter((s) => s.trim().length > 20)
          : content.split(/\n(?=\/\*\*|\/\/\s[A-Z]{3,})/).filter((s) => s.trim().length > 30);

      const final_segments =
        segments.length === 0 && content.trim().length > 0 ? [content] : segments;

      final_segments.forEach((seg, i) => {
        const id = crypto
          .createHash("sha256")
          .update(namespace + rel_path + i)
          .digest("hex");
        all_chunks.push({
          id,
          metadata: {
            content: seg.trim(),
            source: rel_path,
            chunk_index: i,
            indexed_at: new Date().toISOString(),
          },
        });
      });
    }

    // Batch Upload
    for (let i = 0; i < all_chunks.length; i += this.#pinecone_config.batch_size) {
      const batch = all_chunks.slice(i, i + this.#pinecone_config.batch_size);
      const texts = batch.map((c) => c.metadata.content);
      const embed_res = await fetch("https://api.pinecone.io/embed", {
        method: "POST",
        headers: {
          "Api-Key": this.#pinecone_config.api_key,
          "Content-Type": "application/json",
          "X-Pinecone-API-Version": "2024-07",
        },
        body: JSON.stringify({
          model: "multilingual-e5-large",
          parameters: { input_type: "passage", truncate: "END" },
          inputs: texts.map((t) => ({ text: t })),
        }),
      });
      const embed_data = await embed_res.json();
      if (!embed_data.data) throw new Error(`Embedding failed: ${JSON.stringify(embed_data)}`);

      const vectors = batch.map((record, idx) => ({
        id: record.id,
        values: embed_data.data[idx].values,
        metadata: record.metadata,
      }));
      await fetch(`https://${host}/vectors/upsert`, {
        method: "POST",
        headers: { "Api-Key": this.#pinecone_config.api_key, "Content-Type": "application/json" },
        body: JSON.stringify({ namespace, vectors }),
      });
      process.stderr.write(
        `\r✅ Uploaded chunk ${Math.min(i + this.#pinecone_config.batch_size, all_chunks.length)}/${all_chunks.length}`,
      );
    }
    process.stderr.write("\n✨ Ingestion complete.\n");
  }

  async describe_index_stats() {
    const host = await this.#get_pinecone_host();
    const response = await fetch(`https://${host}/describe_index_stats`, {
      method: "POST",
      headers: { "Api-Key": this.#pinecone_config.api_key, "Content-Type": "application/json" },
    });
    const stats = await response.json();
    return stats;
  }

  // --- CORE ENGINE: SUPABASE (COLD STORAGE) ---

  async archive_log({ session_id, task_slug, content, metadata = {} }) {
    const url = `${this.#supabase_config.url}/rest/v1/development_logs`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: this.#supabase_config.key,
        Authorization: `Bearer ${this.#supabase_config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        session_id,
        task_slug,
        content,
        metadata,
        created_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error(`Supabase Archive Failed: ${await response.text()}`);
    return { success: true };
  }

  async query_logs({ task_slug, limit = 10 }) {
    let endpoint = `${this.#supabase_config.url}/rest/v1/development_logs?select=*&order=created_at.desc&limit=${limit}`;
    if (task_slug) endpoint += `&task_slug=eq.${task_slug}`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: this.#supabase_config.key,
        Authorization: `Bearer ${this.#supabase_config.key}`,
      },
    });
    if (!response.ok) throw new Error(`Supabase Query Failed: ${await response.text()}`);
    return await response.json();
  }

  // --- MCP SERVER INTEGRATION ---

  async create_mcp_server() {
    const server = new Server({ name: "data", version: "3.2.0" }, { capabilities: { tools: {} } });

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "read_knowledge_base",
          description: "Search technical KB via Pinecone.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
          },
        },
        {
          name: "write_knowledge_base",
          description: "Ingest files into KB.",
          inputSchema: {
            type: "object",
            properties: {
              paths: { type: "array", items: { type: "string" } },
              namespace: {
                type: "string",
                enum: ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
              },
            },
            required: ["paths", "namespace"],
          },
        },
        {
          name: "describe_knowledge_base",
          description: "Show index stats.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "archive_log_entry",
          description: "Archive log to Supabase.",
          inputSchema: {
            type: "object",
            properties: {
              session_id: { type: "string" },
              task_slug: { type: "string" },
              content: { type: "string" },
              metadata: { type: "object" },
            },
            required: ["session_id", "task_slug", "content"],
          },
        },
        {
          name: "query_cold_storage",
          description: "Retrieve archived logs.",
          inputSchema: {
            type: "object",
            properties: { task_slug: { type: "string" }, limit: { type: "number" } },
          },
        },
      ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        switch (name) {
          case "read_knowledge_base": {
            const matches = await this.query_knowledge_base(/** @type {any} */ (args));
            const text = matches
              .map(
                (m) =>
                  `[Source: ${m.metadata.source}] (Score: ${(m.score * 100).toFixed(0)}%)\n${m.metadata.content}`,
              )
              .join("\n\n---\n\n");
            return { content: [{ type: "text", text: text || "No documentation found." }] };
          }
          case "write_knowledge_base":
            await this.write_knowledge_base(/** @type {any} */ (args));
            return { content: [{ type: "text", text: "KB updated." }] };
          case "describe_knowledge_base":
            return {
              content: [
                { type: "text", text: JSON.stringify(await this.describe_index_stats(), null, 2) },
              ],
            };
          case "archive_log_entry":
            await this.archive_log(/** @type {any} */ (args));
            return { content: [{ type: "text", text: "Log archived." }] };
          case "query_cold_storage": {
            const logs = await this.query_logs(/** @type {any} */ (args));
            const text = logs
              .map((l) => `[${l.created_at}] ${l.task_slug}: ${l.content}`)
              .join("\n---\n");
            return { content: [{ type: "text", text: text || "No logs found." }] };
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
      }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("水晶 Oracle MCP Server v3.2.0 (Consolidated) running on stdio");
  }

  // --- CLI BOOTSTRAP ---
  static async bootstrap(args) {
    const engine = new KnowledgeEngine();
    if (args.length === 0) {
      return await engine.create_mcp_server();
    }

    const command = args[0];
    console.error(`🔮 Knowledge CLI: Executing ${command}...`);
    switch (command) {
      case "upsert":
        await engine.write_knowledge_base({
          paths: [".agent/rules", ".agent/skills", "src/core"],
          namespace: "knowledge-base.meta",
        });
        break;
      case "select": {
        const query = args[1] || "";
        const results = await engine.query_knowledge_base({ query });
        console.log(JSON.stringify(results, null, 2));
        break;
      }
      case "archive": {
        const content = await fs.readFile(args[1], "utf-8");
        await engine.archive_log({
          session_id: "manual-cli-archive",
          task_slug: "historical-cleanup",
          content,
        });
        break;
      }
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  KnowledgeEngine.bootstrap(process.argv.slice(2)).catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
}

export const knowledge = new KnowledgeEngine();
