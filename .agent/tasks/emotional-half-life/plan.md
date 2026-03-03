# Plan: Emotional Half-Life Protocol

## 1. Logic: Weight Semantic Engine

- **File**: `src/core/intelligence/semantic_evaluator.js` (New File)
- **Task**: Create `evaluate_weight(text)` using regex arrays to score input strings against MNOTION emotional tiers.
    - W=10 (Immutable): core trauma, death, identity destruction.
    - W=8-9 (Resistant): betrayal, revelation, unconditional love.
    - W=6-7 (Stable): conflict, anger, promises.
    - W=1-5 (Minor): baseline fallback.
- **Task**: Add `semantic_evaluator.test.js` to ensure the algorithm prevents hallucinations and accurately groups terms.

## 2. State: Annotation & History

- **File**: `src/core/engine/engine.js` (or relevant history ingestion module)
- **Task**: Intercept chat messages locally before adding to the history log array.
- **Task**: Assign and attach `{ weight: evaluate_weight(message.content) }` to the message payload natively.

## 3. Logic: Broker Synthesis (Context Pinning)

- **File**: `src/core/intelligence/intelligence_broker.js`
- **Task**: `pull_entities()` needs to analyze past context windows (e.g., `history.slice(-20, -3)`).
- **Task**: Filter out messages with `weight >= 8`.
- **Task**: Cap the pinned messages (e.g., max 2 most recent high-weight messages) to mitigate token bloat.
- **Task**: Morph these pinned messages into synthetic Entity Fragments equipped with an `EPISODIC_MEMORY_COMPILER` enhancer and inject them into the "Past" sector. This bypasses the brutal 3-turn decay without corrupting the active scene snapshot.

## 4. Automation & Validation

- **Task**: Update integration tests / Mocks to ensure the JSON structure output correctly binds the `weight` property to LLM instructions, and that prompt rendering limits token consumption properly.
