import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";
import { PATHS } from "./config.js";

export async function compileStyles() {
  console.log("🎨 [Styles] Compiling SCSS...");
  const picoPath = path.join(PATHS.LIBS, "pico.min.css");
  let pico = "";
  try {
    pico = await fs.readFile(picoPath, "utf8");
    console.log("   - Loaded Pico CSS (" + pico.length + " bytes)");
  } catch (e) {
    console.warn("   ⚠️ WARNING: pico.min.css not found in libs/!");
  }

  const result = await sass.compileAsync(PATHS.ENTRY_SCSS);
  const processed = await postcss([autoprefixer]).process(result.css, {
    from: undefined,
  });
  console.log("   - Compiled App SCSS (" + processed.css.length + " bytes)");

  return pico + "\n" + processed.css;
}
