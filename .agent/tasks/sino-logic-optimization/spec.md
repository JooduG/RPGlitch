# Spec: Sino-Logic Optimization

## 1. Objective

Implement the "Sino-Logic" cognitive protocol to optimize the token footprint of the simulation engine. This involves forcing internal reasoning (`<think>` blocks) into concise, technical Chinese (zh-CN) while maintaining a strict boundary with the target language narrative (English/Swedish).

## 2. Success Criteria (Acceptance)

- [ ] **Language Isolation**: The `<think>` block MUST be 100% zh-CN.
- [ ] **Narrative Integrity**: The final output MUST match the user's active language (English/Swedish).
- [ ] **Semantic Density**: Reasoning in zh-CN must use technical/concise terminology (e.g., "Analysis: High Risk" -> "分析: 危殆").
- [ ] **Metadata Transparency**: The `intelligence_broker` correctly identifies and passes the target language metadata.
- [ ] **Zero Regressions**: Existing `EPISTEMIC_WALL` and `COGNITION` protocols must remain functional.

## 3. Constraints

- **Format**: Svelte 5 context only.
- **Location**: `src/core/intelligence/prompt_builder.js` and `src/core/intelligence/intelligence_broker.js`.
- **Standards**: Must use `snake_case` for all internal data keys.
- **Aesthetic**: All narrative output must follow the "Chalk Regime" / RPGlitch sensory standards.

## 4. References

- `.agent/archive/ANEX/ANEX.json` (Line 28-29)
- `src/core/intelligence/prompt_builder.js` (`PROTOCOL_LIBRARY`)
