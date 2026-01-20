---
name: agents
description: Triggers on AGENTS.md, .agent/config.yaml, .agent/tooling.json, or when modifying agent behaviors. Governs bidirectional state synchronization and skill lifecycle management.
---

# Agents: State Synchronization & Lifecycle Skill

## When to use this skill

- Modifying `AGENTS.md`, `.agent/config.yaml`, or `.agent/tooling.json`.
- Adding, updating, or removing skills in `.agent/skills/`.
- Ensuring that agent configurations accurately mirror the codebase reality (e.g., matching the package manager or required tools).

## The Synchronization Philosophy

Agents and the codebase must exist in a **Bi-directional Mirror State**. If the project's infrastructure changes (e.g., a new library is added), the agent's `tooling.json` or `config.yaml` must be updated to reflect that reality immediately.

### 🔄 Bidirectional Sync Workflow

1.  **Code -> Agent**: After a major architectural change or dependency update, audit `.agent/config.yaml` and `.agent/tooling.json`.
2.  **Agent -> Code**: If an agent-wide rule or tool is added, ensure any necessary support scripts (like `.gemini/on_startup.sh`) are implemented or updated.
3.  **Verification**: Periodically run `npm run validate` to ensure the "Reality Check" remains passing.

---

## Skill Lifecycle Management

### 🛠️ Lifecycle Procedures

1.  **Creation**: Create `<skill-name>/` with a mandatory `SKILL.md`. Include trigger patterns in the `description` for AI understanding.
2.  **Installation**: For NEW skills, run `gemini skills install .agent/skills/<skill-name>/`.
3.  **Updating**: If you modify a `SKILL.md`, use the `/skills reload` command (or restart the session) to pick up changes.
4.  **Removal**: To delete a skill, run `gemini skills uninstall <skill-name>` and then delete the folder.

---

## Implementation Rules

- **Mirroring**: Never allow `tooling.json` to reference a tool that isn't installed in `package.json` or available in the path.
- **Protocol Adherence**: Every agent modification MUST be documented in `AGENTS.md` if it changes how agents interact with the system.
- **Self-Correction**: If an agent detects a mismatch between its config and the repo state, its first task MUST be to fix the config.

## Resources

- **Central Config**: `.agent/config.yaml`
- **Tooling Manifest**: `.agent/tooling.json`
- **Prime Directive**: `AGENTS.md`
- **Startup Logic**: `.gemini/on_startup.sh`
