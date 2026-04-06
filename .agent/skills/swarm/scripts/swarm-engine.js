#!/usr/bin/env node

/**
 * @file .agent/skills/swarm/scripts/swarm-engine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🐝 SWARM ENGINE — The Sovereign Fleet Module
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Orchestrates parallel agent execution (Fleets) with concurrency control,
 * error resilience, and reactive state management.
 *
 * RESPONSIBILITIES
 * - Concurrency : Manages active agent slots via Promise.allSettled.
 * - Confidence  : Implements 'The 80% Gate' for collective verification.
 * - CLI Dispatch: Entry point for human/agent CLI interactions.
 *
 * NOMENCLATURE (Rule 05)
 * - Swarm: Tactical dispatch and execution of a Fleet.
 * - Fleet: Strategic grouping of specialized sub-agents.
 */

import url from "node:url";
import { SWARM_TEMPLATES } from "./automation/prompts/swarm-review.js";

// --- Svelte 5 Rune Shims for Node.js ---
if (typeof globalThis.$state === "undefined") {
  globalThis.$state = (v) => v;
  globalThis.$state.snapshot = (v) => JSON.parse(JSON.stringify(v));
  globalThis.$derived = (v) => v;
  globalThis.$derived.by = (fn) => fn();
  globalThis.$effect = (fn) => {};
  globalThis.$effect.root = (fn) => fn();
}
const { llm_service } = await import("../../../../src/core/intelligence/llm-service.js");
const { jules } = await import("@google/jules-sdk");
import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(execCallback);
const jules_client = jules.with({
  apiKey: process.env.JULES_API_KEY,
  pollingIntervalMs: 500,
  timeout: 600000,
});

export class SwarmEngine {
  // --- PRIVATE STATE (#) ---
  #tasks = [];
  #processed_count = 0;
  #active_agent_count = 0;
  #errors = [];

  // --- PUBLIC GETTERS (REACTIVE) ---
  get tasks() {
    return this.#tasks;
  }
  get processed_count() {
    return this.#processed_count;
  }
  get active_agent_count() {
    return this.#active_agent_count;
  }
  get errors() {
    return this.#errors;
  }

  // --- DERIVED METRICS ---
  get progress() {
    return this.#tasks.length > 0 ? (this.#processed_count / this.#tasks.length) * 100 : 0;
  }

  get is_complete() {
    return this.#tasks.length > 0 && this.#processed_count === this.#tasks.length;
  }

