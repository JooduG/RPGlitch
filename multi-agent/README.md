# Multi-Agent System Overview

## Entry Point

This document is the entry point for all multi-agent workflows. It describes how to coordinate 1, 2, or 3 agents on any project. For project-specific file assignments and coordination points, see `project-config.md`.

---

## Scenarios & Division of Labor

### Scenario 1: Single Agent (Default)
- **Agent 1**: Owns all files, handles all development
- **Division**: None - full ownership
- **Handoff**: None - working alone

### Scenario 2: Two Agents
- **Agent 1 (Primary Developer)**: Core logic files (business logic, data, algorithms)
- **Agent 2 (UI/UX Specialist)**: Presentation files (HTML, CSS, UI components)
- **File Division**: Each agent owns complete files when possible; if shared, use clear comment markers
- **Handoff**: Agent 1 hands off to Agent 2 for UI work, and vice versa for integration

### Scenario 3: Three Agents
- **Agent 1 (Core Logic Specialist)**: Pure business logic and algorithms
- **Agent 2 (Frontend Specialist)**: All user-facing code (HTML, CSS, UI JavaScript)
- **Agent 3 (Quality & Infrastructure)**: Testing, build, deployment, documentation
- **File Division**: No shared files; clear interfaces and documented contracts
- **Handoff**: Agent 1→2 for frontend, 2→3 for testing, 1/2→3 for test suite

---

## Handoff & Handback

- **Handoff**: When one agent completes their phase, they document the current state, required elements, and integration points, then transfer file ownership to the next agent.
- **Handback**: When the next agent completes their work, they document changes, integration points, and return file ownership.
- **Fallback**: If any agent becomes unavailable, the previous agent resumes full control or the project falls back to single agent mode.

---

## Dynamic Assignment & Fallbacks

- **Single Agent**: Use for simple features, bug fixes, or maintenance
- **Two Agents**: Use for medium complexity features with clear logic/UI separation
- **Three Agents**: Use for large, complex features or when quality/testing is critical
- **Fallbacks**: If an agent is unavailable, responsibilities are reassigned as needed

---

## Key Files

- `agent-1-startup.md`: Instructions for primary agent
- `agent-2-startup.md`: Instructions for secondary agent
- `session-state.md`: Current multi-agent status
- `project-config.md`: Project-specific file assignments and coordination points

---

## Rules Integration

All agents must follow the same rules:
- Enhanced Error Handling
- Code Quality Standards
- Perchance Best Practices
- Communication Style
- Context Management
- Basic Security
- Multi-agent coordination (see `.cursor/rules/`)

---

## Benefits

- Specialization: Each agent focuses on their strength
- Parallel Work: JS and UI development can happen simultaneously
- Clear Boundaries: No file conflicts or confusion
- Flexible: Works with 1, 2, or 3 agents as available
- Recovery: System handles agent unavailability gracefully 