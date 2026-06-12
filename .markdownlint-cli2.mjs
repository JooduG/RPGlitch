import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import markdownIt from "markdown-it";
import githubRules, { init } from "@github/markdownlint-github";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./.markdownlint.json"), "utf8"));

export default {
  config: {
    ...init(),
    "line-length": false,
    "no-inline-html": false,
    ...localConfig,
  },
  markdownItFactory: () => markdownIt({ html: true }),
  customRules: githubRules,
  outputFormatters: [["markdownlint-cli2-formatter-pretty", { appendLink: true }]],
};
