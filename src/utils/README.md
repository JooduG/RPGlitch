# RPGlitch Shared Utilities (`src/utils/`)

## Overview

Rank-0 shared utilities package for **RPGlitch**, providing pure data codecs, text and bracket-state parsers, entity-aware macro resolution, XML/Markdown compilers, prose detoxification and style auditing, HTML sanitization and web fetching, math/vector quantization and cryptographic primitives, ONNX mutex/embedding inference, resilience runners, Svelte DOM actions, and decoupled cross-layer registries.

- **Barrel Entry Point**: [`index.js`](./index.js) re-exports `*` from 17 modules in this package (`actions.js`, `detox.js`, `embeddings.svelte.js`, `field-path.js`, `html.js`, `job-queue.js`, `macros.js`, `markdown.js`, `math.js`, `onnx.js`, `registries.js`, `resilience.js`, `story-export.js`, `styles.js`, `text.js`, `ui-helpers.js`, `xml.js`).
- **Legacy Bridge Exclusion**: [`bridges.js`](./bridges.js) is retained on disk without callers and is intentionally excluded from [`index.js`](./index.js); [`registries.js`](./registries.js) supersedes it while exporting the same bridge symbols (`state_bridge`, `stream_bridge`, `stories_bridge`, `register_state_accessors`, `register_stream_handlers`).
- **Dependency Boundary**: Modules import only intra-package helpers, `@config`, `dompurify`, `svelte/reactivity`, and a dynamic ESM import of `@huggingface/transformers@3.5.2` inside [`embeddings.svelte.js`](./embeddings.svelte.js), avoiding upward imports from `@ui`, `@state`, `@intelligence`, `@data`, `@platform`, or `@media`.

## Interface

### 1. Barrel & Cross-Layer Registries

- [`index.js`](./index.js): Central barrel re-exporting `*` from all active `src/utils/` modules except [`bridges.js`](./bridges.js).
- [`registries.js`](./registries.js): Cell-backed cross-layer registries sharing an internal `create_cell(label, { noisy })` factory:
  - `register_state_accessors(accessors)` and `state_bridge` (`app`, `runtime`, `simulation_state`, `simulation_log`, `session_driver`, `record_prompt_token_snapshot(snapshot)`).
  - `register_stream_handlers(handlers)` and `stream_bridge` (`is_active()`, `start(node_id, role = "ai")`, `update(chunk)`, `end()`).
  - `stories_bridge` (`register_bump(fn)`, `bump()`).
  - `reset_registries_for_testing()`: Resets all 11 module-level cells and warning flags to initial blank state.
- [`bridges.js`](./bridges.js): Unreferenced predecessor to [`registries.js`](./registries.js) with plain object stores exporting `register_state_accessors(accessors)`, `state_bridge`, `register_stream_handlers(handlers)`, `stream_bridge`, `stories_bridge`, and `reset_bridges_for_testing()`.

### 2. Text, Bracket State & History Codecs

