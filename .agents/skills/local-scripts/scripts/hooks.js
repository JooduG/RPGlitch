/**
 * .agents/skills/local-scripts/scripts/hooks.js
 * 🪝 CONSOLIDATED ANTIGRAVITY LIFECYCLE HOOK DISPATCHER
 *
 * Consolidates all lifecycle hooks into a single, high-performance router.
 * Can be invoked directly with a specific sub-hook name:
 *   node skills/local-scripts/scripts/hooks.js <hook-name>
 *
 * Supported Hook Handlers:
 *   - command-guard:            PreToolUse 3-tier security gate for run_command.
 *   - sequential-thinking-gate: PreToolUse think-before-edit cognitive gate.
 *   - waldzell-router:          PreToolUse MCP tool rewriting & argument enrichment.
 *   - file-architecture-gate:   PreToolUse validation for file structure headers & changelogs.
 *   - grep-truncation:          PostToolUse hard-stop circuit breaker on capped grep results.
 *   - circuit-breaker:          PostToolUse 3-strike self-audit circuit breaker on tool failures.
 *   - svelte-pre-invocation:    PreInvocation prompt injection for svelte-autofixer awareness.
 *   - svelte-stop-gate:         Stop gate ensuring svelte-autofixer runs after .svelte changes.
 *   - planning-handoff:         Stop gate enforcing tasks/PRESENT.md update on src/ changes.
 *   - stop-hygiene:             Stop gate preventing transient debris in repository root.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// =================================================================================================
// 0. SHARED LIFECYCLE IO & PATH UTILITIES
// =================================================================================================

/**
 * Reads and parses JSON payload from stdin synchronously.
 * Returns an empty object on any parse failure or empty input to prevent locking up hooks.
 *
 * @returns {Record<string, any>} Parsed stdin payload.
 */
export function read_stdin_payload() {
  try {
    const raw_input = fs.readFileSync(0, "utf-8");
    if (!raw_input || !raw_input.trim()) return {};
    return JSON.parse(raw_input);
  } catch {
    return {};
  }
}

/**
 * Writes a formatted JSON response to stdout.
 *
 * @param {Record<string, any>} response JSON response object.
 */
export function send_hook_response(response) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

/**
 * Normalizes absolute or relative paths to a relative workspace path.
 * Strips `.agents/` suffix if present in workspace root.
 *
 * @param {string} file_path Target file path.
 * @param {string} [workspace_root] Workspace root path.
 * @returns {string} Normalized relative workspace path with forward slashes.
 */
export function to_relative_workspace_path(file_path, workspace_root) {
  let root = (workspace_root || process.cwd()).replace(/\\/g, "/");
  if (root.endsWith("/.agents") || root.endsWith(".agents")) {
    root = root.replace(/\/\.agents$/, "").replace(/\.agents$/, "");
  }
  const normalized = (file_path || "").replace(/\\/g, "/");
  if (normalized.startsWith(root + "/")) {
    return normalized.slice(root.length + 1);
  }
  return normalized;
}

/**
 * Resolves repository root directory cleanly regardless of whether CWD is root or .agents/.
 *
 * @param {Record<string, any>} [payload] Stdin hook payload.
 * @returns {string} Absolute path to repository root.
 */
export function resolve_repo_root(payload) {
  if (payload?.workspacePaths && payload.workspacePaths[0]) {
    return payload.workspacePaths[0];
  }
  return process.cwd().endsWith(".agents") ? fs.realpathSync(process.cwd() + "/..") : process.cwd();
}

// =================================================================================================
// 1. CONSTANTS & WORKSPACE REGISTRIES
// =================================================================================================

const DEFAULT_WORKSPACE_TOOLS = Object.freeze([
  "run_command",
  "view_file",
  "replace_file_content",
  "multi_replace_file_content",
  "write_to_file",
  "grep_search",
  "list_dir",
  "manage_task",
  "schedule",
  "call_mcp_tool",
  "read_url_content",
  "generate_image",
  "mcp:svelte:svelte-autofixer",
  "mcp:developer-database:read_knowledge_base",
  "mcp:developer-database:write_knowledge_base",
  "mcp:deepwiki",
  "mcp:context7:query-docs",
  "mcp:github-copilot",
  "mcp:firecrawl-mcp",
  "mcp:chrome-devtools",
  "mcp:StitchMCP",
  "mcp:waldzell-clear-thought",
]);

