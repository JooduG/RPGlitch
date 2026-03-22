import markdownIt from "markdown-it";
import githubRules, { init } from "@github/markdownlint-github";

const markdownItFactory = () => markdownIt({ html: true });

export default {
  config: {
    ...init(),
    "line-length": false,
    "no-inline-html": false,
  },
  markdownItFactory,
  customRules: githubRules,
  ignores: [
    "**/.git/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/*.bak",
    "**/*.log",
    "**/*.tmp",
    "**/.gemini/**",
  ],
  outputFormatters: [["markdownlint-cli2-formatter-pretty", { appendLink: true }]],
};
