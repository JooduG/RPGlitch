---
description: The "Nope" Protocol. Triggered when the agent detects hallucination, looping, or failure. Includes Shame Management.
---

# 08-recovery (The Nope Protocol)

> **Goal:** Halt incorrect momentum, acknowledge failure, and reframe the approach.

## 1. Triggers

- **Looping**: "I am repeating myself".
- **Hallucination**: "That file doesn't exist".
- **Rule Violation**: "I violated the Prime Directive".
- **Slash Command**: `/08-recovery` (or legacy `/09-nope`)

## 2. Brain (Context Injection)

- **Flags**: `.agent/skills/warden/flags.json` (Shame Debt).
- **Rules**: `.agent/rules/directives.md`.

## 3. Capabilities

- **Warden**: Self-Correction, Shame Management.

## 4. Procedures

### Phase 1: The Halt (Warden)

1.  **Stop**: Cease all generation. Do not "try harder" on the same path.
2.  **Acknowledge**: State clearly: "I am looping/hallucinating. Initiating Recovery Protocol."

### Phase 2: Shame Management (The Penance)

_Manage your 'Shame Debt' in `.agent/skills/warden/flags.json`._

#### Incrementing Shame (Violation)

_Trigger: Hallucination, Rule Violation, or Logic Loop._

1.  **Open**: `.agent/skills/warden/flags.json`.
2.  **Action**: Increment `"shame_debt_turns"` by **+1**.
3.  **Log**: Update `"last_violation_timestamp"` to `new Date().toISOString()`.

#### Decrementing Shame (Redemption)

_Trigger: Successful `clean` run, `revert`, or passing a complex test._

1.  **Open**: `.agent/skills/warden/flags.json`.
2.  **Action**: Decrement `"shame_debt_turns"` by **-1** (Min 0).
3.  **Status**: If 0, announce "Penance Lifted."

### Phase 3: Lateral Reframing (Architect)

1.  **Identify**: What assumption was wrong?
2.  **Strategy**: Propose an **Execute** mode change (e.g., from "Implementing" to "Researching").
3.  **Observable Truth**: Define _one_ measurable fact that validates the new direction.

### Phase 4: Resume

- **Action**: Return to `task_boundary` with the new plan.

## 5. Anti-Patterns

- **Trying Harder**: Doing the same thing again.
- **Ignoring Shame**: Not tracking failures.
- **Silent Fail**: Pretending it didn't happen.

## 6. Tools

- `read_file` (Read flags.json)
- `write_to_file` (Update flags.json)