- [`text.js`](./text.js): Stateless string, pseudo-JSON, history, alternation, and LLM output utilities:
  - Token & key sets: `CLEAR_TOKENS` (9 lowercase clearing tokens), `AGGREGATE_KEYS` (`"INVENTORY"`, `"STASH"`), `VISUAL_EXCLUDED_KEYS` (`"INVENTORY"`, `"STASH"`, `"SECRET"`, `"PLAN"`, `"STATUS"`), `NAME_PREFIXES` (25-item frozen list), `NAME_PREFIX_STEMS` (`NAME_PREFIXES` without trailing `.`), `ALTERNATION_PATTERN` (`/{([^{}]+(?:\|[^{}]+)+)}/g`).
  - Cleaning & truncation: `strip_cognition_blocks(text)`, `collapse_whitespace(text)`, `truncate_at_word(text, limit = 200, options = {})`, `truncate_at_boundary(text, limit = 200, options = {})`, `estimate_tokens(text)`, `clean_text(text, limit = 500)`, `first_sentence(text, max_len = 160)`, `indent_continuation(text, spaces)`, `normalize_comma_spacing(str)`, `match_case(original, replacement)`, `format_key_as_label(key)`, `format_datetime(ts)`.
  - JSON & bracket state codecs: `extract_json_block(raw)`, `escape_unescaped_json_quotes(json_string)`, `safe_parse_pseudo_json(raw)`, `safe_parse_json(raw, options = {})`, `merge_prose_into_field(current_field_value, new_prose)`, `strip_visual_excluded(raw_parameter_string)`, `balance_brackets(raw)`, `has_bracket_bond(entity, target_identifier_or_entity)`.
  - Relational vectors & initials: `parse_relational_vector(vector_str)`, `format_relational_vector(source_name, target_name, dynamic = "")`, `derive_vector_title(text, max_len = 38)`, `get_style_initials(name)`, `compute_initials(text, stop_words = NAME_PREFIX_STEMS)`, `decompose_story_title(title, entities = {})`.
  - History & roles: `role_display_label(role)`, `canonicalize_role(role)`, `normalize_history_beat(entry, options = {})`, `is_narrative_role(role)`, `collapse_history(messages, options = {})`, `filter_narrative_messages(messages, options = {})`, `format_history_entries(messages, options = {})`.
  - Alternations & LLM payload helpers: `extract_alternations(text)`, `has_alternations(text)`, `resolve_alternations(text, opts = {})`, `diff_alternation_picks(source, resolved)`, `strip_alternation_braces(text)`, `alternation_field_label(text, raw)`, `match_keyword_pattern(pattern, haystack)`, `looks_truncated(text)`, `raw_to_text(raw)`, `raw_stop_reason(raw)`, `sanitize_llm(text)`.

### 3. Macro Expansion & XML Prompt Serialization

- [`macros.js`](./macros.js): Relational macro expansion and enhancement unwrapping:
  - `UNRESOLVED_LABELS` (`{ user: "the traveler", you: "the traveler", fractal: "the realm", char: "the companion" }`).
  - `create_relational_context({ me, you, speaker, listener, owner, target, witnesses } = {})`: Builds a frozen `RelationalContext` with `is_relational_context: true`.
  - `parse_macros(text, owner_or_context, entities = {}, context = {})` and `expand_entity_macros(entity, entities)`: Expands `@USER`, `@CHAR`, `@FRACTAL`, `@TARGET`, `@SPEAKER`, `@ME`, `@OWNER`, `@LISTENER`, and `@YOU` tokens for LLM prompts.
  - `resolve_display_macro_segments(text, owner, entities = {}, context = {})` and `render_display_macros(text, owner, entities = {})`: Splits/renders UI display macro segments (`{ text, macro, entity }`).
  - `strip_profile_wrappers(text)`, `unwrap_enhancement_text(text, field_id = "")`, `render_field_value(text, owner, entities, context = {})`.
- [`xml.js`](./xml.js): Pure XML escaping, indentation, physical normalization, and atom compilation:
  - `CLOTHING_KEYS` (27 frozen uppercase apparel/gear keys) and `PHYSICAL_KEY_ALIASES` (`{ SHORTS: "APPAREL", SOMA: "SOMATIC", POSE: "POSTURE" }`).
  - `interpolate_tokens(template, values = {})`, `escape_xml(str)`, `prompt_escape(str)`.
  - `strip_leading_key_echo(value, keys = [])`, `normalize_physical_entries(parsed)`, `render_profile_field_block(tag, rows = [])`.
  - `clean_xml(xml)`, `dedent_all(text)`, `indent_all(text, spaces)`, `inline_or_block(content, indent)`, `wrap_tag(tag, inner, indent)`, `render_xml_tag({ tag, attrs, children, indent, child_indent, closed, separator, inline })`, `render_atom_xml(atom_or_catalog, key_or_options = {}, values_or_options = {}, options_param = {})`.

