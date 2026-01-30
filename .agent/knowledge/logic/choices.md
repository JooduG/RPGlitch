# 🧩 Gamemaster: Strategic Choices (Decision Matrix)

> **Goal**: Resolve "A vs B" conflicts with data-driven weighted recommendations.

## Required Tooling

- **MCP**: `waldzell-decision-framework`
- **Function**: `decisionFramework`

## The Protocol: The Decision Matrix

When faced with a conflict (Architecture, Library, Pattern), you must produce a matrix:

1. **Hard Constraints**: List the "Must-Haves" (e.g., Svelte 5 Compliance, Offline-First).
2. **The Options**: Clearly define Option A, B, and (optionally) C.
3. **Pros/Cons**: Be brutal and honest.
4. **Weighted Scoring**: Score each option against the constraints.
5. **The Verdict**: Make a definitive choice. No "it depends".

## Anti-Patterns

- **The "Goldilocks" Choice**: Choosing the middle option because it's safe.
- **Decision Paralysis**: Researching forever. If two options are 90% similar, flip a coin or pick the one with better Svelte 5 support.
