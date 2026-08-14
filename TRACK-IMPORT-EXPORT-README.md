# RPGlitch — track-import-export-2026-08-14 (delivery)

One-time delivery of the **Import / Export** track implementation. Extract this ZIP over your
local `RPGlitch` repo (replaces the listed files in `src/`), then run the verification steps below.

## What's inside

### Inbound (ingestion)

- **Web URL fetch**: ImportModal now has a **Web URL** tab — paste any `https://` page (wikis, fandom,
  bios, lore) and it fetches clean readable text via the superFetch proxy. URL is scheme/host validated
  before any request; HTML is stripped to text and clipped to a budget (8k chars for characters,
  10k for fractal/worlds).
- **File dropzone**: drop `.json` (Tavern/Chub/Janitor Character Cards V2/V3 OR native RPGlitch exports)
  or `.png` (embedded `chara` chunk extracted as before).
- **Raw Text tab**: the familiar paste box, now with an **ingestion directive** appended to the AI
  sorter prompt (SOURCE_OF_TRUTH + NO_NULL_FABRICATION).
- Structured JSON (cards + native exports) bypasses the AI entirely; only raw prose goes through the
  sorter.

### Outbound (portability)

- **Story archival**: each story card in the Library (Control Panel) has a download icon that saves
  `story-{title}-{date}.md` — header metadata + per-round transcript (blockquote narrators, bold
  dialogue labels, italic telemetry).
- **Entity export**: in the Profile modal's edit-mode footer there are now two buttons —
  `Save Entity (.json)` (native RPGlitch backup) and `V2 Card` (standard Character Card V2 for
  Tavern/Chub/Janitor). Both trigger browser downloads.

## New / changed files

```
src/utils/text.js                    + html_to_plain_text, truncate_readable, decode_html_entities, budgets
src/utils/text.test.js               (new)
src/utils/story-export.js            (new) markdown transcript compiler
src/utils/story-export.test.js       (new)
src/utils/ui-helpers.js              + download_blob / download_text_file / download_json_file
src/utils/index.js                   + story-export re-export
src/platform/security.js             + validate_url (https-only + optional host allow-list)
src/platform/security.test.js        + URL tests
src/platform/transport.js            + fetch_web_content (superFetch engine resolution + budgets)
src/platform/transport.test.js       + fetch tests
src/platform/index.js                + fetch_web_content / validate_url exports
src/data/normalizer.js               + serialize_entity_for_export (strips transient DB fields)
src/data/cards.js                    (new) Character Card V2/V3 codec (import + export)
src/data/cards.test.js               (new) round-trip tests
src/data/index.js                    + cards + serializer exports
src/data/definitions/protocols.js    + PROFILE.INGESTION_DIRECTIVE
src/intelligence/parser.js           + parse_profile_json
src/intelligence/index.js            + parse_profile_json export
src/intelligence/prompts.js          + build_profile_sorting_prompt(..., { ingestion: true })
src/intelligence/prompts.test.js     + ingestion directive tests
src/ui/entity/ImportModal.svelte     3-tab rewrite (Web URL / File / Raw Text)
src/ui/story/StoryCard.svelte        + onexport prop + download button
src/ui/story/StoryManager.svelte     + export_story handler wiring
src/ui/profile/Profile.svelte        + Save Entity (.json) + V2 Card footer buttons
src/index.html                       + superFetch plugin capture in the alias poller
src/RPGlitch-left-panel.pjs          + superFetch = {import:super-fetch-plugin}
```

## Steps

1. `npm install` (if needed) then `npm run verify` — should be green (new tests included).
2. `npm run deploy:prepare` → paste `dist/index.html` into the Perchance HTML panel.
3. The Perchance **left panel** (main.pjs) already has the superFetch import added in this workspace —
   keep it: `superFetch = {import:super-fetch-plugin}`.
4. Live smoke test on the deployed page:
   - Import Modal → Web URL tab → fetch a wiki/fandom page → review → import (Character/Fractal).
   - Import Modal → File tab → drop a `.png` card and a `.json` card (both should bypass the AI).
   - Profile edit-mode footer → `Save Entity (.json)` and `V2 Card` → re-import the `.json` back.
   - Library → story card download icon → open the `.md` in any viewer.

Note: Web URL fetch needs the super-fetch-plugin at runtime (already imported). If the fetch throws
"superFetch plugin unavailable", the generator was pasted without the left-panel import.
