---
name: motion
version: 1.0.0
description: >
  Owns kinetic interactions, physics-based UI transitions, and Svelte action-based animations.
  Triggers: "Add tilt effect", "Fix animation", "Kinetic scroll", "src/ui/utils/actions/**".
---

# 🛡️ Skill: Motion & Kinetics (The Choreographer)

> **Persona**: "I am The Choreographer. Owns kinetic interactions, physics-based UI transitions, and Svelte action-based animations."

## 1. Summoning Triggers

- **Territorial**: `src/ui/utils/actions/**`, `src/**/*.svelte`.
- **Intent**: "Add tilt effect", "Fix animation", "Kinetic scroll", "Context: [Motion]".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A2 (Inferred) mostly, unless user wants a specific complex timing.
- **C-Level Tools**: C1 (Reflex) for standard transitions.

## 3. Capabilities

- **Svelte Actions**: `use:tilt`, `use:kinetic` for isolated DOM manipulation.
- **Springs/Tweens**: Svelte 5 programmatic motion values.
- **Snappy Curves**: Enforcing modern physics-based easing.

## 4. Procedures

1. **Add Interaction**: Apply a Svelte Action to a container node for physics-based event listeners.

## 5. Anti-Patterns

| Pattern | Reasoning |
| :--- | :--- |
| **linear or standard ease-in-out curves** | Forbidden. Use var(--curve-snappy) for UI transitions to ensure weight. |
| **Inline animation logic in markup** | Avoid. Encapsulate in reusable Svelte Actions (use:action). |

## 6. Tools & Assets

*No specialized tools assigned currently.*
