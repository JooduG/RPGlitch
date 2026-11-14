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

    function runSync(markdown) {
      fs.writeFileSync(tmpMd, markdown);

      execSync(`node ${SCRIPT_SYNC}`, { env: { ...process.env, DESIGN_MD_PATH: tmpMd, CSS_PATH: tmpCss, JS_BRIDGE_PATH: tmpJs, VITEST: "1" } });

      return { css: fs.readFileSync(tmpCss, "utf8"), js: fs.readFileSync(tmpJs, "utf8") };
    }

    it("should parse Markdown frontmatter and generate CSS + unified JS tokens bridge", () => {
      const { css: finalCss, js: finalJs } = runSync(`---
colors:
  color-obsidian: "#0b0c10"
  color-adrenaline-pink: "#ec4899"
signatures:
  - color-adrenaline-pink
---
# Architecture Specs
`);

      expect(finalCss).toContain("--color-obsidian: #0b0c10;");
      expect(finalJs).toContain("export const TOKENS = Object.freeze({");
      expect(finalJs).toContain("export const PALETTE = Object.freeze({");
      expect(finalJs).toContain("export const SIGNATURE_COLORS = [");
      expect(finalJs).toContain("Adrenaline Pink");
    });

    it("should resolve object typography, {category.token} references, and top-level theme tokens", () => {
      const { css: finalCss, js: finalJs } = runSync(`---
colors:
  color-electric-cyan: "#11aecc"
  color-dev-accent: "{colors.color-electric-cyan}"
  primary: "#11aecc"
  empty-fill: "rgb(23 23 23 / 0.6)"
typography:
  font-sans:
    fontFamily: '"Inter", sans-serif'
  font-display:
    fontFamily: '"Satisfy", cursive'
rounded:
  radius-sharp: "{spacing.spacing-unit}"
spacing:
  spacing-unit: 0.25rem
theme:
  duration-fast: 150ms
  scale-sink: "0.97"
---
# Design Tokens
`);

      expect(finalCss).toContain("--color-dev-accent: var(--color-electric-cyan);");
      expect(finalCss).toContain('--font-sans: "Inter", sans-serif;');
      expect(finalCss).toContain('--font-display: "Satisfy", cursive;');
      expect(finalCss).not.toContain("--fontFamily:");
      expect(finalCss).toContain("--radius-sharp: var(--spacing-unit);");
      expect(finalCss).toContain("/* --- COMPONENTS --- */");
      expect(finalCss).toContain("--duration-fast: 150ms;");
      expect(finalCss).toContain("--scale-sink: 0.97;");

      const paletteBlock = finalJs.match(/export const PALETTE = Object\.freeze\(\{[\s\S]*?\}\);/)?.[0] ?? "";
      expect(paletteBlock).toContain('"Electric Cyan": "#11aecc"');
      expect(paletteBlock).not.toContain("Primary");
      expect(paletteBlock).not.toContain("empty-fill");
    });

    it("should fail fast and preserve existing outputs when DESIGN.md has malformed YAML or missing frontmatter", () => {
      const sentinelCss = "/* existing css */";
      const sentinelJs = "/* existing js */";
      fs.writeFileSync(tmpCss, sentinelCss);
      fs.writeFileSync(tmpJs, sentinelJs);

      const execOpts = { env: { ...process.env, DESIGN_MD_PATH: tmpMd, CSS_PATH: tmpCss, JS_BRIDGE_PATH: tmpJs, VITEST: "1" }, stdio: "pipe" };

      fs.writeFileSync(tmpMd, "# Missing frontmatter delimiters\n");
      expect(() => execSync(`node ${SCRIPT_SYNC}`, execOpts)).toThrow();
      expect(fs.readFileSync(tmpCss, "utf8")).toBe(sentinelCss);
      expect(fs.readFileSync(tmpJs, "utf8")).toBe(sentinelJs);

      fs.writeFileSync(tmpMd, "---\ncolors:\n  color-bad: [\n---\n# Broken YAML\n");
      expect(() => execSync(`node ${SCRIPT_SYNC}`, execOpts)).toThrow();
      expect(fs.readFileSync(tmpCss, "utf8")).toBe(sentinelCss);
      expect(fs.readFileSync(tmpJs, "utf8")).toBe(sentinelJs);
    });
  });
});
