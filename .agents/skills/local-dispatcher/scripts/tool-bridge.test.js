import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";

const BRIDGE_PATH = path.resolve(__dirname, "./tool-bridge.js");
const TEST_DIR = path.resolve(__dirname, "../../../../tmp/test-home");

describe("tool-bridge.js CLI", () => {
  beforeAll(() => {
    // Set up test directories
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directories
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("fails when no arguments are provided", () => {
    const result = spawnSync("node", [BRIDGE_PATH], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Usage: node tool-bridge.js");
  });

  it("fails when an unknown tool name is provided", () => {
    const result = spawnSync("node", [BRIDGE_PATH, "nonexistent-tool"], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown tool name");
  });

  it("routes to the global tool when it exists", () => {
    // Mock the global summarize script
    const mockScriptDir = path.join(TEST_DIR, ".gemini/config/skills/master-dispatcher/scripts");
    fs.mkdirSync(mockScriptDir, { recursive: true });

    const mockScriptPath = path.join(mockScriptDir, "summarize.js");
    fs.writeFileSync(mockScriptPath, "console.log('Mock summarize executed with args:', process.argv.slice(2)); process.exit(42);");

    const result = spawnSync("node", [BRIDGE_PATH, "summarize", "--mode=sequential", "sync"], {
      env: { ...process.env, TEST_HOME_DIR: TEST_DIR },
      encoding: "utf8",
    });

    expect(result.status).toBe(42);
    expect(result.stdout).toContain("Mock summarize executed with args:");
    expect(result.stdout).toContain("--mode=sequential");
  });

  it("skips non-summarize global tools in CI (when global tool is missing)", () => {
    const result = spawnSync("node", [BRIDGE_PATH, "knowledge"], {
      env: { ...process.env, TEST_HOME_DIR: path.join(TEST_DIR, "nonexistent") },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[Tool-Bridge] Global tool "knowledge" not found');
    expect(result.stdout).toContain("is developer-only and not required for CI builds. Skipping.");
  });
});
