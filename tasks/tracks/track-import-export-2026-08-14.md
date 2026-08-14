# 🚀 Implementation Blueprint — `track-import-export-2026-08-14`

> **Track Goal**: Implement comprehensive ingestion and export capabilities for RPGlitch:
>
> 1. **Wiki/Fandom Ingestion**: One-click URL import for characters and fractals/worlds via `superFetch`, plain-text extraction, and LLM-driven schema mapping.
> 2. **Entity JSON Export & Import**: Clean single-entity JSON export and import for seamless sharing and backup.
> 3. **Story Markdown Export**: Export complete story transcripts (dialogue, narration, telemetry, timestamps) to cleanly formatted Markdown.
> 4. **Epilogue / End-of-Story Action**: Integrate "Export Story (Markdown)" and "Export Entities (JSON)" directly into the Epilogue/End-of-Story flow.

---

## 🧩 Track Overview

| Feature                         | Surface / Layer                                                                    | Primary Objective                                                                                   |
| :------------------------------ | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Wiki/Fandom URL Import**      | `platform/transport.js`, `intelligence/prompts.js`, `ui/entity/ImportModal.svelte` | Paste URL → Fetch HTML via `superFetch` → Strip & Truncate → Extract Entity JSON → Normalize.       |
| **Entity JSON Export / Import** | `utils/ui-helpers.js`, `data/normalizer.js`, `ui/profile/Profile.svelte`           | Download active/saved character or fractal as standalone JSON file; import with schema validation.  |
| **Story Markdown Export**       | `utils/story-export.js`, `ui/Storyboard.svelte`, `ui/Storymode.svelte`             | Compile session history to Markdown with title, summary, character metadata, and timestamped beats. |
| **End of Story Integration**    | `ui/organisms/Storymode.svelte`, `ui/molecules/EpilogueCard.svelte`                | Surface story export & entity saving upon reaching narrative resolution/epilogue.                   |

---

## 1. Wiki/Fandom Ingestion

### 🎯 Goal & Specifications

In the Import modal, paste a URL to a wiki/fandom page for a **character** or a **world/setting**. One click produces a fully-formed profile (`character` or `fractal` entity).

**The Ingestion Fill Rules**:

- Wiki-stated details are **source of truth** — use them verbatim.
- Anything NOT stated (eye color, outfit, height, unspoken traits) → invent a fitting, vivid default consistent with the setting. **Never leave a field null or blank.**
- Output is a single JSON object matching our existing entity schema fields.

### 🏗️ Technical Design

1. **Plugin import (`main.pjs`)**:
   - `superFetch = {import:super-fetch-plugin}` (top-level assignment only; accessed via `root.superFetch`).
   - Wrap in `platform/transport.js` as `fetch_wiki_text(url)` so the rest of the application never touches `root.superFetch` directly.

2. **Fetch + content extraction (`utils/text.js`)**:
   - `fetch_wiki_text(url)` → HTML via `root.superFetch` → strip scripts, navigation, headers, footers, tags → clean plain text.
   - Truncate to readable token budget (~8k chars for characters, ~10k chars for worlds).
   - Validate scheme (`https:`) + security boundary sanitization in `platform/security.js`.

3. **Prompt builders (`intelligence/prompts.js`)**:
   - `render_wiki_character_form(truncated_text, scenario_context)` → JSON schema of character fields (name, appearance, personality, backstory, fears, values, dynamics) mapped to our `eternal` and `present` schemas.
   - `render_wiki_scenario_form(truncated_text)` → JSON schema of world fields (name, description, setting, fashion, races, tone, story rules) mapped to our `fractal` entity schema.
   - Strict system directive: "Source of truth for stated details; invent vivid defaults for missing fields; never emit blanks/nulls."

4. **Parse + map (`intelligence/parser.js` & `data/normalizer.js`)**:
   - Parse pseudo-JSON / JSON output.
   - Map into normalized entity shape via `normalize_entity` with schema-safe fallbacks.

5. **UI Wiring (`ui/entity/ImportModal.svelte`)**:
   - "Import from Wiki / Fandom URL" tab/section: URL input + Character/World toggle + "Import" button.
   - Busy spinner during fetch/generation, clean error notifications, preview step before committing to database.

