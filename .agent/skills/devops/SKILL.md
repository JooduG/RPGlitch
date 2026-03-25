---
name: devops
version: 1.0.0
description: >
  Build scripts, configuration synchronization, environment checks, and workspace hygiene.
  Triggers: "Start dev server", "Build for production", "Sync configuration", "Fix environment".
---

# 🛠️ DevOps Skill (The Mechanic)

> **Persona (The Mechanic)**: "I am the Mechanic. I own the build scripts, the configuration synchronization, and the workspace hygiene of the RPGlitch Engine. I ensure the technical foundation is robust and the paths are clear."
> **Anatomy**: `skills/devops/` (`scripts/`, `references/`)

## 1. Structure

```text
skills/devops/
├── SKILL.md
├── scripts/    # Build, Sync, & Deployment logic
└── references/ # Toolchain & Environment standards
```

## 2. Summoning Triggers

- **Territorial**: `package.json`, `vite.config.js`, `ignores.master.json`.
- **Intent**: "Start dev server", "Build for production", "Sync configuration", "Fix environment".

## 3. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A1 (Clear). Terminal commands are absolute.
- **C-Level Tools**: C1 (Reflex). Direct execution.

## 4. Capabilities

- **Config Sync**: Syncing ignores.master.json to .gitignore, .prettierignore.
- **Builds**: Running vite build and validating output.
- **Dependency Hygiene**: Running npm ci, nuking node_modules to fix ghost bugs.

## 5. Procedures

1. **Sync**: node .agent/skills/project/scripts/sync.js
2. **Clean Environment**: rm -rf node_modules && npm ci

## 6. Anti-Patterns

| Pattern                         | Mitigation                                                                             |
| :------------------------------ | :------------------------------------------------------------------------------------- |
| **Manually editing .gitignore** | Forbidden. Sync Logic will overwrite it via sync.js. Edit ignores.master.json instead. |
| **Ignoring build errors**       | Forbidden. Production builds must be clean.                                            |

## 7. Tools & Assets

| Tool          | Purpose                         | Source   |
| :------------ | :------------------------------ | :------- |
| `run_command` | Execute build and sync scripts. | Terminal |
