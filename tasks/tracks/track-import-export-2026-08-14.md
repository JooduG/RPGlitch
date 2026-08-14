# 🚀 Implementation Blueprint — `track-import-export-2026-08-14`

> **Track Goal**: Implement comprehensive ingestion and export capabilities for RPGlitch:
>
> 1. **Wiki/Fandom Ingestion**: One-click URL import for characters and fractals/worlds via `superFetch`, plain-text extraction, and LLM-driven schema mapping.
> 2. **Entity JSON Export & Import**: Clean single-entity JSON export and import for seamless sharing and backup.
> 3. **Story Markdown Export**: Export complete story transcripts (dialogue, narration, telemetry, timestamps) to cleanly formatted Markdown.
> 4. **Epilogue / End-of-Story Action**: Integrate "Export Story (Markdown)" and "Export Entities (JSON)" directly into the Epilogue/End-of-Story flow.

```text
  INBOUND PIPELINE (Wiki / Fandom URL)
  ┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
  │  Wiki/Fandom │ ──> │   superFetch Proxy    │ ──> │ HTML Sanitization &   │ ──> │ LLM Synthesis &     │ ──> Local DB (Dexie)
  │     URL      │     │ (platform/transport)  │     │ Truncation (utils)    │     │ Normalizer (schema) │
  └──────────────┘     └───────────────────────┘     └───────────────────────┘     └─────────────────────┘

  OUTBOUND PIPELINE (Portability & Archival)
  ┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
  │ Active Story │ ──> │ Story Markdown Engine │ ──> │ story-{title}-{date}  │
  │ / Epilogue   │     │ (utils/story-export)  │     │ .md Download          │
  └──────────────┘     └───────────────────────┘     └───────────────────────┘
  ┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
  │ Entity State │ ──> │ Schema Serializer     │ ──> │ {entity-name}.json    │
  │ (Char/World) │     │ (data/normalizer)     │     │ Standalone Export     │
  └──────────────┘     └───────────────────────┘     └───────────────────────┘
```

---

## 1. Inbound Engine: Wiki & Fandom Ingestion

### A. Security, Transport & Extraction Flow

To safely ingest external HTML without polluting core domain logic or exposing security vulnerabilities:

1. **Transport Isolation**: `superFetch` is isolated within `src/platform/transport.js` via `fetch_wiki_text(url)` to ensure the rest of the application never touches raw plugin roots directly.
2. **Security & Protocol Sanitization**: `src/platform/security.js` enforces strict `https:` scheme validation and blocks malicious URI vectors before request execution.
3. **HTML Extraction & Token Budgeting**: `src/utils/text.js` strips scripts, navigations, headers, footers, and markup tags. Content is hard-truncated against token budgets to protect LLM context windows:
   - **Characters**: Truncated to ~8,000 characters.
   - **Worlds / Fractals**: Truncated to ~10,000 characters.

### B. LLM Ingestion Directive & Fill Rules

The extraction prompts in `src/intelligence/prompts.js` (`render_wiki_character_form` and `render_wiki_scenario_form`) enforce strict generation rules to map unstructured text into structured entity schemas:

```xml
<INGESTION_DIRECTIVE Authority="L3_HIGH">
  <RULE name="SOURCE_OF_TRUTH">
    Wiki-stated details are absolute truth. Map them verbatim into corresponding schema fields.
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
- **Normalization Layer**: Parsed JSON passes through `normalize_entity` to ensure schema safety and provide robust fallbacks.

---

## 2. Outbound Engine: Serialization & Export Formats

| Target Format              | Scope & Surface                                | Architecture & Behavior                                                                                                                                                                                                                                                                                       |
| :------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Story Markdown** (`.md`) | Ongoing Storyboard, Epilogue Screen, Storymode | Handled by `src/utils/story-export.js` (`export_story_markdown`). Compiles header metadata (Title, Characters, Setting, Beats count, Date) and formatted transcript beats (dialogue sensory quotes, protagonist actions, narrator blockquotes, and optional telemetry blocks) into a clean markdown document. |
| **Entity JSON** (`.json`)  | Profile Header, Entity Cards, Import Modal     | Handled by `src/data/normalizer.js` & `src/utils/ui-helpers.js`. Strips internal transient database IDs, indents with 2 spaces, and triggers a browser blob download (`download_blob`). Supports bidirectional drag-and-drop import with unique ID re-generation.                                             |

---

## 3. UI Surface Integration & Lifecycle Touchpoints

```text
                        ┌──────────────────────────────────────────┐
                        │           Entity Import Modal            │
                        │ ┌──────────────────────┬───────────────┐ │
                        │ │ Wiki/Fandom URL      │ JSON Dropzone │ │
                        │ └──────────────────────┴───────────────┘ │
                        └────────────────────┬─────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │     Active Gameplay       │               │      Story Epilogue       │
         │   (Storyboard Action Bar) │               │   (PrologueEpilogue Card) │
         │ ┌───────────────────────┐ │               │ ┌───────────────────────┐ │
         │ │ Export Story (.md)    │ │               │ │ Save Story (.md)      │ │
         │ │ Export Entity (.json) │ │               │ │ Save Entities (.json) │ │
         │ └───────────────────────┘ │               │ └───────────────────────┘ │
         └───────────────────────────┘               └───────────────────────────┘
