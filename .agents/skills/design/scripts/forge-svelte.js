#!/usr/bin/env node
/**
 * 🛠️ THE COMPONENT FORGE (Svelte 5)
 * ---------------------------------
 * Usage: node forge-component.js <Name> [type]
 * Types: atoms, molecules, organisms, templates (default: atoms)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = process.cwd();

// Paths
const SRC_DIR = path.join(PROJECT_ROOT, "src", "ui");
const TEMPLATE_DIR = path.join(__dirname, "../templates");

const forge = (name, type = "atoms") => {
  if (!name) {
    console.error("❌ Component name required.");
    process.exit(1);
  }

  const componentName = name.charAt(0).toUpperCase() + name.slice(1);
  const targetDir = path.join(SRC_DIR, type);
  const targetFile = path.join(targetDir, `${componentName}.svelte`);

  // Ensure Directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(targetFile)) {
    console.warn(`⚠️ Component ${componentName} already exists.`);
    process.exit(0);
  }

  // Read Template
  const templatePath = path.join(TEMPLATE_DIR, "COMPONENT.svelte");
  let content = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, "utf-8")
    : `<script>
  let { children } = $props();
</script>

<div class="${componentName.toLowerCase()}">
  {@render children?.()}
</div>

<style>
  .${componentName.toLowerCase()} {
    /* Tokens Here */
  }
</style>`;

  // Hydrate Template
  content = content.replace(/PropName/g, componentName);

  // Write
  fs.writeFileSync(targetFile, content, "utf-8");
  console.log(`\n✅ FORGE SUCCESS: ${type}/${componentName}.svelte created.`);
};

// Execution
const args = process.argv.slice(2);
forge(args[0], args[1]);
