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
- **`src/media/optics.js`** — Image prompt synthesis pipeline:
  - `PromptTemplates.BUILDER`: System prompt builder for the Optics Scribe LLM.
  - `AestheticResolver`: Token mapping and dimension flattening for Stable Diffusion / Perchance Text-to-Image API.
- **`src/platform/transport.js`** — LLM service wrappers (`generate()`, `enhance()`).
- **`src/ui/organisms/`** — `Profile.svelte` (entity profile editor), `ProfileArray.svelte`, `Storymode.svelte`, `Storyboard.svelte`.
- **`src/ui/molecules/`** — `EntityCard.svelte`, `VisualWing.svelte`, `DevWing.svelte`, `AudioWing.svelte`, `DynamicsMeter.svelte`.
- **`src/ui/atoms/`** — `TextField.svelte`, `Button.svelte`, `Slider.svelte`, `Dropdown.svelte`.
- **`src/data/`** — `narrative-styles.js` (author styles with XML engines), `normalizer.js` (entity schema sanitization), `lists.js` (dimension arrays for image tokens), `premades.js`.
- **`src/state/`** — `app.svelte.js` (global app state & settings), `runtime.svelte.js` (active entities & chronology), `status.svelte.js` (phase state).

---

## 📋 Data Model Essentials

1. **Eternal & Present Fields**: Single-value state properties (`state.eternal`, `state.present`).
   - `physical` fields store pseudo-JSON key-value pairs (parsed via `safeParsePseudoJson`).
   - `non_physical` fields store plain prose paragraphs. Director state mutations are merged via `merge_prose_into_field` (capped at 2000 chars).
2. **Past & Future Fields**: Arrays of vector objects (`{id, timestamp, directive, type, base_weight, tags, meta}`).
   - Scored via RAG, resolved from Future → Past by Director, managed by `temporal_engine`.

---

## 🎯 Current Implementation Tasks

---

### Task 1: Visual Style System (Aesthetic Engine)

**Objective**: Implement a **Visual Style System** for image generation that mirrors the existing **Narrative Style System** for prose. Users can select visual aesthetics (e.g. Photorealism, Anime, Surrealism, Cyberpunk, Dark Fantasy, Watercolor) whose `<VISUAL_ENGINE>` XML blocks get injected into diffusion prompts.

#### Default Style

- The global default visual style is **`"photorealism"`**.

#### Resolution & Entity Fallback Architecture

The system supports two distinct image generation contexts: **Entity Portrait Generation** (Visual Wing) and **Story Scene Generation** (Storymode).

1. **Entity Schema (`src/data/normalizer.js`)**: Add `visual_style` (string, default `"photorealism"`) to **BOTH** Character and Fractal entity models.
2. **Portrait Generation Resolution (`resolve_portrait_visual_style_key(entity)`)**:
   - Used when generating/rerolling profile pictures in `VisualWing.svelte`.
   - Checks `entity.visual_style` first. If `"default"`, `""`, or missing, falls back to global user setting `app.settings.visual_style` (defaults to `"photorealism"`).
   - **Entity-Centric Rule**: Profile picture generation always respects that specific entity's chosen style (or global default), regardless of active story context.
3. **Story Scene Generation Resolution (`resolve_story_visual_style_key()`)**:
   - Used for all in-story scene image generations (prologue, action turns, epilogue).
   - Checks `runtime.active_fractal?.visual_style` first. If `"default"`, `""`, or missing, falls back to global user setting `app.settings.visual_style` (`"photorealism"`).
   - **Exclusive World Style Rule**: The active Fractal's Visual Style is the **EXCLUSIVE** visual style for the story, overriding individual character styles to keep all scene generations aesthetically cohesive.

#### Step-by-Step Implementation Guide

1. **Data Dictionary (`src/data/visual-styles.js`)**:
   - Create and export `VISUAL_STYLES` dictionary structured like `NARRATIVE_STYLES`.
   - Each entry: `id`, `name`, `portrait` (URL), `description`, `tags[]`, and `visual_engine` (XML string).
   - Include presets: `photorealism` (DEFAULT), `anime`, `surrealism`, `watercolor`, `oil_painting`, `comic_book`, `cyberpunk`, `dark_fantasy`, `pixel_art`, `film_noir`, `studio_ghibli`, `retro_synthwave`.
   - XML structure example:

     ```xml
     <VISUAL_ENGINE>
       <medium>RAW photograph, photorealistic 8k rendering</medium>
       <palette>kodak vision3 color profile, natural lighting, fine film grain</palette>
       <camera>85mm prime f/1.2 lens, shallow depth of field</camera>
       <texture>crisp asset definition, micro-detailed surface textures</texture>
       <negative_prompt>anime, illustration, 3d render, cartoon, drawing, painting</negative_prompt>
     </VISUAL_ENGINE>
     ```

