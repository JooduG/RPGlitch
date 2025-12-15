const fs = require("fs");
const path = require("path");

const TESTS_DIR = path.resolve(__dirname, "../tests");

// MAPPING: Old Filename -> New Relative Path (from apps/rpglitch/js base)
const MAPPING = {
  "core-utils.js": "core/utils.js",
  "core-events.js": "core/events.js",
  "core-db.js": "core/db.js",
  "app-state.js": "core/state.js",

  "entity-structs.js": "data/models.js",
  "entity-crud.js": "data/repo.js",

  "manager-turns.js": "engine/director.js",
  "engine-prompt-builder.js": "engine/prompter.js",
  "engine-physics.js": "engine/physics/main.js",

  "ui-chin.js": "ui/components/drawer/mobile.js", // or desktop.js, but chin usually implies mobile or shared
  "drawer.js": "ui/components/drawer/desktop.js",
  "ui-chat-feed.js": "ui/components/chat/feed.js",
  "ui-chat-message.js": "ui/components/chat/bubble.js",
  "ui-chat-input.js": "ui/components/chat/input.js",
  "ui-profile.js": "ui/components/profile/main.js",
  "ui-views.js": "ui/orchestrator.js", // Maybe? Or ui/views.js
  "ui-toast.js": "ui/components/toast.js",
  "settings.js": "ui/components/settings.js",
  "manager-setup.js": "ui/setup.js",
  "ui-render-chat.js": "ui/components/chat/renderer.js",
  "utils-virtual-feed.js": "ui/components/chat/virtual-feed.js",
  "ui-chat-visuals.js": "ui/visuals/image-gen-ui.js",
  "manager-visuals.js": "ui/services/visuals.js",
  "index.js": "core/bootstrap.js", // Entry point
};

// Map for "exact match" replacements in require/import strings
// We look for patterns like: "../apps/rpglitch/js/OLD_FILE"
// And replace with: "../apps/rpglitch/js/NEW_FILE"

function updateTests() {
  if (!fs.existsSync(TESTS_DIR)) {
    console.error("Tests directory not found:", TESTS_DIR);
    return;
  }

  const files = fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith(".js"));
  let totalUpdated = 0;

  files.forEach((file) => {
    const filePath = path.join(TESTS_DIR, file);
    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;

    // Sort keys by length (desc) to avoid partial matches if any share prefix
    const keys = Object.keys(MAPPING).sort((a, b) => b.length - a.length);

    keys.forEach((oldName) => {
      const newName = MAPPING[oldName];

      // Regex to find: /js/oldName.js or /js/oldName (without ext if needed, but imports usually have .js here)
      // The tests seem to use full extensions: "../apps/rpglitch/js/core-utils.js"

      const regex = new RegExp(
        `rpglitch/js/${oldName.replace(".", "\\.")}`,
        "g",
      );

      if (regex.test(content)) {
        content = content.replace(regex, `rpglitch/js/${newName}`);
        updated = true;
      }
    });

    // Also fix specific known edge cases if mapping didn't cover generic moves
    // e.g. "ui-chin.js" logic might need verification if it was split

    if (updated) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed imports in: ${file}`);
      totalUpdated++;
    }
  });

  console.log(`\nFixed ${totalUpdated} test files.`);
}

updateTests();
