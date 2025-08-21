---
description: High-level structure and principles for Perchance apps and generators.
tags: "perchance", "architecture", "css", "js", "html"
globs: **/*.html,**/*.js,**/*.scss
alwaysApply: false
---

# Perchance Architecture

## Core Principles

- **Client-Side Only:** All code (HTML, CSS, JS) runs in the browser. No server-side execution.
- **Single-File Output:** For deployment, all CSS and JS must be merged into single files for copy-paste into Perchance's editor fields.
- **No Package Manager:** All dependencies must be inlined or loaded via `<script>` tags (if allowed).
- **Sandboxed Execution:** User code is sandboxed for security. No direct access to server-side resources or the file system.
- **Modular Organization:** Separate logic, UI, and data handling for maintainability and extensibility.

## Key Components

- **Panels:**  
  - *Left Panel*: Plugin initialization, extension points.
  - *Right Panel*: Core app logic, user interaction.
- **Global App Object:** Expose core logic via a global object for plugin access and extensibility.
- **Plugin System:** Support for user-created plugins that extend generator functionality.
- **Persistent Storage:** Use IndexedDB (via Dexie.js) or the Remember Plugin for client-side persistence.
- **Atomic CSS:** Use utility-first CSS for maintainability and minimal bloat.

## Design Patterns

- **Separation of Concerns:** Keep UI, logic, and data management in separate modules/files.
- **Extensibility:** Design with plugin hooks and global access points.
- **Minimal Global State:** Only expose what's needed for plugins or debugging.

## References

- [Perchance Welcome](https://perchance.org/welcome)
- [Perchance Tutorial](https://perchance.org/tutorial)
- [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial)
- [Perchance Examples](https://perchance.org/examples)
- [Perchance Snippets](https://perchance.org/perchance-snippets)
