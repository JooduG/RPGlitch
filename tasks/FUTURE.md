# 🔧 TRACK: prompt-pipeline-rebuild-2026-06-30

## Goal

Rebuild all AI-facing natural language in the prompt pipeline for maximum immersion, clarity, and token efficiency. Zero changes to mechanical scaffolding.

## Steps

### Phase 1 — `src/intelligence/prompts.js`
- [x] Restore `PERCHANCE_SYNTAX` to `PROTOCOL_LIBRARY` (remove inline from `render_enhancement`, add as library key)
- [x] Rewrite `USER_AGENCY` protocol
- [x] Rewrite `COGNITION` protocol (rename phases to simulation-native language)
- [x] Rewrite `HYGIENE` protocol (restructure: ban first, brevity second)
- [x] Rewrite `AFFIRMATIVE` protocol (clarify: affirmative construction, not sentiment)
- [x] Rewrite `MOMENTUM` protocol (single cinematographic principle)
- [x] Rewrite `FIRST_CONTACT` protocol (halve current length)
- [x] Clean `MACRO_CHARACTER` / `MACRO_FRACTAL` (remove legacy macro mention)
- [x] Rewrite `render_director()` TASK block
- [x] Rewrite `render_character()` EPISTEMIC_PHYSICS as 3 numbered laws + sharpen stability locks
- [x] Rewrite `render_narrator()` prologueText and epilogueText
- [x] Rewrite `render_memory()` TASK block
- [x] Sharpen `render_enhancement()` cognitionInstruction (both modes) and formatInstruction; remove legacy macro mention
- [x] Update `prompts.test.js` MOMENTUM + HYGIENE exact-text assertions

### Phase 2 — `src/data/author-styles.js`
- [x] Strip `<SUMMARY_AND_THEMES>`, `<description>`, `<core_themes>` XML from all 17 style `prompt` strings (preserve JS fields)
- [x] Add `<voice>` one-liner to each style `prompt` string
- [x] Rewrite 6 broken mod triggers to `dynamics.*` equivalents
- [x] Queer/inclusive motif audit

### Phase 3 — `src/intelligence/fragments.js`
- [x] Append tense reminder to `past` vector directive
- [x] Append tense reminder to `future` vector directive
- [x] Minor trim to `eternal.non_physical` character directive

### Phase 4 — `src/media/optics.js`
- [x] Add missing keys to `labelMap` in `buildDimensionsContext()` (quality, styles, tech, artifacts, glitches)
- [x] Replace `"8k resolution"` in BUILDER scene mode

### Phase 5 — `src/data/lists.js`
- [x] Add JSDoc comments marking dimension keys vs. excluded keys

### Phase 6 — Verification
- [x] Run `npm run verify` — all tests green
- [x] Checkpoint commit
