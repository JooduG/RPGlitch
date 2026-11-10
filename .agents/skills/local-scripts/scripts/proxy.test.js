/**
 * .agents/skills/local-scripts/scripts/proxy.test.js
 * 🧪 PROXY UNIT TEST SUITE (split from bridges.test.js — deepwiki half archived).
 *
 * Validates CLI routing of proxy.js:
 *   - Missing arguments handling
 *   - Unknown tool handling
 *   - Global tool routing when present in simulated home directory
 *   - CI skip behavior when global tool is missing
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";

const PROXY_PATH = path.resolve(__dirname, "./proxy.js");
const TEST_DIRECTORY = path.resolve(__dirname, "../../../../tmp/test-home");

describe("proxy.js CLI", () => {
  beforeAll(() => {
    fs.mkdirSync(TEST_DIRECTORY, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIRECTORY)) {
      fs.rmSync(TEST_DIRECTORY, { recursive: true, force: true });
    }
  });

  it("fails when no arguments are provided", () => {
    const process_result = spawnSync("node", [PROXY_PATH], { encoding: "utf8" });
    expect(process_result.status).toBe(1);
    expect(process_result.stderr).toContain("Usage: node proxy.js");
  });

  it("fails when an unknown tool name is provided", () => {
    const process_result = spawnSync("node", [PROXY_PATH, "nonexistent-tool"], { encoding: "utf8" });
    expect(process_result.status).toBe(1);
    expect(process_result.stderr).toContain("Unknown tool name");
  });

  it("routes to the global tool when it exists", () => {
    const mock_script_directory = path.join(TEST_DIRECTORY, ".gemini/config/skills/planning/scripts");
    fs.mkdirSync(mock_script_directory, { recursive: true });

    const mock_script_path = path.join(mock_script_directory, "summarize.js");
    fs.writeFileSync(mock_script_path, "console.log('Mock summarize executed with args:', process.argv.slice(2)); process.exit(42);");

    const process_result = spawnSync("node", [PROXY_PATH, "summarize", "--mode=sequential", "sync"], {
      env: { ...process.env, TEST_HOME_DIR: TEST_DIRECTORY },
      encoding: "utf8",
    });

    expect(process_result.status).toBe(42);
    expect(process_result.stdout).toContain("Mock summarize executed with args:");
    expect(process_result.stdout).toContain("--mode=sequential");
  });

  it("skips non-summarize global tools in CI (when global tool is missing)", () => {
    const process_result = spawnSync("node", [PROXY_PATH, "knowledge"], {
      env: { ...process.env, TEST_HOME_DIR: path.join(TEST_DIRECTORY, "nonexistent"), TOOL_BRIDGE_FALLBACK_NOTICED: "" },
      encoding: "utf8",
    });

    expect(process_result.status).toBe(0);
    expect(process_result.stdout).toContain('[Proxy] Global tool "knowledge" not found');
    expect(process_result.stdout).toContain("is developer-only and not required for CI builds. Skipping.");
  });
});

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Split from bridges.test.js — proxy half. DeepWiki bridge archived (no callers, no test).
 */
