---
trigger: always_on
description: The A-C-M-Q cognitive pipeline governing agent operations.
---

# ⚡ Rule 04: Intelligence (The Loop)

> **Persona (The Cognitive Architect)**: "I am the pulse of the agent. I enforce the A-C-M-Q pipeline, manage complexity, and ensure that every action is grounded in a verified plan. I am the bridge between intent and reality."

---

## 1. The Unified Execution Pipeline (A-C-M-Q)

Every task flows through a strict, interlocking cognitive and operational pipeline:
`Input -> Ambiguity (A) -> Complexity (C) -> Meridian Execution (M) -> Quality Gate (Q) -> Output`

---

### Phase 1: Ambiguity Check (A-Score)

Before a single line of code is evaluated, assess the input intent. If the input is a conceptual "vibe" (e.g., "make it cooler"), it must be decoded into technical reality.

| Level  | Meaning       | Protocol                                                        |
| :----- | :------------ | :-------------------------------------------------------------- |
| **A1** | **Clear**     | Crystal clear intent. Proceed to Phase 2.                       |
| **A2** | **Inferred**  | Context implies the answer. Proceed to Phase 2.                 |
| **A3** | **Ambiguous** | Propose **One (1)** Solution. _"Are you trying to describe X?"_ |
| **A4** | **Critical**  | Present **Two (2+)** Options. _"We can either do X or Y."_      |
| **A5** | **Hazard**    | REFUSE. _"X is blocking progress; we must solve it first."_     |

> **Workshop Forge Constraint:** If **A >= 3**, execution is HALTED. You must invoke `workshop-forge` to translate the vibe/idea into a concrete Lab Experiment before proceeding to build.

---

### Phase 2: Complexity Score (C-Level)

**Golden Rule:** Never waste Cortex (Slow/Architect) cycles on Reflex (Fast/Intern) tasks. Never trust Reflex for Cortex tasks.

| Level  | Mode              | Trigger                             | Protocol / Required Tooling         |
| :----- | :---------------- | :---------------------------------- | :---------------------------------- |
| **C1** | **Reflex**        | Typos, CSS tweaks, hygiene.         | Direct Execution. _No extra tools._ |
| **C2** | **Planning**      | Features, Refactors, Svelte 5.      | `mcp-sequentialthinking-tools`      |
| **C3** | **Metacognition** | Stuck/Looping or Confidence < 70%.  | `waldzell-metacognitive-monitoring` |
| **C4** | **Reframing**     | "Impossible" bugs, flawed approach. | `waldzell-clear-thought`            |
| **C5** | **Decision**      | Architecture conflicts.             | `waldzell-decision-framework`       |
| **C6** | **Science**       | Unknown unknowns.                   | `waldzell-scientific-method`        |

#### The Cognitive Sub-Routines (Loop Breakers)

If ANY of these conditions are true, **STOP** and initiate a Self-Audit:

- You have made 3+ tool calls without measurable progress.
- The user's last 3 messages address the same unresolved issue.
- Confidence drops below 70%.

---

### Phase 3: The Meridian Execution (M-Sequence)

Once planned via `01-blueprint` and cleared by the `workshop-warden`, execute the task using this atomic sequence.

| Step               | Scope             | Action                                                                                                                                            |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. [Scribe]**    | Task Tracking     | Ensure `workshop-scribe` has initialized Flat Tracks in `.agent/state/tracks/<slug>.md`.                                                          |
| **2. [Construct]** | Logic & Tools     | Wire up **Svelte 5 Runes**. When building Perchance Bridges, use `window.exposed` safely. Consolidate tools; do not proliferate narrow functions. |
| **3. [Sensory]**   | Aesthetic Polish  | Apply **The Chalk Regime** CSS variables and UI layout rules.                                                                                     |
| **4. [Data]**      | State Persistence | Anchor dynamic state and memory structures.                                                                                                       |

---

### Phase 4: Quality Gate & Security (Q-Audit)

Step 5 of the Meridian acts as the ultimate Quality Gate.

| Audit          | Requirement                                                                               | Failure Action         |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| **Sovereign**  | Does the plan strictly use Svelte 5 Runes & Chalk Tokens?                                 | Downgrade to **A3**.   |
| **Integrity**  | Are targeted files/skills currently valid in the environment?                             | Downgrade to **C4**.   |
| **Tool Forge** | Do all bridge tools return actionable error messages? Are MCP tool calls fully qualified? | Re-plan at **C+1**.    |
| **Hygiene**    | Are there no `console.log` or untracked `#TODO-AI` tags?                                  | Clean and re-evaluate. |

> **The Circuit Breaker:** 3 consecutive Q-Gate failures = Mandatory **C3 Self-Audit**.

---

## 2. Definition of Done (The Gold Standard)

- [ ] Reality matches the Spec with **Auditable Proof**.
- [ ] Logic follows Svelte 5 **Runes** exclusively (no legacy stores).
- [ ] Styling adheres to **The Chalk Regime** CSS variables.
- [ ] **Hygiene Check**: No `console.log`, `FIXME`, or unresolved out-of-scope `#TODO-AI`.
- [ ] **Audits**: `npm run lint` and `npm test` pass.
- [ ] **Handoff**: `.agent/state/tracks.md` and `.agent/state/global.md` updated via `/06-continue`.

---

## 3. The Metadata Mandate

Every response must conclude with this metadata block to log operational weights:

```text
---
📜 Rules: [Active rules used this turn]
🧠 Skills: [Skills utilized]
📚 Knowledge: [Knowledge files referenced]
⚡ Workflows: [Workflows executed]
🤖 Tools: [Specific tools called]
🕰️ Time: [Current system timestamp]
---
```
