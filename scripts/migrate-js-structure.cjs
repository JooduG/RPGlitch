const fs = require("fs");
const path = require("path");

const BASE_DIR = path.resolve(__dirname, "../apps/rpglitch/js");

// Map: Old Filename -> New Relative Path (from .js root)
const FILE_MAP = {
  "index.js": "core/bootstrap.js",
  "core-db.js": "core/db.js",
  "core-events.js": "core/events.js",
  "app-state.js": "core/state.js",
  "core-utils.js": "core/utils.js",

  "entity-structs.js": "data/models.js",
  "entity-crud.js": "data/repo.js",

  "manager-turns.js": "engine/director.js",
  "engine-prompt-builder.js": "engine/prompter.js",
  "llm-adapter.js": "engine/llm.js",
  "engine-physics.js": "engine/physics/main.js",
  "worker.js": "engine/physics/worker.js",
  "worker-bridge.js": "engine/physics/bridge.js",
  "config-physics.js": "engine/physics/config.js",
  "engine-variance.js": "engine/variance.js",

  "ui-views.js": "ui/orchestrator.js",
  "ui-chat-feed.js": "ui/components/chat/feed.js",
  "ui-chat-message.js": "ui/components/chat/bubble.js",
  "ui-render-chat.js": "ui/components/chat/renderer.js",
  "utils-virtual-feed.js": "ui/components/chat/virtual-feed.js",
  "ui-chat-visuals.js": "ui/visuals/image-gen-ui.js",
  "manager-visuals.js": "ui/services/visuals.js",

  // profile moved already? No, ui-profile.js is still there, just edited.
  "ui-profile.js": "ui/components/profile/main.js",

  "drawer.js": "ui/components/drawer/desktop.js",
  "ui-chin.js": "ui/components/drawer/mobile.js",
  "settings.js": "ui/components/settings.js",
  "manager-setup.js": "ui/setup.js",
};

async function migrate() {
  console.log("🔄 Starting Migration...");

  // 1. Move Files
  for (const [oldName, newRelPath] of Object.entries(FILE_MAP)) {
    const oldPath = path.join(BASE_DIR, oldName);
    const newPath = path.join(BASE_DIR, newRelPath);

    if (fs.existsSync(oldPath)) {
      // Ensure dir exists
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Moved: ${oldName} -> ${newRelPath}`);
    } else {
      console.warn(`⚠️  Skipped (Not Found): ${oldName}`);
    }
  }

  // 2. Update Imports
  // We need to scan ALL files in the new structure (values of FILE_MAP + theme.js)
  const allFiles = [...Object.values(FILE_MAP), "ui/services/theme.js"];

  for (const newRelPath of allFiles) {
    const filePath = path.join(BASE_DIR, newRelPath);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    // Regex to find imports: import ... from "..." or import "..."
    // We only care about relative imports starting with .
    content = content.replace(
      /(from\s+['"]|import\s+['"])([\.\/]+.*)(['"])/g,
      (match, prefix, importPath, suffix) => {
        if (!importPath.startsWith(".")) return match; // Ignore libraries

        // Resolve the import to the OLD filename
        // Current file is at newRelPath (e.g. core/bootstrap.js)
        // Import is relative (e.g. ./core-utils.js)

        // Better approach:
        // The import was written relative to the OLD location.
        // But now we are in the NEW location.
        // Actually, the content is *untouched*, so the import path is relative to the OLD location of the file.
        // Wait, no. I just moved the file. The content is what it WAS.
        // So if index.js had "./core-utils.js", and I moved index.js to core/bootstrap.js,
        // the string is still "./core-utils.js".

        // 1. Determine who "I" was (Old Name).
        const myOldName = Object.keys(FILE_MAP).find(
          (k) => FILE_MAP[k] === newRelPath,
        );
        // Special case: theme.js acts as new, but it didn't exist before. It imports things? No, it has no imports.
        if (!myOldName) return match;

        // 2. Resolve what I was importing relative to my old self.
        // importPath might be "./core-utils.js" or "../js/core-utils.js" (unlikely).
        // Assuming flat structure, "import ... from './foo.js'" meant "js/foo.js".

        let targetOldName = "";
        if (importPath.startsWith("./")) {
          targetOldName = importPath.substring(2);
        } else if (importPath.startsWith("../")) {
          // Tricky. If file was in subdirectory? Currently flat.
          // Assuming strict flat structure for the old files.
          targetOldName = path.basename(importPath);
        } else {
          targetOldName = importPath;
        }

        // 3. Find where that target went.
        const targetNewRel = FILE_MAP[targetOldName];

        if (!targetNewRel) {
          // Maybe it's a file I didn't move? Or a lib?
          // console.warn(`   Unknown import target in ${newRelPath}: ${importPath}`);
          return match;
        }

        // 4. Calculate NEW relative path.
        // From: dirname(newRelPath) -> To: targetNewRel

        const fromDir = path.dirname(path.join(BASE_DIR, newRelPath));
        const toFile = path.join(BASE_DIR, targetNewRel);

        let newImportPath = path.relative(fromDir, toFile).replace(/\\/g, "/");
        if (!newImportPath.startsWith("."))
          newImportPath = "./" + newImportPath;

        // console.log(`   Rewriting ${newRelPath}: ${importPath} -> ${newImportPath}`);
        changed = true;
        return `${prefix}${newImportPath}${suffix}`;
      },
    );

    if (changed) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✏️  Updated imports in: ${newRelPath}`);
    }
  }

  console.log("✅ Migration Complete.");
}

migrate().catch(console.error);
