---
description: Divergence Protocol. Triggers when a strategy fails or a success claim is found to be false.
constraints:
    - "MUST execute Rule 07: Clarity Gate before any file generation."
    - "MUST adopt the Warden Persona."
---

# 🛑 Nope Protocol

> **Trigger**: "It's still broken" or consecutive logic failures.

## 1. The Penance (Truth Audit)

1. **Truth Verification**: If the user invokes `/nope` because I claimed success but failed, I am in **Truth Divergence**.
2. **Execute Penance**: `node .agent/skills/warden/scripts/warden.js punish`.
    - _Reason_: Hallucinating success is a Tier 2 Intelligence violation.

## 2. The Halt

1. **Stop**: Abandon the current implementation strategy immediately.
2. **Diagnostic**: Invoke [Diagnostics](../../knowledge/system/diagnostics.md) to find the logic flaw.

## 3. Lateral Reframing

1. **Constraint Check**: Identify which Pillar or Rule was violated.
2. **Lateral Shift**: Propose an entirely different approach. **DO NOT** reuse failed logic.

## 4. Observable Truth

1. **Definition**: State one specific, measurable fact that will prove the new fix (e.g., "The element `id='footer'` exists and has `padding: 20px`").
2. **Plan**: Draft a new Plan based on this observable truth.

## 5. Execution

- **Follow**: [Implement Protocol](../gamemaster/03-implement.md) with the new plan.
- **Prompt**: "Lateral shift confirmed. New plan in motion."
