import fs from "fs";
import markdownIt from "markdown-it";
import githubRules, { init } from "@github/markdownlint-github";

const localConfig = JSON.parse(fs.readFileSync("./.markdownlint.json", "utf8"));

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