### 4. Prose Detoxification, Style Resolution & Narrative Auditing

- [`detox.js`](./detox.js): Deterministic speaking-style and anti-AI prose rewriting:
  - `register_speaking_rules(rules)` and `register_anti_ai_rules(rules)`: Store rule tables supplied by higher layers.
  - `detox_prose(raw_text, speaking_style = "casual", custom_rules = null)`: Applies speaking-style rules, 12 hardcoded structural regex rewrites, and registered anti-AI rules.
- [`styles.js`](./styles.js): Style key resolution and narrative slop/shape auditing:
  - `SLOP_PATTERNS`: Deep-frozen object holding `CLICHES` (10 patterns) and `SOMATIC_MARKERS` (17 patterns).
  - `lint_narrative_slop(text)`: Returns frozen `{ violations, somatic_count, over_cap }`.
  - `cap_somatic_markers(text)`: Keeps only the earliest somatic marker match and collapses leftover whitespace.
  - `resolve_style(explicit_style, app_setting_key, registry = {}, fallback = "")` and `resolve_speaking_style(entity = null, narrative_style = null)`.
  - `audit_macro_shape(text)` and `register_cluster_words(words)`: Audits `as_if_overuse`, `every_para_question`, `familiar_closer`, `door_slam_closer`, and Tier 2 `vocabulary_cluster`.

### 5. Markdown Parsing & Story Export

- [`markdown.js`](./markdown.js): Pure inline Markdown tokenizer:
  - `parse_markdown(text)`: Splits paragraphs on blank lines and returns token arrays (`text`, `strong`, `em`, `strong-em`, `quote`) without DOM or HTML evaluation.
- [`story-export.js`](./story-export.js): Markdown transcript serialization:
  - `format_story_beat(entry, options = {})`: Formats a single beat as an image, blockquote, italicized system note, or bold-attributed line.
  - `export_story_markdown(story = {}, entries = [], options = {})`: Compiles story header metadata and narrative beats into a full Markdown transcript.
  - `build_story_export_filename(story = {}, date = new Date())`: Produces `story-<slug>-<YYYY-MM-DD>.md`.

### 6. HTML Sanitization, Media Validation & Web Fetching

