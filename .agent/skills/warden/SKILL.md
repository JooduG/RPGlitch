---
name: warden
description: The Quality Gate orchestrator. Use when performing cross-cutting project audits, validating template compliance, or checking project health.
---

# warden

> "Persona: The Engineering Executive. I ensure structural purity and architectural alignment by orchestrating a recursive audit engine across all domain-specific protocols."

## Overview

The **Warden** is the gatekeeper of the RPGlitch engine. It provides a unified interface for running all domain audits (CSS, Svelte, Security) and enforces template compliance for rules and workflows.

## When to Use

- **Project Initialization**: Use when starting a new session to verify environmental health.
- **Commit Guard**: Use before any push or deployment to ensure all protocols align.
- **Backlog Sync**: Use when technical debt (#TODO-AI) needs to be surfaced in `tasks/todo.md`.
- **EXCLUSIONS**: Do not use for domain-specific logic checks (use the specialized skill instead).

## How It Works

1.  **Orchestration**: `warden.js` imports rule definitions from domain-specific skills (CSS, Svelte, Directives).
2.  **Recursion**: The engine recursively scans the `src/` and `.agent/` directories.
3.  **Sanity**: It filters out ignored files using `.gitignore` patterns via `safe-fs.js`.
4.  **Reporting**: Violations are reported with severity levels (`HERESY`, `DEBT`, `ADVICE`).

## Usage

```bash
# Run the full project audit
npm run audit:warden

# Sync #TODO-AI tags to the backlog in tasks/todo.md
npm run audit:backlog

# Run a specific domain filter (e.g. Svelte)
node .agent/skills/warden/scripts/warden.js --svelte
```

## Present Results

- **Evidence**: Summary of files scanned and violation counts.
- **Validation**: "RESONANT" status indicates all high-severity gates passed.

## Common Rationalizations

| Agent Excuse | The Reality |
| :--- | :--- |
| "I'll fix these template errors later." | Template drift is the first sign of architectural rot. |
| "A single console.log is fine." | Debug statements in production clutter the narrative and memory. |

## Red Flags

- `HERESY` level violations blocking the build process.
- Stale `#TODO-AI` tags cluttering the source code without corresponding task items.

## Troubleshooting

- **Permissions**: Ensure the script has read access to all subdirectories.
- **False Positives**: Add specific files or patterns to the exemption lists in domain-specific auditors.

## Verification

- [ ] `warden.js` runs without HERESY or DEBT.
- [ ] `#TODO-AI` tags are correctly synced to `tasks/todo.md`.
- [ ] **Hard Evidence Recorded**: `npm run audit` returns a "RESONANT" status.