```

- **`src/ui/entity/ImportModal.svelte`**: Unified modal featuring a tabbed interface for Wiki/Fandom URL fetching (with Entity Type toggle and progress spinner) and a standalone JSON file dropzone.
- **`src/ui/profile/Header.svelte` & `src/ui/profile/Profile.svelte`**: Single-click "Export Entity JSON" action button for instant backup.
- **`src/ui/story/Storyboard.svelte` & `src/ui/message/PrologueEpilogue.svelte`**: End-of-story action cards offering immediate archival choices when narrative closure is reached.

---

## 4. Implementation Playbook (Bite-Sized Checklist)

### Phase 1: Test-Driven Red Suite

- [ ] **Sanitization & Budgeting Tests**: Create unit tests in `src/utils/text.test.js` validating script stripping, tag removal, and length clipping.
- [ ] **Prompt Schema Tests**: Build prompt assertions in `src/intelligence/prompts.test.js` verifying JSON schema output structure and ingestion directives.
- [ ] **JSON Serialization Round-Trip**: Test import/export round trips and schema normalization in `src/data/normalizer.test.js`.
- [ ] **Markdown Formatter Tests**: Validate metadata compilation and dialogue block styling in `src/utils/story-export.test.js`.

### Phase 2: Core Logic Implementation

- [ ] **Transport & Security Layers**: Implement `fetch_wiki_text(url)` in `src/platform/transport.js` and URL scheme sanitization in `src/platform/security.js`.
- [ ] **HTML Parsing Utilities**: Implement clean plain-text stripping and token truncator in `src/utils/text.js`.
- [ ] **Prompt Builders & Parsers**: Implement `render_wiki_character_form` / `render_wiki_scenario_form` in `src/intelligence/prompts.js` and wire response parsing in `src/intelligence/parser.js`.
- [ ] **Export Helpers**: Build `story-export.js` and standalone JSON download utilities in `src/utils/`.

### Phase 3: UI Wiring & Presentation

- [ ] **Import Modal Overhaul**: Implement Wiki URL input, entity toggle (Character vs. World), preview step, and JSON dropzone in `src/ui/entity/ImportModal.svelte`.
- [ ] **Profile Export Integration**: Wire JSON export buttons in `src/ui/profile/Header.svelte` and `src/ui/profile/Profile.svelte`.
- [ ] **Story Action Surfacing**: Wire Markdown export triggers in `src/ui/story/Storyboard.svelte` and resolution cards in `src/ui/message/PrologueEpilogue.svelte`.

### Phase 4: Verification & Stress Testing

- [ ] **Execute verification suite**:

  ```bash
  npm run verify
  ```

  _(Validates `test:unit`, `test:design`, `lint`, and `svelte-check`)_.

- [ ] **Perform live import verification**: Test against live character and world fandom URLs to confirm schema field completeness and fallback synthesis.
- [ ] **Inspect exported artifacts**: Verify that exported Markdown parses cleanly in standard viewers and exported JSON passes schema validation upon re-import.

### Phase 5: Build & Archival

- [ ] **Execute production build**:

  ```bash
  npm run build
  ```

  _(Validates bundle integrity)_.

- [ ] **Update project log**: Record completion in `tasks/PRESENT.md` and archive track blueprint.
