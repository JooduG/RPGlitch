# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Active

---

## 🎯 Active Goal

### `feature-2026-07-28-bayesian-psychology`

Adapt six concepts from Bayesian cognitive modeling research (ANEX Framework + Bayes' Theorem for LLMs) into RPGlitch's existing 2-shot architecture to deepen psychological realism in AI character roleplay — **without adding any new user-facing UX or settings**. All six adaptations operate under the hood, piggybacking on the existing Director shot (Shot 1) and Character shot (Shot 2), with zero additional LLM calls.

**Design Constraint**: The previously removed `dynamics_scan` system (2026-06-29) proved that conditional, on/off prompt injection is hard to calibrate. These adaptations avoid that trap by using continuous signals and deterministic JS-side computation — no conditional protocol switching, no threshold-gated injection. Everything is always-on and weighted naturally by the LLM.

**Reference Spec**: `.agents/skills/simulation/data/SUGGESTION-somatic-psychology-engine.md` — the SPTE design doc. Parts were implemented (somatic tells, epistemic physics, observability). This track completes the unimplemented portions: evidence classification, trigger amplification, attachment presets, and neuroplastic decay.

---

## 📐 Audit Summary

### Current 2-Shot Pipeline (`kernel.js:execute_turn`)

```
HYDRATE → SETTLE_PHYSICS → DIRECTOR (Shot 1, JSON) → APPLY_MUTATIONS → CHARACTER (Shot 2, prose) → VALIDATE → PERSIST → CONSOLIDATE
```

1. **Director Shot** (`prompts.js:render_director`): Receives entity state + user input. Returns JSON with `_thought_process`, `mutations` (present_append, resolve_vectors, new_vectors, dynamics_deltas). Also already returns `somatic_tells`, `intent`, `dialogue_direction` (consumed in `kernel.js:340-367`).
2. **Character Shot** (`prompts.js:render_character`): Receives entity identity + scene state + protocols. Produces `<think>` cognition block + 2 paragraphs prose.
3. **Consolidation** (`temporal.js:temporal_engine.consolidate`): Fires when 8+ unconsolidated messages. Calls `forge_memory()` (single LLM call) → distributes memory + present_summaries + eternal_mutations to all entities.
4. **Vector Scoring** (`temporal.js:score` / `score_async`): Ranks by `emotional_weight × (1 + semantic_similarity) × recency_factor`. Embeddings engine (`embeddings.svelte.js`) provides 384-dim cosine similarity — operates on **semantic relevance ranking**, not evidence classification.
5. **Dynamics Settlement** (`dynamics.js:settle_physics`): Gravity pull toward `dynamics_baseline` with entropy-variance. Baselines extracted via `_get_baselines(entity)` → `entity.dynamics_baseline`.
6. **Entity Schema** (`normalizer.js:normalize`): Characters have `dynamics`, `dynamics_baseline`, `eternal`, `present`, `past[]`, `future[]`. No `attachment_style` field currently. `TemporalVector` (in `temporal.js:create`) has: `id`, `timestamp`, `directive`, `type`, `emotional_weight`, `tags`, `meta`.

### Key Insight: Where the Adaptations Hook In

| Adaptation                                         | Hook Point                                             | New LLM Calls?           | Files Modified                           |
| -------------------------------------------------- | ------------------------------------------------------ | ------------------------ | ---------------------------------------- |
| 1. Evidence Classification + Trigger Amplification | Director JSON schema + `apply_state_mutations`         | No (piggybacks Director) | `prompts.js`, `temporal.js`, `kernel.js` |
| 2. Vector Categories                               | `temporal.js:create` + `render_character` FUTURE block | No                       | `temporal.js`, `prompts.js`              |
| 3. Goal Arbitration Tension                        | `render_character` FUTURE block assembly               | No                       | `prompts.js`                             |
| 4. Cognitive State Signal                          | `render_character` system block                        | No                       | `prompts.js`                             |
| 5. Attachment-Style Baseline Presets               | `dynamics.js` + `normalizer.js`                        | No                       | `dynamics.js`, `normalizer.js`           |
| 6. Neuroplasticity                                 | `temporal_engine.consolidate` post-forge pass          | No                       | `temporal.js`                            |

---

## 🧪 TDD Verification Plan

All tests follow the existing Vitest pattern (colocated `*.test.js`, mocked dependencies via `vi.mock`). Each phase has red-green-refactor cycles.

### Test Suites to Add/Extend

1. **`temporal.test.js`** — Extend for: `create()` with `category` and `triggers` fields, `apply_state_mutations` with trigger amplification, `consolidate` neuroplasticity pass.
2. **`prompts.test.js`** — Extend for: `render_director` schema includes `evidence_classification`, `render_character` includes `<COGNITIVE_STATE>` block and goal arbitration FUTURE formatting.
3. **`dynamics.test.js`** (new if not exists) — `ATTACHMENT_PRESETS` lookup, `_get_baselines` resolves attachment style.
4. **`normalizer.test.js`** — Extend for: `attachment_style` field normalization, default inference.

---

## 📋 Execution Checklist

### Phase 1: Vector Schema Extension (`temporal.js` + `normalizer.js`)

**Goal**: Add `category`, `triggers`, and `attachment_style` fields to the data model.

- [x] **1.1** Extend `temporal.js:create()` to accept `category` (default `"event"`) and `triggers` (default `[]`) parameters. Add to the returned vector object.

  ```
  create(directive, type="future", weight=5, category="event", triggers=[])
  → { ..., category, triggers }
  ```

- [x] **1.2** Update `apply_state_mutations` in `temporal.js` to pass `category` and `triggers` through when creating new vectors from Director mutations. The Director JSON `new_vectors` schema gains optional `category` and `triggers` fields.
- [x] **1.3** Add `attachment_style` field to `normalizer.js:ENTITY_TEMPLATES.character` (default `""` — empty means "infer from dynamics"). Add to `normalize()` destructuring and output. Valid values: `"secure"`, `"anxious"`, `"avoidant"`, `"disorganized"`, `""`.
- [x] **1.4** Write tests for all three schema extensions.

### Phase 2: Attachment-Style Baseline Presets (`dynamics.js`)

**Goal**: Map attachment styles to psychologically meaningful `dynamics_baseline` values.

- [x] **2.1** Define `ATTACHMENT_PRESETS` lookup table in `dynamics.js`:

  ```js
  const ATTACHMENT_PRESETS = {
    secure: { chaos: 30, intensity: 40, openness: 70, affinity: 65 },
    anxious: { chaos: 55, intensity: 70, openness: 80, affinity: 75 },
    avoidant: { chaos: 35, intensity: 45, openness: 20, affinity: 25 },
    disorganized: { chaos: 75, intensity: 65, openness: 50, affinity: 40 },
  };
  ```

- [x] **2.2** Update `dynamics_engine._get_baselines(entity)` to check `entity.attachment_style` first. If set and valid, return `ATTACHMENT_PRESETS[style]`. Otherwise fall back to `entity.dynamics_baseline` (existing behavior). This means gravity settlement already pulls toward these values — no new logic needed, just meaningful baselines.
- [x] **2.3** In `normalizer.js:normalize()`, if `attachment_style` is empty/unset and `dynamics_baseline` is null, optionally infer attachment style from `dynamics` values (e.g., low openness + low affinity → avoidant). This is a heuristic, not a hard rule — it only runs at birth/import time when no baseline exists.
- [x] **2.4** Export `ATTACHMENT_PRESETS` from `dynamics.js` for use in tests.
- [x] **2.5** Write tests for preset lookup, baseline resolution, and inference heuristic.

### Phase 3: Evidence Classification + Trigger Amplification (`prompts.js` + `temporal.js` + `kernel.js`)

**Goal**: Director classifies social evidence each turn; matched triggers amplify mutations.

- [x] **3.1** Extend the Director JSON schema in `prompts.js:render_director` task block. Add `evidence_classification` to the expected JSON output:

  ```json
  {
    "_thought_process": "...",
    "evidence_classification": {
      "type": "reassurance | inconsistency | sudden_distance | deception_cue | shared_vulnerability | null",
      "confidence": 0.0-1.0,
      "note": "One sentence rationale"
    },
    "mutations": { ... }
  }
  ```

  Add instructions to the `<TASK>` block explaining the classification types (drawn from SPTE §3.1 trauma triggers: betrayal→inconsistency, abandonment→sudden_distance, neglect→dismissal, shame→judgment_cue).

- [x] **3.2** In `temporal.js:apply_state_mutations`, add trigger amplification logic. After applying `present_append_non_physical`, check if the entity has any past vectors with `triggers` matching the Director's `evidence_classification.type`. If matched:
  - Amplify the `present_append_non_physical` by prepending a brief leakage directive (e.g., `"The old wound stirs — beneath the surface, [trigger-specific somatic tell from SPTE §3.1]."`)
  - Amplify `dynamics_deltas` for `chaos` and `intensity` by ×1.5 (clamped to max +12).
  - This is pure JS — no LLM call. The amplified text is a template string built from the trigger catalog.
- [x] **3.3** In `kernel.js:execute_turn`, after parsing `directorData`, pass `directorData.evidence_classification` through to `apply_state_mutations` so it can perform the trigger check. Add a new parameter to `apply_state_mutations`.
- [x] **3.4** Define `TRIGGER_CATALOG` in `temporal.js` — a static map from evidence types to somatic tell phrases (drawn from SPTE §3.1):

  ```js
  const TRIGGER_CATALOG = {
    inconsistency: "throat constricted, hands cold",
    sudden_distance: "stomach hollow, chest tight",
    deception_cue: "jaw tensing, eyes narrowing",
    shared_vulnerability: "breath catching, shoulders softening",
    reassurance: "exhaling slowly, tension releasing",
  };
  ```

- [x] **3.5** Write tests: Director schema includes evidence_classification field, trigger amplification fires on matching past vectors, amplification is skipped when no triggers match, dynamics deltas are clamped.

### Phase 4: Cognitive State Signal (`prompts.js`)

**Goal**: Always-present `<COGNITIVE_STATE>` block in the character prompt, derived from existing dynamics. NOT a conditional protocol — it's a continuous signal, always emitted.

- [x] **4.1** Add a `build_cognitive_state(dynamics)` helper in `prompts.js`:

  ```js
  function build_cognitive_state(dynamics) {
    const chaos = dynamics?.chaos ?? 50;
    const intensity = dynamics?.intensity ?? 50;
    const openness = dynamics?.openness ?? 50;
    const affinity = dynamics?.affinity ?? 50;

    // Certainty: high openness + low chaos = grounded; low openness + high chaos = dysregulated
    const certainty = openness > 60 && chaos < 40 ? "grounded" : openness < 40 && chaos > 60 ? "fragile" : "moderate";

    // Regulation: high intensity + high chaos = strained; low intensity = stable
    const regulation = intensity > 70 && chaos > 60 ? "strained" : intensity > 70 && chaos < 40 ? "elevated" : intensity < 30 ? "depleted" : "stable";

    return ` certainty="${certainty}" regulation="${regulation}"`;
  }
  ```

- [x] **4.2** Inject `<COGNITIVE_STATE${build_cognitive_state(compressed_snapshot?.ai?.dynamics)} />` into `render_character`'s `<FRACTAL_FEED>` block, inside `<YOUR_IDENTITY>` — after `<PRESENT>` and before `<PAST>`. This positions it as part of the volatile scene state (prefix-cache-safe since it's in the dynamic suffix, not the static prefix).
- [x] **4.3** Add a brief instruction to the `<EPISTEMIC_PHYSICS>` block or a new `<COGNITIVE_GROUND>` note: "Your COGNITIVE_STATE reflects your current psychological bandwidth. Let it color your internal processing and somatic expression naturally — do not name it explicitly."
- [x] **4.4** Write tests: `build_cognitive_state` produces correct values across dynamics ranges, the signal appears in the rendered character prompt.

