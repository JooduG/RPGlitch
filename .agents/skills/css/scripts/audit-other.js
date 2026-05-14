import fs from "fs";
import path from "path";
import postcss from "postcss";

const CSS_PATH = path.join(process.cwd(), "src", "theme", "design.css");

/**
 * Determines the category for a given token name.
 * @param {string} name - The token name.
 * @returns {string} The category name.
 */
function getCategory(name) {
  if (
    name.startsWith("color-") ||
    name.startsWith("background-") ||
    name.endsWith("-color") ||
    name.startsWith("title-color-") ||
    name.includes("-color-")
  ) {
    return "colors";
  }
  if (name.startsWith("font-")) {
    return "typography";
  }
  if (
    name.startsWith("spacing-") ||
    name.startsWith("gap-") ||
    name.startsWith("padding-") ||
    name === "auto-resize-buffer"
  ) {
    return "spacing";
  }
  if (name.startsWith("radius-")) {
    return "rounded";
  }
  if (
    name.startsWith("duration-") ||
    name.startsWith("angle-") ||
    name.startsWith("scale-") ||
    name.startsWith("ease-") ||
    name.startsWith("kinetic-") ||
    name.startsWith("motion-") ||
    name.startsWith("hover-") ||
    name.startsWith("click-")
  ) {
    return "kinetic";
  }
  if (
    name.startsWith("grid-") ||
    name.startsWith("column-") ||
    name.startsWith("columns-") ||
    name.startsWith("row-") ||
    name.startsWith("rows-") ||
    name === "column" ||
    name === "row"
  ) {
    return "grid";
  }
  if (
    name.startsWith("blur-") ||
    name.startsWith("brightness-") ||
    name.startsWith("contrast-") ||
    name.startsWith("saturation-")
  ) {
    return "filters";
  }
  if (
    name.startsWith("shadow-") ||
    name.includes("-shadow") ||
    name.includes("-glow") ||
    name.startsWith("glass-")
  ) {
    return "elevation";
  }
  if (
    name.startsWith("width-") ||
    name.startsWith("height-") ||
    name.endsWith("-width") ||
    name.endsWith("-height") ||
    name.endsWith("-size") ||
    name.endsWith("-max") ||
    name === "aspect-square" ||
    name === "golden-ratio"
  ) {
    return "layout";
  }
  if (name.startsWith("breakpoint-")) {
    return "breakpoints";
  }
  if (name.startsWith("z-index-") || name.endsWith("-z-index")) {
    return "depth";
  }
  if (name.startsWith("opacity-")) {
    return "opacity";
  }
  if (name.startsWith("border-") || name.endsWith("-border")) {
    return "borders";
  }
  if (
    name.startsWith("state-") ||
    name.startsWith("toggle-") ||
    name.startsWith("slider-") ||
    name.startsWith("swatch-") ||
    name.startsWith("icon-") ||
    name.startsWith("avatar-") ||
    name.startsWith("modal-") ||
    name.startsWith("skeleton-") ||
    name.startsWith("profile-") ||
    name.startsWith("storyboard-") ||
    name.startsWith("dev-") ||
    name.startsWith("scrollbar-")
  ) {
    return "components";
  }
  return "other";
}

const cssContent = fs.readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(cssContent);
const others = [];

root.walkRules((rule) => {
  if (rule.selector === ":root") {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith("--")) {
        const name = decl.prop.slice(2);
        if (getCategory(name) === "other") {
          others.push(name);
        }
      }
    });
  }
});

console.log("Tokens in 'other' category:");
console.log(JSON.stringify(others, null, 2));
