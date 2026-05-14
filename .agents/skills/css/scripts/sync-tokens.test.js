import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const TEST_DIR = path.join(process.cwd(), "tmp", "test-sync");
const CSS_PATH = path.join(TEST_DIR, "design.css");
const MD_PATH = path.join(TEST_DIR, "DESIGN.md");
const JS_PATH = path.join(TEST_DIR, "tokens.js");
const SCRIPT_PATH = path.join(
  process.cwd(),
  ".agents",
  "skills",
  "css",
  "scripts",
  "sync-tokens.js",
);

describe("Design Token Sync", () => {
  beforeEach(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should sync from CSS to MD robustly", () => {
    const css = `:root {
      /* COLORS */
      --color-black: #000;
      --color-white: #fff;
      
      /* SPACING */
      --spacing-1: 4px;
    }`;
    fs.writeFileSync(CSS_PATH, css);
    fs.writeFileSync(MD_PATH, "# Design\n");

    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const md = fs.readFileSync(MD_PATH, "utf8");
    expect(md).toContain("colors:");
    expect(md).toContain('color-black: "#000"');
    expect(md).toContain("spacing:");
    expect(md).toContain("spacing-1: 4px");
  });

  it("should sync from MD to CSS robustly", () => {
    const md = `---
name: Test
colors:
  primary: "#ff0000"
---
# Design`;
    fs.writeFileSync(MD_PATH, md);
    fs.writeFileSync(CSS_PATH, ":root {}");

    execSync(`node ${SCRIPT_PATH} --to-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const css = fs.readFileSync(CSS_PATH, "utf8");
    expect(css).toContain(":root");
    expect(css).toContain("--- COLORS ---");
    expect(css).toContain("--primary: #ff0000");
  });

  it("should preserve MD content below frontmatter", () => {
    const md = `---
name: Test
---
# IMPORTANT CONTENT
Don't delete me.`;
    fs.writeFileSync(MD_PATH, md);
    fs.writeFileSync(CSS_PATH, ":root { --color-test: #000; }");

    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const newMd = fs.readFileSync(MD_PATH, "utf8");
    expect(newMd).toContain("# IMPORTANT CONTENT");
    expect(newMd).toContain("Don't delete me.");
    expect(newMd).toContain("Don't delete me.");
    expect(newMd).toContain('color-test: "#000"');
  });

  it("should preserve manually added comments and handle unknown tokens via bidirectional sync", () => {
    const css = `:root {
      /* IMPORTANT: Do not change the base scale without approval */
      --spacing-unit: 0.25rem;

      /* --- COLORS --- */
      --primary: #ff0000;
    }`;
    fs.writeFileSync(CSS_PATH, css);

    fs.writeFileSync(MD_PATH, "# Design\n");

    // First sync from CSS to MD to pull in the unknown --spacing-unit
    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    // Then sync back to CSS to verify everything is preserved
    execSync(`node ${SCRIPT_PATH} --to-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const resultCss = fs.readFileSync(CSS_PATH, "utf8");
    expect(resultCss).toContain("Do not change the base scale without approval");
    expect(resultCss).toContain("--spacing-unit: 0.25rem");
    expect(resultCss).toContain("--primary: #ff0000");
  });

  it("should handle empty or malformed frontmatter gracefully", () => {
    const md = `# Just some markdown
No frontmatter here.`;
    fs.writeFileSync(MD_PATH, md);
    const css = `:root { --test: 123; }`;
    fs.writeFileSync(CSS_PATH, css);

    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const newMd = fs.readFileSync(MD_PATH, "utf8");
    expect(newMd).toContain("---");
    expect(newMd).toContain('test: "123"');
    expect(newMd).toContain("# Just some markdown");
  });

  it("should handle complex multi-line CSS values", () => {
    const css = `:root {
      --noise-url: url("data:image/svg+xml,%3Csvg ... %3E%3C/svg%3E");
      --complex-gradient: linear-gradient(
        180deg,
        rgba(0,0,0,1) 0%,
        rgba(255,255,255,1) 100%
      );
    }`;
    fs.writeFileSync(CSS_PATH, css);
    fs.writeFileSync(MD_PATH, "# Design\n");

    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const md = fs.readFileSync(MD_PATH, "utf8");
    expect(md).toContain("noise-url:");
    expect(md).toContain("complex-gradient:");
  });

  it("should handle frontmatter with '---' inside strings", () => {
    const md = `---
name: "File with --- inside"
description: |
  This is a block
  with --- delimiter
  inside it.
---
# Content`;
    fs.writeFileSync(MD_PATH, md);
    fs.writeFileSync(CSS_PATH, ":root { --color-test: #000; }");

    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const newMd = fs.readFileSync(MD_PATH, "utf8");
    expect(newMd).toContain("name: File with --- inside");
    expect(newMd).toContain("with --- delimiter");
    expect(newMd).toContain("# Content");
  });

  it("should maintain alphabetical order of categories and tokens", () => {
    const css = `:root {
      --z-index: 10;
      --color-red: #f00;
      --color-blue: #00f;
      --spacing-2: 8px;
      --spacing-1: 4px;
    }`;
    fs.writeFileSync(CSS_PATH, css);
    fs.writeFileSync(MD_PATH, "# Design\n");

    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const md = fs.readFileSync(MD_PATH, "utf8");

    // Ensure tokens are synced correctly
    expect(md.indexOf("color-blue")).toBeLessThan(md.indexOf("color-red"));
    expect(md.indexOf("spacing-1")).toBeLessThan(md.indexOf("spacing-2"));
  });

  it("should be stable across multiple sync cycles", () => {
    const initialMd = `---
colors:
  color-test: "#000"
name: Stable Test
---
# Content`;
    fs.writeFileSync(MD_PATH, initialMd);
    fs.writeFileSync(CSS_PATH, ":root {}");

    // Cycle 1: MD -> CSS
    execSync(`node ${SCRIPT_PATH} --to-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    // Cycle 2: CSS -> MD
    execSync(`node ${SCRIPT_PATH} --from-css`, {
      env: { ...process.env, CSS_PATH, DESIGN_MD_PATH: MD_PATH, JS_BRIDGE_PATH: JS_PATH },
    });

    const finalMd = fs.readFileSync(MD_PATH, "utf8");
    expect(finalMd).toContain('color-test: "#000"');
    expect(finalMd).toContain("name: Stable Test");
    expect(finalMd).toContain("# Content");
  });
});
