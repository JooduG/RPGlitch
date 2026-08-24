---
id: track-1-director-quick-shot-2026-08-24
title: "Track 1: Director Quick Shot, Unified Next Action & Latency Instrumentation"
type: feature
status: proposed
created_at: 2026-08-24
author: Strategy Architect
dependencies: []
---

## Track 1 — Director Quick Shot, Unified Next Action & Latency Instrumentation

> **Goal**: Minimize perceived turn latency from player action to first token stream ($\le 300\text{ms}$ p50 quick shot) by consolidating Director dispatch into a unified `next_action`, moving signature colors to Genesis, expanding `keywords` (1–3 somatic/visual triggers), upgrading `directors_note` (1–3 lines), and offloading all relational/promotion/state persistence to the rolling **Back Shot**.  
> **Economic Context**: Perchance LLM calls are free. We optimize for perceived foreground snappiness and non-blocking concurrency.

---

## 1. Context & Architectural Rationale

The user-perceived cost of a turn equals the time from hitting **Send** to the character prose finishing.

The Director is strictly on the critical path: its output (`next_action`, `keywords`, `dynamics_deltas`, `directors_note`) must land _before_ the character prompt is built, because the prose depends on somatic tells from [`src/data/definitions/triggers.js`](../../src/data/definitions/triggers.js) and the reactive in-scene NPC roster.

### Turn Execution Models

```text
NORMAL ROUND (95% of rounds):
[1. Director Quick Shot] (Fast 4-Field JSON) ──► [2. Foreground Character Stream] (Glitch/NPC)
                                                        │
                                                        └──► [3. Back Shot Stream] (Single-Entity Rolling Worker)

GENESIS ROUND (When Director sets next_action: "GENESIS"):
[1. Director Quick Shot] ──► [2. Genesis Rich Synthesis] (Selects Palette Color) ──► [3. Foreground Character Stream]
                                                                                               │
                                                                                               └──► [4. Back Shot Stream & Portrait]
```

1. **Normal Rounds ($\sim 95\%$ of turns)**: Accelerate the **Director Quick Shot** ($\le 300\text{ms}$ p50) and immediately start streaming the existing character/NPC prose while slow-tail persistence side-effects run in the **Back Shot**.
2. **Genesis Rounds (Character Spawning)**: When the Director requests an entirely new character (`next_action: "GENESIS"`), the round intentionally executes 1 extra LLM call (`rich_character_synthesis`) inline so the newly born character's Twin-Cylinder schema and signature color are fully minted before their first dialogue stream begins. Background tasks (like portrait diffusion) fire asynchronously.
3. **Prompt Token Pruning**: Strip `<AVAILABLE_SIGNATURE_COLORS>` completely from the Director prompt (~150–200 tokens saved every turn). The palette is provided exclusively to the dedicated Genesis prompt.

> [!TIP]
> **Performance Target**: Normal round quick-shot resolution in **$\le 300\text{ms}$ (p50)** with a **p95 budget of $\le 600\text{ms}$** (verified via active instrumentation).

---

## 2. Current Verified State

- **Director Call**: [`src/intelligence/kernel.js:634-703`](../../src/intelligence/kernel.js)
  - Full director prompt compilation $\rightarrow$ `director_call(false)` $\rightarrow$ `parse_director_json`.
  - JSON truncation triggers a **terse retry** (`director_call(true)`), incurring up to $2\times$ LLM latency.
  - Still failing $\rightarrow$ `synthesize_director_fallback()`, then `normalize_director_data()`.
  - **Inline Blocking Side-Effects**: `_apply_in_scene_change`, `_apply_promotions`, `_apply_genesis`, and `_apply_relationships` execute synchronously before the character call.
- **Stage Spotlight Invariant**: `_apply_in_scene_change` updates `runtime.in_scene_npc_ids` $\rightarrow$ consumed by `context.js:165` to construct the character prompt's roster. **In-scene choreography MUST remain foreground.**
- **Instrumentation**: No director timing benchmarks currently exist.

---

## 3. Deep-Dive Technical Design

### 3.1 High-Resolution Director Instrumentation

- Wrap the director call (and retries) with high-resolution timers.
- Write `runtime.last_director_ms` and a rolling ring buffer `runtime.director_ms_pool` (~50 samples) for p50/p95 metrics.
- Surface metrics in `TelemetryCard.svelte` and dev mode.

### 3.2 Streamlined Director Quick Shot Contract

```json
{
  "next_action": "AI_CHARACTER",
  "keywords": ["vulnerability", "defiance", "cinematic_shot"],
  "directors_note": "Lower your defensive posture slightly as you admit the truth.\nLook away toward the frozen blast door.",
  "dynamics_deltas": { "intensity": 10, "openness": 15 }
}
```

