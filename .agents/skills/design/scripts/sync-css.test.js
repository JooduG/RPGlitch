import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_SYNC = path.resolve(__dirname, "sync-css.js");

describe("Design System Orchestration Engine", () => {
  describe("Structural Sync Pipeline", { timeout: 15000 }, () => {
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

    it("should parse Markdown frontmatter and generate CSS + unified JS tokens bridge", () => {
      const mockMd = `---
colors:
  color-obsidian: "#0b0c10"
  color-adrenaline-pink: "#ec4899"
signatures:
  - color-adrenaline-pink
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

      const finalJs = fs.readFileSync(tmpJs, "utf8");
      expect(finalJs).toContain("export const TOKENS = Object.freeze({");
      expect(finalJs).toContain("export const PALETTE = Object.freeze({");
      expect(finalJs).toContain("export const SIGNATURE_COLORS = [");
      expect(finalJs).toContain("Adrenaline Pink");
    });
  });
});
