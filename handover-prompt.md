# RPGlitch — Session Setup & Handover Prompt

You are working on **RPGlitch**, an AI roleplay engine built with **Svelte 5 + Vite 8**, deployed as a single-file bundle to Perchance (perchance.org). The source repository lives on GitHub at **`JooduG/RPGlitch`**.

---

## ⚡ Initial Setup (Execute First)

1. **Fetch Latest Repository State**:
   - Download the latest main branch ZIP: `https://github.com/JooduG/RPGlitch/archive/refs/heads/main.zip` to `scratch/repo.zip`.
   - Unzip it into `scratch/src/`.
2. **Review Project Standards**:
   - Inspect `README.md` and `AGENTS.md` (if present in `scratch/src/`) for project conventions.
   - **Crucial**: Re-read `index.html` in the workspace root before editing — manual edits occur between sessions and hold the latest shell state. Preserve all existing custom markup/scripts.
3. **Framework Rules**:
   - **Svelte 5 Sovereignty**: Use Runes ONLY (`$state`, `$derived`, `$effect`, `{@render}`). Legacy Svelte 4 patterns (`export let`, `$:`, `writable()`, `readable()`, `<slot />`) are strictly forbidden.

---

## 🏗️ Architecture Overview

- **`src/intelligence/`** — Prompt assembly & turn pipeline:
  - `fragments.js`: Entity taxonomy & field directives.
  - `prompts.js`: XML prompt assembly for Character, Director, Narrator, & Enhancement passes.
  - `kernel.js`: Turn execution pipeline (Round/Turn mechanics).
  - `context.svelte.js`: Context broker, hydration, & lexical filter.
  - `temporal.js`: Past/Future vector arrays, RAG scoring, consolidation, & memory forging.
  - `parser.js`: Pseudo-JSON parsing, `<think>` block stripping, & prose merging.
  - `dynamics.js`: Dynamics slider metadata & gravity settlement calculations.
- **`src/media/optics.js`** — Image prompt synthesis pipeline:
  - `PromptTemplates.BUILDER`: System prompt builder for the Optics Scribe LLM.
  - `AestheticResolver`: Token mapping and dimension flattening for Stable Diffusion / Perchance Text-to-Image API.
- **`src/platform/transport.js`** — LLM service wrappers (`generate()`, `enhance()`).
- **`src/ui/organisms/`** — `Profile.svelte` (entity profile editor), `ProfileArray.svelte`, `Storymode.svelte`, `Storyboard.svelte`.
- **`src/ui/molecules/`** — `EntityCard.svelte`, `VisualWing.svelte`, `DevWing.svelte`, `AudioWing.svelte`, `DynamicsMeter.svelte`.
- **`src/ui/atoms/`** — `TextField.svelte`, `Button.svelte`, `Slider.svelte`, `Dropdown.svelte`.
- **`src/data/`** — `narrative-styles.js` (author styles with XML engines), `visual-styles.js` (aesthetic styles with XML visual engines), `normalizer.js` (entity schema sanitization), `lists.js` (dimension arrays for image tokens), `premades.js`.
- **`src/state/`** — `app.svelte.js` (global app state & settings), `runtime.svelte.js` (active entities & chronology), `status.svelte.js` (phase state).

---

## 📋 Data Model Essentials

1. **Eternal & Present Fields**: Single-value state properties (`state.eternal`, `state.present`).
   - `physical` fields store pseudo-JSON key-value pairs (parsed via `safeParsePseudoJson`).
   - `non_physical` fields store plain prose paragraphs. Director state mutations are merged via `merge_prose_into_field` (capped at 2000 chars).
2. **Past & Future Fields**: Arrays of vector objects (`{id, timestamp, directive, type, base_weight, tags, meta}`).
   - Scored via RAG, resolved from Future → Past by Director, managed by `temporal_engine`.
3. **Entity Aesthetics & Perspective**:
   - `visual_style`: Dictates diffusion prompt styling for profile pictures and story scenes.
   - `pov`: Dictates perspective (`"1st_person"` or `"3rd_person"` for characters; forced `"3rd_person"` for fractals).

---

## 🎯 Current Implementation Task

<!-- Insert specific task objectives, acceptance criteria, and step-by-step guidelines below -->

**Objective**: `[Describe the high-level objective for this turn or feature]`

### Requirements & Guidelines

- `[Detail requirement 1]`
- `[Detail requirement 2]`
- `[Detail requirement 3]`

---

## 🛠️ Verification & Quality Gate

- Run `npm run verify` locally to validate linting and TypeScript compilation.
- Run `npm run sync` if CSS tokens in `DESIGN.md` are modified.
- Test that single-file bundling succeeds with `npm run build`.
