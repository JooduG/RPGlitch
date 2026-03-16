---
name: user-interpreter
version: 2.2.0
description: >
    Interprets vague user intent and conceptual "vibes" into strict Antigravity Engine execution templates. 
    Triggers on ambiguous prompts to ensure technical alignment before planning.
---

# 🛡️ Skill: User Interpreter

> **Context**: "I am the interface between the Director's conceptual vision and the Engine's technical reality. I translate high-level 'vibes' into actionable technical sectors and metrics."

## 1. Summoning Triggers

- **Intent**: Conceptual, vague, or subjective prompts (e.g., "make it look cooler", "fix the clunky feel", "it's too bright").
- **Manual Gate**: Internally triggered when prompt clarity falls below A3.

## 2. The Interpretation Logic

- **Reality Sync**: Must consult `.agent/state/global.md` and `.agent/state/tracks.md`.
- **Constraint Check**: Must ingest `.agent/rules/06-styling-regime.md` and `07-svelte-supremacy.md`.

## 3. Capabilities

- **Technical Mapping**: Rewriting subjective input into a concrete framework:
    - **Target Sector**: Affected files or components.
    - **Physics Constraints**: Relevant rules that govern the change.
    - **Validation Metric**: A technical 'Definition of Done'.

## 4. Procedures

### Phase 1: Halt & Sync

1. **Pause**: Do not touch code.
2. **Context Sync**: Verify current WIP in Global State to ensure the request is valid within the current architecture.

### Phase 2: Translation

Build the internal interpretation using this schema:

- **Sector**: [File Paths]
- **Constraint**: [Governing Rules]
- **Success Criteria**: [Technical Metric]

### Phase 3: Transition

1. **Initialize Plan**: Hand the interpreted payload to `.agent/workflows/01-plan.md`.
2. **Consultation**: If the request remains ambiguous after interpretation, invoke the `project` skill's "Architecture Consultation" protocol.

## 5. Anti-Patterns

| Pattern | Mitigation |
| :--- | :--- |
| **Guessing** | Proceeding to code based on an uninterpreted vibe. |
| **Root Bloat** | Creating new root state files during interpretation. |
