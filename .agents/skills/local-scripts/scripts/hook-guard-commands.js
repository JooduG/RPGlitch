/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Optimized 3-Tier PreToolUse Command Guard
 * -------------------------------------------------------------------------------------------------
 * Evaluates terminal commands across 3 distinct security tiers:
 *   1. DENY: Strictly destructive operations (git reset --hard, force clean, un-scoped recursive rm).
 *   2. ASK: Sensitive or state-altering commands (git checkout, stash drop, branch deletion, force push)
 *           that bypass cached IDE permissions and require manual user confirmation.
 *   3. ALLOW: Safe read-only or build/test commands that execute without added friction.
 * Receives JSON on stdin and writes decision JSON to stdout.
 * -------------------------------------------------------------------------------------------------
 */

import fs from "fs";

/**
 * Reads JSON payload from stdin synchronously.
 *
 * @returns {object} Parsed stdin payload.
 */
function read_stdin_payload() {
  try {
    const raw_input = fs.readFileSync(0, "utf-8");
    if (!raw_input || !raw_input.trim()) return {};
    return JSON.parse(raw_input);
  } catch {
    return {};
  }
}

/**
 * Main hook execution.
 */
function run() {
  const payload = read_stdin_payload();
  const command_line = payload?.toolCall?.args?.CommandLine || "";

  // -----------------------------------------------------------------------------------------------
  // TIER 1: STRICTLY DENIED (Destructive actions that cannot be undone)
  // -----------------------------------------------------------------------------------------------
  const is_destructive_git = /\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f|checkout\s+--\s+\.|restore\s+\.)/i.test(command_line);

  const is_destructive_rm =
    /\b(rm\s+-[a-zA-Z]*r|rmdir\s+\/s|Remove-Item\s+-[a-zA-Z]*Recurse)\b/i.test(command_line) &&
    !command_line.includes("tmp/") &&
    !command_line.includes("tmp\\");

  if (is_destructive_git || is_destructive_rm) {
    const response = {
      decision: "deny",
      reason: `Blocked by destructive-command-guard: "${command_line}" is potentially destructive to the repository.`,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // -----------------------------------------------------------------------------------------------
  // TIER 2: FORCE ASK (Sensitive operations requiring explicit user consent)
  // -----------------------------------------------------------------------------------------------
  const is_sensitive_git = /\bgit\s+(push(\s+--force|\s+-f)?|branch\s+-D|stash\s+(drop|clear)|rebase|merge)\b/i.test(command_line);

  const is_npm_mutation = /\bnpm\s+(install|uninstall|update|i)\b/i.test(command_line);

  if (is_sensitive_git || is_npm_mutation) {
    const response = {
      decision: "ask",
      reason: `Sensitive action detected ("${command_line}"). User confirmation required.`,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // -----------------------------------------------------------------------------------------------
  // TIER 3: ALLOW (Standard build, test, audit, status, and read commands)
  // -----------------------------------------------------------------------------------------------
  process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Upgraded to 3-tier security model (DENY destructive, ASK sensitive, ALLOW safe).
 * 2026-09-04: Initial creation of PreToolUse command guard hook for RPGlitch.
 */
