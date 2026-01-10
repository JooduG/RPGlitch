import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import path from "path";
import { PATHS } from "./config.js";

export async function bundleJs() {
  console.log(`📦 [Scripts] Bundling ${path.basename(PATHS.ENTRY_JS)}...`);

  const result = await esbuild.build({
    entryPoints: [PATHS.ENTRY_JS],
    bundle: true,
    minify: true,
    keepNames: true,
    write: false,
    format: "iife",
    outfile: "bundle.js",
    globalName: "AppBundle",
    plugins: [
      esbuildSvelte({
        compilerOptions: { runes: true, css: "external" },
        preprocess: sveltePreprocess(),
      }),
    ],
    loader: {
      ".png": "dataurl",
      ".svg": "text", // Load SVG as text string
    },
  });

  const jsFile = result.outputFiles.find((f) => f.path.endsWith(".js"));
  const cssFile = result.outputFiles.find((f) => f.path.endsWith(".css"));

  return {
    js: jsFile ? jsFile.text : "",
    css: cssFile ? cssFile.text : "",
  };
}
