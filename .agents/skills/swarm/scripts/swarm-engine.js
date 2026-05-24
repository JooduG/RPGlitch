#!/usr/bin/env node

/**
 * @file .agents/skills/swarm/scripts/swarm-engine.js
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

import { exec as execCallback } from "node:child_process";
import url from "node:url";
import { promisify } from "node:util";
import { SWARM_TEMPLATES } from "./automation/prompts/swarm-review.js";

// --- Svelte 5 Rune Shims for Node.js ---
if (typeof globalThis.$state === "undefined") {
  /**
   * @template T
   * @param {T} [v]
   * @returns {T | undefined}
   */
  const _state = (v = undefined) => v;
  /** @param {any} v */
  _state.snapshot = (v) => JSON.parse(JSON.stringify(v));
  /**
   * @template T
   * @param {T} [v]
   * @returns {T | undefined}
   */
  _state.raw = (v = undefined) => v;
  /**
   * @template T
   * @param {T} [v]
   * @returns {T | undefined}
   */
  _state.eager = (v = undefined) => v;
  globalThis.$state = /** @type {any} */ (_state);

  /**
   * @template T
   * @param {T} v
   * @returns {T}
   */
  const _derived = (v) => v;
  _derived.by = (/** @type {() => any} */ fn) => fn();
  globalThis.$derived = /** @type {any} */ (_derived);

  /**
   * @param {() => void | (() => void)} _fn
   */
  const _effect = (_fn) => {};
  _effect.pre = (/** @type {() => void | (() => void)} */ _fn) => {};
  _effect.pending = () => false;
  _effect.tracking = () => false;
  /**
   * @param {() => void | (() => void)} fn
   * @returns {() => void}
   */
  _effect.root = (fn) => {
    fn();
    return () => {};
  };
  globalThis.$effect = /** @type {any} */ (_effect);
}
const { llm_service } = await import("../../../../src/platform/transport.js");
const { jules } = await import("@google/jules-sdk");

const execAsync = promisify(execCallback);

if (!process.env.JULES_API_KEY) {
  console.warn("[swarm-engine] JULES_API_KEY is not set. Swarm dispatch will fail.");
}

const jules_client = jules.with({
  apiKey: process.env.JULES_API_KEY,
});

/**
 *
 */
export class SwarmEngine {
  // --- PRIVATE STATE (#) ---
  /** @type {import('./swarm-types.js').SwarmTask[]} */
  #tasks = [];
  /** @type {number} */
  #processed_count = 0;
  /** @type {number} */
  #active_agent_count = 0;
  /** @type {import('./swarm-types.js').SwarmError[]} */
  #errors = [];

  // --- PUBLIC GETTERS (REACTIVE) ---
  /**
   * @type {import('./swarm-types.js').SwarmTask[]}
   */
  get tasks() {
    return this.#tasks;
  }
  /**
   * @type {number}
   */
  get processed_count() {
    return this.#processed_count;
  }
  /**
   * @type {number}
   */
  get active_agent_count() {
    return this.#active_agent_count;
  }
  /**
   * @type {import('./swarm-types.js').SwarmError[]}
   */
  get errors() {
    return this.#errors;
  }

  // --- DERIVED METRICS ---
  /**
   * @type {number}
   */
  get progress() {
    return this.#tasks.length > 0 ? (this.#processed_count / this.#tasks.length) * 100 : 0;
  }

  /**
   * @type {boolean}
   */
  get is_complete() {
    return this.#tasks.length > 0 && this.#processed_count === this.#tasks.length;
  }