  /**
   * THE 80% GATE
   * Percentage of tasks that met the confidence threshold.
   */
  get confidence_score() {
    if (this.#tasks.length === 0) return 0;
    const scored_tasks = this.#tasks.filter((t) => t.score >= 80).length;
    return (scored_tasks / this.#tasks.length) * 100;
  }

  /**
   * GET GIT CONTEXT
   * Injects branch, status, and recent log into the mission kernel.
   * @private
   * @async
   */
  async #get_git_context() {
    try {
      const [{ stdout: branch }, { stdout: status }, { stdout: logs }] = await Promise.all([
        execAsync("git rev-parse --abbrev-ref HEAD"),
        execAsync("git status --short"),
        execAsync("git log -n 3 --oneline"),
      ]);
      return `[GIT_CONTEXT]\nBranch: ${branch.trim()}\nStatus: ${status.trim()}\nRecent:\n${logs.trim()}\n`;
    } catch (e) {
      return "[GIT_CONTEXT] (Git not available)";
    }
  }

  /**
   * DISPATCH SWARM
   * Run a fleet of agents on a manifest.
   */
  async dispatch_manifest(manifest, options = { max_concurrency: 3, stop_on_error: false }) {
    // 1. Initialize State
    this.#tasks = manifest.map((t) => ({
      ...t,
      status: "pending",
      score: 0,
      result: null,
      rationale: null,
      error: null,
    }));
    this.#processed_count = 0;
    this.#active_agent_count = 0;
    this.#errors = [];

    const queue = [...this.#tasks];
    const git_context = await this.#get_git_context();

    // 2. Main Orchestration Loop via Jules SDK
    try {
      const results = await jules_client.all(queue, (task) => ({
        prompt: `${git_context}\n\n[TASK_INSTRUCTIONS]\n${task.instructions || task.prompt}`,
        files: task.target_files,
      }), {
        maxConcurrency: options.max_concurrency || 3,
        delayMs: options.delay_ms || 1000,
      });

      await Promise.all(results.map(async (res, i) => {
        const task = this.#tasks[i];

        if (res.status === "fulfilled") {
          task.result = res.value;
          task.status = "verifying";
          // Extract output string from session object if present, otherwise use value directly
          const output = res.value?.output || res.value;
          const verification = await this._verify_task(task.instructions || task.prompt, output);
          task.score = verification.score;
          task.rationale = verification.rationale;
          task.status = "completed";
        } else {
          task.status = "failed";
          task.error = res.reason?.message || "Unknown Jules Error";
          this.#errors.push({ taskId: task.id, message: task.error });
        }
        this.#processed_count++;
      }));
    } catch (err) {
      console.error(`[swarm_engine] Swarm dispatch failed:`, err);
      this.#errors.push({ message: err.message });
    }

    return {
      success: this.#errors.length === 0,
      score: this.confidence_score,
      results: this.#tasks,
    };
  }

  /**
   * INTERNAL: Individual task execution.
   * @private
   */
  async _execute_task(task) {
    this.#active_agent_count++;
    try {
      const response = await llm_service.generate({ system: task.prompt }, { silent: true });
      task.result = response;
      task.status = "verifying";

      const verification = await this._verify_task(task.prompt, response);
      task.score = verification.score;
      task.rationale = verification.rationale;
      task.status = "completed";
    } catch (err) {
      task.status = "failed";
      task.error = err.message;
      this.#errors.push({ taskId: task.id, message: err.message });
      console.error(`[swarm_engine] Task ${task.id} failed:`, err);
    } finally {
      this.#active_agent_count--;
    }
  }

  /**
   * INTERNAL: 80% Gate verification.
   * @private
   */
  async _verify_task(prompt, output) {
    try {
      const payload = {
        system: SWARM_TEMPLATES.review({ input_prompt: prompt, agent_output: output }),
        messages: [],
      };
      const response = await llm_service.generate(payload, { silent: true, raw: true });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const clean_json = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(clean_json);
    } catch (err) {
      return { score: 0, rationale: "Verification Engine Error" };
    }
  }

  // --- CLI DISPATCHER ---
  static async bootstrap(args) {
    const flags = {
      human: args.includes("--human"),
      agent: args.includes("--agent") || !args.includes("--human"),
      help: args.includes("--help") || args.includes("-h"),
      yes: args.includes("--yes"),
    };

    const command = args[0];
    if (flags.help || !command) return this.show_meta();

    const engine = new SwarmEngine();
    switch (command) {
      case "review":
        await engine.cli_review(args, flags);
        break;
      case "brief":
        this.show_meta(flags);
        break;
      default:
        console.error(`Unknown command: ${command}`);
    }
  }

  static show_meta(flags = { agent: true }) {
    const meta = { name: "swarm", description: "Fleet Logistics", version: "3.2.0" };
    console.log(JSON.stringify(meta, null, 2));
  }

  /**
   * PARSE MANIFEST FROM MARKDOWN
   * Extracts tasks from a markdown file (e.g., Task.md or PR body).
   * Looks for items starting with [ ] or [x] in a "Tasks" section.
   */
  async parse_markdown_manifest(content) {
    const lines = content.split("\n");
    const tasks = [];
    let in_task_section = false;

    for (const line of lines) {
      if (line.toLowerCase().includes("## tasks")) {
        in_task_section = true;
        continue;
      }
      if (in_task_section && line.startsWith("##")) break;

      const match = line.match(/^\s*[-*]\s*\[([ x])\]\s*(.*)/i);
      if (match) {
        tasks.push({
          id: `task-${tasks.length + 1}`,
          prompt: match[2].trim(),
          status: match[1].toLowerCase() === "x" ? "completed" : "pending",
        });
      }
    }
    return tasks;
  }

  async cli_review(args, flags) {
    console.log("PR Review pattern initialized...");
    const manifest = [{ id: "audit-1", prompt: "Perform a security audit." }];
    const result = await this.dispatch_manifest(manifest);
    console.log(JSON.stringify(result, null, 2));
  }

  /**
   * THE ECHO DSL (Query)
   * Wraps jules.select() to expose SQL-like querying for the engine.
   */
  async query(statement, params = []) {
    try {
      return await jules_client.select(statement, params);
    } catch (err) {
      console.error(`[swarm-engine] Query failed:`, err);
      return [];
    }
  }

  /**
   * LOG STREAM
   * Maps to Jules SDK's native session.stream() with a typed handler map.
   */
  async logStream(session, handlers = {}) {
    for await (const activity of session.stream()) {
      const type = activity.type;
      if (handlers[type]) {
        handlers[type](activity.data);
      } else {
        console.log(`[swarm-engine] Activity [${type}]:`, activity.data);
      }
    }
  }
}

// ── BOOTSTRAP ───────────────────────────────────────────────────────────────

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  SwarmEngine.bootstrap(process.argv.slice(2)).catch(console.error);
}

export const swarm = new SwarmEngine();
