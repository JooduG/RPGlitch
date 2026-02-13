---
name: devops
version: 1.0.0
description: >
    Environment Operations & Toolchain Manager. Handles the build lifecycle, domestic server,
    configuration synchronization, and dependencies.
    Triggers: "Start dev server", "Build for production", "Sync configuration", "Fix environment".
---

# 🔧 Skill: DevOps (The Mechanic)

> **Tool Interface**: "I am the Engine Room. I keep the gears oiled, the fires hot, and the structure sound. I do not design the machine; I ensure it runs."

## 1. Triggers

- **Commands**:
    - "Start dev server" (`npm run dev`)
    - "Build for production" (`npm run build`)
    - "Sync configuration" (`npm run sync`)
    - "Fix environment" (Clean install)
- **Files**:
    - `package.json`
    - `vite.config.js`
    - `.agent/skills/project/scripts/sync.js`
    - `ignores.master.json`

## 2. Capabilities

### 🛠️ Toolchain Management

- **Development Server**: Managing the local Vite instance.
- **Production Build**: Compiling the application for deployment.
- **Configuration Sync**: Ensuring `.gitignore`, `.prettierignore`, etc., match `ignores.master.json`.
- **Dependency Hygiene**: Managing `node_modules` and `package-lock.json`.

## 3. Procedures

### 🔄 Sync Routine (`sync.js`)

1.  **Read**: Load `ignores.master.json`.
2.  **Generate**: Overwrite `.gitignore`, `.prettierignore`, `.stylelintignore`.
3.  **Verify**: Ensure no untracked files are contaminating the workspace.
4.  **Execute**: Run `npm run sync`.

### 🏗️ Build Protocol

1.  **Check**: Ensure no type errors (`npm run check`) before building.
2.  **Compile**: Run `vite build`.
3.  **Validate**: Resolve strict mode errors if the build fails.

### 🧹 Cleaning Protocol

1.  **Symptom**: "Weird errors", "Ghost modules", "Cache accumulation".
2.  **Action**:
    - Delete `node_modules`
    - Delete `.svelte-kit` (if applicable)
    - Run `npm ci` (preferred over `install` for consistency)

## 4. Tools

| Tool      | Purpose                           | Command                                      |
| :-------- | :-------------------------------- | :------------------------------------------- |
| `npm`     | Dependency and script management. | `npm install`, `npm run ...`                 |
| `vite`    | Build tool and dev server.        | `vite`, `vite build`                         |
| `sync.js` | Configuration synchronization.    | `node .agent/skills/project/scripts/sync.js` |

## 5. Anti-Patterns

| Pattern                       | Reasoning                                                                                |
| :---------------------------- | :--------------------------------------------------------------------------------------- |
| Manually editing `.gitignore` | **Sync Logic**. It will be overwritten by `sync.js`. Edit `ignores.master.json` instead. |
| Committing `node_modules`     | **Hygiene**. Heavy artifact; never commit.                                               |
| Ignoring build errors         | **Quality**. Production builds must be clean.                                            |
