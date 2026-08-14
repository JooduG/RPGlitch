# 🚀 Implementation Blueprint — `track-import-export-2026-08-14`

> **Track Goal**: Implement comprehensive ingestion and export capabilities for RPGlitch:
>
> 1. **Web Content & URL Ingestion**: Fetch and parse any webpage URL (wikis, fandom, bios, lore, blogs) via `superFetch` (`fetch_web_content`), extracting clean text for LLM schema synthesis.
> 2. **AI RP Character Card Compatibility**: Bidirectional import & export supporting both native RPGlitch JSON and standard AI Character Card V2/V3 formats (Tavern, Chub, Janitor).
> 3. **Unified Import Modal (3-in-1)**: Upgrade `ImportModal.svelte` with tabbed support for **Web URL Fetch**, **File Dropzone (.json / .png)**, and **Raw Text Paste**.
> 4. **Story Markdown Archival**: Story transcript export to clean, formatted Markdown (`.md`) from the **Library panel** on the Control Panel.
> 5. **Edit-Mode Entity Export**: Position `Save Entity (.json)` in the Profile Modal footer when in edit mode.

```text
  INBOUND PIPELINE (Webpage URL, JSON Card, or Raw Text)
  ┌──────────────────┐
  │ 1. Web URL Fetch │ ──> superFetch (transport.js) ──┐
  │ 2. JSON Card/PNG │ ──> V2/V3 Normalizer (data)   ──┼──> Schema Normalizer ──> Local DB (Dexie)
  │ 3. Raw Textarea  │ ──> LLM Sorter (prompts.js)   ──┘
  └──────────────────┘

  OUTBOUND PIPELINE (Portability & Archival)
  ┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
  │ Story Record │ ──> │ Story Markdown Engine │ ──> │ story-{title}-{date}  │
  │ (Library)    │     │ (utils/story-export)  │     │ .md Download          │
  └──────────────┘     └───────────────────────┘     └───────────────────────┘
  ┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
  │ Entity State │ ──> │ Character Card / JSON │ ──> │ {entity-name}.json    │
  │ (Edit Mode)  │     │ Serializer (data)     │     │ Standalone Export     │
  └──────────────┘     └───────────────────────┘     └───────────────────────┘
```

---

## 1. Inbound Engine: Upgrading the Import System

We build directly on the existing `src/ui/entity/ImportModal.svelte` and sorting pipeline, expanding it to handle three distinct input modalities:

### A. The 3-in-1 Ingestion Surface

1. **Web Content & URL Fetch**:
   - `superFetch` is isolated in `src/platform/transport.js` via `fetch_web_content(url)`.
   - Fetches HTML from any valid webpage (wikis, character repositories, lore pages, or fan wikis).
   - `src/platform/security.js` validates `https:` schemes and sanitizes input URLs.
   - `src/utils/text.js` strips scripts, navigations, headers, and markup tags, clipping to ~8,000 chars (characters) or ~10,000 chars (worlds).
2. **File Dropzone (.json & .png Character Cards)**:
   - Supports native RPGlitch `.json` files.
   - Supports standard **Character Card V2/V3 PNGs** (extracting `tEXt`/`chara` chunks) and `.json` files from Tavern, Chub, and Janitor.
3. **Raw Text Paste**:
   - A dedicated multi-line textarea allowing users to paste unformatted bio paragraphs, character descriptions, or creative notes directly.

### B. LLM Ingestion Directive & Fill Rules

When raw unformatted text (from Web URL or Textbox) is submitted, `prompt_builder.build_profile_sorting_prompt` applies the following extraction directives:

```xml
<INGESTION_DIRECTIVE Authority="L3_HIGH">
  <RULE name="SOURCE_OF_TRUTH">
    Source text details are absolute truth. Map them verbatim into corresponding schema fields.
  </RULE>
  <RULE name="NO_NULL_FABRICATION">
    If a field (e.g., eye color, attire, height, unstated motivations) is absent from the source text:
    - Synthesize a vivid, lore-consistent default.
    - NEVER emit null, undefined, or empty string values.
  </RULE>
</INGESTION_DIRECTIVE>
```

- **Character Mapping**: Maps source text into `eternal` and `present` schemas (name, appearance, personality, backstory, fears, values, dynamics).
- **World / Fractal Mapping**: Maps source text into `fractal` schemas (name, description, setting, fashion, races, tone, story rules).
- **Normalization Layer**: Parsed data passes through `src/data/normalizer.js` to ensure schema compliance and safe defaults.

---

## 2. Outbound Engine: Serialization & Standard Card Formats

| Target Format | Scope & Surface | Architecture & Compatibility |
| :--- | :--- | :--- |
| **Story Markdown** (`.md`) | Control Panel Library (`ControlPanel.svelte` / `Library.svelte`) | Handled by `src/utils/story-export.js` (`export_story_markdown`). Compiles header metadata (Title, Characters, Setting, Beats count, Date) and formatted transcript beats (dialogue sensory quotes, protagonist actions, narrator blockquotes, and optional telemetry blocks) into a clean markdown document. |
| **Entity JSON / V2 Card** (`.json`) | Profile Modal Footer in Edit Mode (`Profile.svelte`) | Handled by `src/data/normalizer.js` & `src/utils/ui-helpers.js`. Strips internal transient database IDs, indents with 2 spaces, and triggers a browser blob download (`download_blob`). Maps cleanly to both native RPGlitch schemas and industry-standard Character Card V2 schemas. |

