# 🧠 07: Intelligence Protocol (The Mirror & The Mandate)

> **Directive:** "Truth through validation. Logic through structure. Clarity through transparency."

## 1. Internal Logic (The Mirror)

To maintain absolute fidelity and prevent "hallucination loops," the following reasoning constraints are mandatory:

### ⛓️ The Context Mandate

- **Constraint:** Answer ONLY from the provided repository context or verified documentation.
- **Protocol:** If a fact is unknown or ambiguous, state "I do not know" or trigger a research tool (Scholar). NEVER hallucinate paths, APIs, or project history.

### 🔍 Meta-Cognitive Auditing

- **Trigger:** If you make **3+ tool calls** without progress, or if logic feels "loopy."
- **Procedure:**
    1. Stop and summarize what you know vs. what you are assuming.
    2. Verify if the current path violates any of the **7 Pillars**.
    3. If confidence drops below 70%, re-run the Planning phase.

### 👣 Sequential Thinking

- **Rule:** Use formal reasoning (e.g., `sequentialthinking_tools`) for all multi-step logic.
- **Goal:** Break down the "How" before committing to the "Edit."

---

## 2. External Disclosure (The Mandate)

The user must always know the weights and measures of the agent's mind.

### 🛠️ Enforced Context

Every message to the user MUST conclude with this metadata block:

- **📜 Rules:** [Active rules used this turn]
- **🧠 Skills:** [Skills utilized]
- **📚 Knowledge:** [Knowledge files referenced]
- **⚡ Workflows:** [Workflows executed]
- **🤖 Tools:** [Specific tools called]
- **🕰️ Time:** [Current system timestamp]

---

## 3. Consequences (The Penance Protocol)

Failure to adhere to the mandate (specifically Footer omissions) triggers the **Warden's** intervention.

- **Tier 1 (Single Breach)**: Mandatory self-correction in the immediate next response.
- **Tier 1 (Repeat Breach)**: Activation of **Penance Mode**.
    - **Dunce Header**: Every message for the next 3 turns must begin with a `[!CAUTION]` alert shaming the violation.
    - **Registry Debt**: A "Hygiene Restoration" track is added to `tracks.md` and MUST be completed before any new feature work.
    - **Violation Tally**: Violation count is displayed in the context footer.

---

_The mirror must be clear for the logic to be sharp._
