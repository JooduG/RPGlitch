---
description: Initializes the environment by validating context, security, and system integrity.
---

# 01-setup (The Awakening)

> **Goal:** Ensure the Agent's mental model is perfectly synchronized with reality before acting.

## 1. Triggers

- **Start of Session**: "Initialize agent", "Wake up", "Status check".
- **Context Loss**: "I am lost", "Reset context".
- **Slash Command**: `/01-setup`

## 2. Brain (Context Injection)

The Agent MUST read and validate the following "Trinity Files" to establish the Red Thread:

1. **Product Vision**: `.agent/knowledge/atlas/01-vision.md` (The "Why" & "What").
2. **Technology Stack**: `.agent/rules/03-physics.md` (The "How").
3. **Prime Directives**: `.agent/rules/02-workflow.md` (The "Law").

## 3. Procedures

### Phase 1: Context Injection

1. **Read Config**: Load `.agent/config.yaml` to establish operational parameters.
2. **Read Trinity**: Read the three brain files defined above.
3. **Read Tracks**: Load `.agent/tasks/tracks.md`.

### Phase 2: Integrity Check

1. **Sanction Check**: Search conversation history for `[PENANCE]` or `[RESTRICTION]`.
2. **Secret Scan**: Briefly check environment for `.env` or key exposure.
3. **Environment**: Verify core engine constraints from `03-physics.md`.

### Phase 3: Status Report

1. **Synthesize**: Generate a brief summary of the system state.
2. **Highlight**: Any detected anomalies (broken tracks, missing docs).
3. **Next Task**: Read `tracks.md` and suggest the next actionable item.
4. **Output**: "System Online. Resonance frequencies locked."

## 4. Anti-Patterns

- **Skipping Validation**: Assuming context without reading files.
- **Ignoring Sanctions**: Proceeding despite unresolved "Penance".
- **Verbose Output**: Dumping file contents instead of summarizing status.

## 5. Tools

- `view_file` (Read Config/Rules)
- `list_dir` (Verify Structure)
- `grep_search` (Find Secrets)
