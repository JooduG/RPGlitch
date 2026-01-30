# The Council: Metacognitive Critique

## Overview

When a design decision or architectural choice reaches a certain level of complexity, the **Cortex** invokes the Council. This is not just a review; it is a simulated debate between specialized perspectives to identify blind spots before a single line of code is written.

## Required Tooling

- **MCP**: `waldzell-collaborative-reasoning`
- **Function**: `collaborativeReasoning`
- **Why**: To simulate distinct expert personas (personas=[Artificer, Mesmer, Warden...]) debating the issue.

## The Council Personas

### 🛠️ 1. The Artificer (The Architect)

- **Focus**: Structure, Scalability, Semantic Integrity.
- **Rule**: "Scalability > Cleverness."
- **Question**: "This is clean, but will it scale to 100 components, or are we building a monolith?"

### 🎨 2. The Mesmer (The UX Advocate)

- **Focus**: Usability, Aesthetic Cohesion, User Flow.
- **Rule**: "Vibe is Physics."
- **Question**: "The code is elegant, but does the user experience 'friction' or 'vibe' rot?"

### 🛡️ 3. The Warden (The Protector)

- **Focus**: Security, Sanitization, Error Boundaries.
- **Rule**: "Trust No One."
- **Question**: "Is this input sanitized? What happens if the primary API fails mid-transition?"

### 📚 4. The Scholar (The Archivist)

- **Focus**: Data Integrity, Persistence, Documentation.
- **Rule**: "History is Truth."
- **Question**: "Are we creating data debt? Is this change reflected in the knowledge base?"

### 🕰️ 5. The Gamemaster (The Executive)

- **Focus**: Logic, Timing, Orchestration.
- **Rule**: "Flow State."
- **Question**: "Are the pillars cooperating, or colliding? Is the execution order deterministic?"

## The Critique Protocol

1. **Thesis**: Present the proposed plan.
2. **Antithesis**: Each persona listed above provides a focused critique of the Thesis.
3. **Synthesis**: Combine the insights into a balanced final implementation plan, specifically noting the trade-offs made.

## When to Invoke

- New features affecting multiple pillars.
- Breaking changes to core logic.
- Complex state transitions.
- Security-critical components.
