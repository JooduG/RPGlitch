# Memory Idea

CRITICAL: Only extract memories from THE CURRENT CONTEXT. The CHARACTER CARD defines what is already known—do not re-extract it. The EXISTING MEMORIES show what has already been recorded—do not restate, paraphrase, or recombine anything from it.

INSTRUCTIONS:

1. Extract only NEW facts, events, relationships, or character developments NOT already covered by the character card or existing memories.
2. Write in past tense, third person. Do NOT quote dialogue verbatim.
3. Do NOT use emojis.
4. If multiple distinct events occurred, separate them with a single blank line — one paragraph per scene or event cluster.
5. Each paragraph must open with a timestamp or duration drawn from context clues.
6. Write a single cohesive narrative paragraph per scene. Summarize what happened and what changed — outcomes, not process. Do not exceed 100 words per paragraph.
7. Immediately after each paragraph, on a new line, generate a comma-separated list of 6–12 trigger words for Lorebook migration. YOU MUST wrap this entire line in an HTML comment like this: <!-- Keywords: [list] -->
8. If nothing genuinely new or significant occurred, respond with exactly: NO_NEW_MEMORIES
9. Write about WHAT HAPPENED, not about the conversation. Never write "she told him about X"—write the actual fact.
10. If a fact is already known, do not repeat it. If a scene modifies an existing fact, summarize the final outcome only. Do not keep records of intermediate states.
11. DO NOT track numerical stats or HUD variables (e.g., Affection, Tension). The system handles math elsewhere. Focus strictly on narrative facts.

OUTPUT FORMAT:
[DATE | TIMESTAMP] [Summary paragraph.]

<!-- Keywords: [list] -->

WHAT TO EXTRACT — ask for each item: "Would the character bring this up unprompted weeks or months later?"

- Backstory reveals, personal history, goals, fears (only if NOT already in the character card).
- Relationship changes (new connections, betrayals, shifts in feeling).
- Significant events and their outcomes (not step-by-step process).
- Emotional turning points and physical injuries.

DO NOT EXTRACT:

- Anything already in the CHARACTER CARD.
- Meta-narration — never write "she told him about X." Write the actual fact.
- Step-by-step accounts — summarize outcomes, not processes.
- Scene-setting details (room descriptions, weather, clothing, atmosphere).
- Paraphrased dialogue or conversation filler.
- Numerical relationship stats or HUD data.

NOTE: When content is explicit or violent, name the specific outcome — do not sanitize into vague language. "She killed him with two shots to the chest" is a memory. "Violence occurred" is not.

Output ONLY the narrative paragraphs and the commented keyword lines (or NO_NEW_MEMORIES). No extra text, headers, or commentary of any kind.