### Industry Standard Card V2 Mapping

When exporting or importing character cards:

- `data.name` $\leftrightarrow$ `entity.name`
- `data.description` / `data.personality` $\leftrightarrow$ `entity.eternal.non_physical` & `entity.eternal.physical`
- `data.first_mes` / `data.scenario` $\leftrightarrow$ `entity.present.non_physical` & `entity.future`
- `data.tags` $\leftrightarrow$ `entity.tags`

---

## 3. UI Surface Integration & Lifecycle Touchpoints

```text
                        ┌─────────────────────────────────────────────────────────┐
                        │                   Entity Import Modal                   │
                        │ ┌─────────────────┬──────────────────┬────────────────┐ │
                        │ │ 1. URL Fetch    │ 2. File Dropzone │ 3. Raw Textbox │ │
                        │ └─────────────────┴──────────────────┴────────────────┘ │
                        └────────────────────────────┬────────────────────────────┘
                                                     │
                       ┌─────────────────────────────┴────────────────────────────┐
                       ▼                                                          ▼
         ┌───────────────────────────┐                              ┌───────────────────────────┐
         │       Control Panel       │                              │       Entity Profile      │
         │     (Library Section)     │                              │   (Edit Mode Modal Footer)│
         │ ┌───────────────────────┐ │                              │ ┌───────────────────────┐ │
         │ │ Save Story (.md)      │ │                              │ │ Save Entity (.json)   │ │
         │ └───────────────────────┘ │                              │ └───────────────────────┘ │
         └───────────────────────────┘                              └───────────────────────────┘
```

- **`src/ui/entity/ImportModal.svelte`**: Tabbed modal supporting URL scraping, file dropzone (`.json`, `.png` chara cards), and raw text input with a Character vs. World target toggle.
- **`src/ui/profile/Profile.svelte` (Edit Mode Footer)**: Right-aligned `Save Entity (.json)` button in the profile modal footer when editing an entity for instant backups and card export.
- **`src/ui/console/ControlPanel.svelte` (Library)**: Clean `Save Story (.md)` action button on each story row in the Library panel to export transcripts at any time.

---

## 4. Implementation Playbook (Bite-Sized Checklist)

### Phase 1: Test-Driven Red Suite

- [ ] **Sanitization & Budgeting Tests**: Create unit tests in `src/utils/text.test.js` validating script stripping, tag removal, and length clipping.
- [ ] **Prompt Schema Tests**: Build prompt assertions in `src/intelligence/prompts.test.js` verifying JSON schema output structure and ingestion directives.
- [ ] **V2 Card & JSON Serialization Round-Trip**: Test import/export round trips and schema normalization in `src/data/normalizer.test.js` for both RPGlitch JSON and Character Card V2 format.
- [ ] **Markdown Formatter Tests**: Validate metadata compilation and dialogue block styling in `src/utils/story-export.test.js`.

### Phase 2: Core Logic Implementation

- [ ] **Transport & Security Layers**: Implement `fetch_web_content(url)` in `src/platform/transport.js` and URL scheme sanitization in `src/platform/security.js`.
- [ ] **HTML Parsing Utilities**: Implement clean plain-text stripping and token truncator in `src/utils/text.js`.
- [ ] **Prompt Builders & Parsers**: Implement profile extraction formatting in `src/intelligence/prompts.js` and wire response parsing in `src/intelligence/parser.js`.
- [ ] **Export Helpers**: Build `story-export.js` and standalone JSON download utilities in `src/utils/`.

### Phase 3: UI Wiring & Presentation

- [ ] **Import Modal Overhaul**: Upgrade `src/ui/entity/ImportModal.svelte` with tabbed controls for Web URL Fetch, File Dropzone, and Raw Textarea.
- [ ] **Profile Edit-Mode Footer Integration**: Wire `Save Entity (.json)` action button into the right-aligned edit-mode footer of `src/ui/profile/Profile.svelte`.
- [ ] **Control Panel Library Export**: Wire `Save Story (.md)` triggers in the Library section of `src/ui/console/ControlPanel.svelte` / `Library.svelte`.

### Phase 4: Verification & Stress Testing

- [ ] **Execute verification suite**:

  ```bash
  npm run verify
  ```

  _(Validates `test:unit`, `test:design`, `lint`, and `svelte-check`)_.

- [ ] **Perform live import verification**: Test against live character and world URLs (wikis, fandom, lore sites) to confirm schema field completeness and fallback synthesis.
- [ ] **Inspect exported artifacts**: Verify that exported Markdown parses cleanly in standard viewers and exported JSON passes schema validation upon re-import.

### Phase 5: Build & Archival

- [ ] **Execute production build**:

  ```bash
  npm run build
  ```

  _(Validates bundle integrity)_.

- [ ] **Update project log**: Record completion in `tasks/PRESENT.md` and archive track blueprint.