- **`next_action`** _(Unified Router Key)_:
  - `"AI_CHARACTER"`, `"NPC_<ID>"`, `"USER_PERSONA"`, `"FRACTAL"` $\rightarrow$ Delegates active speaker.
  - `"GENESIS"` $\rightarrow$ Diverts to foreground Genesis Rich Synthesis.
  - `"EPILOGUE_CONCLUDED"`, `"EPILOGUE_COLLAPSED"` $\rightarrow$ Triggers epilogue conclusion state.
- **`keywords`** _(1–3 items)_:
  - Combines somatic archetypes (`shame`, `vulnerability`, `fear`) and visual triggers (`cinematic_shot`, `portrait_focus`).
- **`directors_note`** _(1–3 lines)_:
  - 1–3 lines of evocative somatic acting instructions, subtext, or staging directives for the upcoming speaker.
- **`dynamics_deltas`**:
  - Physics slider nudges.
- **Offloaded to Back Shot (Track 2)**:
  - Relational Mesh (`relationships: [...]`)
  - NPC Tier Promotions (`promotions: [...]`)
  - Entity State Appends (`state_append: { physical, non_physical }`)
  - Vector Lore Consolidation (`past`, `future`, `eternal`, `present`)

### 3.3 Deferred Persistence Pipeline & Mutex

- Coordinate with Track 2's Back Shot worker: if the user sends an action while the Back Shot is in-flight, the Back Shot pauses gracefully.
- **Keep `_apply_in_scene_change` and Genesis creation synchronous** to maintain character prompt roster integrity.

---

## 4. Tactical Blueprint & Phasing

### Phase 1: High-Resolution Quick Shot Instrumentation & Mutex Setup

- [ ] `task-1.1`: **`RED`** Write unit tests in `src/intelligence/kernel.test.js` asserting director timing capture on `runtime.last_director_ms` and `runtime.director_ms_pool` (ring buffer).
- [ ] `task-1.2`: **`GREEN`** Implement high-res timing in `src/intelligence/kernel.js` around the quick shot and retries; expose rolling p50/p95 in `runtime.svelte.js`.
- [ ] `task-1.3`: **`GREEN`** Create lightweight `generation_mutex` in `src/state/runtime.svelte.js` to coordinate foreground vs background LLM calls.

### Phase 2: Quick Shot Schema Streamlining (`next_action`, `keywords` 1-3, `directors_note`)

- [ ] `task-2.1`: **`RED`** Add unit tests in `src/intelligence/director.test.js` asserting normalization of `next_action`, `keywords` (1–3 items), `directors_note` (1–3 lines), and `dynamics_deltas`.
- [ ] `task-2.2`: **`GREEN`** Update `src/intelligence/prompts.js` to remove `<AVAILABLE_SIGNATURE_COLORS>` from the Director prompt, wire `directors_note` instructions (1–3 lines), and support 1–3 keywords from `<AVAILABLE_KEYWORDS>`.
- [ ] `task-2.3`: **`GREEN`** Update `src/intelligence/director.js` normalizer for unified `next_action` routing (`speaker`, `genesis`, `epilogue`).

### Phase 3: Genesis Inline Branch & Back Shot Pipeline Setup

- [ ] `task-3.1`: **`RED`** Add test verifying `_apply_genesis` executes synchronously when `next_action === "GENESIS"` (passing signature color palette to genesis prompt) before speaker compilation.
- [ ] `task-3.2`: **`GREEN`** Wire persistence offloading and round-freshness hooks for the Back Shot stream in `src/intelligence/kernel.js`.

---

## 5. File Changes

- [`src/intelligence/kernel.js`](../../src/intelligence/kernel.js) — Timing instrumentation, `next_action` routing, genesis branch routing, mutex lifecycle.
- [`src/intelligence/prompts.js`](../../src/intelligence/prompts.js) — Purge signature colors from Director quick shot, update `directors_note` and `keywords` instructions, add color palette to genesis prompt.
- [`src/intelligence/director.js`](../../src/intelligence/director.js) — Normalizer for `next_action`, `directors_note`, and `keywords`.
- [`src/state/runtime.svelte.js`](../../src/state/runtime.svelte.js) — `last_director_ms`, `director_ms_pool`, generation mutex state.
- [`src/intelligence/context.js`](../../src/intelligence/context.js) — In-scene synchronous verification.

---

## 6. Verification Gate & Acceptance Criteria

- [ ] Normal round p50 director quick shot $\le 300\text{ms}$, p95 $\le 600\text{ms}$ (measured from active instrumentation).
- [ ] Director prompt tokens reduced by $\ge 150$ tokens per turn (signature color removal).
- [ ] Genesis rounds successfully synthesize new NPC schema + signature color and pass it directly to the foreground character stream.
- [ ] `directors_note` (1–3 lines) and `keywords` (1–3 items) inject cleanly into the speaker's `<TASK>` block.
- [ ] Automated tests: `npm run test:unit` passes with 0 regressions.
- [ ] Production build: `npm run build`
