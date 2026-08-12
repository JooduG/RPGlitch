# RPGlitch — Session Handoff (2026-08-12, stress-test session)

Unzip over the repo root. Then `npm run deploy:prepare` and paste `dist/index.html` into the Perchance code panel.

## What changed vs GitHub main (4 files, all in `src/`)

### 1. `src/intelligence/embeddings.svelte.js` — ort pin + serialized pipeline init

- Pins esm.sh to **`onnxruntime-web@1.22.0` stable** (esm.sh's default `1.22.0-dev.20250409` cannot init WASM inside the Perchance iframe:n"WebAssembly is not initialized yet" on every backend, which silently degradedn RAG to lexical-only). `1.21.0` is NOT a drop-in: it lacks the `_OrtGetInputName` binding kokoro-js needs.
- The transformers.js **pipeline construction is now wrapped in `onnx_mutex.run()`** so the shared ort-wasm init is serialized against kokoro's load, and on success it calls the new `mark_ort_ready()` signal (below).

### 2. `src/media/audio.svelte.js` — same ort pin + boot-race fix

- Same `?deps=onnxruntime-web@1.22.0` pin on the `kokoro-js@1.2.1` import.
- `#load_model_inner` now **awaits `wait_ort_ready()`** before attempting any device. Root cause this fixes: at boot the VoiceEngine and the embeddings pipeline load **concurrently**, and when kokoro's webgpu-first session fired while ort-wasm was still mid-initialization, it aborted the shared ort init and failed EVERY backend for the rest of the page life (embeddings included — confirmed live with a full cascade of "no available backend found" errors). Once gated, kokoro's webgpu candidate loads and synthesizes fine (verified).

### 3. `src/utils/resilience.js` — ort-readiness gate

- New one-shot `mark_ort_ready()` / `wait_ort_ready(timeoutMs)` next to the existing `onnx_mutex`. Embeddings signals readiness after its pipeline constructs; kokoro holds until then (45s timeout fallback → Web Speech API).

### 4. `src/intelligence/prompts.js` — mandatory standing-agenda rewrite

- `MEMORY_JSON_SCHEMA.future_consolidated` for all three targets is now REQUIRED (removed the "or empty string if unchanged" escape hatch the LLM used to keep stale agendas; explicitly forbids echoing the old text verbatim).
- `render_memory` TASK: `future_consolidated` is mandatory for every active entity; resolved prophecies/threats must be dropped and replaced by their aftermath; JSON budget raised 1400 → 1800 chars with cut-order guidance that protects the agenda (cut eternal/vector_append before it).
- Why: the stress test showed the forge's LLM skipping the agenda rewrite under the old budget (post-climax "eclipse" stayed stale for a forge cycle).

## `index.html` (Perchance shell) — NOT part of the repo build

The live deployed bundle has been **vault-patched** with the same two `?deps=onnxruntime-web@1.22.0` pins (both the `transformers@3.5.2` and `kokoro-js@1.2.1` esm.sh URLs inside the base64 vault — each occurs exactly once). This patched `index.html` is included so the live Perchance page matches these fixes TODAY. The repo's own `src/index.html` template is untouched. After you `deploy:prepare` the 4 src changes, the freshly built `dist/index.html` supersedes this patch (it will already contain the pins). Do NOT paste both.

## Not fixed in src (observations only)

- Boot-model race above is fixed in src; the _vault-patched_ live bundle still has it (a reload can still flip kokoro to Web Speech fallback). See #2.
- Post-turn consolidation regularly overruns the 255s watchdog ("Post-turn consolidation overran 255s — releasing intent lock"), which blocks turn submission during the forge. Functional, but slow.
- Library panel can show "No stories yet.." after a reload even when stories exist in IndexedDB (list only refreshes when the control panel opens / `stories_version` bumps; resume still works via the story card when present).
