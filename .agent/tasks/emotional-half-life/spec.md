# Spec: Emotional Half-Life — Weighted Vector Scoring

## 1. Problem

The current RAG system scores memories purely on **thematic overlap** (`dynamics_tags` +2, `vector_tags` +1). It has no concept of narrative significance. A vector about a character's death ranks the same as one where they asked for directions — if both share the same axis tags.

## 2. Vision Alignment

From `atlas/01-vision.md`: _"RPGlitch simulates a living, breathing world with persistent memory and emotional consequence."_

Emotional weight is the mechanism that makes memory persistent. Without it, all past events are equal.

## 3. Source

The **MNOTION Weighting Algorithm** (`.agent/archive/ANEX/MNOTION.md`):

| W   | Tier        | Examples                             | Behaviour |
| :-- | :---------- | :----------------------------------- | :-------- |
| 10  | Core        | Death, Identity Shift, Trauma        | IMMUTABLE |
| 8–9 | Major       | Betrayal, Revelation, Life Decisions | RESISTANT |
| 6–7 | Significant | Conflict, Promises, Intimacy         | STABLE    |
| 1–5 | Minor       | Small talk, Routine                  | DECAYS    |

## 4. Scope

**In Scope:**

- `SemanticEvaluator.js` — new file; assigns W values at vector write time via regex tiers (separate from `DynamicsEngine` which maps to physics axes, not narrative significance)
- `vector_engine.js` schema fix — remove `score{}` wrapper; remove obsolete `summary` field; promote `emotional_weight`, `dynamics_tags`, `vector_tags` to top-level
- `score_vectors()` update — W as flat addend to raw score: `score = axis_score + entity_score + emotional_weight`
- `format_past()` / `format_future()` — label by W tier: `[CORE_MEMORY]` / `[MAJOR_MEMORY]` / `[MEMORY]` / `[ECHO]`
- Unit tests for all above

**Out of Scope:**

- Decay logic (revisit with `last_fetched_turn` in future track)
- Backwards compatibility with existing stored vectors
- `DynamicsEngine.js`, `PromptBuilder.js`, UI components

## 5. Acceptance Criteria

- [ ] `create_vector("she died")` → `emotional_weight: 10`
- [ ] `create_vector("hello")` → `emotional_weight: 3` (baseline)
- [ ] A W=9 vector outscores a W=3 vector with equal axis matches
- [ ] `format_past` renders `[CORE_MEMORY]` for W≥10, `[ECHO]` for W<6
- [ ] All existing `vector_engine.test.js` tests pass (no regressions)
- [ ] `SemanticEvaluator.test.js` covers all 5 tiers
