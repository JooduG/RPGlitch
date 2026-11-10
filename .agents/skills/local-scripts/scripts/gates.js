/**
 * .agents/skills/local-scripts/scripts/gates.js
 * � gate registry — single source of truth for Antigravity lifecycle hooks.
 *
 * GATE_TABLE drives everything: `node gates.js --dump` regenerates
 * `.agents/hooks.json` (which is a GENERATED artifact — do not hand-edit it),
 * and `hooks.js` imports this table for its dispatch map.
 *
 * Retired (see CHANGELOG): the ceremonial `svelte-autofixer` PreInvocation
 * reminder + Stop gate pair (svelte-check + lint:svelte already pin this in
 * CI), and the `active-track-gate` ghost (no handler ever existed).
 *
 * WORKSHOP_MODE: set WORKSHOP_MODE=1 (or touch tmp/.workshop_mode) during
 * rapid brainstorming to bypass friction gates (sequential-thinking,
 * planning-handoff). CI never sets it.
 */

/**
 * @typedef {Object} GateDef
 * @property {string} id - hooks.json top-level key.
 * @property {string} event - Antigravity lifecycle event (PreToolUse, PostToolUse, Stop).
 * @property {string} matcher - Tool matcher for the event.
 * @property {string} subcommand - hooks.js subcommand to invoke.
 * @property {number} timeout - Hook timeout in seconds.
 * @property {string} description - Human-readable purpose.
 */

export const GATE_TABLE = Object.freeze([
  {
    id: "destructive-command-guard",
    event: "PreToolUse",
    matcher: "run_command",
    subcommand: "command-guard",
    timeout: 10,
    description: "3-tier security gate: DENY destructive git/rm, ASK on sensitive ops, ALLOW the rest.",
  },
  {
    id: "sequential-thinking-gate",
    event: "PreToolUse",
    matcher: "write_to_file|replace_file_content|multi_replace_file_content",
    subcommand: "sequential-thinking-gate",
    timeout: 10,
    description: "Think-before-edit cognitive gate for high-risk engine files, multi-file edits, thrash loops.",
  },
  {
    id: "mcp-argument-normalizer",
    event: "PreToolUse",
    matcher: "call_mcp_tool",
    subcommand: "mcp-argument-normalizer",
    timeout: 10,
    description: "Normalizes sequentialthinking camelCase args and enriches available_tools.",
  },
  {
    id: "file-architecture-gate",
    event: "PreToolUse",
    matcher: "write_to_file",
    subcommand: "file-architecture-gate",
    timeout: 10,
    description: "Enforces Universal File Architecture (top header + CHANGELOG footer) on new src/ files.",
  },
  {
    id: "grep-truncation-breaker",
    event: "PostToolUse",
    matcher: "grep_search",
    subcommand: "grep-truncation",
    timeout: 10,
    description: "Hard stop when ripgrep results cap at 50 matches: mandates subdirectory-filtered re-search.",
  },
  {
    id: "strike-circuit-breaker",
    event: "PostToolUse",
    matcher: ".*",
    subcommand: "circuit-breaker",
    timeout: 10,
    description: "3-strike self-audit: 3 consecutive tool failures mandate sequentialthinking self-audit.",
  },
  {
    id: "planning-handoff-gate",
    event: "Stop",
    matcher: "",
    subcommand: "planning-handoff",
    timeout: 15,
    description: "Blocks stop when src/ changed without CHANGELOG.md/ROADMAP.md entries, or on spec drift.",
  },
  {
    id: "workspace-hygiene-gate",
    event: "Stop",
    matcher: "",
    subcommand: "stop-hygiene",
    timeout: 15,
    description: "Blocks stop when transient debris (.tmp/.log/scratch_*/temp_*) litters the repo root.",
  },
]);

// ============================================================================
// High-risk file policy (derived from audit-layers rank, not hardcoded debt)
// ============================================================================
// audit-layers.js ranks src/engine + src/data at 2 (load-bearing logic) above
// src/media + src/utils at 1. The sequential-thinking gate fires DENY on the
// turn-pipeline + persistence spine inside those rank-2 layers; everything else
// rank-2 gets the standard multi-file/thrash treatment. Former hardcoded paths
// (src/intelligence/*, src/state/chrono.svelte.js, src/state/status.svelte.js,
// src/data/repository.js) are DELETED post-demolition and intentionally absent.

const HIGH_RISK_SUFFIXES = Object.freeze([
  "src/engine/transport.js",
  "src/engine/gate.js",
  "src/engine/kernel.svelte.js",
  "src/engine/runs.js",
  "src/engine/lifecycle.js",
  "src/engine/turns.js",
  "src/engine/prompts.js",
  "src/data/db.js",
  "src/data/entities.js",
  "src/data/parser.js",
]);

/**
 * Returns true when a workspace-relative path is on the load-bearing spine.
 *
 * @param {string} relative_path Workspace-relative path with forward slashes.
 * @returns {boolean}
 */
export function is_high_risk_file(relative_path) {
  const normalized = String(relative_path || "").replace(/\\/g, "/");
  return HIGH_RISK_SUFFIXES.some((suffix) => normalized === suffix || normalized.endsWith(`/${suffix}`));
}

// ============================================================================
// hooks.json codegen (--dump)
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Renders the GATE_TABLE as a .agents/hooks.json document.
 *
 * @returns {Record<string, any>}
 */
export function render_hooks_json() {
  const document = {};
  for (const gate of GATE_TABLE) {
    const entry = {
      [gate.event]: gate.matcher
        ? [
            {
              matcher: gate.matcher,
              hooks: [
                {
                  type: "command",
                  command: `node skills/local-scripts/scripts/hooks.js ${gate.subcommand}`,
                  timeout: gate.timeout,
                },
              ],
            },
          ]
        : [
            {
              type: "command",
              command: `node skills/local-scripts/scripts/hooks.js ${gate.subcommand}`,
              timeout: gate.timeout,
            },
          ],
    };
    document[gate.id] = entry;
  }
  return document;
}

const is_main_execution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (is_main_execution) {
  const flag = process.argv[2];
  if (flag === "--dump") {
    const out_path = process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks.json");
    fs.writeFileSync(out_path, JSON.stringify(render_hooks_json(), null, 2) + "\n");
    console.log(`GATE_TABLE dumped to ${out_path} (${GATE_TABLE.length} gates).`);
  } else if (flag === "--list") {
    for (const gate of GATE_TABLE) {
      console.log(`${gate.id} [${gate.event}${gate.matcher ? ` ${gate.matcher}` : ""}] -> hooks.js ${gate.subcommand}`);
    }
  } else {
    console.error("Usage: node gates.js [--dump [out-path] | --list]");
    process.exit(1);
  }
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Created as the single source of truth for lifecycle gates. hooks.json is now generated
 *   via --dump. Retired the ceremonial svelte-autofixer reminder + stop-gate pair (CI pins via
 *   svelte-check/lint:svelte) and the active-track-gate ghost (no handler ever existed). High-risk
 *   file list re-derived from audit-layers rank-2 spine (engine turn pipeline + data persistence);
 *   deleted post-demolition intelligence/state/repository paths intentionally absent.
 */
