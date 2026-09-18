---
name: track-prompt-switchboard-and-builder-streamlining
description: Promote `src/intelligence/prompts.js` to sovereign central prompt switchboard and streamline `builder.js`
status: completed
last_synchronized: 2026-09-18
references: scrobbles.md
---

# 🎯 Track: Promote `prompts.js` to Sovereign Prompt Switchboard & Streamline `builder.js`

## 1.0 Vision & High-Level Architecture

Establish [src/intelligence/prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts.js) as the master prompt switchboard and primary entry point for prompt compilation in RPGlitch.

```text
[ Domain Callers: story.js / director.js / Profile.svelte.js / visual.svelte.js ]
                               │
                               ▼
              ┌─────────────────────────────────┐
              │  src/intelligence/prompts.js    │ ◄── Master Switchboard & Entrypoint
              │  • Catalog (PROMPTS manifest)   │
              │  • compile_prompt(mode, ctx)    │
              └────────────────┬────────────────┘
                               │
                               ▼
              ┌─────────────────────────────────┐
              │  src/intelligence/builder.js    │ ◄── Pure 7-Layer Assembly Engine
              │  (System ➔ Constitution ➔     │
              │   Protocols ➔ Entities ➔      │
              │   History ➔ Task ➔ Format)    │
              └────────────────┬────────────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┐
        ▼          ▼           ▼           ▼          ▼
    [system] [constitution] [protocols] [entities] [history] [task] [format]
```

## 2.0 Playbook & TDD Execution Steps

- [x] ef669c9 `1. RED`: Extend tests in `src/intelligence/prompts.test.js` to verify `compile_prompt` as sovereign switchboard compiler for all 10 prompt modes.
- [x] ef669c9 `2. GREEN (Switchboard)`: Implement `compile_prompt(mode_key, context)` in `src/intelligence/prompts.js`, dispatching cleanly to `compile_pipeline_prompt`.
- [x] ef669c9 `3. REFACTOR (Builder Streamlining)`: Streamline `src/intelligence/builder.js`, collapsing repetitive bespoke functions into the 7-layer pipeline runner, pruning obsolete legacy facades (`build_character`, `build_prologue`, `build_epilogue`, `build_npc`).
- [x] ef669c9 `4. HARMONIZE (Consumers & Barrel Exports)`: Update `src/intelligence/index.js`, `src/intelligence/story.js`, `src/intelligence/director.js`, and test mocks to route prompt generation through the switchboard.
- [x] ef669c9 `5. AUDIT & GATE`: Verify all 71 unit test suites, design tests, and 13 hook contracts pass 100%.

## 3.0 Changelog

- 2026-09-18: Promoted `src/intelligence/prompts.js` to sovereign central prompt switchboard with `compile_prompt(mode, context)`.
- 2026-09-18: Streamlined `src/intelligence/builder.js` facade and routed `temporal.js`, `director.js`, and `index.js` through switchboard. Verified 100% test pass via `npm run deploy:prepare`.
- 2026-09-18: Initialized track blueprint for prompt switchboard consolidation and builder streamlining.
