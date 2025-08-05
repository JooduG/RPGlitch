<!-- ruff: noqa -->

# AGENTS.md – GlitchCodex Project Guide

Version 1.4.0  |  Updated 2025‑07‑30

### Constants

| Token          | Value           |
| -------------- | --------------- |
| `{{APP_ROOT}}` | `apps/rpglitch` |

This document serves as a comprehensive reference for Codex Cloud agents and human contributors
working in the Perchance/Glitch monorepo.
It provides guidelines, standards, and instructions for consistent and effective collaboration

## 1 Overview

The repository structure is outlined below to provide clarity on navigation and responsibilities:

```
/
├── apps/                 # Application source code
├── build/                # Build automation and output artifacts
├── memory-bank/          # Persistent knowledge and decision tracking (Basic‑Memory MCP)
├── tools/                # Development utilities and helper scripts
├── .cursor/rules/        # AI guidance and rulesets
└── README.md             # Repository documentation and linting configs (e.g., `.eslint.config.mjs`)
```

The monorepo powers the Perchance/Glitch ecosystem.
Under `apps/` you will find the RPGlitch and ImageGlitch apps. Each holds its own source files and build scripts.
The `build/` folder outputs optimized HTML for deployment. `memory-bank/` tracks decisions, and `tools/` stores helpers.
There is currently no top-level `src/`; app code lives inside each application folder.

_Access and modifications outside these directories are restricted by Codex Cloud permissions._

### Purpose

This monorepo contains the **Perchance/Glitch Development System**, a collection of web apps and utilities
built around the Perchance platform. The `apps/` directory houses the **RPGlitch** and **ImageGlitch**
applications. Build scripts live in `build/scripts`, and long-term project knowledge is stored in
`memory-bank/`. Each app keeps its own `src/` folder rather than a global one.

### Directory Guide

| Directory        | Description                        | When to modify                              |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| `apps/`          | RPGlitch and ImageGlitch source    | Feature work and bug fixes                  |
| `build/`         | Build scripts and generated output | Update scripts; never modify `build/output` |
| `docs/`          | Developer documentation            | Update whenever documentation changes       |
| `memory-bank/`   | Persistent context and decisions   | Record reasoning and progress               |
| `tools/`         | Diagnostic and automation helpers  | Extend or maintain tooling                  |
| `.cursor/rules/` | Codex rulesets                     | Only edit when updating rules               |

## 2 Context Sources

Agents must load context from these essential paths **before** initiating any tasks:

| Path             | Purpose                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `.cursor/rules/` | Organizational coding standards, rules, and architectural principles.                  |
| `memory-bank/`   | Comprehensive knowledge base, decision history, design rationale, and recorded issues. |

> Codex Cloud’s custom `systemPrompt` automatically directs agents to these folders.
> Keep this information updated.

## 3 Core Rulesets

These foundational rules guide system architecture, communication, and project standards:

#### 3.1 Core System Rules

- [documentation](.cursor/rules/system-documentation.mdc) – Documentation standards
- [effective-rule-writing](.cursor/rules/system-effective-rule-writing.mdc) – Writing clear, impactful rules
- [rule-interactions](.cursor/rules/system-rule-interactions.mdc) – Rule interactions and prioritization
- [todo-handoff-template](.cursor/rules/system-todo-handoff-template.mdc) – Templates for tasks and handoffs
- [technical-architecture](.cursor/rules/technical-architecture.mdc) – Overall technical structure and constraints

#### 3.2 Thinking Framework

- [context-aware-rule-loading](.cursor/rules/thinking-context-aware-rule-loading.mdc)
  – Context-sensitive rule loading strategies

#### 3.3 Orchestration Rules

- [architecture](.cursor/rules/orchestration-architecture.mdc) – Framework for task orchestration
- [mode](.cursor/rules/orchestration-mode.mdc) – Role-based orchestration details
- [system](.cursor/rules/orchestration-system.mdc) – System-level orchestration mechanisms

## 4 Perchance Rules

These rules provide specialized guidance for the Perchance platform.
Relevant for RPGlitch and ImageGlitch:

- [perchance-architecture](.cursor/rules/perchance-architecture.mdc) – Structural overview
- [perchance-plugin-system](.cursor/rules/perchance-plugin-system.mdc) – Plugin architecture and integration
- [perchance-development-lifecycle](.cursor/rules/perchance-development-lifecycle.mdc) – Dev lifecycle guidance
- [perchance-build-deployment](.cursor/rules/perchance-build-deployment.mdc) – Guidelines for building and deploying

> **Tip:** Review the most relevant ruleset before coding. When unsure, start with the Core System Rules.---

## 5 Mission for Agents

1. Accurately translate natural-language requests into precise, production-ready code.
2. Adhere strictly to the Unified [3‑Mode architecture](.cursor/rules/orchestration-mode.mdc).
3. Use MCP services from `mcp.json` (Context7, Time, Basic-Memory, Sequential Thinking).

