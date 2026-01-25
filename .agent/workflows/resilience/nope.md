---
description: The Divergence Protocol. Triggers when a fix fails to meet expectations or bugs persist after verification.
---

# 🛑 Workflow: Nope (Divergence & Correction)

> **Trigger:** User invokes `/nope` or expresses frustration that a fix didn't work.
> **Philosophy:** "Insanity is doing the same thing over and over and expecting different results."

## 1. The Halt (Immediate Action)

1. **Acknowledge the Divergence**: State clearly that the previous attempt failed without excessive apologies.
2. **Rollback Assessment**: Check if you need to use `conductor/05-revert.md` to restore a working state.

## 2. The Diagnostic (Why were we wrong?)

Use the **[Diagnostic Questions](./knowledge/diagnostics.md)** to break your current mental model. Identify the _Expectation Gap_ and the _Flawed Assumption_.

## 3. The New Approach (Lateral Thinking)

**Constraint:** You are NOT allowed to try the "same fix but slightly different". You must propose a **Different Mechanism**.

- **Level 3 (Debug)**: Trace the root cause deeper.
- **Level 4 (Reframe)**: Question the architecture.
- **Level 5 (Conflict)**: Identify competing systems.

## 4. The Rigorous Verification Plan

Define a **Binary, Observable Truth Test** before writing code.

- "It should work now" is NOT valid verification.

## 5. Execution

Execute and verify. Present the evidence of the fix to the User.
