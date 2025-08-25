# AGENTS.md – RPGlitch Project Guide  

Version **1.6.0** · Updated **2025-08-25**

This is the canonical playbook for human contributors and AI agents working in the RPGlitch/Perchance codebase. It defines how we think, what we’re allowed to touch, and how we keep the app deterministic, safe, and shippable.

---

## Table of Contents

- Core Rulesets
- Context Sources
- Perchance Rules (platform-specific)
- Mission for Agents
- Development Environment Guidelines
- Safety & Quality Assurance
- Permissions
- AI Editing Environment (Codex)
- Agent Operating Loop (all tasks)
- Security & Configuration Tips
- Commit & Pull Request Guidelines
- Changelog

---

## Core Rulesets

### Core System Rules

- Favor **determinism over cleverness**. If it’s inspectable, it’s debuggable.
- Small, reversible diffs > large, entangled changes.
- Keep **single sources of truth** (SSOT) for config and rules. If a file is derived, don’t hand-edit it.
- Document decisions where future-you will look first (see “Context Sources”).

### Thinking Framework

- Strategy → Tactics → Operations (STO).
  - **Strategy**: 1-3 sentences of intent + constraints.
  - **Tactics**: concrete steps / acceptance criteria.
  - **Operations**: actual code, tests, and concrete commands.
- When blocked, write the minimal repro and capture it under `memory-bank/present/`.

### Orchestration Rules
>
> Canonical operating model: **Unified Orchestrator Mode**  
> `memory-bank/forever/unified-orchestrator-mode.md`

#### **Live work pointers**

- Current plan index: `present/INDEX.md`  
- 30-day execution plan: `present/rpglitch-core-execution-plan.md`  
- Today’s context: `present/context-2025-08-25.md`

---

## Context Sources

Read in this order before you start changing anything:

1) **Rules**  
   - `rules/**` (global policies, style, tooling)  
   - `apps/**/README.md` (per-app guardrails, with YAML front matter)

2) **Current Context (Present)**  
   - `memory-bank/present/INDEX.md` (or `present/INDEX.md` in repo root)  
   - The latest context snapshot under `present/context-*.md`  
   - Any active execution plans (e.g., `present/rpglitch-core-execution-plan.md`)

3) **Permanent References (Forever)**  
   - Design system & UI standards  
   - Orchestrator & Basic Memory guides  
   - Time MCP example and other canonical patterns

4) **History (Past)**  
   - Milestone write-ups, change logs, and completed plans for background only

---

## Perchance Rules

These rules provide specialized guidance for the Perchance platform. If unsure, start with the **Core System Rules**, then come back here.

### Quick Constraints (TL;DR)

- **Single-file output**: final deliverable is **one inlined HTML** file.
- **Vanilla first**: HTML5/CSS3/ES2023; only libraries already shipped with the app (**Cash DOM**, **Dexie**, **DOMPurify**, **Hyperscript**).
- **Global App pattern**: attach new features as `App.*` methods/properties (e.g., `App.chat.send()`).
- **Plugins**: permitted when wired in the app: `ai-text-plugin`, `remember-plugin`, `upload-plugin`.
- **Sanitize**: any dynamic HTML (user/AI) must pass `DOMPurify.sanitize()`.
- **No icon-only controls**: text labels required (see `memory-bank/forever/design-icon-free-standard.md`).
- **Time**: fetch from **Time MCP**; do **not** hardcode dates/times.

> Tip: When editing chat logic, ensure there is a deterministic **Prompt Preview**, a clear **FSM** (`idle → sending → streaming → done|error|aborted`), and **Import/Export** for persistence/debugging.

---

## Mission for Agents

- Translate natural language goals into **production-ready Perchance code**, **without** breaking visual design.
- Keep **users in the loop** with small diffs and clear acceptance criteria.
- Where ambiguity exists, **state the assumption** in the PR description and keep the change reversible.

---

## Development Environment Guidelines

To foster consistency and efficiency:

- Use **npm** for Node-based operations (Node 22).
- Prefer `npm ci` for clean, reproducible installs.
- Respect the **allowed write paths** (see **Permissions**).

