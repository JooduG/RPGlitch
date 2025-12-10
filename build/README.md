# Build System

This directory contains all scripts, configurations, and outputs related to the project's build process.

**Key Principle:** Source files are located in the `/apps` directory. This build system compiles, bundles, and optimizes them into single, standalone HTML files that are easy to deploy on platforms like Perchance.

**⚠️ IMPORTANT: Do NOT edit files in `/build/output/` directly. They are auto-generated, and your changes will be overwritten.**

## Directory Structure

```text
build/
├── local_libs/     # Vendored (locally-saved) third-party libraries like Dexie.js and DOMPurify.
├── output/         # Compiled, final HTML application files. DO NOT EDIT.
├── scripts/        # The core build scripts (e.g., build-app.js, sync.js).
└── README.md       # This file.
```

## Core Scripts

- **`build-app.js`**: Compiles a specific application (e.g., RPGlitch) by processing its HTML, SCSS, and JavaScript into a single inlined HTML file.
- **`sync.js`**: Synchronizes configurations across the monorepo, manages vendored libraries, and updates ignore files.
- **`watch.js`**: Monitors source files for changes and automatically triggers a rebuild, useful for development.

## Related Documentation

- [GEMINI.md](../GEMINI.md): The complete project protocol, including build commands.
- [PERCHANCE.md](../PERCHANCE.md): Describes the deployment workflow that uses the output of this build system.
