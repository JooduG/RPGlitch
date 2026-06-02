import { mdsvex } from "mdsvex";

export default {
  // Strip out svelte-preprocess and SCSS.
  // The AI must use the vanilla CSS variables from design.css.
  preprocess: [mdsvex()],

  extensions: [".svelte", ".svx"],

  compilerOptions: {
    /* ========================================================================
       [**] THE RUNE REGIME (COMPILER LEVEL)
       ======================================================================== */
    // FATAL CONSTRAINT: Force the compiler into strict Svelte 5 mode.
    // The build will instantly crash if the AI attempts Svelte 4 legacy syntax.
    runes: true,

    // Perchance Optimization: Forces Svelte to inject CSS directly into the JS bundle
    // rather than generating external stylesheet files that are hard to copy-paste.
    css: "injected",
  },
};
