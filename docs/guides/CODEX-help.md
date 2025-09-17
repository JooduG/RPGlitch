---
description: "Codex CLI quick help: agent operations, triggers, and common tasks"
tags:
  - codex
  - cli
  - help
  - operations
---

# Codex CLI — Quick Help

## Agent Operations

- `apply_patch`: add/update/delete files using minimal diffs. I propose a patch; you review changes before commit.
- `shell`: run terminal commands (read files, build, test, lint, scripts). I group related reads/commands with short preambles.
- `update_plan`: maintain a live step-by-step plan (pending/in_progress/completed) for multi-step work.

## Quick Triggers (what to ask)

- Plan: “Draft a 4–6 step plan before coding.”
- Read: “Show lines 1–120 of `apps/rpglitch/html/index.html`.”
- Patch: “Rename X, update Y, and add Z — minimal diff.”
- Run: “Run `npm run build` then `npm test`; show summaries.”
- Lint/Format: “Run `npm run lint:fix` scoped to changed files.”
- Verify: “Confirm `build/output/RPGlitch.html` exists and is non-empty.”

## Common Tasks

- Build: `npm run build`
- Build + copy: `npm run build:copy`
- Deploy (strict): `npm run deploy`
- Deploy (loose): `npm run deploy:loose`
- Lint: `npm run lint`  •  Fix: `npm run lint:fix`
- Markdown lint: `npm run lint:md`  •  Fix: `npm run lint:md:fix`
- Tests: `npm run test`
- Sync all: `npm run sync` (libs, configs, combine, hub)
- Combine docs only: `npm run sync:combine`
- Sync configs (ignores/IDE/MCP): `npm run sync:configs`
- Sync hub: `npm run sync:hub`

## Guardrails (important)

- Read first: `../../AGENTS.md` + relevant `memory-bank/**` (exclude `archive/`).
- Write only under: `apps/**`, `build/scripts/**`, `docs/**`, `tests/**`, `memory-bank/**`.
- Don’t touch: `build/output/**`, `.cursor/**`, `node_modules/**`.
- Validate before handoff: `npm run lint && npm test` (and build if relevant).

## Tips

- Folder-first rules: open local `README.md` (with YAML) for context, tasks, and links to `../../rules/`.
- Keep diffs small; ask for a plan on multi-step work.