const WALDZELL_TOOL_ROUTING = Object.freeze({
  collaborative_reasoning: {
    ServerName: "waldzell-collaborative-reasoning",
    ToolName: "collaborativeReasoning",
  },
  decision_framework: {
    ServerName: "waldzell-decision-framework",
    ToolName: "decisionFramework",
  },
  metacognitive_monitoring: {
    ServerName: "waldzell-metacognitive-monitoring",
    ToolName: "metacognitiveMonitoring",
  },
  scientific_method: {
    ServerName: "waldzell-scientific-method",
    ToolName: "scientificMethod",
  },
  stochastic_thinking: {
    ServerName: "waldzell-stochastic-thinking",
    ToolName: "stochasticalgorithm",
  },
  structured_argumentation: {
    ServerName: "waldzell-structured-argumentation",
    ToolName: "structuredArgumentation",
  },
  visual_reasoning: {
    ServerName: "waldzell-visual-reasoning",
    ToolName: "visualReasoning",
  },
  sequential_thinking: {
    ServerName: "mcp-sequentialthinking-tools",
    ToolName: "sequentialthinking_tools",
  },
});

// =================================================================================================
// 2. HOOK HANDLERS
// =================================================================================================

/**
 * PreToolUse: 3-Tier Security Guard for run_command.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_command_guard(payload) {
  const command_line = payload?.toolCall?.args?.CommandLine || "";

  // Tier 1: Strictly Denied
  const is_destructive_git = /\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f|checkout\s+--\s+\.|restore\s+\.)/i.test(command_line);
  const is_destructive_rm =
    /\b(rm\s+-[a-zA-Z]*r|rmdir\s+\/s|Remove-Item\s+-[a-zA-Z]*Recurse)\b/i.test(command_line) &&
    !command_line.includes("tmp/") &&
    !command_line.includes("tmp\\");

  if (is_destructive_git || is_destructive_rm) {
    send_hook_response({
      decision: "deny",
      reason: `Blocked by destructive-command-guard: "${command_line}" is potentially destructive to the repository.`,
    });
    return;
  }

  // Tier 2: Force Ask
  const is_sensitive_git = /\bgit\s+(push(\s+--force|\s+-f)?|branch\s+-D|stash\s+(drop|clear)|rebase|merge)\b/i.test(command_line);
  const is_npm_mutation = /\bnpm\s+(install|uninstall|update|i)\b/i.test(command_line);

  if (is_sensitive_git || is_npm_mutation) {
    send_hook_response({
      decision: "ask",
      reason: `Sensitive action detected ("${command_line}"). User confirmation required.`,
    });
    return;
  }

  // Tier 3: Allow
  send_hook_response({ decision: "allow" });
}

/**
 * PreToolUse: Cognitive Thinking Gate for File Modifications.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_sequential_thinking_gate(payload) {
  const tool_call = payload?.toolCall || {};
  const tool_args = tool_call.args || {};
  const target_file = tool_args.TargetFile || "";

  if (!target_file) {
    send_hook_response({ decision: "allow" });
    return;
  }

  const workspace_root = payload?.workspacePaths?.[0] || "";
  const relative_target = to_relative_workspace_path(target_file, workspace_root);

  if (!relative_target.startsWith("src/") && !relative_target.startsWith(".agents/skills/")) {
    send_hook_response({ decision: "allow" });
    return;
  }

  const transcript_path = payload?.transcriptPath || "";
  if (!transcript_path || !fs.existsSync(transcript_path)) {
    send_hook_response({ decision: "allow" });
    return;
  }

  let has_thought_recorded = false;
  const files_edited_in_turn = new Set();
  let consecutive_edits_on_target = 0;

  try {
    const raw_transcript = fs.readFileSync(transcript_path, "utf-8");
    const all_lines = raw_transcript.trim().split("\n");
    // Optimize performance: slice trailing 60 lines (last turn) to avoid O(transcript) scan
    const lines = all_lines.slice(-60);

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;

      try {
        const step = JSON.parse(line);
        if (step.type === "USER_INPUT") break;

        const step_str = JSON.stringify(step);
        if (step_str.includes("sequentialthinking_tools")) {
          has_thought_recorded = true;
        }

        const tool_calls = step.tool_calls || [];
        for (const tc of tool_calls) {
          if (tc.name === "replace_file_content" || tc.name === "write_to_file" || tc.name === "multi_replace_file_content") {
            const edited_path = to_relative_workspace_path(tc.args?.TargetFile || "", workspace_root);
            if (edited_path) {
              files_edited_in_turn.add(edited_path);
              if (edited_path === relative_target) {
                consecutive_edits_on_target++;
              }
            }
          }
        }
      } catch {
        // Continue on JSON parse error
      }
    }
  } catch {
    // If transcript inspection fails, allow through
  }

  if (has_thought_recorded) {
    send_hook_response({ decision: "allow" });
    return;
  }

  const is_high_risk_engine_file =
    relative_target.startsWith("src/intelligence/") ||
    relative_target === "src/state/chrono.svelte.js" ||
    relative_target === "src/state/status.svelte.js" ||
    relative_target === "src/data/repository.js";

  if (is_high_risk_engine_file) {
    send_hook_response({
      decision: "deny",
      reason: `High-Risk Engine Gate: "${relative_target}" is a core simulation/intelligence engine file. Structural modifications to prompt compilers, chrono state, or data persistence require sequential thinking. Run \`call_mcp_tool\` for \`mcp-sequentialthinking-tools\` (\`sequentialthinking_tools\`) to record your step-by-step reasoning and plan before editing.`,
    });
    return;
  }

  const is_multi_file_attempt = files_edited_in_turn.size > 0 && !files_edited_in_turn.has(relative_target);
  const is_consecutive_thrashing = consecutive_edits_on_target >= 1;

  if (is_multi_file_attempt) {
    const other_files = Array.from(files_edited_in_turn).join(", ");
    // Soften to ask with feedback so agent is never hard-locked if MCP is unavailable
    send_hook_response({
      decision: "ask",
      reason: `Multi-File Cognitive Reminder: You previously modified (${other_files}) and are now modifying "${relative_target}". Cross-file changes benefit from structured reasoning via \`mcp-sequentialthinking-tools\`. Please confirm or record step plan before editing multiple files.`,
    });
    return;
  }

  if (is_consecutive_thrashing) {
    send_hook_response({
      decision: "ask",
      reason: `Thrashing Prevention Reminder: You are editing "${relative_target}" for the ${consecutive_edits_on_target + 1}th time in this turn. Repeated edits to the same file indicate potential looping. Please confirm and state your plan before editing again.`,
    });
    return;
  }

  send_hook_response({ decision: "allow" });
}

/**
 * PreToolUse: Waldzell MCP Router & Tool Arguments Enricher.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_waldzell_router(payload) {
  const tool_call = payload?.toolCall || {};
  const tool_name = tool_call.name || "";
  const tool_args = tool_call.args || {};

  if (tool_name === "call_mcp_tool") {
    let server_name = tool_args.ServerName || "";
    let target_tool = tool_args.ToolName || "";
    let inner_args = tool_args.Arguments || {};

    const operation = inner_args.operation || "";
    if (server_name === "waldzell-clear-thought" && WALDZELL_TOOL_ROUTING[operation]) {
      const target = WALDZELL_TOOL_ROUTING[operation];
      server_name = target.ServerName;
      target_tool = target.ToolName;
      inner_args = inner_args.parameters || {};
    }

    if (server_name === "mcp-sequentialthinking-tools" && target_tool === "sequentialthinking_tools") {
      if (!inner_args.available_tools || inner_args.available_tools.length === 0) {
        inner_args = {
          ...inner_args,
          available_tools: [...DEFAULT_WORKSPACE_TOOLS],
        };
      }
    }

    const args_changed = JSON.stringify(inner_args) !== JSON.stringify(tool_args.Arguments);
    if (server_name !== tool_args.ServerName || target_tool !== tool_args.ToolName || args_changed) {
      send_hook_response({
        decision: "allow",
        overwrite: {
          ServerName: server_name,
          ToolName: target_tool,
          Arguments: inner_args,
        },
      });
      return;
    }
  }

  send_hook_response({ decision: "allow" });
}

/**
 * PreToolUse: Universal File Architecture Gate.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_file_architecture_gate(payload) {
  const tool_name = payload?.toolCall?.name || payload?.tool_name || "";
  const args = payload?.toolCall?.args || {};

  if (tool_name !== "write_to_file") {
    send_hook_response({ decision: "allow" });
    return;
  }

  const target_file = (args.TargetFile || "").replace(/\\/g, "/");
  const code_content = args.CodeContent || "";

  const is_src_source_file =
    target_file.includes("/src/") && (target_file.endsWith(".js") || target_file.endsWith(".svelte") || target_file.endsWith(".ts"));

  if (!is_src_source_file) {
    send_hook_response({ decision: "allow" });
    return;
  }

  const trimmed_code = code_content.trim();
  const has_top_header = trimmed_code.startsWith("/**") || trimmed_code.startsWith("<!--") || trimmed_code.startsWith("/*");
  const has_changelog = trimmed_code.includes("CHANGELOG") || trimmed_code.includes("Changelog") || trimmed_code.includes("changelog");

  if (!has_top_header || !has_changelog) {
    const missing = [];
    if (!has_top_header) missing.push("Instructional Header Block (/** ... */ or <!-- ... --> at line 1)");
    if (!has_changelog) missing.push("Changelog Footer Block (/** CHANGELOG ... */ at bottom)");

    send_hook_response({
      decision: "deny",
      reason: [
        `🛑 Blocked by Universal File Architecture Gate (GEMINI.md System Standards § 3):`,
        `Target file "${target_file}" is missing required structural elements:`,
        ...missing.map((item) => ` - ${item}`),
        `Please add the required blocks to CodeContent before creating the file.`,
      ].join("\n"),
    });
    return;
  }

  send_hook_response({ decision: "allow" });
}

