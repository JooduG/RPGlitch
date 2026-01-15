import fs from "fs/promises";
import path from "path";
import { PATHS } from "./builder/config.js";
import { compileStyles } from "./builder/styles.js";
import { bundleJs } from "./builder/scripts.js";
import { assembleHtml } from "./builder/assembler.js";

async function build() {
  console.log("🔥 [Orchestrator] Starting RPGlitch Build Protocol...");
  const startTime = Date.now();

  // Ensure dist directory exists
  await fs.mkdir(PATHS.DIST, { recursive: true });

  // EXECUTE PARALLEL BUILD STEPS
  // We run heavy tasks (Styles, Scripts, Template Read) in parallel for speed
  const [globalCss, { js: appJs, css: componentCss }] = await Promise.all([
    compileStyles(),
    bundleJs(),
  ]);

  // MERGE STYLES
  // Monolith Architecture: All CSS (Global + Svelte) goes into one <style> tag.
  const finalCss = globalCss + "\n/* Svelte Components */\n" + componentCss;

  // ASSEMBLE MONOLITH
  const outputHtml = await assembleHtml(finalCss, appJs);

  // WRITE ARTIFACT
  await fs.writeFile(path.join(PATHS.DIST, "RPGlitch.html"), outputHtml);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [Orchestrator] Build Complete in ${duration}s`);
  console.log(`   👉 Artifact: dist/RPGlitch.html`);
}

// Global Error Handler
build().catch((e) => {
  console.error("\n❌ [Orchestrator] BUILD FAILED");
  console.error(e);
  process.exit(1);
});
