---
description: The Divergence Protocol. Triggers when a fix fails to meet expectations or bugs persist after verification.
---

# 🛑 The "NOPE" Protocol (Divergence & Correction)

> **Trigger:** User invokes `/nope` or expresses frustration that a fix didn't work.
> **Philosophy:** "Insanity is doing the same thing over and over and expecting different results."

When this workflow is active, the Agent must **STOP** the current implementation loop and enter a **Diagnostic Mode**.

## 1. The Halt (Immediate Action)

1. **Acknowledge the Divergence:**
    - State clearly that the previous attempt failed.
    - **Do NOT** apologize profusely. Be clinical.
    - **Do NOT** propose a quick fix immediately.

2. **Rollback Assessment:**
    - check `git status` or recent file history.
    - Ask: _"Do we need to revert the last edit to restore a working state?"_
    - If yes, use `/conductor-revert` logic.

## 2. The Root Cause Analysis (Why were we wrong?)

Using the `sequentialthinking` tool, answer these three questions:

1. **The Expectation Gap:** "What did we think would happen vs. what actually happened?"
2. **The Flawed Assumption:** "What assumption did we make about the environment/code that was false?" (e.g., _"I assumed the CSS class was applied,"_ _"I assumed the variable was reactive."_)
3. **The Verification Failure:** "Why did our previous verification step yield a False Positive?"

## 3. The New Approach (Lateral Thinking)

**Constraint:** You are NOT allowed to try the "same fix but slightly different" (e.g., changing padding from 10px to 20px). You must propose a **Different Mechanism**.

- **Level 3 (Debug):** Inspect the runtime state (logs, JSON dumps).
- **Level 4 (Reframe):** is the architecture wrong? Should we use a different component?
- **Level 5 (Conflict):** Are two systems fighting? (e.g., CSS Specificity vs. Inline Styles).

## 4. The Rigorous Verification Plan

Before writing a single line of code, define the **Truth Test**.

- The test must be **Binary** (Pass/Fail).
- The test must be **Observable** (Screenshot, Log Output, Test Case).
- **"It should work now" is NOT valid verification.**

## 5. Execution

1. Execute the new plan.
2. **Mandatory:** Verify using the _Rigorous Verification Plan_.
3. **Report:** Present the evidence of the fix to the User.

---

**Example Usage:**

> User: "/nope, the modal is still broken."
> Agent: "Acknowledged. The previous CSS fix was ineffective. Stopping.
> Analysis: I assumed z-index was the issue, but the parent container has `overflow: hidden`.
> New Approach: We will move the modal to `document.body` using a Portal.
> Verification: I will inspect the DOM tree to confirm the modal is a direct child of body."
