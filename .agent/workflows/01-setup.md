---
description: Initializes the Gamemaster environment by validating project context, security, and state.
skill: gamemaster
constraints:
    - "MUST adopt the Gamemaster Persona."
    - "MUST fail if critical context files are missing."
context:
    - "Initialize agent"
    - "Setup environment"
---

# ⚡ /01-setup

> **Mandate:** Ensure the agent's mental model is perfectly synchronized with reality.

## Phase 1: Inject Context (The Awakening)

You MUST read and validate the following files sequentially to establish the "Red Thread":

1.  **Read Core Instruction**: [GEMINI.md](../../GEMINI.md)
2.  **Read Prime Directive**: [AGENTS.md](../../AGENTS.md)
3.  **Read Index**: [.agent/index.md](../index.md)
4.  **Read Rules**: [.agent/rules/01-prime-directive.md](../rules/01-prime-directive.md)

## Phase 2: Verify Integrity (Warden)

Verify system health and security boundaries.

1.  **Check for Sanctions**: Search conversation history for `[PENANCE]` or `[RESTRICTION]` markers. If found, acknowledge debt.
2.  **Audit Secrets**: Scan environment for accidental `.env` or key exposure.

## Phase 3: Map Road (Cortex)

Assess strategic direction and active tracks.

1.  **Read Product**: [.agent/product.md](../product.md) (The Why).
2.  **Read Roadmap**: [.agent/roadmap.md](../roadmap.md) (The Where).
3.  **Read Tracks**: [.agent/tasks/tracks.md](../tasks/tracks.md) (The What).
4.  **Identify Status**: Cross-reference active tracks against the current milestone to determine project momentum.

## Phase 4: Initialize System (Freedom Protocol)

1.  **Verify Engine**: Read [bootstrap.js](../../src/core/engine/bootstrap.js) to ensure storage overrides are present.

## Phase 5: Report Status

Once all steps are verified:

1.  **Synthesize**: Generate a brief summary of the current system state.
2.  **Announce**:
    > "Gamemaster Online. Resonance frequencies locked."
3.  **Highlight**: Any detected hygiene or structural anomalies.
4.  **Suggest**: The next logical step based on `tracks.md`.
