import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";
import { PATHS } from "./config.js";

export async function compileStyles() {
  console.log("🎨 [Styles] Compiling SCSS...");
  const result = await sass.compileAsync(PATHS.ENTRY_SCSS);
  const processed = await postcss([autoprefixer]).process(result.css, {
    from: undefined,
  });
  console.log("   - Compiled App SCSS (" + processed.css.length + " bytes)");

  return processed.css;
}
