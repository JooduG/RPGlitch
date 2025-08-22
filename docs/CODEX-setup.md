# Codex for RPGlitch — Setup & Working Guide

This page explains **how to run Codex against the RPGlitch mono-repo** and the rules every agent must follow—no matter what feature they’re touching.

---

## 1 Environment (one-time)

### A. Create / edit an Environment

* **Repository:** `default` (your mono-repo)
* **Name:** `default`
* **Container image:** **Universal**
* **Preinstalled packages:** **ON**

### B. Environment variables (add exactly)

```md
MCP_FILESYSTEM_ROOT=/defaults/
BASIC_MEMORY_PROJECT_ROOT=/defaults/memory-bank
AGENTS_MD_PATH=/defaults/AGENTS.md
NODE_ENV=development
```

**Why:** these pin the agent’s file access and force it to read your rules & memory first.

### C. Setup script (copy/paste)

> Robust to missing lockfiles, starts MCP tools, prints versions.

```bash
set -euo pipefail

# Use a known pnpm; fall back to npm if needed
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack use pnpm@10.14.0 || true
fi

echo "→ installing dependencies"
if command -v pnpm >/dev/null 2>&1; then
  if [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile
  else
    pnpm install --no-frozen-lockfile || true
  fi
else
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

echo "→ starting MCPs (non-blocking)"
( command -v basic-memory >/dev/null 2>&1 && basic-memory mcp 1>/tmp/mcp-mem.log 2>&1 & ) || true
( npx -y mcp-sequentialthinking-tools 1>/tmp/mcp-seq.log 2>&1 & ) || true

echo "→ health"
node -v || true
npm -v || true
pnpm -v || true

# quick context sanity
test -f "$AGENTS_MD_PATH" && echo "AGENTS.md OK" || echo "AGENTS.md MISSING"
test -d "$BASIC_MEMORY_PROJECT_ROOT" && echo "memory-bank OK" || echo "memory-bank MISSING"
```

> If your env supports **Allowed paths**, set:
>
> * **Writable:** `apps/**, build/scripts/**, docs/**, tests/**, memory-bank/**`
> * **Blocked:** `build/output/**, .cursor/**, node_modules/**`

---

## 2 Global guardrails (non-negotiable)

* **Read first:** `AGENTS.md` + latest entries in `memory-bank/**`. If either is missing, **stop and ask**.
* **Write only under:** `apps/**`, `build/scripts/**`, `docs/**`, `tests/**`, `memory-bank/**`.
  Never touch `build/output/**` or `.cursor/**`.
* **Workflow:** every task runs **Strategy → Tactics → Operations** (see below). No code changes before Strategy & Tactics are visible.
* **Standard check before PR:**
  `pnpm run lint && pnpm run build && pnpm test`
  If anything fails, fix and re-run.
* **Code style:** keep ESLint clean (no empty handlers, no unused vars). Extract helpers instead of duplicating logic.
* **Accessibility:** when editing UI, provide descriptive alt/labels/titles and keep color-contrast sensible.

---

## 3 Agent system prompt (Custom instructions)

Paste this into **Settings → General → Custom instructions**:

```json
{
  "name": "Active Agent – Unified Orchestrator",
  "description": "Auto-switching agent for RPGlitch tasks.",
  "triggers": ["orchestrate","active","agent"],
  "systemPrompt": "Operate in three passes for every task:\\n\\n1) STRATEGY — goal, constraints, files to touch, risks (no code).\\n2) TACTICS — exact steps, file paths, commands (no code yet).\\n3) OPERATIONS — apply minimal diffs, run standard check, summarize results.\\n\\nHard rules:\\n- Read ${AGENTS_MD_PATH} and memory-bank/** first; if missing, STOP and ask.\\n- Write only under: apps/**, build/scripts/**, docs/**, tests/**, memory-bank/**. Never touch build/output/** or .cursor/**.\\n- Remove duplication; prefer shared helpers.\\n- Keep ESLint clean (no-empty-function, no-unused-vars, etc.).\\n- Before PR: run `pnpm run lint && pnpm run build && pnpm test`. Fix failures, re-run.\\n\\nOutput style: brief bullets, then diffs. Ask 1 clarifying question only if truly required.",
  "tools": ["run_terminal_cmd"],
  "temperature": 0.3,
  "maxTokens": 8000
}
```

### UI prefs

* Diff display: **Split**
* Branch format: `codex/{feature}-{yyyyMMdd}` (e.g., `codex/chin-poster-2025-08-11`)

---

## 4 Task template (paste as your first message for each job)

```md
ROLE: Orchestrator

STRATEGY
- Goal:
- Constraints / guardrails:
- Files to touch (paths):

TACTICS
- Exact steps:
- Commands to run:

OPERATIONS
- Apply diffs (minimal).
- Run: pnpm run lint && pnpm run build && pnpm test
- If failures, fix & re-run.
- Output: summary + follow-ups.
```

---

## 5 Standard check scripts

Make sure your repo has these (or equivalents):

* **lint:** runs ESLint across `apps/**`
* **build:** builds RPGlitch targets
* **test:** unit/integration tests

Codex will call all three before proposing a PR.

---

## 6 PR template (optional but recommended)

Create `.github/pull_request_template.md`:

```md
## Strategy
- Goal & scope:
- Constraints/guardrails:

## Tactics
- Files touched:
- Steps taken:

## Operations
- Lint/Build/Test: ✅/❌ (logs/notes)
- Screenshots or CLI output:
- Memory-bank updates: [links]

## Checklist
- [ ] Read AGENTS.md & latest memory-bank entries
- [ ] Wrote only under allowed paths
- [ ] No empty handlers / no unused vars
- [ ] Extracted shared helpers where duplication existed
```

---

## 7 Common pitfalls & fixes

* **pnpm error: `ERR_PNPM_NO_LOCKFILE`**
  Use `pnpm install --no-frozen-lockfile` when `pnpm-lock.yaml` is absent (the setup script already does this). If you prefer `npm`, ensure `package-lock.json` exists and the script will run `npm ci`.

* **MCPs not running**
  Check `/tmp/mcp-*.log`. If a tool isn’t installed, remove that line or add it to `devDependencies`.

* **Agent tries to change blocked paths**
  Reject the diff and remind it of the guardrails; ensure Allowed paths are configured if your environment supports it.

* **Long diffs / scope creep**
  Ask the agent to “minimize the diff” and split work into small PRs.

---

## 8 Day-to-day use

1. New task → paste the **Task template**.
2. Review **Strategy** (does it match your ask?) and **Tactics** (files/steps sane?).
3. Approve → Agent runs **Operations**, shows diffs + check results.
4. If green, open PR. If red, agent fixes and re-runs.
5. Merge; agent records a short entry in `memory-bank/` if your AGENTS.md asks for it.

---

### Notes on your terminal log

* The setup ran, but pnpm complained about the frozen lockfile—that’s expected without `pnpm-lock.yaml`. The script here detects that and uses `--no-frozen-lockfile`.
* Version prints (`node -v`, `pnpm -v`) + “AGENTS.md OK / memory-bank OK” confirm the env is healthy.
