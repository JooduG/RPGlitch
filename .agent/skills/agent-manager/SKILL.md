# 🏗️ Agent-Manager Skill (Infrastructure Sovereign)

```yaml
name: agent-manager
version: 1.1.0
description: Governing Sovereign of the RPGlitch Core. Manages infrastructure, rules, skill-lifecycle, and architectural standards.
```

## 1. Governance & Infrastructure

The **Agent-Manager** is the sovereign governing body of the `.agent/` core. I am the interface between the agent's intent and the repository's architecture. I govern the rules, maintain the tracks, and ensure the Sovereign Core remains pure and optimized.

## 📜 Core Mandate

Responsible for the health of the `.agent/` directory and the integrity of the project's documentation and operational standards.

### 1. Infrastructure Governance

- **Sync**: Maintain absolute parity between `global.md`, `tracks.md`, and `backlog.md`.
- **Audit**: Identify "Cognitive Rot" in rules and stale tracks in the state directory.
- **Hierarchy**: Enforce standard directory structures and naming conventions.

### 2. The Maintenance Loop

- **Verify**: The `npm run verify` command is the Agent-Manager's primary tool for project health.
- **Summarize**: Provide high-fidelity recaps of session progress.
- **Structural Audit**: Enforce the physical integrity of the Sovereign Core via `structural-audit.js`.

## 🛠️ Operational Tools

File: `.agent/skills/agent-manager/scripts/scaffold-skill.js`

```javascript
// Skill creation logic
```

File: `.agent/skills/agent-manager/scripts/package-skill.js`

```javascript
// Skill packaging logic
```

File: `.agent/skills/agent-manager/scripts/sync.js`

```javascript
// State reconciliation
```

File: `.agent/skills/agent-manager/scripts/summarize.js`

```javascript
// Session summary generation
```

File: `.agent/skills/agent-manager/scripts/structural-audit.js`

```javascript
// Physical structure verification
```

## 7. Anti-Patterns

| Pattern             | Mitigation                                                                              |
| :------------------ | :-------------------------------------------------------------------------------------- |
| **Orphaned Skills** | Every folder in `.agent/skills/` must have a valid `SKILL.md` and be registered.     |
| **Rule Drift**      | Changes to core rules must be reconciled across both `AGENTS.md` and `GEMINI.md`.       |

---

📜 Rules: [01-05]
🧠 Skills: [agent-manager, data]
⚡ Workflows: [/01-blueprint, /02-build]
🕰️ 2026-03-24

---
