# RPGlitch - Roadmap (Future Delta)

> **Temporal Mirror Rule**: This document tracks **only unbuilt work** (the delta between [README.md](./README.md) and the target product). Completed work moves to [CHANGELOG.md](./CHANGELOG.md).

---

## Next Up

- **Phase 2 UI Monolith Decomposition** (`src/ui/organisms/ChatBubble.svelte`, `src/ui/Storyboard.svelte`, `src/ui/Profile.svelte`, `src/ui/Console.svelte`, `src/ui/Storymode.svelte`): Extract focused flat organisms from the five remaining large UI views/organisms cleanly on top of the 4-tier Atomic Design architecture.

---

## Parking Lot

- **Primary Cast Compression & POV Isolation** (`src/engine/prompts.js`): Compress inactive/secondary cast blocks dynamically when approaching `LENGTH_THRESHOLDS.PROMPT_MAX` (`src/config.js`), and enforce strict POV isolation in compiled prompts.
- **User-Sovereignty Output Boundary** (`src/engine/prompts.js`): Reinforce the hard constraint against speaking, acting, or thinking on behalf of the user persona.
- **Caretaker Active-Cast Scope Lockdown** (`src/engine/runs.js`): Restrict background Caretaker consolidation (`dispatch_caretaker_consolidation`) strictly to entities present in the active story cast.
- **Single-Word Slug Enforcement** (`src/data/entities.js`): Enforce strict single-word slug regex validation for entity IDs at creation/normalization.
- **Settled-Fact Hallucination Guard** (`src/engine/prompts.js`): When high Chaos/Entropy (`>= 75`) triggers `■■■` block glyphs, instruct the model to acknowledge uncertainty rather than invent verbatim dialogue.
- **Prompt Atom Compaction** (`src/engine/prompts.js`): Trim repetitive scene directives and `<THINK>` boilerplate to reclaim ~100 tokens/shot.
- **Slash-Command Directing Bar** (`src/ui/Console.svelte`): Add `/ooc`, `/time`, and `/mood` quick directives to the message composer.
- **Persistent Story Image Archive** (`src/ui/Storymode.svelte`, `src/media/optics.js`): Add a story-scoped gallery modal for browsing generated beats beyond `render_optics_fallback`.
- **Inline Console Undo** (`src/ui/Console.svelte`): Fold `UndoToast` deletion countdowns into `Console.svelte`.
- **Feed DOM Virtualization** (`src/ui/Storymode.svelte`): Window `visible_feed` for 100+ turn sessions.
- **Live Perchance A/B Harness**: Interactive prompt benchmarking against live Perchance endpoints.
- **Physics Protocols Injection** (`src/definitions/dynamics-registry.js`, `src/simulation/prompts.js`): Wire somatic archetypes and dynamics trigger directives into compiled turn prompts.
- **Narrative Slop & Macro-Shape Post-Processing** (`src/simulation/llm-output.js`): Wire prose slop linting, somatic-marker capping, and macro-shape auditing into the turn output pipeline / DevWing QA.
