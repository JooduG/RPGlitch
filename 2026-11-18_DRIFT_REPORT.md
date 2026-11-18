# Drift Detection Report: post-execution.md vs. Codebase Reality

**Date**: 2026-11-18  
**Specification Document**: [post-execution.md](file:///c:/Users/johng/source/repos/RPGlitch/post-execution.md)  
**Status**: Divergences Detected

---

## post-execution.md

The following divergences, missing symbols, and architectural discrepancies were identified when comparing [post-execution.md](file:///c:/Users/johng/source/repos/RPGlitch/post-execution.md) against the actual implementation:

### 1. Inexistent Module: `src/media/policy.js`

- **Doc Specification (§3, Rank 2)**: Lists `src/media/policy.js` as an active module exporting `IMAGE_TIERS`, `TIER_RESOLUTIONS`, `normalize_image_tier`, `get_resolution`, `get_resolution_string`, `get_tier_guidance_scale`, `evaluate_image_trigger`, and `resolve_image_trigger`.
- **Codebase Reality**: `src/media/policy.js` does not exist.
  - Image tiers, resolutions, and guidance scale utilities (`IMAGE_TIERS`, `TIER_RESOLUTIONS`, `normalize_image_tier`, `get_resolution`, `get_resolution_string`, `get_tier_guidance_scale`) are implemented in [src/media/image-generation.js](file:///c:/Users/johng/source/repos/RPGlitch/src/media/image-generation.js) and re-exported from [src/simulation/prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/simulation/prompts.js).
  - `evaluate_image_trigger` is located in [src/simulation/dynamics.js](file:///c:/Users/johng/source/repos/RPGlitch/src/simulation/dynamics.js).
  - `resolve_image_trigger` is located in [src/simulation/prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/simulation/prompts.js).

### 2. Displaced / Missing Module Exports

- **`src/utils/text.js`**:
  - Spec lists `first_sentence` under `src/utils/text.js`.
  - In code, `first_sentence` is defined and exported in [src/simulation/llm-output.js](file:///c:/Users/johng/source/repos/RPGlitch/src/simulation/llm-output.js).
- **`src/simulation/llm-output.js`**:
  - Spec lists `resolve_style` under `src/simulation/llm-output.js`.
  - In code, `resolve_style` is defined in [src/utils/style-resolve.js](file:///c:/Users/johng/source/repos/RPGlitch/src/utils/style-resolve.js) and used by `@definitions` and `@simulation/prompts`. It is not exported from `llm-output.js`.
- **`src/simulation/history.js`**:
  - Spec lists `TELEMETRY_MESSAGE_TYPES` as an export of `src/simulation/history.js`.
  - In code, `TELEMETRY_MESSAGE_TYPES` is an internal private `Set` in [src/simulation/history.js#L411](file:///c:/Users/johng/source/repos/RPGlitch/src/simulation/history.js#L411) and is not exported.
- **`src/simulation/retrieval.js`**:
  - Spec lists `ORIGIN_SCORE_MULTIPLIER` as an export of `src/simulation/retrieval.js`.
  - In code, `ORIGIN_SCORE_MULTIPLIER` is an internal private constant in [src/simulation/retrieval.js#L29](file:///c:/Users/johng/source/repos/RPGlitch/src/simulation/retrieval.js#L29) (`const ORIGIN_SCORE_MULTIPLIER = 1.5;`) and is not exported.
- **`src/simulation/prompts.js`**:
  - Spec lists `PROMPT_ROLES` and `render_task_envelope` as narrative XML exports of `src/simulation/prompts.js`.
  - In code, prompts are governed by `PURPOSE_CORES` and `compile_prompt`; `PROMPT_ROLES` and `render_task_envelope` do not exist.
- **`src/media/image-generation.js`**:
  - Spec lists `ImageService` as an exported class.
  - In code, the class is named `VisualEngine` (instantiated and exported as `visual_engine`). `ImageService` does not exist.

### 3. Extinction Ledger Inconsistencies & Lingering References

- **Spec (§2)** requires zero remaining files or symbol references across the codebase for retired artifacts:
  - Spec marks `set_visualizer_envision_impl` as eradicated. However, a mock reference persists in [src/state/status.test.js#L19](file:///c:/Users/johng/source/repos/RPGlitch/src/state/status.test.js#L19).
  - Spec marks `is_loading` on the visual engine as pruned. However, `visual_engine.is_loading` is still checked in [src/ui/Storymode.svelte#L383-L386](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/Storymode.svelte#L383-L386) to conditionally disable photo menu items, while `VisualEngine` in `src/media/image-generation.js` no longer declares `is_loading`.
