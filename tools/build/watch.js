// Description: This script watches for file changes in a specified app directory
// and automatically triggers a rebuild using the consolidated build-app.js script.
// To run: `npm run watch -- <app-name>`

import chokidar from "chokidar";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const appName = process.argv[2];
if (!appName) {
  console.error("❌ Error: No app name provided.");
  console.log("Usage: node scripts/watch.js <app-name>");
  process.exit(1);
}

console.log(`👀 Starting build watcher for ${appName}...`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// UPDATED PATH: ../apps instead of ../../apps
const appPath = path.resolve(__dirname, `../apps/${appName}`);
const buildScriptPath = path.resolve(__dirname, "build-app.js");

const watcher = chokidar.watch(
  [
    `${appPath}/html/**/*.html`,
    `${appPath}/js/**/*.js`,
    `${appPath}/scss/**/*.scss`,
  ],
  {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
  },
);

const runBuild = (filePath) => {
  console.log(`\nFile changed: ${path.basename(filePath)}`);
  console.log(`🚀 Triggering ${appName} rebuild...`);

  const command = `node "${buildScriptPath}" ${appName}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Build failed:");
      console.error(stderr);
      return;
    }
    console.log("✅ Build successful!");
    console.log(stdout);
  });
};

watcher
  .on("add", runBuild)
  .on("change", runBuild)
  .on("unlink", runBuild)
  .on("error", (error) => console.error(`Watcher error: ${error}`))
  .on("ready", () =>
    console.log(`Watcher for ${appName} is ready and watching for changes...`),
  );
