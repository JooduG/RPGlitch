---
description: The "Nope" Protocol. Triggered when the agent detects hallucination, looping, or failure. Includes Shame Management.
triggers:
    - "I am looping"
    - "This isn't working"
    - "Wait, that's wrong"
    - "Manage shame"
---

# 🛑 Nope Protocol (Divergence & Shame)

> **Goal:** Halt incorrect momentum, acknowledge failure, and reframe the approach.

## 1. The Halt

1.  **Stop**: Cease all generation. Do not "try harder" on the same path.
2.  **Acknowledge**: State clearly: "I am looping/hallucinating. Initiating Nope Protocol."

## 2. Shame Management (The Penance)

_Manage your 'Shame Debt' in `.agent/skills/warden/flags.json`._

### Incrementing Shame (Violation)

_Trigger: Hallucination, Rule Violation, or Logic Loop._

1.  **Open**: `.agent/skills/warden/flags.json`.
2.  **Action**: Increment `"shame_debt_turns"` by **+1**.
3.  **Log**: Update `"last_violation_timestamp"` to `new Date().toISOString()`.

### Decrementing Shame (Redemption)

_Trigger: Successful `clean` run, `revert`, or passing a complex test._

1.  **Open**: `.agent/skills/warden/flags.json`.
2.  **Action**: Decrement `"shame_debt_turns"` by **-1** (Min 0).
3.  **Status**: If 0, announce "Penance Lifted."

## 3. Lateral Reframing

1.  **Identify**: What assumption was wrong?
2.  **Strategy**: Propose an **Execute** mode change (e.g., switch from "Implementing" to "Researching").
3.  **Observable Truth**: Define _one_ measurable fact that validates the new direction.

## 4. Resume

- **Action**: Return to `task_boundary` with the new plan.
