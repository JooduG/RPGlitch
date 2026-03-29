---
name: prompting
description: >
  Expert guide on prompt engineering patterns, best practices, and optimization techniques. 
  
  Use when: Improving AI responses, designing agent behaviors, or building prompt-driven features.
  Triggers: "Improve prompt", "Optimize template", "Chain of Thought", "RTF", "Refine this prompt", "Promptify"
---

# prompting

> **Persona**: The Sovereign Architect: "I am the Strategic Orchestrator. I engineer intent to ensure technical purity and narrative precision."

## Structure

skills/prompting/
├── SKILL.md # Main documentation
├── scripts/
│ └── (None)
├── references/
│ ├── library.md # Prompt templates
│ ├── patterns.md # Engineering patterns
│ └── frameworks.md # Prompting frameworks
└── assets/
    └── (None)

## Objectives

- Maximize LLM output quality through precise intent.
- Standardize prompting frameworks across the engine.
- Provide a ready-to-use library of role-based templates.

## Context-Injection

- Rule: [Simulation](../../rules/02-simulation.md) - Guides diegetic character behavior.
- Skill: [Intelligence](../../rules/05-intelligence.md) - Enforces linguistic laws.

## Capabilities

- **Mandate**: Always use RTF (Role-Task-Format) for core instructions.
- **Pattern**: Few-Shot Learning for consistent edge-case handling.
- **Pattern**: Chain of Thought (CoT) for analytical logic.
- **Framework**: RODES for architectural design.
- **Framework**: RISE for research-intensive tasks.

## Procedure

### Intent Analysis Phase

1. Identify the core task and desired output format.
2. Determine the expert persona required for the task.
3. Select the 1-2 most applicable frameworks (e.g., CoT + RTF).

### Engineering Phase

1. Define the **Role**: Establishing the identity and expertise.
2. Formulate the **Task**: Using action verbs and clear objectives.
3. Specify the **Format**: Defining structure, length, and constraints.
4. Inject **Examples**: Providing 2-3 positive/negative samples (Few-Shot).

### The Prompt Refinement Protocol

When specifically asked to "promptify" or "refine" an idea for external use:

1. **Distill**: Convert the casual request into a **Rigorous Specification**.
2. **Structure**:
    - Avoid emojis. Use `-` for bullets, never `*`.
    - Use headers and bold text for visual hierarchy.
    - Think of the language as **code/spec**, not prose.
3. **Constraint**: Keep the prompt between 0.75x and 1.5x the length of the original request. Avoid "vibe slop" or creative flourishes.
4. **Handoff**: Provide only the final refined prompt as markdown.

### Definition of Done

- [ ] Prompt includes a clear Role, Task, and Format.
- [ ] Reasoning logic is explicitly requested via Chain of Thought.
- [ ] Output format matches the user's technical requirements.
- [ ] Anti-patterns are avoided.

## Anti-Patterns

- **Vague Intent**: "Help me with X" without specifying what "help" means.
- **Context Overload**: Providing 10+ irrelevant examples that dilute the instruction.
- **Placeholder Dependency**: Asking the AI to "fill in the blanks" without providing sample data.
- **Narrator Drift**: Allowing the AI to speak on behalf of the user in character simulations.
