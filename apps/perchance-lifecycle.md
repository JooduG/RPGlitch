---
description: Complete development lifecycle for Perchance applications.
globs: **/*.html,**/*.js,**/*.scss
alwaysApply: false
---

# Perchance Development Lifecycle

## Core Principles

- **Incremental, Modular Development:** Use multiple files and clear separation of concerns during development; merge for deployment.
- **Manual Testing:** Test all features in the Perchance editor. Use "duplicate" and "download" for safe iteration and backup.
- **Single-File Output for Deployment:** All CSS and JS must be merged into single files before copy-pasting into Perchance.
- **No Build System in Platform:** Any build/merge steps must be done locally.
- **No @import:** Perchance does not support CSS `@import`—merge all styles manually.
- **No External Dependencies:** All dependencies must be inlined or included via `<script>` tags.

## Development Steps

1. **Plan:** Define the generator's structure, features, and plugin needs.
2. **Develop:** Build modular HTML, CSS, and JS files. Use atomic CSS and Perchance plugin APIs as needed.
3. **Test:** Test in the Perchance editor. Use "duplicate" to create safe checkpoints.
4. **Build:** Combine all CSS and JS into single files for deployment.
5. **Deploy:** Paste merged code into Perchance, set generator to public/private, and share the URL.
6. **Iterate:** Use feedback and logs to improve and refine the generator.

## Best Practices

- **Use Perchance Snippets and Examples:** Reference official examples for common patterns.
- **Inspect Advanced Generators:** Click "Edit" on public generators to learn from real-world code.
- **Backup Regularly:** Use the "download" feature to save your work.
- **Document Your Workflow:** Keep notes on your process and decisions for future reference.
