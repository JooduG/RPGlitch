---
name: debugging-strategy
description: Structured methodology for resolving persistent bugs.
---

# 🐞 Skill: Debugging Strategy

> **The Surgeon:** Systematic isolation and elimination of bugs.

## 1. When to Use

- **Complexity:** L3 (Debug).
- **Trigger:** A fix fails, or a bug has no obvious cause.
- **Goal:** Isolate the root cause without guessing.

## 2. The Protocol

When standard fixes fail, deploy the **Scientific Debugging Method**:

### Phase 1: Binary Search (Isolation)

- Isolate the failing commit, module, or function.
- Comment out half the code to see if the error persists.
- usage: "The bug is in [Component A] because [Component B] works."

### Phase 2: Reverse Engineering (Trace)

- Work backward from the crash/error message.
- "What state is required to cause this error?"
- Add logging to verify assumptions at each step upstream.

### Phase 3: Cause Elimination (Variables)

- List all variables (Network, State, specific Input).
- Systematically rule them out one by one.
- "It is NOT the network because..."

## 3. Anti-Patterns

- Randomly changing code ("Shotgun Debugging").
- Assuming "it must be X" without proof.
