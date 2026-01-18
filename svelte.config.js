import { mdsvex } from "mdsvex";
import sveltePreprocess from "svelte-preprocess";

const config = {
  preprocess: [sveltePreprocess(), mdsvex()],
  extensions: [".svelte", ".svx"],
};

export default config;
