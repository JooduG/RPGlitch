import { mdsvex } from "mdsvex";
import sveltePreprocess from "svelte-preprocess";

export default {
  preprocess: [sveltePreprocess(), mdsvex()],
  extensions: [".svelte", ".svx"],
  vitePlugin: {
    inspector: {
      toggleKeyCombo: "alt-x",
      showToggleButton: "always",
      toggleButtonPos: "bottom-right",
    },
  },
};
