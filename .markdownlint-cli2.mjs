import markdownIt from "markdown-it";
import githubRules, { init } from "@github/markdownlint-github";
import mermaid from "@mermaid-lint/markdownlint";
import master from "./ignores.master.json" with { type: "json" };

export default {
  config: {
    ...init(),
    MD003: { style: "atx" },
    MD004: { style: "dash" },
    MD007: { indent: 2 },
    MD009: false,
    MD013: false,
    MD022: false,
    MD024: { siblings_only: true },
    MD028: false,
    MD029: false,
    MD030: false,
    MD032: false,
    MD033: false,
    MD034: false,
    MD036: false,
    MD040: false,
    MD046: { style: "fenced" },
    MD053: false,
    MD056: true,
    MD060: { style: "any" },
  },
  globs: ["**/*.md", "**/*.mdx"],
  ignores: [...(master.common || []), ...(master.linters?.markdownlint || [])],
  markdownItFactory: () => markdownIt({ html: true }),
  customRules: githubRules,
  ...mermaid.recommended,
  outputFormatters: [["markdownlint-cli2-formatter-pretty", { appendLink: true }]],
};