  /**
   * @type {number}
   */
  get confidence_score() {
    if (this.#tasks.length === 0) return 0;
    const scored_tasks = this.#tasks.filter((t) => t.score >= 80).length;
    return (scored_tasks / this.#tasks.length) * 100;
  }

  /**
   * GET GIT CONTEXT
   * Injects branch, status, and recent log into the mission kernel.
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
    } catch {
      return "[GIT_CONTEXT] (Git not available)";
    }
  }

  /**
   * GET REPO NAME
   * Resolves the current owner/repo from git.
   */
  async #get_repo_name() {
    try {
      const { stdout: url } = await execAsync("git remote get-url origin");
      const match = url.trim().match(/[:/]([^/]+\/[^/.]+)(\.git)?$/);
      return match ? match[1] : "JooduG/RPGlitch";
    } catch {
      return "JooduG/RPGlitch";
    }
  }

  /**
   * DISPATCH SWARM
   * Run a fleet of agents on a manifest.
   * @param {import('./swarm-types.js').InputTask[]} manifest
   * @param {import('./swarm-types.js').DispatchOptions} [options]
   * @returns {Promise<import('./swarm-types.js').DispatchResult>}
   */
  async dispatch_manifest(manifest, options = {}) {
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
    const [git_context, repo_name] = await Promise.all([
      this.#get_git_context(),
      this.#get_repo_name(),
    ]);

    // 2. Main Orchestration Loop via Jules SDK
    try {
      const sessions = await jules_client.all(
        queue,
        (task) => {
          task.status = "executing";
          this.#active_agent_count++;
          return {
            prompt: `${git_context}\n\n[TASK_INSTRUCTIONS]\n${task.instructions || task.prompt}`,
            files: task.target_files || task.files,
            source: {
              github: options.repo_full_name || repo_name,
              baseBranch: options.base_branch || "main",
            },
          };
        },
        {
          concurrency: options.max_concurrency || 3,
          delayMs: options.delay_ms || 1000,
        },
      );

      for await (const session of sessions) {
        if (options.stop_on_error && this.#errors.length > 0) break;
        const task = this.#tasks[this.#processed_count];
        task.sessionId = session.id;

        // AutomatedSession.result() blocks until terminal state and returns the outcome
        const outcome = /** @type {import('@google/jules-sdk').Outcome} */ (await session.result());
        this.#active_agent_count--;

        if (outcome.state === "completed") {
          task.result = outcome;
          task.status = "verifying";
          // Serialize the outcome for the 80% Gate verifier
          const output_data = outcome.outputs !== undefined ? outcome.outputs : outcome;
          const output =
            typeof output_data === "string" ? output_data : JSON.stringify(output_data);
          const task_prompt = task.instructions || task.prompt || "No instructions provided.";
          const verification = await this.#verify_task(task_prompt, output);
          task.score = verification.score;
          task.rationale = verification.rationale;
          task.status = "completed";
        } else {
          task.status = "failed";
          task.error = `Session ${session.id} failed with state: ${outcome.state}`;
          this.#errors.push({ taskId: task.id, message: task.error });
        }
        this.#processed_count++;
      }
    } catch (err) {
      const error = /** @type {Error} */ (err);
      console.error(`[swarm_engine] Swarm dispatch failed:`, error);
      this.#errors.push({ message: error.message });
    }

    return {
      success: this.#errors.length === 0,
      score: this.confidence_score,
      results: this.#tasks,
    };
  }

  /**
   * INTERNAL: 80% Gate verification.
   * @param {string} prompt
   * @param {string} output
   * @returns {Promise<{score: number, rationale: string}>}
   */
  async #verify_task(prompt, output) {
    try {
      const payload = {
        system: SWARM_TEMPLATES.review({ input_prompt: prompt, agent_output: output }),
        messages: [],
      };
      const response = await llm_service.generate(payload, { silent: true, raw: true });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const clean_json = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(clean_json);
    } catch {
      return { score: 0, rationale: "Verification Engine Error" };
    }
  }

  // --- CLI DISPATCHER ---
  /**
   * @param {string[]} args
   */
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

  /**
   * @param {object} [_flags]
   */
  static show_meta(_flags = { agent: true }) {
    const meta = { name: "swarm", description: "Fleet Logistics", version: "3.2.0" };
    console.log(JSON.stringify(meta, null, 2));
  }

  /**
   * PARSE MANIFEST FROM MARKDOWN
   * Extracts tasks from a markdown file (e.g., Task.md or PR body).
   * Looks for items starting with [ ] or [x] in a "Tasks" section.
   * @param {string} content
   * @returns {Promise<import('./swarm-types.js').SwarmTask[]>}
   */
  async parse_markdown_manifest(content) {
    const lines = content.split("\n");
    /** @type {import('./swarm-types.js').SwarmTask[]} */
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
          score: 0,
          rationale: null,
          result: null,
          error: null,
        });
      }
    }
    return tasks;
  }

  /**
   * @param {string[]} _args
   * @param {object} _flags
   */
  async cli_review(_args, _flags) {
    console.log("PR Review pattern initialized...");
    const manifest = [{ id: "audit-1", prompt: "Perform a security audit." }];
    const result = await this.dispatch_manifest(manifest);
    console.log(JSON.stringify(result, null, 2));
  }

  /**
   * THE ECHO DSL (Query)
   * Wraps jules.select() to expose SQL-like querying for the engine.
   * @param {import("@google/jules-sdk").JulesQuery<any>} queryObj
   */
  async query(queryObj) {
    try {
      // jules.select() takes a JulesQuery object: { from, where, select, limit, order, include }
      return await jules_client.select(queryObj);
    } catch (err) {
      console.error(`[swarm-engine] Query failed:`, err);
      return [];
    }
  }

  /**
   * @param {import("@google/jules-sdk").AutomatedSession} session
   * @param {import('./swarm-types.js').StreamHandlers} [handlers]
   * @returns {Promise<void>}
   */
  async logStream(session, handlers = {}) {
    for await (const activity of session.stream()) {
      const type = activity.type;
      const data = "message" in activity ? { message: activity.message } : activity;

      if (handlers[type]) {
        handlers[type](data);
      } else {
        console.log(`[swarm-engine] Activity [${type}]:`, data);
      }
    }
  }
}

// ── BOOTSTRAP ───────────────────────────────────────────────────────────────

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  SwarmEngine.bootstrap(process.argv.slice(2)).catch(console.error);
}

export const swarm = new SwarmEngine();
