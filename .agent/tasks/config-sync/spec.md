# Feature Spec: Universal Config Sync (kebab-case-config-sync)

## 🎯 Goal

Restore and enhance the project's synchronization engine to ensure `ignores.master.json` is the absolute source of truth for all project hygiene and environmental constraints.

## 📖 Background

Currently, `sync.js` handles most ignore files but requires manual updates for `eslint.config.js` and lacks deep verification for modern Svelte 5 / Agentic structures. The user wants a "sync that syncs like ignores.master.json and shit," implying a desire for more comprehensive automation.

## ✅ Acceptance Criteria

1.  **Automated ESLint Sync**: `eslint.config.js` must be updated automatically via marker comments (`// @agent:ignore-start` / `// @agent:ignore-end`).
2.  **Total Hygiene Coverage**: All files mentioned in `ignores.master.json` (gitignore, prettier, stylelint, htmlhint, markdownlint) must be accurately generated.
3.  **VSCode Alignment**: `.vscode/settings.json` must perfectly reflect the `vscode.files.exclude` and other settings from the master file.
4.  **Pillar Verification**: Expanded verification of core project "Pillars" beyond just the `.agent/rules/` files.

## 🚀 Performance

- Sync execution time: < 200ms.
- Atomic writes: No partial files on failure.
