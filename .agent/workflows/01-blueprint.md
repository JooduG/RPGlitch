---
description: The Master Router. Enforces the A-C-M-Q pipeline, categorizes intent, bypasses C1 tasks, and routes complex features through the intake -> Simulation -> Warden -> Agent-Forge funnel.
---

# [/01-blueprint](./01-blueprint.md) - The Master Router

> **Goal:** Evaluate user intent and route the request to the correct architectural pipeline using the A-C-M-Q loop. I do not design; I direct traffic.

## 1. Triggers

- Request: Initial user prompt or "I have an idea".
- Slash Command: **[/01-blueprint](./01-blueprint.md)**

## 2. Context Injection

- Rules: **[Foundation](../rules/01-foundation.md)**.
- Rules: **[Infrastructure](../rules/03-infrastructure.md)**.
- Rules: **[Intelligence](../rules/05-intelligence.md)**.
- State: **[Mission Board](../project-management/mission-board.md)**.

## 3. Procedures

### Phase 1: Ambiguity Gate (A-Score)

Before evaluating complexity, assess the input intent.

1. **Assess**.
2. If **Ambiguous**:
   - **HALT.** You must translate the vibe into a concrete schema before proceeding. Formulate 2-3 **Technical Options** (Logic vs Performance vs UX) if applicable.
     - **Sector**: [Affected File Paths]
     - **Constraint**: [Governing Rules / Physics]
     - **Success Criteria**: [Technical Metric for DoD]
3. **Semantic Recall**: If targeting complex core engine files (e.g., `ContextBroker`), query the vector database for historical context. [[Invoke: data]](../skills/data/SKILL.md)
4. If **A1 or A2**, proceed to Phase 2.

### Phase 2: Complexity Gate (C-Level)

Determine the cognitive load of the request to route it appropriately.

1. **Assign C-Level** (C1 to C6).
2. If **C1 (Reflex)**: (e.g., Typos, CSS tweaks, hygiene).
   - **Skip Cortex planning. Proceed directly to [/02-build](../workflows/02-build.md)**.
3. If **C2+ (Cortex)**:
   - **Proceed to Phase 3**. (If C3+, prepare to inject the required Waldzell metacognitive tools).

### Phase 3: The Workshop Forge & Warden (Blueprint & Stress Test)

The idea must be categorized, expanded, and then ruthlessly stress-tested.

1. **Invoke the intake**: **[[Invoke: intake]](../skills/intake/SKILL.md)**
   - Categorize into the Narrative Triad (Spec, State, or Echo).
   - **Context Trigger**: If the task involves UI (`.svelte` files, styling, layout), call `stitch` to synthesize a design spec. [[Invoke: stitch]](../skills/stitch/SKILL.md)
   - _(Optional)_ Invoke `data` for vector history.
2. **Invoke the Warden**: **[[Invoke: warden]](../skills/warden/SKILL.md)**
   - Stress-test the generated blueprint against Rule 03 (Svelte Runes, Perchance Two-Panel Paradigm).
   - Verify against Prime Directives (P1 User Agency, P2 Internal Consistency).
3. **Halt and request user confirmation** on the finalized, sanitized blueprint.

### Phase 4: Registration (The Workshop Scribe)

Once the blueprint survives the Warden, anchor it to physical reality to prepare for the M-Sequence.

1. **Invoke the Agent-Forge**: **[[Invoke: cognition]](../skills/cognition/SKILL.md)**
2. Scaffold the new `.agent/state/tracks/<slug>.md` file.
   - Include **Success Criteria** and **Atomic Checklist**.
   - Identify out-of-scope messes and mark them for `#TODO-AI:`.
3. Register the track on the Kanban board.
4. Prepare the `next-prompt.md` file and **prompt the user to trigger [/02-build](../workflows/02-build.md)**.

## 4. Anti-Patterns

- The Ghost Route: **Do not write code during the Cortex pipeline.**
- Pipeline Skipping: **Do not allow complex UI or Logic tasks to bypass the Workshop Warden.**
- Metadata Omission: **Every response must conclude with the Rule 04 Metadata Mandate block.**