- [`html.js`](./html.js): DOMPurify wrappers, Perchance iframe error hardening, image validation, URL validation, and web content extraction:
  - Hardening & sanitization: `is_perchance_frame_error(target)`, `install_environment_hardening()`, `sanitize(dirty)`, `sanitize_to_fragment(dirty)`, `escape_html(str)`, `security` (`{ sanitize, sanitize_to_fragment, escape_html, validate_image, install_environment_hardening }`).
  - Image & binary codecs: `IMAGE_SIGNATURE_VALIDATORS` (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`), `validate_image(file, options = {})`, `blob_to_data_url(blob)`.
  - Web fetching & plain-text extraction: `get_super_fetch_engine()`, `validate_url(raw_url, options = {})`, `fetch_web(raw_url, options = {})`, `BLOCK_LEVEL_TAGS` (28 tags), `NOISE_SELECTORS` (16 tags), `decode_html_entities(text)`, `html_to_plain_text(html, options = {})`, `truncate_readable(text, max_chars = LENGTH_THRESHOLDS.INGESTION, ellipsis = "…")`.

### 7. Math, Vector Quantization, CSPRNG & Hashing

- [`math.js`](./math.js): Numeric, embedding vector, cryptographic, and trigger math:
  - Scalar & similarity math: `clamp(value, min = 0, max = 100)`, `get_percentage(value)`, `cosine_similarity(a, b)`.
  - Embedding serialization & 8-bit quantization: `serialize_embedding(raw_embedding)`, `deserialize_embedding(stored_embedding, dimensions = 384)`, `quantize_vector_q8(raw_embedding, as_base64 = true, dimensions = 384)`, `dequantize_vector_q8(quantized_data, dimensions = 384)`.
  - CSPRNG & FNV-1a hashing: `generate_uuid()`, `generate_secure_seed(limit = 1000000)`, `pick_random(array)`, `HASH_OFFSET_BASIS` (`0x811c9dc5`), `HASH_PRIME` (`0x01000193`), `fnv1a_hash(str)`, `stable_pick(list, seed = "", offset = 0)`.
  - Simulation trigger math: `evaluate_image_trigger(current = {}, previous = {}, options = {})` returning `{ triggered, signals, tier, deltas }`.

### 8. ONNX Synchronization & Semantic Embeddings

- [`onnx.js`](./onnx.js): ONNX Runtime mutual exclusion and initialization barrier:
  - `OnnxMutex` class (`run(fn)`, `is_busy()`, `queue_length`), singleton `onnx_mutex`, `mark_ort_ready()`, `wait_ort_ready(timeout_ms = 45000)`, `reset_ort_ready_for_testing()`.
- [`embeddings.svelte.js`](./embeddings.svelte.js): Svelte-reactive MiniLM (`Xenova/all-MiniLM-L6-v2`) embedding pipeline and LRU cache:
  - `load_model()`, `embed(text)`, `ensure_embedding(vector)`, `ensure_embeddings(vectors)`, `score_by_semantics(vectors, context_text)`, `calculate_semantic_drift(current_text, previous_text)`, `is_ready()`.
  - `embeddings_engine`: Facade exposing the functions above plus reactive getters (`load_progress`, `is_loading`, `model_ready`), `cache_stats()`, `_debug_reset_cache(capacity)`, and `_debug_set_pipeline(pipeline_function)`.

### 9. Async Queues & Resilience Primitives

- [`job-queue.js`](./job-queue.js): Bounded-concurrency FIFO job queue:
  - `CLEARED_RESULT` (`{ cleared: true }`), `SUPERSEDED_RESULT` (`{ superseded: true }`), `create_job_queue(options = {})` returning `{ run(task, opts), is_busy(), queue_length, clear() }`.
- [`resilience.js`](./resilience.js): Abort signal composition, backoff retries, and circuit breaking:
  - `merge_abort_signals(caller, secondary)`.
  - `ExponentialBackoffRetryer`: `constructor(options = {})`, `async retry(fn, on_retry = () => {})`.
  - `CircuitBreaker`: `constructor(options = {})`, `state` getter/setter, `is_closed`, `is_open`, `is_half_open`, `active_count`, `queue_length`, `reset()`, `async execute(fn)`.

### 10. Path Traversal, UI Helpers & Svelte Actions

- [`field-path.js`](./field-path.js): Prototype-safe dot-path object accessors:
  - `UNSAFE_PATH_KEYS` (`Set(["__proto__", "prototype", "constructor"])`), `get_value(obj, path)`, `set_value(obj, path, value)`.
- [`ui-helpers.js`](./ui-helpers.js): Zero-DOM-injection CSS token resolvers, file downloads, and view-transition locking:
  - CSS token resolvers: `resolve_px(value, fallback = 0, context = null)`, `resolve_ms(value, fallback = 0, context = null)`, `resolve_number(value, fallback = 0, context = null)`, `resolve_string(value, fallback = "", context = null)`.
  - File downloads & transitions: `download_text_file(filename, text, mime = "text/plain;charset=utf-8")`, `download_json_file(filename, value)`, `guarded_transition(callback, options = {})`.
- [`actions.js`](./actions.js): Svelte DOM actions:
  - `use_actions(node, actions)`, `click_outside(node, handler)`, `safe_html(node, content)`, `auto_resize(node, options = {})`.

## Invariants

- **Prototype Pollution Guard** ([`field-path.js`](./field-path.js)): `get_value` and `set_value` reject any dot-path segment present in frozen `UNSAFE_PATH_KEYS` (`__proto__`, `prototype`, `constructor`). `get_value` returns `""` on missing, nullish, non-object, or unsafe paths; `set_value` allocates `{}` for missing or non-object intermediate nodes.
- **Cross-Layer Registry Semantics** ([`registries.js`](./registries.js), [`bridges.js`](./bridges.js)): `state_bridge`, `stream_bridge`, and `stories_bridge` never throw when unregistered (returning `null` / `false` or no-oping). In [`registries.js`](./registries.js), the five noisy state cells (`app`, `runtime`, `simulation_state`, `simulation_log`, `session_driver`) emit `console.warn` at most once per registration lifecycle outside Vitest (`process.env.VITEST`), and `reset_registries_for_testing()` resets all 11 cells including `_snapshot_recorder` (whereas legacy [`bridges.js`](./bridges.js) `reset_bridges_for_testing()` omits `_accessors.record_prompt_token_snapshot`). Fallback `record_prompt_token_snapshot` only overwrites `runtime.last_prompt_token_snapshot` when empty, `snapshot.total >= current.total`, or `current.round !== snapshot.round`.
- **Pseudo-JSON & Present-Field Ceiling** ([`text.js`](./text.js)): `safe_parse_pseudo_json` executes four ordered tiers (flat `[KEY: VALUE]` segments, quoted `"KEY": "VALUE"`, unbracketed uppercase `KEY: VALUE`, and `{ __raw_prose__ }` fallback). `merge_prose_into_field` caps output at `2000` trailing characters, deletes keys on `CLEAR_TOKENS`, clears all `CLOTHING_KEYS` on `[CLOTHING: <clear_token>]`, deduplicates `AGGREGATE_KEYS` case-insensitively, aliases `CLOTHING`/`SHIRT` to the existing key, and preserves `| hide` on overwrite unless `| show` or `| hide` arrives.
- **XML Escaping & Relational Immunity** ([`xml.js`](./xml.js)): `escape_xml` escapes `&`, `"`, `'`, `<`, `>`, `[`, and `]`, whereas `prompt_escape` escapes strictly `<` and `>`. `render_profile_field_block` only compacts `key="..."` rows into attributes, leaving `<RELATION>` rows immune as indented child elements. `normalize_physical_entries` skips `__raw_prose__`, remaps `PHYSICAL_KEY_ALIASES`, and prioritizes canonical keys over alias collisions.
- **Macro Perspective & Cycle Safety** ([`macros.js`](./macros.js)): `expand_entity_macros` guards cyclic entity graphs with a `WeakSet`. `create_relational_context` freezes the context and copied `witnesses` array. `parse_macros` prioritizes explicit `RelationalContext` objects and preserves unrecognized `@tokens` verbatim.
- **Deterministic Detox & Style Hierarchy** ([`detox.js`](./detox.js), [`styles.js`](./styles.js)): `detox_prose` selects replacements deterministically via `stable_pick` and cascades voice resolution `exact_voice -> fallback_voice -> casual -> lyrical -> primal -> clinical`. `resolve_speaking_style` enforces `entity?.speaking_style > narrative_style.speaking_style > "casual"` validated against `SPEAKING_STYLES`. `SOMATIC_MARKER_CAP` is `1`: `lint_narrative_slop` sets `over_cap = somatic_count > 1`, and `cap_somatic_markers` keeps only the earliest somatic marker match. `audit_macro_shape` flags `as_if_overuse` (`> 2`), `every_para_question` (`>= 2` paragraphs), `familiar_closer`, `door_slam_closer`, and `vocabulary_cluster` (`>= 2` distinct `_cached_cluster_words`).
- **Sanitization, URL & Image Validation** ([`html.js`](./html.js)): `sanitize` and `sanitize_to_fragment` enforce `SANITIZE_DOM: true` and `SANITIZE_NAMED_PROPS: true` in browser contexts and return input unmodified when `window` is undefined. `validate_url` permits only `https` (plus `http` when `allow_http` is truthy) and optional `allowed_hosts` suffix matches (without private-IP SSRF filtering). `fetch_web` falls back to native `fetch` only outside Vitest when `hostname` is `localhost`/`127.0.0.1` or `import.meta.env.DEV` is truthy. `validate_image` checks byte limit, MIME allowlist, and 12-byte magic signatures (`JPEG`, `PNG`, `GIF`, `WebP`, `AVIF`).
- **Vector Dimensions, Hashing & CSPRNG** ([`math.js`](./math.js)): `deserialize_embedding`, `quantize_vector_q8`, and `dequantize_vector_q8` default to and enforce `dimensions = 384`. `generate_uuid` and `generate_secure_seed` require `globalThis.crypto` and throw if unavailable; `generate_secure_seed` uses rejection sampling for `lim < 2^32`. `fnv1a_hash` uses 32-bit FNV-1a (`0x811c9dc5`, `0x01000193`) returning `0` for non-strings.
- **ONNX Serialization & Embedding Cache** ([`onnx.js`](./onnx.js), [`embeddings.svelte.js`](./embeddings.svelte.js)): `OnnxMutex` serializes tasks through a `max_concurrency: 1` queue with error isolation. `wait_ort_ready(timeout_ms = 45000)` resolves on timeout rather than rejecting. `load_model` enforces single-flight initialization via `_loading` and sets `wasm.proxy = false` and `wasm.numThreads = 1`. `embed` rejects blank strings and `text.trim().length > 1e6`, enforces `Float32Array` length `EMBEDDING_SPECS.DIMENSIONS`, bounds `_embedding_cache` (`SvelteMap`) with true-LRU eviction at `_max_cache` (`EMBEDDING_SPECS.CACHE_CAPACITY`), and retries once after clearing a failed pipeline. `calculate_semantic_drift` clamps drift strictly to `[0.0, 1.0]`.
- **Queue Isolation & Circuit Breaking** ([`job-queue.js`](./job-queue.js), [`resilience.js`](./resilience.js)): `create_job_queue` enforces `max_concurrency >= 1`, isolates task rejections per job, resolves superseded `{ latest: true }` waiting jobs with frozen `SUPERSEDED_RESULT`, and resolves cancelled waiting jobs with frozen `CLEARED_RESULT`. `CircuitBreaker` transitions `CLOSED -> OPEN` at `failure_threshold`, `OPEN -> HALF_OPEN` when `Date.now() - #last_failure_time > recovery_timeout`, `HALF_OPEN -> CLOSED` at `success_threshold`, and `HALF_OPEN -> OPEN` on any single failure; `reset()` clears `#queue.length = 0` without settling pending queued promises.
- **DOM Actions & Transition Locking** ([`actions.js`](./actions.js), [`ui-helpers.js`](./ui-helpers.js)): `safe_html` passes all content through `sanitize_to_fragment`; `use_actions` sets `data-kinetic="true"` only while at least one active action has truthy `is_kinetic`; `click_outside` ignores detached targets and `defaultPrevented` events. `resolve_px` never injects measurement DOM nodes and guards division by zero in `calc()`. `guarded_transition` prevents re-entrant `document.startViewTransition` calls via `_transition_state.active`, falling back synchronously when unsupported or active.

## Side Effects

- **DOM Mutation, Observation & Global Hardening** ([`actions.js`](./actions.js), [`html.js`](./html.js), [`ui-helpers.js`](./ui-helpers.js)):
  - [`actions.js`](./actions.js): `use_actions` mutates `data-kinetic`; `click_outside` registers a capturing `pointerdown` listener on `document` after a 10ms `setTimeout`; `safe_html` replaces `node` children; `auto_resize` mutates inline `style.height`, redefines `node.value` on `HTMLTextAreaElement`/`HTMLInputElement`, attaches `input`/`change` listeners, `ResizeObserver`, `MutationObserver`, and `requestAnimationFrame` callbacks.
  - [`html.js`](./html.js): `install_environment_hardening` overwrites `window.onerror` and attaches capture-phase `error` and `unhandledrejection` listeners on `window`; `html_to_plain_text` invokes `DOMParser` when available.
  - [`ui-helpers.js`](./ui-helpers.js): CSS resolvers read `getComputedStyle` / `.style` across ancestor elements; `download_text_file` and `download_json_file` create Object URLs, append/click/remove a hidden `<a>` node, and schedule `URL.revokeObjectURL` after 4000ms; `guarded_transition` toggles `options.className` on `document.documentElement.classList`, invokes `document.startViewTransition`, and logs errors via `console.error`.
- **Network, WASM Inference & File Reads** ([`embeddings.svelte.js`](./embeddings.svelte.js), [`html.js`](./html.js)):
  - [`embeddings.svelte.js`](./embeddings.svelte.js): `load_model` dynamically imports `@huggingface/transformers@3.5.2` from `esm.sh`, downloads `Xenova/all-MiniLM-L6-v2` weights, mutates `transformers.env.backends.onnx.wasm`, updates Svelte `$state` runes (`_load_progress`, `_is_loading`, `_model_ready`), and logs warnings/errors to `console`.
  - [`html.js`](./html.js): `fetch_web` performs outbound HTTP/plugin requests via `get_super_fetch_engine()` or `fetch()`; `validate_image` reads slices of `File` bytes; `blob_to_data_url` invokes `FileReader.readAsDataURL`.
- **Module-Level Mutable State & Regexes** ([`registries.js`](./registries.js), [`bridges.js`](./bridges.js), [`detox.js`](./detox.js), [`styles.js`](./styles.js), [`onnx.js`](./onnx.js), [`embeddings.svelte.js`](./embeddings.svelte.js), [`ui-helpers.js`](./ui-helpers.js), [`markdown.js`](./markdown.js), [`text.js`](./text.js)):
  - Mutate module-level registry cells/accessors, rule/cluster caches (`_cached_speaking_rules`, `_cached_anti_ai_rules`, `_cached_cluster_words`), `onnx_mutex` and `_ort_ready` promise, `_embedding_cache` (`SvelteMap`), and `_transition_state.active`.
  - [`markdown.js`](./markdown.js) (`INLINE_TOKEN_REGEX`) and [`text.js`](./text.js) (`ALTERNATION_PATTERN`) use `/g` flags with mutable `lastIndex`.
- **In-Place Mutations, Timers, CSPRNG & System Clock** ([`field-path.js`](./field-path.js), [`embeddings.svelte.js`](./embeddings.svelte.js), [`job-queue.js`](./job-queue.js), [`resilience.js`](./resilience.js), [`onnx.js`](./onnx.js), [`math.js`](./math.js), [`story-export.js`](./story-export.js), [`text.js`](./text.js)):
  - [`field-path.js`](./field-path.js) `set_value` mutates `obj` in place; [`embeddings.svelte.js`](./embeddings.svelte.js) `ensure_embedding` assigns or deletes `vector._embedding`; [`registries.js`](./registries.js) `record_prompt_token_snapshot` mutates `runtime` snapshot fields.
  - [`resilience.js`](./resilience.js) and [`onnx.js`](./onnx.js) schedule `setTimeout` timers, attach `AbortSignal` listeners, and mutate `CircuitBreaker` internal state; [`job-queue.js`](./job-queue.js) schedules microtasks via `Promise.resolve().then(...)`.
  - [`math.js`](./math.js) consumes CSPRNG entropy via `globalThis.crypto`; [`story-export.js`](./story-export.js) and [`text.js`](./text.js) `format_datetime` read local clock/timezone environment; [`text.js`](./text.js) `decompose_story_title` and `resolve_alternations` invoke caller callbacks synchronously.

## Verification

- Run: `npx vitest run src/utils/`
