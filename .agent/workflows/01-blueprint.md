---
description: The Master Router. Enforces the A-C-M-Q pipeline, categorizes intent, bypasses C1 tasks, and routes complex features through the Forge -> Warden -> Scribe funnel.
---

# 01-blueprint (The Master Router)

> **Goal:** Evaluate user intent and route the request to the correct architectural pipeline using the A-C-M-Q loop. I do not design; I direct traffic.

## 1. Triggers

- Request: Initial user prompt or "I have an idea".
- Slash Command: **[/01-plan](./01-plan.md)**

## 2. Brain (Context Injection)

- Rules: **[.agent/rules/01-foundation.md](../rules/01-foundation.md)**.
- Rules: **[.agent/rules/03-technetium.md](../rules/03-technetium.md)**.
- Rules: **[.agent/rules/04-intelligence.md](../rules/04-intelligence.md)**.
- State: **[.agent/state/tracks.md](../state/tracks.md)** (Mission Board).

## 3. Procedures

### Phase 1: Ambiguity Gate (A-Score)

Before evaluating complexity, assess the input intent.

1. **Assign A-Score** (A1 to A5).
2. If **A >= 3 (Ambiguous, Critical, or Hazard)**:
   - **HALT.** You must translate the vibe into a concrete schema before proceeding:
     - **Sector**: [Affected File Paths]
     - **Constraint**: [Governing Rules / Physics]
     - **Success Criteria**: [Technical Metric for DoD]
3. If **A1 or A2**, proceed to Phase 2.

### Phase 2: Complexity Gate (C-Level)

Determine the cognitive load of the request to route it appropriately.

1. **Assign C-Level** (C1 to C6).
2. If **C1 (Reflex)**: (e.g., Typos, CSS tweaks, hygiene).
    - **Skip Cortex planning. Proceed directly to [/02-build](../workflows/02-build.md)**.
3. If **C2+ (Cortex)**:
    - **Proceed to Phase 3**. (If C3+, prepare to inject the required Waldzell metacognitive tools).

### Phase 3: The Workshop Forge & Warden (Blueprint & Stress Test)

The idea must be categorized, expanded, and then ruthlessly stress-tested.

1. **Invoke the Workshop Forge**: **[[Invoke: workshop-forge]](../skills/workshop-forge/SKILL.md)**
   - Categorize into the Narrative Triad (Spec, State, or Echo).
   - *(Optional)* Invoke `stitch` for UI specs or `data` for vector history.
2. **Invoke the Workshop Warden**: **[[Invoke: workshop-warden]](../skills/workshop-warden/SKILL.md)**
   - Stress-test the generated blueprint against Rule 03 (Svelte Runes, Perchance Two-Panel Paradigm).
   - Verify against Prime Directives (P1 User Agency, P2 Internal Consistency).
3. **Halt and request user confirmation** on the finalized, sanitized blueprint.

### Phase 4: Registration (The Workshop Scribe)

Once the blueprint survives the Warden, anchor it to physical reality to prepare for the M-Sequence.

1. **Invoke the Workshop Scribe**: **[[Invoke: workshop-scribe]](../skills/workshop-scribe/SKILL.md)**
2. Scaffold the new `.agent/state/tracks/<slug>.md` file.
3. Register the track on the Kanban board.
4. Prepare the `next-prompt.md` file and **prompt the user to trigger [/02-build](../workflows/02-build.md)**.

## 4. Anti-Patterns

- The Ghost Route: **Do not write code during the Cortex pipeline.**
- Pipeline Skipping: **Do not allow complex UI or Logic tasks to bypass the Workshop Warden.**
- Metadata Omission: **Every response must conclude with the Rule 04 Metadata Mandate block.**
