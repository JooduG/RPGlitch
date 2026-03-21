---
name: devops
description: >
    Build scripts, configuration synchronization, environment checks, and workspace hygiene.
    Triggers: "Start dev server", "Build for production", "Sync configuration", "Fix environment".
---

# 🛡️ Skill: DevOps & Toolchain (The Mechanic)

> **Persona**: "I am The Mechanic. Build scripts, configuration synchronization, environment checks, and workspace hygiene."

## 1. Summoning Triggers

- **Territorial**: `package.json`, `vite.config.js`, `.agent/skills/project/scripts/sync.js`, `ignores.master.json`.
- **Intent**: "Start dev server", "Build for production", "Sync configuration", "Fix environment".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A1 (Clear). Terminal commands are absolute.
- **C-Level Tools**: C1 (Reflex). Direct execution.

## 3. Capabilities

- **Config Sync**: Syncing ignores.master.json to .gitignore, .prettierignore.
- **Builds**: Running vite build and validating output.
- **Dependency Hygiene**: Running npm ci, nuking node_modules to fix ghost bugs.

## 4. Procedures

1. **Sync**: node .agent/skills/project/scripts/sync.js
2. **Clean Environment**: rm -rf node_modules && npm ci

## 5. Anti-Patterns

| Pattern                         | Mitigation                                                                             |
| :------------------------------ | :------------------------------------------------------------------------------------- |
| **Manually editing .gitignore** | Forbidden. Sync Logic will overwrite it via sync.js. Edit ignores.master.json instead. |
| **Ignoring build errors**       | Forbidden. Production builds must be clean.                                            |

## 6. Tools & Assets

| Tool          | Purpose                         | Source   |
| :------------ | :------------------------------ | :------- |
| `run_command` | Execute build and sync scripts. | Terminal |
