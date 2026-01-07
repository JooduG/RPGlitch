import chokidar from "chokidar";
import { spawn } from "child_process";

console.log("Starting watch mode...");

let timeout = null;
function triggerBuild() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.log("Changes detected. Rebuilding...");
    // Inherit stdio so colors and output are preserved
    const build = spawn("node", ["tools/build.js"], { stdio: "inherit" });
    build.on("close", (code) => {
      if (code === 0) console.log("Build complete.");
      else console.error("Build failed.");
    });
  }, 100);
}

// Watch src directory
chokidar.watch("src/**/*", { ignoreInitial: true }).on("all", () => {
  triggerBuild();
});

// Run initial build
triggerBuild();
