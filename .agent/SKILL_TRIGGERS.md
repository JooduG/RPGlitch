# 🎯 Antigravity Skill Trigger Matrix

This document maps all registered skills and their activation signals. Use this to determine which context to load for a given user request.

## 1. Top-Level Skills Audit

| Skill               | Trigger Quality        | Strength / Weakness                                                                                                                                                  | Recommendation                                                                                               |
| :------------------ | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Artificer**       | ⭐⭐⭐⭐⭐ (Excellent) | **Strength**: Explicit "REQUIRED" mandate. Binds to file extensions (`.svelte`, `.css`) and keywords ("frontend").<br>**Weakness**: None.                            | Keep as is.                                                                                                  |
| **Conductor**       | ⭐⭐⭐⭐⭐ (Excellent) | **Strength**: Clear responsibility (Task State). Binds to high-level actions ("new feature").<br>**Weakness**: None.                                                 | Keep as is.                                                                                                  |
| **Cortex**          | ⭐⭐⭐⭐ (Good)        | **Strength**: Good conceptual trigger ("Complexity > L1").<br>**Weakness**: "Complex logic" is subjective. Can fail to trigger if user doesn't use "think" keywords. | **Update**: Add explicit file path triggers for `src/gamemaster/**` (Logic Core).                            |
| **Debugging**       | ⭐⭐⭐ (Fair)          | **Strength**: Explicit path trigger (`tools/tests`).<br>**Weakness**: Keyword trigger "bug/error" is reactive. Misses "why is this not working?" phrasing.           | **Update**: Broaden to include "investigate", "trace", "diagnose".                                           |
| **Doc Surgeon**     | ⭐⭐⭐⭐ (Good)        | **Strength**: Binds to `.agent` directory perfectly.<br>**Weakness**: Might be too aggressive for simple typo fixes in docs.                                         | Keep as is; safety first.                                                                                    |
| **Prompt Engineer** | ⭐⭐⭐⭐⭐ (Excellent) | **Strength**: Very specific domain keywords ("persona", "system prompt").<br>**Weakness**: None.                                                                     | Keep as is.                                                                                                  |
| **Scholar**         | ⭐⭐⭐⭐ (Good)        | **Strength**: Unified interface for "How To".<br>**Weakness**: Might conflict with "Cortex" for architectural questions.                                             | **Update**: Clarify that **Scholar** is for _Information Retrieval_ and **Cortex** is for _Decision Making_. |
| **Skill Forge**     | ⭐⭐⭐⭐⭐ (Excellent) | **Strength**: Explicit path trigger (`.agent/skills`).<br>**Weakness**: None.                                                                                        | Keep as is.                                                                                                  |

## 2. Sub-Skills Analysis

**Status**: Currently, **only `Cortex` uses active Sub-Skills ("Specialists").**

- **Cortex**: Uses `specialists/*.md` as active personas (e.g., "Act as an AI Engineer").
- **Others**: Use `knowledge/*.md` as passive reference material (e.g., "Here is how to use Pinecone").

**Recommendation**: This distinction is healthy.

- **Cortex** needs _Personas_ because it changes _who_ is thinking (Architect vs. SQL Expert).
- **Scholar/Artificer** only need _Knowledge_ because the "Persona" is constant (The Archivist / The Builder).

## 3. Cortex Specialists (Sub-Skills)

| Specialist       | Trigger Quality | Recommendation                                           |
| :--------------- | :-------------- | :------------------------------------------------------- |
| **AI Engineer**  | ⭐⭐⭐⭐        | Add trigger for "LLM", "RAG", "Vector".                  |
| **Architecture** | ⭐⭐⭐          | Add trigger for "Refactor", "Pattern", "SOLID".          |
| **Clean Code**   | ⭐⭐⭐⭐⭐      | Explicitly linked to "Refactoring" / "Simplification".   |
| **Mermaid**      | ⭐⭐⭐⭐        | Add trigger for "Diagram", "Visualize", "Flow".          |
| **Perchance**    | ⭐⭐⭐⭐⭐      | Binds to platform constraints. Essential.                |
| **DB Architect** | ⭐⭐⭐          | Needs explicit binding to `src/scholar/**` (Data Layer). |
