---
name: Workflow Rules
description: What steps should an agent take?
---

# PR Review: Step-by-Step

## 1. **Preparation**
- Run **`gli review --dry-run`**.
- Fetch the diff from the base branch (e.g., `main`).

## 2. **Analysis**
- Compare the diff against the **`Sovereign AI-Native CLI spec`**.
- Verify compliance with `.agent/rules/`.
- Identify "Aesthetic Debt" (deviations from Rule 04).

## 3. **Output**
- Post a structured JSON summary to stderr.
- Format for human readability using the **`--human`** flag if requested.

## 4. **Feedback**
- Record any identified persistent issues into the **`issue`** system.
- Log the review session into the **`Echo`** (History).