### Build Commands

- **Deploy to Perchance:** `npm run deploy` (sync all, test, lint, build & copy)
- **Deploy (looser checks):** `npm run deploy:loose` (continues on non-critical failures)
- **Build RPGlitch only:** `npm run build`
- **Lint everything:** `npm run lint`  (auto-fix: `npm run lint:fix`)
- **Sync everything:** `npm run sync`  (libs, configs, combined docs)
- **Test:** `npm test`

---

## Safety & Quality Assurance

### Quality Gates

- Lint clean, tests green (or explicit `--passWithNoTests` with rationale).
- No console errors on app startup; no dead buttons in core flows.
- All dynamic HTML sanitized; no unsanitized `innerHTML`.

### UI/UX Guarantees

- No icon-only buttons. Every control has a **text label**.
- Respect Pico.css semantics and spacing; no visual redesigns in logic PRs.

---

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
  - "./node_modules/**"
````

---

## AI Editing Environment (Codex)

To keep sessions deterministic and secure:

- **Custom instructions** should reference this file (AGENTS.md) and follow the **Agent Operating Loop** below.
- **Branch format:** `codex/{date}-{time}-{feature}`
  Example: `codex/2025-08-25-1420-fix-title`
- **Internet access:** **Off by default**. If enabled, use an explicit domain allowlist and restrict methods to `GET, HEAD`.
  Typical allowlist during setup: `registry.npmjs.org` (and optionally `cdn.jsdelivr.net`, `unpkg.com`).
- **Environment:** Node-first. If Python is required, use a separate environment profile.
- **Timezone:** `TZ=Europe/Stockholm` for consistent timestamps and tests.

### **Setup & Maintenance (policy)**

- Install with `npm ci`; key the cache to the `package-lock.json` hash; skip reinstall when unchanged.
- After setup/maintenance, run quick validations: `npm run lint` and `npm test` (or a single `npm run validate` if present).

---

## Agent Operating Loop (all tasks)

1. **Load context**

   - Read `rules/**` and the local `README.md` (with YAML front matter).
   - Read `memory-bank/**` — emphasize **present/** for current context; use **past/** for history; modify **forever/** only for policy updates.
   - Live pointers: `present/INDEX.md`, `present/rpglitch-core-execution-plan.md`.

2. **Plan → Implement → Validate**

   - **Plan:** record a short TODO in `memory-bank/present/` or the app’s README **Tasks** section.
   - **Implement:** small, reviewable diffs only in allowed paths.
   - **Validate:** `npm run lint && npm test` (or `npm run validate`).

3. **Record & Archive**

   - Capture key decisions and a short summary in `memory-bank/present/`.
   - When complete, **promote** that summary to `memory-bank/past/` with the date.

---

## Security & Configuration Tips

- Never commit secrets. Use local `.env` for dev-only values.
- Avoid external network calls in app code; prefer vendoring to `build/local_libs/`.
- Always sanitize dynamic HTML with `DOMPurify.sanitize()`.
- Fetch time via **Time MCP**; default timezone is **Europe/Stockholm**.
- Don’t hand-edit derived configs (e.g., generated MCP client files). Edit the **master** config and run the sync script.

---

## Commit & Pull Request Guidelines

- Commits: `<scope>: <summary>` (present tense)
  Example: `rpglitch: add storyboard title sync`
- PR titles: `[<package>] <summary>`; keep PRs small and focused.
- PR description: **what/why**, repro/validation steps, screenshots for UI, and linked issues.

### **Branch naming**

- For Codex-opened branches: `codex/{date}-{time}-{feature}`
- For human branches: `{scope}/{short-task}`
  Example: `rpglitch/storyboard-title-sync`

---

## Changelog

- **1.6.0 (2025-08-25)** — Add Orchestrator pointer, Codex policy, design/time constraints, DOMPurify requirement, deny writes to `node_modules`, live plan pointers under “Context Sources”.
- **1.5.x** — Earlier revisions (pre-Orchestrator consolidation).
