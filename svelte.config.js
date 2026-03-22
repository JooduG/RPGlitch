import { mdsvex } from "mdsvex";
import path from "path";
import sveltePreprocess from "svelte-preprocess";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  preprocess: [
    sveltePreprocess({
      scss: {
        importer: [
          (url) => {
            if (url.startsWith("@theme/")) {
              return {
                file: path.resolve(__dirname, "src/theme", url.slice(7)),
              };
            }
            return null;
          },
        ],
        includePaths: [path.resolve(__dirname, "src/theme")],
      },
    }),
    mdsvex(),
  ],
  extensions: [".svelte", ".svx"],
  vitePlugin: {
    inspector: {
      toggleKeyCombo: "alt-x",
      showToggleButton: "always",
      toggleButtonPos: "bottom-right",
    },
  },
};
