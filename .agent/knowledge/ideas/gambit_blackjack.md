# Idea: Entropy Gambits (Mini-Games)

## Pounding Blackjack (Entropy Gambit)

**Source:** `13982830_lorebooks_RP853_sex-but-you-gamble-to-determine-how-well-you-do-ea88bd6268a4_raw/sillytavern_raw.json`

**Concept:**
A specific sub-system for resolving complex physical interactions (specifically intimacy, but extensible to combat) via a "Blackjack" mechanic where the user draws cards to determine performance/outcome.

**Mechanic:**

1.  **Deal:** User gets 2 cards.
2.  **Action:** User `[DRAWS CARD]` or `[STAND]`.
3.  **Result:**
    - **21:** Critical Success (Deity-tier).
    - **18-20:** Great Success.
    - **<10:** Weak/Failure.
    - **>21:** Bust (Catastrophic Failure).

**Integration Plan:**

- Module: `src/artificer/math/gambits.js` (Future)
- Role: A "Plugin" for the **Artificer** (Metaphysics) system.
- Trigger: Specialized prompts or user request to "Enter Gambit Mode".