/**
 * PostToolUse: Grep Truncation Breaker.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_grep_truncation(payload) {
  const tool_name = payload?.toolCall?.name || payload?.tool_name || "";
  const tool_result = payload?.toolResult || payload?.result || "";

  if (tool_name !== "grep_search") {
    send_hook_response({ decision: "allow" });
    return;
  }

  const result_text = typeof tool_result === "string" ? tool_result : JSON.stringify(tool_result);
  const is_capped_at_fifty = result_text.includes("Total results are capped at 50 matches");
  const has_truncation_warning =
    /more results not shown/i.test(result_text) || /truncated/i.test(result_text) || /results are capped/i.test(result_text);

  if (is_capped_at_fifty || has_truncation_warning) {
    send_hook_response({
      decision: "allow",
      feedback: [
        "⚠️ [CONSTITUTIONAL CIRCUIT BREAKER: Exhaustive Search Truncation Detected]",
        "Grep search results were capped or truncated (GEMINI.md Phase 4.4).",
        "MANDATE: You must NOT proceed on incomplete assumptions.",
        "Execute targeted recursive searches using subdirectory filters ('Includes') until 100% of matches are audited.",
      ].join("\n"),
    });
    return;
  }

  send_hook_response({ decision: "allow" });
}

/**
 * PostToolUse: 3-Strike Circuit Breaker.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_circuit_breaker(payload) {
  const tool_name = payload?.toolCall?.name || payload?.tool_name || "";
  const tool_result = payload?.toolResult || payload?.result || "";
  const state_file = path.join(resolve_repo_root(payload), "tmp", ".tool-failures.json");

  if (tool_name === "call_mcp_tool" && payload?.toolCall?.args?.ServerName === "waldzell-metacognitive-monitoring") {
    try {
      if (fs.existsSync(state_file)) fs.unlinkSync(state_file);
    } catch {
      // Ignore filesystem cleanup errors
    }
    send_hook_response({ decision: "allow" });
    return;
  }

  // Exempt read-only exploration tools from tripping the circuit breaker
  const read_only_tools = new Set([
    "view_file",
    "grep_search",
    "read_url_content",
    "list_dir",
    "read_resource",
    "list_resources",
  ]);
  if (read_only_tools.has(tool_name)) {
    send_hook_response({ decision: "allow" });
    return;
  }

  const result_text = typeof tool_result === "string" ? tool_result : JSON.stringify(tool_result);
  const has_error =
    /error|failed|exception|rejection|command failed/i.test(result_text) && !result_text.includes("0 errors") && !result_text.includes("errors: 0");

  let count = 0;
  try {
    if (fs.existsSync(state_file)) {
      count = JSON.parse(fs.readFileSync(state_file, "utf-8")).consecutive_failures || 0;
    }
  } catch {
    count = 0;
  }

  if (has_error) {
    count += 1;
    try {
      const dir = path.dirname(state_file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(state_file, JSON.stringify({ consecutive_failures: count, updated_at: new Date().toISOString() }));
    } catch {
      // Ignore write errors
    }

    if (count >= 3) {
      send_hook_response({
        decision: "allow",
        feedback: [
          "🛑 [CIRCUIT BREAKER TRIGGERED: 3 Consecutive Tool Failures]",
          "In accordance with GEMINI.md Phase 5.2:",
          "You have encountered 3 consecutive tool/verification failures without progress.",
          "MANDATORY ACTION: You must invoke call_mcp_tool with ServerName: 'waldzell-metacognitive-monitoring'",
          "to perform a metacognitive audit of assumptions, biases, and approaches before attempting more edits.",
        ].join("\n"),
      });
      return;
    }
  } else if (count > 0) {
    try {
      if (fs.existsSync(state_file)) fs.unlinkSync(state_file);
    } catch {
      // Ignore cleanup error
    }
  }

  send_hook_response({ decision: "allow" });
}

/**
 * PreInvocation: Svelte Autofixer Prompt Injector.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_svelte_pre_invocation(payload) {
  const transcript_path = payload?.transcriptPath || "";
  let mentions_svelte = false;

  if (transcript_path && fs.existsSync(transcript_path)) {
    try {
      const content = fs.readFileSync(transcript_path, "utf-8");
      const lines = content.trim().split("\n");
      const recent_lines = lines.slice(-20).join("\n");
      if (/\.svelte\b|svelte-autofixer/i.test(recent_lines)) {
        mentions_svelte = true;
      }
    } catch {
      // Fallback
    }
  }

  if (mentions_svelte) {
    send_hook_response({
      injectSteps: [
        {
          ephemeralMessage:
            "Mandatory Protocol: When creating or modifying Svelte code, you MUST execute `call_mcp_tool` with ServerName: 'svelte' and ToolName: 'svelte-autofixer' before concluding your turn.",
        },
      ],
    });
    return;
  }

  send_hook_response({ injectSteps: [] });
}

/**
 * Stop: Svelte Autofixer Verification Gate.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_svelte_stop_gate(payload) {
  const transcript_path = payload?.transcriptPath || "";
  if (!transcript_path || !fs.existsSync(transcript_path)) {
    send_hook_response({ decision: "stop" });
    return;
  }

  let modified_svelte = false;
  let ran_autofixer = false;

  try {
    const raw_transcript = fs.readFileSync(transcript_path, "utf-8");
    const all_lines = raw_transcript.trim().split("\n");
    // Optimize performance: slice trailing 60 lines (last turn) to avoid O(transcript) scan
    const lines = all_lines.slice(-60);

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;

      try {
        const step = JSON.parse(line);
        if (step.type === "USER_INPUT") break;

        const stringified = JSON.stringify(step);
        if (stringified.includes("svelte-autofixer")) {
          ran_autofixer = true;
        }

        if (
          /\.svelte["']/.test(stringified) &&
          (step.tool_calls?.some(
            (tc) => tc.name === "write_to_file" || tc.name === "replace_file_content" || tc.name === "multi_replace_file_content",
          ) ||
            step.content?.includes("write_to_file") ||
            step.content?.includes("replace_file_content"))
        ) {
          modified_svelte = true;
        }
      } catch {
        // Ignore JSON error
      }
    }
  } catch {
    // If read fails, allow stop
  }

  if (modified_svelte && !ran_autofixer) {
    send_hook_response({
      decision: "continue",
      reason:
        "Svelte component code was modified or created, but `svelte-autofixer` was not executed. You must call `call_mcp_tool` with ServerName: 'svelte' and ToolName: 'svelte-autofixer' on the modified Svelte file to verify and fix any component issues before concluding.",
    });
    return;
  }

  send_hook_response({ decision: "stop" });
}

/**
 * Stop: Planning Handoff Gate.
 *
 * @param {any} _payload Hook payload from stdin.
 */