### Phase 5: Vector Categories + Goal Arbitration Tension (`prompts.js`)

**Goal**: Future vectors are categorized; goal-type vectors participate in active/suppressed tension; others are atmospheric context.

- [x] **5.1** In `render_character`, split the FUTURE block rendering into two sections:
  - `<ACTIVE_GOALS>` — only `category: "goal"` vectors, ranked by `emotional_weight × dynamics_alignment`. Top vector = active goal, second = suppressed goal. Inject both with a directive: "Your primary drive is [active]. A competing impulse [suppressed] presses beneath the surface — let it leak through somatic tells and micro-hesitations, never as direct acknowledgment."
  - `<FUTURE_ATMOSPHERE>` — all non-goal future vectors (threat, prophecy, event), rendered as atmospheric context with no tension directive.
- [x] **5.2** Add a `rank_goal_vectors(entity, dynamics)` helper in `prompts.js` that:
  - Filters `entity.future` for `category === "goal"` vectors.
  - Scores each by `emotional_weight × (1 + dynamics_alignment)` where `dynamics_alignment` = how well the goal aligns with current `affinity` and `openness` (high affinity → connection goals rank higher; low affinity → safety goals rank higher).
  - Returns `{ active: topVector, suppressed: secondVector }`.
- [x] **5.3** If fewer than 2 goal vectors exist, fall back gracefully: 1 goal = active only, 0 goals = skip the tension block entirely.
- [x] **5.4** For the Director prompt (`render_director`), keep the existing FUTURE block as-is — the Director needs to see all future vectors regardless of category.
- [x] **5.5** Write tests: goal vectors are split from atmospheric vectors, ranking respects dynamics alignment, fallback when insufficient goal vectors, non-goal categories don't get tension directives.

