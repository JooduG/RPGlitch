# Plan: Emotional Half-Life Protocol

> Checkpoint: `emot-half-01`
> Stack: Logic → State → Scoring → Pipe → Tests

---

## Phase 1 — Logic: Semantic Evaluator

**File**: `src/core/intelligence/SemanticEvaluator.js` `[NEW]`

- [x] Define `W_TIERS` array of `{ weight, pattern }` objects, ordered W=10 → W=6:
    - W=10: `kill|die|dead|death|destroy|identity|shatter|trauma|murder|execute|genocide|apocalypse`
    - W=9: `betray|revelation|confess|sacrifice|discovered`
    - W=8: `love|forgiv|vow|pact|promise|abandon`
    - W=7: `conflict|fight|anger|rage|intimate|kiss|touch|hold|secret|hidden`
    - W=6: `worry|afraid|argument|threat|warning`
    - Baseline fallback: `return 3`
- [x] Export `evaluate_weight(text: string): number` — iterates `W_TIERS`, first match wins, returns `3` if none
- [x] Export `SemanticEvaluator = { evaluate_weight }`

---

## Phase 2 — State: Schema Fix + Wiring

**File**: `src/core/intelligence/vector_engine.js` `[MODIFY]`

- [x] Import `SemanticEvaluator` from `./SemanticEvaluator.js`
- [x] Rewrite `create_vector()` output — flatten schema, remove `summary`, remove `score{}` wrapper:

    ```js
    {
      id,
      timestamp,
      text,
      emotional_weight,   // SET by SemanticEvaluator
      dynamics_tags,      // from DynamicsEngine.scan_reflexes()
      vector_tags,        // manual/system tags
    }
    ```

- [x] Call `SemanticEvaluator.evaluate_weight(text)` to populate `emotional_weight`
- [x] Update JSDoc schema block at top of file

---

## Phase 3 — Logic: Scoring Formula

**File**: `src/core/intelligence/vector_engine.js` `[MODIFY]`

- [x] Rewrite `score_vectors()` with composite formula:

    ```
    final_score = axis_score + entity_score + emotional_weight
    ```

    - `axis_score` = `+2` per matching `dynamics_tag` (unchanged)
    - `entity_score` = `+1` per matching `vector_tag` (unchanged)
    - `emotional_weight` = flat addend from the vector field (W=3 baseline, W=10 maximum)
    - No decay. No multipliers. No fallback for missing fields.

- [x] Update `score_vectors()` JSDoc to document new formula

---

## Phase 4 — Pipe: Prompt Labels

**File**: `src/core/intelligence/vector_engine.js` `[MODIFY]`

- [x] Update `format_past()` labels by W tier:
    - W ≥ 10 → `[CORE_MEMORY]`
    - W ≥ 8 → `[MAJOR_MEMORY]`
    - W ≥ 6 → `[MEMORY]`
    - W < 6 → `[ECHO]`
- [x] Apply same logic to `format_future()`
- [x] Update JSDoc on both functions

---

## Phase 5 — Tests

**File**: `src/core/intelligence/SemanticEvaluator.test.js` `[NEW]`

- [x] Returns 3 for empty/plain input
- [x] Returns 10 for "she was killed"
- [x] Returns 9 for "he betrayed me"
- [x] Returns 8 for "he promised he'd stay"
- [x] Returns 7 for "we fought bitterly"
- [x] Returns 6 for "I was afraid"
- [x] First matching tier wins (highest W, not lowest)

**File**: `src/core/intelligence/vector_engine.test.js` `[MODIFY]`

- [x] `create_vector` schema is flat — no `score` or `summary` properties
- [x] `create_vector` populates `emotional_weight` > 0 for emotional text
- [x] `score_vectors` — W=9 vector outscores W=3 vector with same axis hits
- [x] `format_past` — W=10 renders `[CORE_MEMORY]`
- [x] `format_past` — W=4 renders `[ECHO]`

**Verify:**

```bash
npm run test:unit src/core/intelligence/SemanticEvaluator.test.js
npm run test:unit src/core/intelligence/vector_engine.test.js
```