---

## 2. Entity JSON Export & Import

### 🎯 Goal & Specifications

Allow users to export any Character or Fractal entity as a standalone `.json` file from the Profile or EntityCard, and drag-and-drop or select a `.json` file to import it.

### 🏗️ Technical Design

1. **Serialization (`data/normalizer.js` & `utils/ui-helpers.js`)**:
   - `export_entity_to_json(entity)`: Sanitizes internal IDs, formats JSON with 2-space indentation, triggers browser download via `download_blob(filename, content, "application/json")`.
2. **Deserialization & Validation**:
   - `import_entity_from_json(json_string)`: Validates schema, runs `normalize_entity`, generates fresh unique ID, and saves to Dexie repository.
3. **UI Hooks**:
   - Export icon/button in Profile Header / Action Bar.
   - Import JSON file dropzone / file picker in `ImportModal.svelte`.

---

## 3. Story Markdown Export

### 🎯 Goal & Specifications

Allow exporting an ongoing or completed narrative session into a publication-ready Markdown file (`.md`).

### 🏗️ Technical Design

1. **Markdown Compilation Helper (`src/utils/story-export.js`)**:
   - Formats metadata header: Title, Characters involved, Fractal/Setting, Rounds count, Date.
   - Formats transcript:
     - AI dialogue & actions formatted with character names and sensory quotes.
     - User actions formatted with clear protagonist markers.
     - Narrator / Fractal environmental beats styled with blockquotes or dividers.
     - Optional inclusion of internal thoughts / telemetry blocks based on user preference toggle.
2. **Download Trigger**:
   - `export_story_markdown(story_id, options)` generates `story-{title}-{date}.md` and triggers browser download.

---

## 4. Epilogue & End-of-Story Integration

### 🎯 Goal & Specifications

When a story concludes (Epilogue rendered or "The End" state triggered), provide clear action cards to save the memories:

- **Save Story**: Download complete story Markdown.
- **Save Entities**: Export modified characters and world states to library or JSON.

---

## 📋 Task Checklist

- [ ] **Phase 1 (RED)**:
  - [ ] HTML stripping and text budget truncation tests (`src/utils/text.test.js`).
  - [ ] Wiki prompt builder schema tests (`src/intelligence/prompts.test.js`).
  - [ ] Entity JSON export/import round-trip validation tests (`src/data/normalizer.test.js`).
  - [ ] Story Markdown formatting tests (`src/utils/story-export.test.js`).

- [ ] **Phase 2 (GREEN — Core Logic)**:
  - [ ] Implement `fetch_wiki_text(url)` in `src/platform/transport.js` + URL validation in `src/platform/security.js`.
  - [ ] Implement HTML stripping & truncation helpers in `src/utils/text.js`.
  - [ ] Implement `render_wiki_character_form` and `render_wiki_scenario_form` in `src/intelligence/prompts.js`.
  - [ ] Implement parser mappings for wiki forms in `src/intelligence/parser.js`.
  - [ ] Implement `story-export.js` and entity JSON export utilities in `src/utils/`.

- [ ] **Phase 3 (UI & Expression)**:
  - [ ] Update `src/ui/entity/ImportModal.svelte` with Wiki URL input, entity type toggle, and JSON file dropzone.
  - [ ] Add "Export Entity JSON" button to `src/ui/profile/ProfileHeader.svelte` / `Profile.svelte`.
  - [ ] Add "Export Story (Markdown)" action to `src/ui/story/Storyboard.svelte` and Epilogue views.

- [ ] **Phase 4 (VERIFY)**:
  - [ ] Run `npm run verify` (`test:unit`, `test:design`, `lint`, `svelte-check`).
  - [ ] Test live wiki import against sample character/world fandom pages.
  - [ ] Verify exported JSON imports cleanly without schema degradation.
  - [ ] Verify exported Markdown renders cleanly in standard Markdown viewers.

- [ ] **Phase 5 (HANDOFF & DEPLOY)**:
  - [ ] Run `npm run build` to verify single-file bundle.
  - [ ] Record completion in `tasks/PRESENT.md` pulse and archive blueprint.
