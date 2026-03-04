# Naivety Index — Implementation Plan

## Phase 1: Engine Logic

1. **Modify `DynamicsEngine.js`**:
    - Add `NAIVETY_TRIGGERS` regex constant (persuasive language patterns).
    - Create `static _resolve_naivety(input, openness)`:
        - Maps `openness` (0–100) to a prior float (0.0–1.0).
        - Returns `null` on no trigger match (zero-overhead no-op).
        - Executes conditional probability formula using `NAIVETY_*` config constants.
        - Returns posterior suspicion score.
    - Call `_resolve_naivety` inside `resolve_dynamics()` after signals are mapped.
    - Append `[NAIVETY]` string to `state.behaviors` on threshold breach.

2. **Modify `config.js`**:
    - Add `NAIVETY_THRESHOLD`, `NAIVETY_P_E_GIVEN_TRUST`, `NAIVETY_P_E_GIVEN_DISTRUST`
      to `CONFIG.DYNAMICS`.

## Phase 2: Protocol Integration

1. **Modify `PromptBuilder.js`**:
    - Add `NAIVETY_COGNITION` entry to `PROTOCOL_LIBRARY`.
    - The existing `behaviors` array and `<NARRATIVE_STYLE>` template inject it automatically.

## Phase 3: QA & Verification

1. **Modify `DynamicsEngine.test.js`**:
    - Add 4 unit tests under `"Naivety Index: _resolve_naivety"`:
        - No trigger → `null`.
        - Low openness + trigger → high suspicion (> 0.6).
        - High openness + trigger → low suspicion (< 0.6).
        - Integration: `state.behaviors` contains `"[NAIVETY]"`.
2. **Manual Smoke Test**: Load character with `openness` ≤ 30, type persuasive phrase,
   confirm `behaviors` output in debug panel.
