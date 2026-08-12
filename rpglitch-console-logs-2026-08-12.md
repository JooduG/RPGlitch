# RPGlitch — Console Logs, Stress-Test Session (2026-08-12)

Compiled from the live output iframe's devtools console. These lines were captured by the
test harness (which reads the iframe console after each boot/eval); they are the SAME
messages the browser devtools console would have shown at the time.

If you don't see them in your own console now, that's expected:

- Most of these fire **at page boot** (and during turn processing), and the console only
  shows live output — once the page is reloaded again (or you cleared/left it), the old
  lines are gone. Devtools console is not a persistent log across reloads.
- The generator runs inside a **subdomain iframe** (`https://<generatorPublicId>.perchance.org/...`).
  In Chrome/Edge, iframe console messages DO appear in the main console, but if the
  message is older than your last DevTools open, or the console is filtered
  ("Default levels" hides verbose/warning in some setups), they won't show.
- The harness also loads/refreshes the page for me automatically, so my test runs may
  have replaced a page-load you were watching.

There is no persistent console-capture in the app itself, BUT the app keeps its own
**telemetry log** in IndexedDB (`kv_settings.rpg_telemetry_logs`) — DevMode →
DevTelemetryBlock shows it, and it survives reloads (capped at ~100 entries).

---

## 1. Summary

| Category                                      | Count               | Severity          |
| --------------------------------------------- | ------------------- | ----------------- |
| ort WASM session warnings (benign)            | ~2 per healthy boot | Info              |
| Model download warnings (benign)              | 1–3 per boot        | Info              |
| Kokoro TTS boot failure → Web Speech fallback | 3 of ~9 boots       | **P0 root cause** |
| Embeddings pipeline cascade failure           | 1 boot (turn 22)    | **P0 aftermath**  |
| Watchdog: consolidation overran 255s          | 1                   | Warn (perf)       |
| JS syntax / uncaught errors                   | 0                   | —                 |

Healthy-boot count: most boots came up with the RAG pipeline fully working
(verified 384-dim embeddings). The failures below are the flaky-boot race that the
src fixes address (see `CHANGES.md` in the handoff zip).

---

## 2. Healthy boots — benign ort warnings (appears every boot where the embed runs)

These look like errors in the console but are informational: ORT assigns a few shape ops
to the CPU executor. Harmless.

```
error: [W:onnxruntime:, session_state.cc:1280 VerifyEachNodeIsAssignedToAnEp] Some nodes were not assigned to the preferred execution providers which may or may not have an negative impact on performance. e.g. ORT explicitly assigns shape related ops to CPU to improve perf.
error: [W:onnxruntime:, session_state.cc:1282 VerifyEachNodeIsAssignedToAnEp] Rerunning with verbose output on a non-minimal build will show node assignments.
```

## 3. Healthy boots — model download warnings (benign)

Appears while downloading the embeddings model (`all-MiniLM-L6-v2`) and/or the Kokoro
voice model from the CDN:

```
warn: Unable to determine content-length from response headers. Will expand buffer when needed.
warn: dtype not specified for "model". Using the default dtype (q8) for this device (wasm).
```

## 4. P0 — Kokoro TTS fails at boot → Web Speech API fallback (3 of ~9 boots)

The VoiceEngine's first device candidate is WebGPU. When the page boots, the voice model
and the embeddings model load **concurrently**; if Kokoro's WebGPU session is created
while the shared ort-wasm runtime is still mid-initialization, it fails — and (critical)
this aborts the ort init, so every later backend fails too. Observed on boots where the
voice load won the race:

```
warn: [VoiceEngine] Kokoro failed to load, falling back to Web Speech API: no available backend found. ERR: [webgpu] Error: WebAssembly is not initialized yet.
    at jl (https://esm.sh/onnxruntime-web@1.22.0/es2022/onnxruntime-web.mjs:2:2014)
    at async dd.create (https://esm.sh/onnxruntime-web@1.22.0/es2022/onnxruntime-web.mjs:2:19755)
```

