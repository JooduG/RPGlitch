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
import { SWARM_TEMPLATES } from "../templates/swarm-templates.js";

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
    const active_slots = [];

    // 2. Main Orchestration Loop
    while (queue.length > 0 || active_slots.length > 0) {
      if (options.stop_on_error && this.#errors.length > 0) break;

      while (queue.length > 0 && active_slots.length < (options.max_concurrency || 3)) {
        const task = queue.shift();
        task.status = "executing";

        const promise = this._execute_task(task).finally(() => {
          this.#processed_count++;
          const idx = active_slots.indexOf(promise);
          if (idx > -1) active_slots.splice(idx, 1);
        });

        active_slots.push(promise);
      }

      if (active_slots.length > 0) {
        await Promise.race(active_slots);
      }
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
}

// ── BOOTSTRAP ───────────────────────────────────────────────────────────────

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  SwarmEngine.bootstrap(process.argv.slice(2)).catch(console.error);
}

export const swarm = new SwarmEngine();