### Phase 6: Neuroplasticity (`temporal.js`)

**Goal**: After memory forge, positive memories decay high-weight trauma vectors; high-chaos turns can relapse them.

- [x] **6.1** In `temporal_engine.consolidate`, after `forge_memory()` returns successfully and memories are distributed to all entities, add a `apply_neuroplasticity(entities, memory, runtime)` pass:

  ```js
  function apply_neuroplasticity(entity_targets, memory, runtime) {
    const chaos = runtime.ai?.chaos ?? 50;
    const is_positive = (memory.emotional_weight ?? 5) <= 4 || memory.tags?.includes("reconciliation") || memory.tags?.includes("connection");

    for (const { entity } of entity_targets) {
      if (!Array.isArray(entity.past)) continue;
      for (const v of entity.past) {
        if (v.emotional_weight >= 8 && v.tags?.some((t) => t.includes("trauma") || t.includes("wound"))) {
          if (is_positive && chaos < 80) {
            v.emotional_weight = Math.max(1, v.emotional_weight - 1);
          } else if (chaos > 80) {
            v.emotional_weight = Math.min(10, v.emotional_weight + 1);
          }
        }
      }
    }
  }
  ```

- [x] **6.2** Call this function inside `consolidate`, after the memory is appended to all entities' `past` arrays and before the `eternal_mutations` block. Wrap in try/catch so a failure here doesn't block consolidation.
- [x] **6.3** Persist the decayed weights back to the entity via `runtime.update_entity` (same pattern as the present_summaries update).
- [x] **6.4** Write tests: positive memory decays trauma vectors by 1, high-chaos turn relapses them by 1, floor/ceiling clamping, non-trauma vectors are untouched, function is safe when past is empty.