2. **Export (`src/data/index.js`)**: Re-export `VISUAL_STYLES`.
3. **Normalizer (`src/data/normalizer.js`)**: Add `visual_style` (default `"photorealism"`) to `normalize()` output schema for all entities.
4. **State Defaults (`src/state/app.svelte.js` & `src/state/status.svelte.js`)**: Set `visual_style` setting default to `"photorealism"` in `AppSettings`.
5. **Optics Integration (`src/media/optics.js`)**:
   - Implement `resolve_portrait_visual_style_key(entity)` and `resolve_story_visual_style_key()`.
   - Update `PromptTemplates.BUILDER` and `AestheticResolver.build_aesthetic_map()` to parse the active `<VISUAL_ENGINE>` XML block and bias diffusion tokens (medium, palette, optics, texture) as well as inject style-specific negative prompts into `NEGATIVE_PROMPT`.
6. **UI Controls (`src/ui/molecules/VisualWing.svelte`, `src/ui/organisms/Profile.svelte`, & `src/ui/molecules/EntityCard.svelte`)**:
   - **Visual Wing (`VisualWing.svelte`)**: Add a Visual Style `Dropdown` component bound to `profileState.char.visual_style`. This makes the Visual Style selector available in the Visual Wing for **ALL** entities (Characters & Fractals) when generating or editing profile pictures.
   - **Fractal Profile Editor (`Profile.svelte`)**: Display a dedicated Visual Style selector for Fractal entities that clearly indicates it sets the exclusive visual style for stories set within this Fractal.
   - **Entity Card (`EntityCard.svelte`)**: Render a Visual Style badge/indicator on entity panel cards.

---

### Task 2: POV (Point of View) Refactor & Legacy Cleanup

**Objective**: Refactor how Narrative Point of View (POV) is controlled, establish clean defaults, and **PURGE** all legacy implicit/hardcoded POV instructions across the codebase.

#### Rules & Perspective Hierarchy

- **Character Entities**: Default to **`"1st_person"`** (First-Person perspective: "I", "my", "me"). Users can optionally change to `"3rd_person"`.
- **Fractal Entities**: Forced **`"3rd_person"`** (Third-Person perspective: "he/she/they", entity name). World narration and Narrator turns must always remain an objective observer.

#### Comprehensive Legacy POV Purge Mandate

1. **Purge `extract_pov_directive()` in `src/intelligence/prompts.js`**: Remove or refactor the legacy regex parsing of `<pov_style>` tags from author narrative styles. Author styles in `narrative-styles.js` must NO LONGER dictate POV; POV is strictly owned by the active entity's `pov` setting.
2. **Purge Hardcoded/Implicit POV Prompts**: Search `src/intelligence/prompts.js` and `src/data/` for any legacy hardcoded references to perspective (e.g. "write in third-person", implicit narrator POV constraints) and replace them with the central `POV_DIRECTIVE` generator.

#### Step-by-Step Implementation Guide

1. **Entity Schema (`src/data/normalizer.js`)**:
   - Add `pov` field (`"1st_person"`, `"3rd_person"`) to the normalized entity model.
   - Default for Characters: **`"1st_person"`**.
   - Default / Forced for Fractals: **`"3rd_person"`**.
2. **Prompt Assembly (`src/intelligence/prompts.js`)**:
   - Refactor `extract_pov_directive()` to build instructions strictly from `entity.pov`.
   - For **Narrator / Prologue / Epilogue** passes: Inject a strict 3rd-person objective mandate regardless of character settings.
   - For **Character** passes:
     - If `character.pov === "1st_person"` (DEFAULT): Inject `<POV_DIRECTIVE>CRITICAL MANDATE: Write strictly in first-person POV ('I', 'me', 'my') through your character's eyes.</POV_DIRECTIVE>`.
     - If `character.pov === "3rd_person"`: Inject `<POV_DIRECTIVE>CRITICAL MANDATE: Write strictly in third-person limited POV ('he', 'she', 'they', entity name).</POV_DIRECTIVE>`.
3. **UI Selector (`src/ui/organisms/Profile.svelte`)**:
   - Add a POV `Dropdown` selector (Options: `1st Person ("I/Me") [Default]`, `3rd Person ("He/She/They")`) on Character profile cards. Set to read-only 3rd Person on Fractal cards.

---

## 🛠️ Verification & Quality Gate

- Run `npm run verify` locally to validate linting and TypeScript compilation.
- Run `npm run sync` if CSS tokens in `DESIGN.md` are modified.
- Test that single-file bundling succeeds with `npm run build`.
- When finished, run `attach_file` on each updated file so changes can be downloaded.
