# AGENTS.md – GlitchCodex Project Guide

Version 1.3.1  |  Updated 2025‑07‑30

This document serves as a comprehensive reference for Codex Cloud agents and human contributors working in the Perchance/Glitch monorepo, providing guidelines, standards, and instructions for consistent and effective collaboration.

---

## 1 Overview

The repository structure is outlined below to provide clarity on navigation and responsibilities:

```mermaid
/
├── apps/                 # Application source code
├── build/                # Build automation and output artifacts
├── memory-bank/          # Persistent knowledge and decision tracking (Basic‑Memory MCP)
├── tools/                # Development utilities and helper scripts
├── .cursor/rules/        # AI guidance and rulesets
└── README.md             # Repository documentation and linting configs (e.g., `.eslint.config.mjs`)
```

*Access and modifications outside these directories are restricted by Codex Cloud permissions.*

---

## 2 Context Sources

Agents must load context from these essential paths **before** initiating any tasks:

| Path             | Purpose                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `.cursor/rules/` | Organizational coding standards, rules, and architectural principles.                  |
| `memory-bank/`   | Comprehensive knowledge base, decision history, design rationale, and recorded issues. |

> Codex Cloud’s custom `systemPrompt` automatically directs agents to these folders. Always keep this information updated and synchronized.

---

## 3 Core Rulesets

These foundational rules guide system architecture, communication, and project standards:

### 3.1 Core System Rules

* [documentation](.cursor/rules/system-documentation.mdc) – Documentation standards
* [effective-rule-writing](.cursor/rules/system-effective-rule-writing.mdc) – Writing clear, impactful rules
* [rule-interactions](.cursor/rules/system-rule-interactions.mdc) – Rule interactions and prioritization
* [todo-handoff-template](.cursor/rules/system-todo-handoff-template.mdc) – Templates for tasks and handoffs
* [technical-architecture](.cursor/rules/technical-architecture.mdc) – Overall technical structure and constraints

### 3.2 Thinking Framework

* [framework](.cursor/rules/thinking-framework.mdc) – Cognitive models and structured reasoning
* [context-aware-rule-loading](.cursor/rules/thinking-context-aware-rule-loading.mdc) – Context-sensitive rule loading strategies

### 3.3 Orchestration Rules

* [architecture](.cursor/rules/orchestration-architecture.mdc) – Framework for task orchestration
* [mode](.cursor/rules/orchestration-mode.mdc) – Role-based orchestration details
* [system](.cursor/rules/orchestration-system.mdc) – System-level orchestration mechanisms

---

## 4 Perchance Rules

These rules provide specialized guidance specifically for the Perchance platform (relevant for RPGlitch and ImageGlitch):

* [perchance-architecture](.cursor/rules/perchance-architecture.mdc) – Structural overview
* [perchance-plugin-system](.cursor/rules/perchance-plugin-system.mdc) – Plugin architecture and integration
* [perchance-development-lifecycle](.cursor/rules/perchance-development-lifecycle.mdc) – Workflow and lifecycle management
* [perchance-build-deployment](.cursor/rules/perchance-build-deployment.mdc) – Guidelines for building and deploying

> **Tip:** Start by reviewing the most relevant ruleset for your task. When unsure, the **Core System Rules** provide foundational guidance.

---

## 5 Mission for Agents

1. Accurately translate natural-language requests into precise, production-ready code.
2. Adhere strictly to the Unified [3‑Mode architecture](.cursor/rules/orchestration-mode.mdc) (Strategic → Tactical → Operational), defined clearly in Codex Cloud Custom Instructions.
3. Utilize relevant [MCP services](mcp.json), including Context7, Time, Basic‑Memory, and Sequential Thinking for enhanced context management.
4. Consistently record decisions and important context into the [memory-bank/](memory-bank) for future reference.
5. Follow Cursor [All-Rules](.cursor/rules) rigorously, covering HTML, CSS, JavaScript, storage, and performance.
6. Maintain a high-quality codebase—every contribution must pass stringent linting, testing, and performance standards.

---

## 6 Development Environment Guidelines

To foster consistency and efficiency:

* Adopt **pnpm** exclusively for Node-based operations.
* Quickly navigate using `pnpm dlx turbo run where <project>`.
* Integrate packages with `pnpm install --filter <project>`.
* Set up new React apps rapidly with `pnpm create vite@latest <project> -- --template react-ts`.
* Regularly confirm package naming conventions in `package.json`.

### Codex Cloud Setup

* **Activate services** via **Project → Services**.
* **Configure environment and secrets** via **Project → Settings → Environment variables / Secrets**.
* **Setup script guidelines:**

  ```bash
  pnpm install --frozen-lockfile || npm install
  uvx basic-memory mcp &
  npx -y mcp-sequentialthinking-tools &
  ```

---

## 7 Coding Standards (Cursor All-Rules)

* Implement semantic HTML, prioritize accessibility, and maintain minimalistic CSS.
* Leverage modern JavaScript (e.g., `async/await`) with efficient DOM manipulation.
* Employ `localStorage` for small datasets; use Dexie.js with `IndexedDB` for complex storage.
* Prioritize performance using Intersection and Resize Observers, Service Workers, lazy-loading, and optimized resource handling.

---

## 8 Pull-Request Workflow

* Format titles as `[<package>] <summary>`.
* Provide clear, concise descriptions linked to relevant issues.
* Ensure all code contributions pass linting, testing, and performance benchmarks.
* Adhere strictly to [build-deployment](.cursor/rules/perchance-build-deployment.mdc) procedures for consistency and reliability.

---

## 9 Effective Codex Prompting

* Offer precise file locations, reproduction steps, and references.
* Segment complex tasks for easier management and clarity.
* Utilize Codex for streamlined debugging and encourage explorative, open-ended prompts.

---

## 10 Safety & Quality Assurance

* Restrict all external network calls to maintain security.
* Mandate comprehensive linting, extensive testing, and adherence to performance budgets via Lighthouse.
* Prioritize robust, graceful error handling across all modules.

---

## 11 Permissions

Explicitly managed via YAML configuration to ensure repository integrity and security:

```yaml
allow_read:
  - "./**/*"
allow_write:
  - "./apps/**/*"
  - "./build/**/*"
  - "./memory-bank/**/*"
  - "./src/**/*"
  - "./docs/**/*"
  - "./tests/**/*"
deny_write:
  - "./.cursor/**"
```

---

## 12 Changelog

* **1.3.1 (2025‑07‑30)** – Expanded and detailed guidance, enhanced clarity, and additional instructions.
* **1.3.0 (2025‑07‑30)** – Restructured rules and improved readability.
* **1.2.0 (2025‑07‑30)** – Added structured rule references and system overview.
* **1.1.0 (2025‑07‑30)** – Initial document creation and basic guidelines.
