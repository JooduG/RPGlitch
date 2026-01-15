import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../.."); // tools/builder/ -> tools/ -> root

export const PATHS = {
  ROOT: REPO_ROOT,
  SRC: path.join(REPO_ROOT, "src"),
  DIST: path.join(REPO_ROOT, "dist"),
  LIBS: path.join(REPO_ROOT, "libs"),
  ENTRY_JS: path.join(REPO_ROOT, "src/gamemaster/bootstrap.js"), // Correct entry point
  ENTRY_SCSS: path.join(REPO_ROOT, "src/scss/index.scss"),
  HTML_TEMPLATE: path.join(REPO_ROOT, "src/index.html"),
};

// 🔌 PERCHANCE BRIDGE
// This injects the Left Panel lists and plugins into the Right Panel JS scope.
export const PERCHANCE_BRIDGE = `
<script>
  /* 🔌 PERCHANCE PLUGIN BRIDGE */
  if (typeof ai !== "undefined") {
    window.ai = ai;
    window.pluginAi = ai;
  }
  if (typeof textToImage !== "undefined") {
    window.textToImage = textToImage;
    window.pluginTextToImage = textToImage;
  }
  if (typeof superFetch !== "undefined") {
    window.superFetch = superFetch;
    window.pluginSuperFetch = superFetch;
  }
  if (typeof remember !== "undefined") {
    window.remember = remember;
    window.pluginRemember = remember;
  }
  if (typeof upload !== "undefined") {
    window.upload = upload;
    window.pluginUpload = upload;
  }

  /* ⚙️ CONFIG BRIDGE */
  window.rpgLists = window.rpgLists || {};
  try {
    // Attempt to pull from global namespace if injected by Perchance Left Panel
    const externalConfig = (typeof rpgLists !== 'undefined') ? rpgLists : null;
    if (externalConfig) {
      Object.assign(window.rpgLists, externalConfig);
    }
  } catch (e) {
    console.warn("rpgLists bridge sync error", e);
  }
</script>
`;

export const LIBS_TO_INJECT = ["purify.min.js", "dexie.min.js"];
