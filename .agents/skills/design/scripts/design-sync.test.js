import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { getCategory } from "./token-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_SYNC = path.resolve(__dirname, "design-sync.js");

describe("Design System Orchestration Engine", () => {
  describe("Engine Classifications", () => {
    it("should process custom color indicators accurately into structural scopes", () => {
      expect(getCategory("color-primary", "#fff")).toBe("colors");
    });

    it("should catch sizing parameters and isolate them inside spacing categories", () => {
      expect(getCategory("spacing-xl", "2rem")).toBe("spacing");
    });
  });

  describe("Bidirectional Structural Sync Pipeline", { timeout: 15000 }, () => {
    /** @type {string} Isolated temp directory for this test suite */
    let tmpDir;
    /** @type {string} */
    let tmpMd;
    /** @type {string} */
    let tmpCss;
    /** @type {string} */
    let tmpJs;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "design-test-"));
      tmpMd = path.join(tmpDir, "DESIGN.md");
      tmpCss = path.join(tmpDir, "design.css");
      tmpJs = path.join(tmpDir, "tokens.js");
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("should parse Markdown frontmatter and generate correct CSS definitions", () => {
      const mockMd = `---
colors:
  color-obsidian: "#0b0c10"
---
# Architecture Specs
`;
      fs.writeFileSync(tmpMd, mockMd);

      execSync(`node ${SCRIPT_SYNC}`, {
        env: {
          ...process.env,
          DESIGN_MD_PATH: tmpMd,
          CSS_PATH: tmpCss,
          JS_BRIDGE_PATH: tmpJs,
          VITEST: "1",
        },
      });

      const finalCss = fs.readFileSync(tmpCss, "utf8");
      expect(finalCss).toContain("--color-obsidian: #0b0c10;");
    });
  });
});
