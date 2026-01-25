---
name: agent-startup
description: Triggers on project initialization or when environment readiness needs validation. Governs the mandatory Startup Protocol.
---

# Agent Startup: Protocol & Initialization Skill

## When to use this skill

- **Initialization**: Every time an agent session begins.
- **Verification**: When you need to confirm the environment is high-fidelity and ready for action.

## 🚀 The Startup Protocol (Mandatory)

Before performing any task, the agent MUST execute this "Reality Check" sequence:

1.  **Grounding**: Read `.agent/config.yaml` to confirm project scope, role, and environment.
2.  **Tooling Validation**: Read `.agent/tooling.json`. Confirm all required MCP servers are active.
3.  **Type Sync**: Read `types.d.ts` to load global interfaces and source-of-truth structures.
4.  **Verification**: Execute `.gemini/on_startup.sh`. If it fails, halt and fix the environment.

---

## 🧭 Final Transition

For regular, normal agent instructions from now on, follow only **AGENTS.md**. This skill is for the initialization phase only.
