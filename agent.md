# AGENTS.md – GlitchCodex Project Guide

Version 1.0.0  |  Updated 2025‑07‑30

This file provides a shared context for Codex Cloud agents and human contributors working in the Perchance/Glitch monorepo.

---

## 1  Overview

The repository is organised as follows:

```mermaid
/
├── apps/                # Application source code
├── build/               # Build automation and output
├── memory-bank/         # Persistent project knowledge (Basic‑Memory MCP)
├── tools/               # Development utilities and scripts
├── linting/             # ESLint, Stylelint, etc.
├── .cursor/             # 39 rule files guiding the AI (Cursor All‑Rules)
└── README.md            # Project‑level documentation
```

*All writes outside these folders are blocked by Codex Cloud permissions.*

---

## 2  Context Sources

Agents should load context from the following locations **before** starting any task:

| Path             | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `.cursor/rules/` | Contains 39 rule files with organisation‑wide standards and architectural guidelines.   |
| `memory-bank/`   | Persistent knowledge store capturing past decisions, design rationale and known issues. |

> Tip for agents: query these folders first to avoid re‑deriving information.

---

## 3  Mission for Agents

1. Translate natural‑language prompts into production‑ready code.
2. Use the Unified **3‑Mode** architecture (Strategic → Tactical → Operational) and associated Thinking Framework.
3. Leverage MCP services (Context7, Time, Basic‑Memory, Sequential Thinking) when extra context is required.
4. Persist decisions in `memory-bank/` so future jobs inherit context.
5. Apply Cursor **All‑Rules** coding standards (HTML, CSS, JS, storage, performance).
6. Maintain zero technical debt—every job must lint, test and pass quality gates.

---

## 3  Development Environment Tips

* Use **pnpm** for all node work.
* `pnpm dlx turbo run where <project>` to jump to a package quickly.
* `pnpm install --filter <project>` to link a package into the workspace.
* `pnpm create vite@latest <project> -- --template react-ts` to scaffold a new app.
* Check each package’s `package.json` for the correct `name`.

### MCP & Codex

* Services are enabled via **Codex Cloud → Project → Services**.
* Environment variables & secrets are configured in **Project → Settings → Environment variables / Secrets**.
* Setup commands belong in **Project → Settings → Setup script**.

---

## 4  Coding Standards

### HTML

* Semantic elements, minimal wrappers, Pico.css baseline.
* Accessibility first: headings hierarchy, labelled controls, ARIA where needed.

### JavaScript & DOM

* ES2023 modules, `async/await`, Vanilla DOM for simple tasks, Cash DOM for complex chaining.
* Performance: debounce, throttle, memoise, lazy‑load.

### Storage

| Data complexity | Volume  | API            | Helper   |
| --------------- | ------- | -------------- | -------- |
| Simple settings |  < 5 MB | `localStorage` | —        |
| Complex objects |  > 5 MB | `IndexedDB`    | Dexie.js |

### Performance Best Practices

* Intersection Observer, Resize Observer, Service Workers.
* Centralised config & feature flags.
* Robust error handling and logging.

---

---

## 6  Pull‑Request Instructions

* **Title format:** `[<package>] <summary>`.
* Include a concise description of the change.
* Reference related issues or tasks.
* Ensure all quality gates are green before requesting review.

---

## 7  Prompting Codex Effectively

### Provide Clear Code Pointers

Codex can search, but greppable identifiers, stack traces or direct paths speed it up.

### Include Verification Steps

Describe how to reproduce bugs, run tests and lint, or validate success.

### Customise the Approach

Specify commit references, logging needs, PR templates, or files to treat as AGENTS.md.

### Split Large Tasks

Break complex work into smaller steps; Codex handles and tests them better.

### Leverage Codex for Debugging

Paste detailed logs or error traces—Codex often spots root causes quickly.

### Try Open‑Ended Prompts

Ask Codex to clean up code, find bugs, brainstorm ideas, write docs, etc.

---

## 8  Safety & Quality Gates

1. External network calls (`curl`, `wget`, etc.) are blocked.
2. Linting: ESLint, Stylelint, HTMLHint, MarkdownLint.
3. Testing: unit (Vitest/Jest), integration and Playwright e2e.
4. Performance: Lighthouse CI budgets.
5. Graceful degradation and robust error handling are mandatory.

---

## 9  Permissions

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
```

Writes outside the project root are blocked.

---

## 10  Changelog

* **1.0.0 (2025‑07‑30)** – Converted previous Agent Guide into standard **AGENTS.md** structure; added dev tips, testing, PR, and prompting guidelines; ensured consistency and clarity.

---

End of file.
