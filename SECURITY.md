# RPGlitch Security Architecture

> **Scope**: Client-side security boundaries, input validation, and environment hardening for the RPGlitch single-file PWA running inside a Perchance iframe. For system topology, see [README.md](./README.md).

---

## 1. Trust Boundaries & Ingestion Vectors

RPGlitch has no backend server; all state lives locally in the browser (IndexedDB via Dexie.js). Untrusted inputs enter through four client-side vectors:

- **User text & chat inputs** (`Console.svelte`, `Profile.svelte`)
- **Imported character cards & JSON/PNG files** (`src/data/card-conversion.js`, `src/ui/molecules/SourceField.svelte`)
- **External web fetches** (`validate_url` / `fetch_web` in `src/utils/ingestion.js`)
- **Streaming LLM responses** (`src/engine/transport.js`, `src/engine/steps.js`)

---

## 2. Active Security Controls

### 2.1 URL & Web Ingestion (`src/utils/ingestion.js`)

- **`validate_url(url)`**: Enforces an explicit protocol allowlist, blocking dangerous schemes (`javascript:`, `data:`, `file:`) before `fetch_web` or `get_super_fetch_engine` executes.
- **`validate_image(file)` / `IMAGE_SIGNATURE_VALIDATORS`**: Inspects raw binary magic-byte headers (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`) before ingesting uploaded image files.

### 2.2 HTML Sanitization & Markdown Rendering

- **AST-Based Markdown (`src/utils/text.js`, `src/ui/molecules/TextField.svelte`)**: Markdown is parsed into an AST token array via `parse_markdown` and rendered via native Svelte snippets (`{@render token_content(...)}`) without evaluating HTML strings.
- **DOMPurify (`src/utils/html.js`)**: `sanitize()` and `sanitize_to_fragment()` enforce `{ SANITIZE_NAMED_PROPS: true, SANITIZE_DOM: true }` to prevent XSS and DOM clobbering (verified by `SECURITY_DOMPURIFY_CONFIG` in `npm run audit:hygiene`).
- **Sanitized Typewriter (`src/ui/atoms/Typewriter.svelte`)**: `current_word_html` runs through `sanitize()` once per phrase before `{@html sliced_html}` character slicing.

### 2.3 LLM Response & Domain Bounds

- **Whitelisted Extraction (`src/engine/steps.js`)**: Director Turn 1 parses JSON via `safe_parse_json` and extracts only whitelisted fields (`dynamics_deltas`, `next_action`, `directors_note`, `camera_note`).
- **Resource & Numeric Caps**: `clamp` (`@utils`) and `DYNAMICS.DELTA.CLIP` (`src/config.js`) bound dynamics values (`[0, 100]` in `reduce_dynamics`, `[5, 95]` in `apply_dynamics_step`).

---

## 3. Environment & Repository Hygiene

- **Sandbox Hardening (`src/utils/dom.js`)**: `install_environment_hardening()` (wired in `src/main.js`) catches and silences sandbox-boundary rejections on initialization.
- **Zero-Secret Client Bundle**: The single-file `dist/index.html` bundle has no runtime `.env` access and must contain zero secrets.
- **Local-Only Persistence**: All story, entity, and ledger state is confined to browser IndexedDB (`Dexie.js`) with zero `localStorage` usage and zero outbound telemetry.
- **Hygiene Gate**: `npm run audit:hygiene` (part of `npm run verify`) scans for accidental secret leaks (`SECURITY_SECRET_LEAK`) and `DOMPurify` configuration regressions.
