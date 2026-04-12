# MISSION PLAN: [037] State Atomicity & Token Asphyxiation Patch

**Goal**: Eliminate the round-skipping race condition and prevent Context Window collapse caused by storing `<think>` blocks in the permanent log.

## User Review Required

> [!IMPORTANT]
> **Round Increment Centralization**: I will be removing `runtime.round++` from `session-driver.js` and `intelligence-kernel.js`. The single source of truth for round advancement will now be the `incrementRound()` lock in `ReactiveSession`.
> [!WARNING]
> **Regex Specificity**: We are using `/<think>[\s\S]*?<\/think>\n?/g` to ensure no trailing newlines remain in the log, which prevents "orphaned" empty lines in the UI and database.

## Proposed Changes

### 🧠 [SECTION: INTELLIGENCE ENGINE]

#### [MODIFY] [text-parser.js](file:///c:/Users/johng/source/repos/RPGlitch/src/core/engine/text-parser.js)
- Implement `strip_cognition_blocks(text)`.
- Use the requested multiline-safe regex.

#### [MODIFY] [llm-service.js](file:///c:/Users/johng/source/repos/RPGlitch/src/core/intelligence/llm-service.js)
- Integrate `strip_cognition_blocks` into the `sanitize()` pipeline.

### 🕹️ [SECTION: CORE ORCHESTRATION]

#### [MODIFY] [session-driver.js](file:///c:/Users/johng/source/repos/RPGlitch/src/core/engine/session-driver.svelte.js)
- Remove manual `runtime.round++` on line 90.

#### [MODIFY] [intelligence-kernel.js](file:///c:/Users/johng/source/repos/RPGlitch/src/core/intelligence/intelligence-kernel.js)
- Remove manual `runtime.round++` on line 136.

### 🌊 [SECTION: STATE & LOCKING]

#### [MODIFY] [session.svelte.js](file:///c:/Users/johng/source/repos/RPGlitch/src/state/session.svelte.js)
- Implement `isProcessing` lock.
- Implement `incrementRound()` and `releaseLock()`.
- Wrap `advance_turn()` in the locking life-cycle.

---

## Verification Plan

### Automated Tests
- `npm test`: Run existing engine logic tests.
- Add test cases to `text-parser.test.js` for multiline `<think>` stripping.

### Manual Verification
- **Round Stability Check**: Open DevMode, send multiple messages, and verify `app.round` increments by precisely 1.
- **Log Hygiene Audit**: Send a message that triggers a `<think>` block, verify the UI shows it, then check the database log (via console) to ensure it's stripped.