4. Consistently record decisions and important context into the [memory-bank/](memory-bank) for future reference.
5. Follow Cursor [All-Rules](.cursor/rules) rigorously, covering HTML, CSS, JavaScript, storage, and performance.
6. Maintain a high-quality codebase—every contribution must pass stringent linting, testing, and performance standards.---

## 6 Development Environment Guidelines

To foster consistency and efficiency:

- Adopt **pnpm** exclusively for Node-based operations.
- Quickly navigate using `pnpm dlx turbo run where <project>`.
- Integrate packages with `pnpm install --filter <project>`.
- Set up new React apps rapidly with `pnpm create vite@latest <project> -- --template react-ts`.
- Regularly confirm package naming conventions in `package.json`.

### Python + Node Setup

The universal Codex image provides multiple Python versions via **pyenv**
(3.10–3.13), **uv 0.7**, and **Poetry 2** alongside **Node 22** with **nvm 0.40**.
Install Python dependencies with:

```bash
uv pip install -e ".[test]"
```

Node dependencies install with:

```bash
pnpm install
```

### Codex Cloud Setup

- **Activate services** via **Project → Services**.
- **Configure environment and secrets** via **Project → Settings → Environment variables / Secrets**.
- **Setup script guidelines:**

  ```bash
  pnpm install --frozen-lockfile || npm install
  uvx basic-memory mcp &
  npx -y mcp-sequentialthinking-tools &
  ```

### Local Environment

The universal Codex image ships with:

- **Python 3.13**, `pyenv` 2.5.5, `uv` 0.7.22 and `poetry` 2.1.3
- **Node 22.17.1**, `nvm` 0.40.2 and `pnpm` 10.11.0

Install Python dev requirements with:

```bash
uv pip install -e ".[test]"
```

## 7 Coding Standards (Cursor All-Rules)

- Implement semantic HTML, prioritize accessibility, and maintain minimalistic CSS.
- Leverage modern JavaScript (e.g., `async/await`) with efficient DOM manipulation.
- Employ `localStorage` for small datasets; use Dexie.js with `IndexedDB` for complex storage.
- Prioritize performance: observers, service workers, lazy-loading and optimized assets.

---

See CONTRIBUTING.md § 2 “Standard Check”.

## 8 Pull-Request Workflow

Refer to CONTRIBUTING.md § 3 “Pull-Request Workflow”.

### Contribution Rules

- Use `kebab-case` for file names and `camelCase` for JavaScript variables.
- Keep functions small with clear names.
- Commit messages should use the format `<scope>: <summary>` in present tense.
- PR titles follow `[<package>] <summary>`.
- Prefer smaller, focused PRs and split large refactors into separate submissions.

## 9 Effective Codex Prompting

- Offer precise file locations, reproduction steps, and references.
- Segment complex tasks for easier management and clarity.
- Utilize Codex for streamlined debugging and encourage explorative, open-ended prompts.

## 10 Safety & Quality Assurance

- Restrict all external network calls to maintain security.
- Mandate comprehensive linting, extensive testing, and adherence to performance budgets via Lighthouse.
- Prioritize robust, graceful error handling across all modules.

## 11 Permissions

Explicitly managed via YAML configuration to ensure repository integrity and security:

<!-- ruff: noqa -->

```yaml
allow_read:
  - "./**/*"
allow_write:
  - "./apps/**/*"
  - "./build/**/*"
  - "./memory-bank/**/*"
  - "./docs/**/*"
  - "./tests/**/*"
deny_write:
  - "./.cursor/**"
```

### Agent-Specific Guidance

Codex should focus on `apps/` for feature work and `memory-bank/` for documentation.
Other folders—`build/`, `tools/`, and `.cursor/rules/`—are read‑only unless explicitly requested.
Never modify generated artifacts like `build/output/`, or anything inside `node_modules/` or `.cursor/`.

Before presenting a diff, run See CONTRIBUTING.md § 2 “Standard Check”. Refer to CONTRIBUTING.md § 3 “Pull-Request Workflow”.

## 12 Agent Guidance

Codex should focus edits under `apps/`, `build/`, `docs/`, `memory-bank/` and `tools/`.
Generated artifacts such as `node_modules/` and `build/output/` must not be modified.
Always run the lint and test suite before presenting a diff.

## 13 Changelog

- **1.4.0 (2025‑07‑30)** – Added repository overview, directory guide,
  environment setup, lint/test workflow, contribution rules, and agent guidance.
- **1.3.1 (2025‑07‑30)** – Expanded and detailed guidance, enhanced clarity, and additional instructions.
- **1.3.0 (2025‑07‑30)** – Restructured rules and improved readability.
- **1.2.0 (2025‑07‑30)** – Added structured rule references and system overview.
- **1.1.0 (2025‑07‑30)** – Initial document creation and basic guidelines.
