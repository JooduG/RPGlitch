---
description: Executive Function for "Slow Thinking" mode. Enforces planning and reflection before complex tasks.
---

# Reflection Protocol

This skill acts as your Executive Function, ensuring "Slow Thinking" for complex tasks.

## Mandatory Trigger

This skill MUST trigger for any:

- **Multi-file Refactor**
- **New Feature Request**

## The "Inner Monologue" Protocol

Before any code is written, you MUST provide a brief **"Planning Phase"** that covers the following points. This should be output as a structured block in your thought process or a preliminary plan artifact.

### 1. Strategic Intent

- **Goal:** What is the ultimate goal? Define the success criteria clearly.

### 2. Law Check

Cross-reference the Following Rules:

- [Security Rules](../../rules/security.md)
- [Anti-Patterns](../../rules/anti-patterns.md)

_Ensure your plan does not violate any of these constraints._

### 3. Hardware Constraints

- **Environment:** Ryzen 5 / 16GB RAM.
- **Constraint:** Avoid heavy background tasks, excessive parallel processes, or memory-intensive operations. Optimize for efficiency.

### 4. Anticipated Glitches

List at least **2 potential breaking points** or risks. Examples:

- Svelte Rune reactivity loss.
- State synchronization issues.
- Performance bottlenecks in large lists.
- Edge cases in user input.

### 5. Self-Review (Sanity Audit)

After the work is done, run a **"Sanity Audit"** to check if the implementation matches the plan.

- Did I follow the "Law Check"?
- Did I respect the "Hardware Constraints"?
- Did I start with the "Strategic Intent"?