### Phase 7: Integration & Final Verification

- [x] **7.1** Run full test suite: `npm test` — verify 310 existing tests still pass + all new tests green.
- [x] **7.2** Run lint: `npm run lint` — verify 0 warnings.
- [x] **7.3** Verify no new user-facing UI elements were added (grep for new settings, toggles, or config fields in UI components).
- [x] **7.4** Verify Director JSON schema change is backward-compatible: if the LLM doesn't return `evidence_classification`, the pipeline should gracefully skip trigger amplification (null check).
- [x] **7.5** Verify `render_character` prefix cache is preserved: the `<COGNITIVE_STATE>` and goal arbitration content must be in the `<FRACTAL_FEED>` (volatile suffix), not the `<SYSTEM>` (static prefix).
- [x] **7.6** Update `tasks/PRESENT.md` with track completion entry in the Pulse table.
- [x] **7.7** Archive blueprint to `C:\Users\johng\.gemini\antigravity-ide\archive\`.

---

## 🔗 Dependency Graph

```
Phase 1 (Schema) ──┬──> Phase 2 (Attachment Presets)
                   ├──> Phase 3 (Evidence + Triggers) ──> Phase 5 (Goal Arbitration)
                   └──> Phase 6 (Neuroplasticity)
Phase 4 (Cognitive State) — independent
Phase 7 (Integration) — depends on all above
```

Phases 1-4 can be implemented in parallel (different files mostly). Phase 5 depends on Phase 1 (category field) and Phase 3 (evidence classification). Phase 6 depends on Phase 1 (triggers field for identifying trauma vectors). Phase 4 is fully independent.

Recommended order: 1 → 2 → 4 → 3 → 5 → 6 → 7.
