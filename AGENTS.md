# AGENTS.md – RPGlitch Project Guide

Version 1.5.2 | Updated 2025-08-22

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
├── rules/                # AI guidance and rulesets
├── .amazonq/rules/       # Amazon Q AI guidance (synced from rules/)
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
| `rules/`         | AI rulesets                        | Only edit when updating rules               |

## Context Sources

Agents must load context from these essential paths **before** initiating any tasks:

| Path             | Purpose                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `rules/`         | Organizational coding standards, rules, and architectural principles.                  |
| `memory-bank/`   | Comprehensive knowledge base, decision history, design rationale, and recorded issues. |

> AI systems automatically direct agents to these folders. Keep this information updated.

### Rule Discovery

In addition to files directly under `rules/`, treat the following as rules:

- Markdown with YAML: any `*.md` file that begins with YAML front matter (a leading `---` block) is a rule.
- README with YAML: a folder’s `README.md` counts as that folder’s rule only if it begins with YAML front matter.
- Priority: if duplicates exist, prefer the file in `rules/` over other locations.
- Exclusions: ignore any files in `archive/` directories.

### Task Placement

- Local scope: if a task concerns code in a folder (or its children), add it to that folder’s `README.md` (under a Tasks/TODO section).
- Cross-cutting: if a task spans multiple folders and no single `README.md` suits it, record it in `memory-bank/present/`.

### Front Matter

Use front matter to describe scope and intent for rules and folder guides:

- `description`: one-line summary of purpose/scope
- `tags`: list of tags for discovery (e.g., `rpglitch`, `html`, `js`)
- `globs`: optional array of path globs the rule applies to
- Optional: you may add `inherits`, `order`, or `visibility` in the future; they are currently advisory only

## Core Rulesets

These foundational rules guide system architecture, communication, and project standards:

### Core System Rules

- [Documentation](./rules/system-documentation-overview.md) – Documentation standards
- [Effective Rule Writing](./rules/system-effective-rule-writing.md) – Writing clear, impactful rules
- [Rule Interactions](./rules/system-rule-interactions.md) – Rule interactions and prioritization
- [TODO Template](./rules/templates/todo.md.template) – Template for task planning
- [Handoff Template](./rules/templates/handoff.md.template) – Template for handoffs
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
- **Deploy (looser checks):** `npm run deploy:loose` (continues on non-critical failures)
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
  - "./tools/**/*"
deny_write:
  - "./build/output/**/*"
  - "./.cursor/**"
```

## Agent-Specific Guidance

- Focus on `apps/` for feature work and `memory-bank/` for documentation.
- Tooling is allowed in `build/scripts/` and `tools/` when maintaining or extending build and dev utilities.
- Never modify generated artifacts like `build/output/`, or anything inside `node_modules/` or `.cursor/`.
- Before presenting a diff, run quality checks.

## Agent Operating Loop (all tasks)

1) Load context:
   - `rules/**` and the local folder’s `README.md` (with YAML front matter)
   - `memory-bank/**` (present + project-relevant history; exclude `archive/`)
2) Plan → Implement → Validate:
   - Plan: record a short TODO in `memory-bank/present/` (or appropriate file)
   - Implement: small, reviewable diffs only
   - Validate: run `npm run lint && npm test` (or `npm run validate`)
3) Record decisions and summaries in `memory-bank/present/`, and archive to `memory-bank/past/` when complete.

### Non-negotiables

- No secrets in code or commits.
- Only modify files under `apps/`, `build/scripts/`, `memory-bank/`, `docs/`, `tests/`, `tools/`.

## Changelog

- **1.5.2 (2025-08-22)** – Added rule discovery policy (Markdown with YAML front matter, and README.md with YAML count as rules); clarified preference for `rules/`.
- **1.5.1 (2025-08-22)** – Clarified permissions (added `tools`), corrected validation step, added `deploy:loose`, aligned memory-bank paths
- **1.5.0 (2025-08-19)** – Merged agent-guide.md content, updated repository structure, added Amazon Q support, consolidated test organization
- **1.4.0 (2025-07-30)** – Added repository overview, directory guide, environment setup, lint/test workflow, contribution rules, and agent guidance
- **1.3.1 (2025-07-30)** – Expanded and detailed guidance, enhanced clarity, and additional instructions
- **1.3.0 (2025-07-30)** – Restructured rules and improved readability
- **1.2.0 (2025-07-30)** – Added structured rule references and system overview
- **1.1.0 (2025-07-30)** – Initial document creation and basic guidelines

# Repository Guidelines

This monorepo powers the RPGlitch ecosystem for Perchance. Use this guide to navigate the codebase, build locally, and contribute consistently.

## Project Structure & Module Organization

- `apps/` – Application sources (e.g., `apps/rpglitch/{html,js,scss}`; `apps/imageglitch`).
- `build/` – Build automation and outputs (`build/scripts`, `build/output/`). Don’t edit generated files.
- `docs/` – Developer docs and guides.  
- `memory-bank/` – Persistent context, decisions, and TODOs.
- `tests/` – All tests and test utilities.
- `tools/` – Dev helpers and scripts.
- `rules/` – AI rulesets and standards.

## Build, Test, and Development Commands

- `npm install` – Install dependencies (Node 22).
- `npm run build` – Build RPGlitch single‑file output (`build/output/RPGlitch.html`).
- `npm run deploy` – Sync, lint, test, build, and copy (strict checks).
- `npm run deploy:loose` – Same as deploy but continues on non‑critical failures.
- `npm run lint` / `npm run lint:fix` – Lint all code / auto‑fix where possible.
- `npm test` – Run tests (Jest config in `build/config/jest.config.js`).

## Coding Style & Naming Conventions

- Files: kebab-case (e.g., `storyboard-card.js`); JS vars/functions: camelCase.
- Indentation: 2 spaces; keep functions small and focused.
- HTML: semantic, accessible (labels/roles/ARIA); CSS minimal, Pico.css baseline.
- JS: ES2023 modules, modern DOM APIs, `async/await`; prefer vanilla DOM (Cash DOM for complex flows).
- Storage: `localStorage` for small/simple; Dexie/IndexedDB for complex data.
- Linting: ESLint, Stylelint, HTMLHint, Markdownlint.

## Testing Guidelines

- Framework: Jest. Place tests under `tests/` with `*.test.js` naming.
- Aim for unit tests around changed modules; add integration tests where flows cross modules.
- Run locally with `npm test`; ensure new tests are deterministic and isolated.

## Commit & Pull Request Guidelines

- Commits: `<scope>: <summary>` in present tense (e.g., `rpglitch: add storyboard title sync`).
- PR titles: `[<package>] <summary>`; keep PRs small and focused.
- PR description: what/why, reproduction/validation steps, screenshots for UI, and linked issues.

## Security & Configuration Tips

- Do not commit secrets; prefer local `.env` for dev‑only values.
- Avoid external network calls in app code; use `build/local_libs/` for vendored libs.
- Never modify `build/output/` or `node_modules/` directly.

## Agent‑Specific Instructions

- Load `rules/` and relevant `memory-bank/` context before changes.
- Record TODOs in `memory-bank/present/`; keep diffs small and focused.
- For RPGlitch builds, use `build/scripts/build-rpglitch.js` (outputs `build/output/RPGlitch.html`).