export function handle_planning_handoff(_payload) {
  try {
    const status_output = execSync("git status --porcelain", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!status_output) {
      send_hook_response({ decision: "stop" });
      return;
    }

    const changed_files = status_output.split("\n").map((line) => line.slice(3).trim().replace(/\\/g, "/"));
    const has_substantive_source_changes = changed_files.some((file) => file.startsWith("src/") && /\.(js|ts|svelte|css)$/.test(file));
    const has_handoff_recorded = changed_files.some((file) => file === "tasks/PRESENT.md");

    if (has_substantive_source_changes && !has_handoff_recorded) {
      send_hook_response({
        decision: "continue",
        reason:
          "Planning Handoff Law: Substantive changes were made to `src/`, but `tasks/PRESENT.md` has not been updated. Record your session progress and updated Pulse/Roadmap in `tasks/PRESENT.md` before concluding.",
      });
      return;
    }
  } catch {
    // Graceful fallback
  }

  send_hook_response({ decision: "stop" });
}

/**
 * Stop: Workspace Hygiene Gate.
 *
 * @param {any} payload Hook payload from stdin.
 */
export function handle_stop_hygiene(payload) {
  const root_directory = resolve_repo_root(payload);
  const forbidden_root_patterns = [/\.tmp$/i, /\.log$/i, /^scratch_/i, /^test_out/i, /^temp_/i];
  const violations = [];

  try {
    const root_files = fs.readdirSync(root_directory);
    for (const file of root_files) {
      if (forbidden_root_patterns.some((pattern) => pattern.test(file))) {
        violations.push(file);
      }
    }
  } catch {
    // Graceful fallback
  }

  if (violations.length > 0) {
    send_hook_response({
      decision: "continue",
      reason: `Workspace hygiene gate violation: Found transient files in repository root (${violations.join(", ")}). Move or clean them in tmp/ before terminating.`,
    });
    return;
  }

  send_hook_response({ decision: "stop" });
}

