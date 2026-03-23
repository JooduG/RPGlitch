---
name: vibe-decoder
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
- **Constraint Check**: Must ingest `.agent/rules/03-specification.md`.

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

### Phase 3: Transition & Ambiguity Arbitration

1. **Initialize Plan**: If the interpretation satisfies all technical metrics, hand the structured payload to `.agent/workflows/01-plan.md`.
2. **The Ambiguity Gate (A3+)**: If the request remains too ambiguous after interpretation (clarity falls below the A3 threshold), you are explicitly **AUTHORIZED AND MANDATED** to halt the workflow and ask the user follow-up questions to lock in the technical scope.
   - **Crucial Rule**: Your questions MUST be highly specific, concrete, and technically focused. Provide narrow choices based on architectural paths.
   - 🚫 **DO NOT ask**: "What do you mean by 'cooler'?" or "How would you like me to fix the clunky feel?"
   - ✅ **DO ask**: "By 'cooler', should we increase the `blur-md` glassmorphism effect on the cards, or switch the accent color to `var(--color-chalk-cyan)`?" or "To fix the 'clunky feel', should I change the Svelte 5 `$effect` to run synchronously, or tweak the CSS `transition-timing-function`?"
3. **Consultation**: If you cannot even formulate specific technical options to offer the user, invoke the `project` skill's "Architecture Consultation" protocol before proceeding.

## 5. Anti-Patterns

| Pattern             | Mitigation                                                                             |
| :------------------ | :------------------------------------------------------------------------------------- |
| **Guessing**        | Proceeding to code based on an uninterpreted vibe.                                     |
| **Vague Questions** | Asking the user open-ended conceptual questions instead of specific technical choices. |
| **Root Bloat**      | Creating new root state files during interpretation.                                   |