Result of this boot: TTS quietly switches to the browser Web Speech API (works, but
lower quality). **Fixed in src** (`audio.svelte.js` + `embeddings.svelte.js` +
`utils/resilience.js`): the embeddings pipeline now marks the shared ort runtime ready,
and Kokoro waits for that before trying any device.

## 5. P0 aftermath — embeddings pipeline cascade failure (turn 22 boot)

On the boot where the race was lost, the shared ort-wasm was left uninitializable, so the
RAG pipeline then failed repeatedly. This is the silent-degradation mode the stress test
probe #3 targets (semantic retrieval drops to lexical). Repeated lines:

```
warn: [Embeddings] Embed failed for text, clearing pipeline for retry: Created inside Project Tartarus by Elias Voss, he survived a no available backend found. ERR: [wasm] Error: WebAssembly is not initialized yet.
    at jl (https://esm.sh/onnxruntime-web@1.22.0/es2022/onnxruntime-web.mjs:2:2014)
    at async dd.create (https://esm.sh/onnxruntime-web@1.22.0/es2022/onnxruntime-web.mjs:2:19755)
warn: [Embeddings] Proxy WASM pipeline init failed, falling back to main thread: no available backend found. ERR: [wasm] Error: WebAssembly is not initialized yet.
...
error: [Embeddings] Failed to load model: no available backend found. ERR: [wasm] Error: WebAssembly is not initialized yet.
...
warn: [Embeddings] Embed retry failed: no available backend found. ERR: [wasm] Error: WebAssembly is not initialized yet.
...
```

(`[Embeddings] Embed failed for text, clearing pipeline for retry: ...` appeared for the
entity memories and user turns being embedded; the "clearing pipeline for retry" text
was the start of the embedding input.)

## 6. Perf warning — post-turn consolidation overrun (once, after the turn-17 forge)

The Memory Forge consolidation ran past the watchdog's 255s budget, so it force-released
the intent lock (turn submission was blocked during the forge — a few of my test sends
were silently dropped in that window and had to be resent):

```
warn: [Watchdog] Post-turn consolidation overran 255s — releasing intent lock. {"phase":"idle","intent_active":true}
```

## 7. Diagnostic-harness logs (not the app)

These came from my own eval scripts (manual ort/TTS probes), not the generator:

```
warn: Unable to determine content-length from response headers. Will expand buffer when needed.   (model fetch in my probe)
error: [W:onnxruntime:, ...] Some nodes were not assigned to the preferred execution providers ...   (ort session in my probe)
```

Results of those probes: Kokoro TTS synthesized ~2.1s of audio (51000 samples @ 24 kHz) on
WebGPU when the ort runtime was already initialized, and embeddings returned 384-dim
Float32Array vectors — the "both pipelines work when the boot race doesn't break ort"
baseline.

---

## 8. What the app logs itself (survives reloads)

The app writes its own telemetry to IndexedDB (see DevTelemetryBlock / DevMode). Entries
from this session included:

```
[GameMaster] Context hydrated. Physics resolved. Entering DIRECTOR_TURN...
[GameMaster] Routing to LLM (Character Pass)...
LLM synthesizing turn N...
Shield scanning causality and physics...
[TemporalEngine] Forging 8 turns into Historical Archive...
Recording memory...
Turn N complete — user×N, fractal×N, ai×N.
Generation complete.
```

No `Director JSON truncated — retrying with terse directive...` and no
`[GameMaster] Director degraded — applying minimal-mutation fallback.` occurred in 29
rounds. One `Reply truncated — regenerating with completion directive...` appeared in the
early turns (turn 6, before this continuation), with a successful regeneration.

---

## 9. If you want to watch these live yourself

1. Open DevTools (F12) → Console.
2. Ensure the console is scoped to the generator iframe: use the dropdown next to
   "Filter"/the context selector and pick the `perchance.org` frame, or check
   "Preserve log" then reload the generator's output tab.
3. Clear the console, then reload — you'll see the boot warnings (sections 2–4).
4. Trigger a turn — watch `[GameMaster]` messages in the DevTelemetryBlock (bottom-left
   DevMode panel), which is the reload-proof view.

Verified on the current page after this compilation: boot clean, story 3 restored at
round 28, embeddings returning 384-dim vectors.