// =================================================================================================
// 3. MAIN ROUTER DISPATCHER
// =================================================================================================

const HOOK_DISPATCH_TABLE = Object.freeze({
  "command-guard": handle_command_guard,
  "guard-commands": handle_command_guard,
  "sequential-thinking-gate": handle_sequential_thinking_gate,
  "waldzell-router": handle_waldzell_router,
  "file-architecture-gate": handle_file_architecture_gate,
  "grep-truncation": handle_grep_truncation,
  "circuit-breaker": handle_circuit_breaker,
  "svelte-pre-invocation": handle_svelte_pre_invocation,
  "svelte-stop-gate": handle_svelte_stop_gate,
  "planning-handoff": handle_planning_handoff,
  "stop-hygiene": handle_stop_hygiene,
  "workspace-hygiene": handle_stop_hygiene,
});

/**
 * Executes router logic by reading stdin and calling the matched handler.
 */
function run() {
  const hook_subcommand = process.argv[2];
  const payload = read_stdin_payload();

  // If sub-command explicitly specified in argv
  if (hook_subcommand && HOOK_DISPATCH_TABLE[hook_subcommand]) {
    HOOK_DISPATCH_TABLE[hook_subcommand](payload);
    return;
  }

  // Fallback: Infer hook type based on payload structure
  const tool_name = payload?.toolCall?.name || payload?.tool_name;
  if (tool_name === "run_command") {
    handle_command_guard(payload);
    return;
  }
  if (tool_name === "call_mcp_tool") {
    handle_waldzell_router(payload);
    return;
  }
  if (tool_name === "grep_search") {
    handle_grep_truncation(payload);
    return;
  }
  if (tool_name === "write_to_file" || tool_name === "replace_file_content" || tool_name === "multi_replace_file_content") {
    handle_file_architecture_gate(payload);
    return;
  }

  // Default response for unhandled events
  send_hook_response({ decision: "allow" });
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-05: Initial creation of consolidated hooks.js dispatcher unifying all 10 Antigravity hooks.
 * 2026-09-05: Fixed circuit breaker false positives (exempted read-only tools, dynamically resolved tmp/.tool-failures.json), optimized transcript parsing (sliced last 60 lines), softened sequential thinking gate on multi-file/repeat edits to ask, and added deep structural equality comparison in handle_waldzell_router.
 */
