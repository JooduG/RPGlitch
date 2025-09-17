# 📁 Folder: build/config

## 🎯 Purpose
This folder centralizes all configuration files for the build system, linters, testing frameworks, and other development tools. Its purpose is to ensure consistent settings and behavior across the entire project, serving as the single source of truth for project configurations.

---

## 📜 Folder-Specific Rules & AI Directives

*   **Human Rules:** All project-wide configurations, including ESLint, Stylelint, Jest, and MCP settings, must reside within this directory. Changes to these files require careful consideration of their impact on the entire project and should be thoroughly tested.
*   **🤖 AI Directives:** AI, when configuring development tools, linters, or build processes, you must always refer to the configuration files in this directory as the single source of truth. Do not hardcode configurations elsewhere or introduce new configuration files outside of this directory without explicit instruction.

---

## 🔗 Overarching Rules (Single Source of Truth)
This folder adheres to the following project-wide guidelines:

*   [System Architecture Overview](../../../docs/system/system-architecture.md)
*   [JavaScript Best Practices](../../../docs/guides/style-guides/js-guide.md)

---

## ✅ TODO

- [ ] Review and consolidate redundant configuration settings across various files to streamline the build process.
- [ ] Document the purpose and key settings of each configuration file to improve clarity for new contributors.

---

## 💡 Usage / Notes
This directory is essential for maintaining a consistent development environment and ensuring that all automated checks (linting, testing) and build processes operate with the same parameters. Developers should consult these files to understand how various tools are configured and to make project-wide adjustments.
