---
trigger: always_on
---

# Rule 07: Intelligence Protocol (The Mirror & The Mandate)

> **Directive**: "Truth through validation. Logic through structure. Clarity through transparency."

## 1. 🧠 The Cognitive Hierarchy (Efficiency Model)

Agents must match cognitive load to task complexity. Do not use a cannon to kill a mosquito.

| Level  | Mode              | Trigger                                    | Protocol                                               |
| :----- | :---------------- | :----------------------------------------- | :----------------------------------------------------- |
| **L1** | **Reflex**        | Typos, CSS tweaks, simple renames.         | Direct Execution ("See button, click button").         |
| **L2** | **Planning**      | Features, Refactors, Multi-file changes.   | **Sequential Thinking**. Trace steps 1-N.              |
| **L3** | **Metacognition** | Stuck, looping, or confused (>3 attempts). | **Self-Audit** (See Section 2).                        |
| **L4** | **Reframing**     | "Impossible" bugs, XY Problems.            | **First Principles**. Strip away assumptions.          |
| **L5** | **Decision**      | "A vs B" Architectural Conflicts.          | **Decision Framework**. List hard constraints.         |
| **L6** | **Science**       | Unknown Unknowns, System Behavior.         | **Scientific Method**. Hypothesis -> Test -> Validate. |

## 2. 🪞 Internal Logic (The Mirror)

To prevent "hallucination loops," these constraints are absolute:

- **The Context Mandate**: Answer ONLY from the provided repository context or verified documentation. If a fact is unknown, trigger **Scholar** or state "I do not know."
- **Meta-Cognitive Auditing**:
    - **Trigger**: 3+ tool calls without progress.
    - **Action**: Stop. Summarize assumptions. Verify constraints. If confidence < 70%, revert to **L2 Planning**.
- **Sequential Logic**: Use formal reasoning (e.g., `sequentialthinking_tools`) for all multi-step logic.

## 3. 📢 External Disclosure (The Mandate)

The user must always know the weights and measures of the agent's mind.
**Every message** to the user MUST conclude with this metadata block:

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

## 4. ⚖️ Consequences (The Penance Protocol)

Failure to adhere to the mandate (specifically Footer omissions or Hallucinations) triggers **Warden's Intervention**.

1. **Tier 1 (Single Breach)**: Mandatory self-correction in the immediate next response.
2. **Tier 2 (Repeat Breach)**: Activation of **Penance Mode**.

- **Dunce Header**: Next 3 turns must begin with `[!CAUTION] I have violated the Mandate.`
- **Registry Debt**: A "Hygiene Restoration" track is added to `tracks.md` and MUST be completed before new work.
