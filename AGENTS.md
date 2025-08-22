# AGENTS.md – RPGlitch Project Guide

Version 1.5.0 | Updated 2025-08-19

## Constants

| Token          | Value           |
| -------------- | --------------- |
| `{{APP_ROOT}}` | `apps/rpglitch` |

This document serves as a comprehensive reference for AI agents and human contributors working in the RPGlitch monorepo. It provides guidelines, standards, and instructions for consistent and effective collaboration.

## Overview

The repository structure is outlined below to provide clarity on navigation and responsibilities:

```md
/
├── apps/                 # Application source code (RPGlitch)
├── build/                # Build automation, scripts, and output artifacts
├── docs/                 # Project documentation and guides
├── memory-bank/          # Persistent knowledge and decision tracking (Basic-Memory MCP)
├── tests/                # Test files and testing utilities
├── tools/                # Development utilities and helper scripts
├── .cursor/rules/        # AI guidance and rulesets
├── .amazonq/rules/       # Amazon Q AI guidance (synced from .rules/)
└── README.md             # Repository documentation
```

The monorepo powers the RPGlitch ecosystem for Perchance. Under `apps/` you will find the RPGlitch application with its source files and build scripts. The `build/` folder contains automation scripts and outputs optimized HTML for deployment. `memory-bank/` tracks decisions, `tests/` contains all testing code, and `tools/` stores development helpers.

*Access and modifications outside these directories are restricted by permissions.*

### Purpose

This monorepo contains the **RPGlitch Development System**, a web application built for the Perchance platform. The `apps/` directory houses the **RPGlitch** application. Build scripts live in `build/scripts`, and long-term project knowledge is stored in `memory-bank/`. Tests are consolidated in the `tests/` directory.

### Directory Guide

| Directory        | Description                        | When to modify                              |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| `apps/`          | RPGlitch source code               | Feature work and bug fixes                  |
| `build/`         | Build scripts and generated output | Update scripts; never modify `build/output` |
| `docs/`          | Developer documentation            | Update whenever documentation changes       |
| `memory-bank/`   | Persistent context and decisions   | Record reasoning and progress               |
| `tests/`         | All test files and utilities       | Add tests for new features                  |
| `tools/`         | Diagnostic and automation helpers  | Extend or maintain tooling                  |
| `.cursor/rules/` | AI rulesets                        | Only edit when updating rules               |

## Context Sources

Agents must load context from these essential paths **before** initiating any tasks:

| Path             | Purpose                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `.cursor/rules/` | Organizational coding standards, rules, and architectural principles.                  |
| `memory-bank/`   | Comprehensive knowledge base, decision history, design rationale, and recorded issues. |

> AI systems automatically direct agents to these folders. Keep this information updated.

## Core Rulesets

These foundational rules guide system architecture, communication, and project standards:

### Core System Rules

- [Documentation](./rules/system-documentation-overview.md) – Documentation standards
- [Effective Rule Writing](./rules/system-effective-rule-writing.md) – Writing clear, impactful rules
- [Rule Interactions](./rules/system-rule-interactions.md) – Rule interactions and prioritization
- [Todo/Handoff Template](./rules/templates/todo.md) – Templates for tasks and handoffs
- [Technical Architecture](./rules/system-architecture.md) – Overall technical structure and constraints

### Thinking Framework

- [Context Aware Rule Loading](./rules/thinking-context-aware-rule-loading.md) – Context-sensitive rule loading strategies
- [Thinking Framework](./rules/thinking-framework.md) - Framework

### Orchestration Rules

- [Orchestration Mode](./rules/system-orchestration-mode.md) – Framework for task orchestration

## Perchance Rules

These rules provide specialized guidance for the Perchance platform:

- [Perchance Architecture](./apps/perchance-architecture.md) – Structural overview
- [Perchance Plugins](./apps/perchance-plugins.md) – Plugin architecture and integration
- [Perchance Development](./apps/perchance-lifecycle.md) – Dev lifecycle guidance
- [Perchance Deployment](./apps/perchance-build.md) – Guidelines for building and deploying

> **Tip:** Review the most relevant ruleset before coding. When unsure, start with the Core System Rules.

## Mission for Agents

1. Accurately translate natural-language requests into precise, production-ready code.
2. Adhere strictly to the Unified 3-Mode Architecture (Strategic → Tactical → Operational).
3. Use MCP services from `mcp.json` (Context7, Time, Basic-Memory, Sequential Thinking).
4. Consistently record decisions and important context into the Memory Bank for future reference.
5. Follow AI Rules rigorously, covering HTML, CSS, JavaScript, storage, and performance.
6. Maintain a high-quality codebase—every contribution must pass stringent linting, testing, and performance standards.

## Development Environment Guidelines

To foster consistency and efficiency:

- Use **npm** for Node-based operations.
- Regularly confirm package naming conventions in `package.json`.

### Node Setup

The environment provides **Node 22** with modern package management. Install dependencies with:

```bash
npm install
```

### Build Commands

- **Deploy to Perchance:** `npm run deploy` (sync all, test, lint, build & copy)
- **Build RPGlitch only:** `npm run build`
- **Lint everything:** `npm run lint` (use `npm run lint:fix` to auto-fix)
- **Sync everything:** `npm run sync` (libs, configs, combine docs)
- **Test:** `npm test`

## Coding Standards

- Implement semantic HTML, prioritize accessibility, and maintain minimalistic CSS.
- Leverage modern JavaScript (e.g., `async/await`) with efficient DOM manipulation.
- Employ `localStorage` for small datasets; use Dexie.js with `IndexedDB` for complex storage.
- Prioritize performance: observers, service workers, lazy-loading and optimized assets.

### HTML

- Semantic elements, minimal wrappers, Pico.css baseline.
- Accessibility first: headings hierarchy, labelled controls, ARIA where needed.

### JavaScript & DOM

- ES2023 modules, `async/await`, Vanilla DOM for simple tasks, Cash DOM for complex chaining.
- Performance: debounce, throttle, memoize, lazy-load.

### Storage

| Data complexity | Volume | API            | Helper   |
| --------------- | ------ | -------------- | -------- |
| Simple settings | <5MB   | `localStorage` | —        |
| Complex objects | >5MB   | `IndexedDB`    | Dexie.js |

### Performance Best Practices

- Intersection Observer, Resize Observer, Service Workers.
- Centralized config & feature flags.
- Robust error handling and logging.

## Contribution Rules

- Use `kebab-case` for file names and `camelCase` for JavaScript variables.
- Keep functions small with clear names.
- Commit messages should use the format `<scope>: <summary>` in present tense.
- PR titles follow `[<package>] <summary>`.
- Prefer smaller, focused PRs and split large refactors into separate submissions.

## Effective AI Prompting

- Offer precise file locations, reproduction steps, and references.
- Segment complex tasks for easier management and clarity.
- Utilize AI for streamlined debugging and encourage explorative, open-ended prompts.

### Provide Clear Code Pointers

AI can search, but greppable identifiers, stack traces or direct paths speed it up.

### Include Verification Steps

Describe how to reproduce bugs, run tests and lint, or validate success.

### Split Large Tasks

Break complex work into smaller steps; AI handles and tests them better.

### Try Open-Ended Prompts

Ask AI to clean up code, find bugs, brainstorm ideas, write docs, etc.

## Safety & Quality Assurance

- Restrict all external network calls to maintain security.
- Mandate comprehensive linting, extensive testing, and adherence to performance budgets.
- Prioritize robust, graceful error handling across all modules.

### Quality Gates

1. External network calls are blocked.
2. Linting: ESLint, Stylelint, HTMLHint, MarkdownLint.
3. Testing: unit (Jest), integration and end-to-end.
4. Performance: Lighthouse CI budgets.
5. Graceful degradation and robust error handling are mandatory.

## Permissions

Explicitly managed to ensure repository integrity and security:

```yaml
allow_read:
  - "./**/*"
allow_write:
  - "./apps/**/*"
  - "./build/scripts/**/*"
  - "./memory-bank/**/*"
  - "./docs/**/*"
  - "./tests/**/*"
deny_write:
  - "./build/output/**/*"
  - "./.cursor/**"
```

## Agent-Specific Guidance

- Focus on `apps/` for feature work and `memory-bank/` for documentation.
- Other folders—`build/`, `tools/`, and `.cursor/rules/`—are read-only unless explicitly requested.
- Never modify generated artifacts like `build/output/`, or anything inside `node_modules/` or `.cursor/`.
- Before presenting a diff, run quality checks.

## Agent Operating Loop (all tasks)

1) Load context:
   - `.cursor/rules/**`
   - `memory-bank/**` (active + project-specific)
2) Plan → Implement → Validate:
   - Plan: write a short TODO in memory-bank/active/todo.md
   - Implement: small, reviewable diffs only
   - Validate: `npm run check` must pass
3) Record decisions in `memory-bank/projects/rpglitch/` before finishing.

### Non-negotiables

- No secrets in code or commits.
- Only modify files under `apps/`, `build/scripts/`, `memory-bank/`, `docs/`, `tests/`, `tools/`.

## Changelog

- **1.5.0 (2025-08-19)** – Merged agent-guide.md content, updated repository structure, added Amazon Q support, consolidated test organization
- **1.4.0 (2025-07-30)** – Added repository overview, directory guide, environment setup, lint/test workflow, contribution rules, and agent guidance
- **1.3.1 (2025-07-30)** – Expanded and detailed guidance, enhanced clarity, and additional instructions
- **1.3.0 (2025-07-30)** – Restructured rules and improved readability
- **1.2.0 (2025-07-30)** – Added structured rule references and system overview
- **1.1.0 (2025-07-30)** – Initial document creation and basic guidelines
