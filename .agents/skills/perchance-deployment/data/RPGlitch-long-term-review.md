# RPGlitch — Dual-Track Implementation Review & Narrative Stress Test Protocol

> **System Designation**: Sovereign AI Roleplay Engine
> **Protocol Purpose**: Test the **implementation quality** of the two active tracks — `track-director-expansion-2026-08-14` (Director Expansion) and `track-npc-expansion-2026-08-14` (NPC & Living World) — via two independent passes: **(1)** a static code audit of every track deliverable against its specified contract, and **(2)** a live 25–30 turn narrative stress test probing each feature at runtime.
> **Audit Anchor**: 2026-08-16 (baseline: 45 test suites / 633 unit tests)
> **Rules of Evidence**: Every verdict below must cite a file path, symbol, test file, or observed runtime behavior. Do **not** trust the track files' checkboxes — they lag the code (several "partial/unchecked" items are shipped; see Part 3).

---

## Part 1 — Static Code Audit: `track-director-expansion-2026-08-14`

Audit each deliverable against the track blueprint. Fill the **Verdict** column (`PASS` / `PARTIAL` / `FAIL` / `N/A`) with a one-line justification.

| #   | Track Deliverable (spec)                                                           | Expected Artifact                                                                                                                    | Verified Artifact (2026-08-16)                                                                                                                                                                                                                                                                                         | Unit Coverage                                                                                                 | Verdict          |
| :-- | :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :--------------- |
| 1.1 | Parallel job queue (latest-pending overwrite, error isolation, single DB pipeline) | `create_job_queue()` in `src/utils/job-queue.js`                                                                                     | `create_job_queue` exported with `run()` / `is_busy()` / `clear()`; single-runner serialization                                                                                                                                                                                                                        | `job-queue.test.js` (9 tests: worker execution, latest-pending, error isolation)                              |                  |
| 1.2 | 12-archetype static somatic/trauma registry                                        | `src/data/definitions/somatic-triggers.js` exporting `SOMATIC_REGISTRY`                                                              | **Renamed** to `src/data/definitions/triggers.js`; `SOMATIC_REGISTRY` (12 archetypes: shame, fear, vulnerability, betrayal, abandonment, emotional_neglect, defiance, intimacy, grief, dominance, deception, dysregulation) each with `tells` + `directive`                                                            | `triggers.test.js` (13 tests)                                                                                 |                  |
| 1.3 | Dynamic style keywords/motifs from narrative styles                                | `keywords` exported from `narrative-styles.js`                                                                                       | `STYLE_MOTIF_REGISTRY` (23 motifs) in `triggers.js`, resolved alongside static archetypes by `resolve_somatic_directives()`                                                                                                                                                                                            | `triggers.test.js` + `prompts.test.js` (`<AVAILABLE_KEYWORDS>` lists the 12 static archetypes)                |                  |
| 2.1 | Expanded Director JSON schema + `<AVAILABLE_KEYWORDS>` pool                        | `render_director()` emits `speaker`, `keywords`, `story_status`, mutations                                                           | `render_director()` in `src/intelligence/prompts.js` emits the full schema + `<AVAILABLE_KEYWORDS>`; `STORY_STATUS_VALUES = ["IN_PROGRESS", "CONCLUDED", "COLLAPSED"]`                                                                                                                                                 | `prompts.test.js` (schema, `<AVAILABLE_KEYWORDS>`, `in_scene_change`, `promotions`, Stage Spotlight schema)   |                  |
| 2.2 | Somatic directive resolver + injection into character & narrator                   | `resolve_somatic_directives(keywords, active_style)`; `<SOMATIC_DIRECTIVES>` injected into `render_character()` / `build_narrator()` | `resolve_somatic_directives` + `render_somatic_directives_xml` + `build_somatic_directives_block` in `triggers.js`; injected via `build_somatic_directives_block` into character prompt; **omitted** from prologue/epilogue bookends                                                                                   | `prompts.test.js` (injects when keywords chosen; omits when none; bookends free)                              |                  |
| 2.3 | Director parser + defensive fallbacks                                              | `parse_director_json()` in `kernel.js`                                                                                               | **Moved** to `src/intelligence/director.js`: `parse_director_json`, `normalize_director_data` (defaults: `speaker:"ai"`, `keywords:[]`, `story_status:"IN_PROGRESS"`), `synthesize_director_fallback` (minimal-mutation on unparsable JSON), `scrub_state_mutations` (detox-screens Director state before application) | `director.test.js` (21 tests) + `kernel.test.js` (invalid-JSON fallback keeps entity memory alive)            |                  |
| 3.1 | Dynamic speaker routing to any entity engine                                       | `execute_turn()` dispatches `ai` / `fractal` / `npc:<id>`                                                                            | `kernel.execute_turn()` resolves via `normalize_speaker` → `resolve_speaker_engine` (`character` / `narrator` / `npc`); fractal → `prompt_builder.build_scene_narrator_prompt()`; NPC → `build_npc_prompt()`; missing NPC falls back to AI character with a log                                                        | `director.test.js`, `prompts.test.js` (scene-narrator prompt), `kernel.test.js`                               |                  |
| 3.2 | Parallel background workers through the queue                                      | Memory Forge / visual synthesis / Dexie checkpoints via `job_queue.run()`                                                            | **PARTIAL**: only ghost-row sweeps run through the queue; Memory Forge, visual beats, and checkpoints remain direct fire-and-forget calls                                                                                                                                                                              | `job-queue.test.js`; kernel comment documents the queue's current scope                                       |                  |
| 3.3 | Reactive generating-entity UI state                                                | `status.generating_entity_type/name/avatar/color` bound to UI                                                                        | `status.svelte.js` exposes `generating_entity_type/name/avatar/color` + `set_generating_entity()` / `clear_generating_entity()`                                                                                                                                                                                        | `runtime.test.js` / UI smoke (Storymode thinking indicator)                                                   |                  |
| 4.1 | Prologue / Epilogue component split                                                | `Prologue.svelte` + `Epilogue.svelte` replace unified component                                                                      | Both exist under `src/ui/message/`; `Epilogue.svelte` renders Satisfy cursive header, outcome badge, final entity trio, action deck                                                                                                                                                                                    | `story-export.test.js` (export), UI smoke                                                                     |                  |
| 4.2 | Auto epilogue dispatch on resolution                                               | `story_status === "CONCLUDED"                                                                                                        | "COLLAPSED"`triggers`execute_epilogue()`                                                                                                                                                                                                                                                                               | `kernel.js` auto-dispatch with double-dispatch guard; both branches handled; non-resolution statuses continue | `kernel.test.js` |
| 4.3 | Epilogue action deck wiring                                                        | `handle_return_to_storyboard()` + `handle_export_story()`                                                                            | Wired in `Epilogue.svelte` (returns to storyboard via `app.set_view`, downloads `.md` via `export_story_markdown`)                                                                                                                                                                                                     | UI smoke                                                                                                      |                  |
| 4.4 | Input pacing calibration + dominant turn hooks                                     | Length matches input rhythm; decisive turn-end hook                                                                                  | Pacing guidance in character TASK; literal `[Statement]/[Action]/[Hover]/[Silence]` brackets **deliberately removed** in favor of freeform dominant-hook guidance                                                                                                                                                      | `prompts.test.js` (pacing-calibration guidance present)                                                       |                  |
| 4.5 | Macro-Quest Progression & Chapter Forking                                          | Fractal `future` milestone check → archive chapter → birth evolved chapter entity                                                    | **NOT IMPLEMENTED**. `entity.future` remains a single consolidated prose field; no chapter/fork machinery exists                                                                                                                                                                                                       | N/A                                                                                                           |                  |

**Track A static summary** (fill): `__` of 13 deliverables PASS; known gaps: Macro-Quest forking (4.5) unimplemented, background job queue (3.2) partial.

---

## Part 2 — Static Code Audit: `track-npc-expansion-2026-08-14`

| #   | Track Deliverable (spec)                                             | Expected Artifact                                                                                                                               | Verified Artifact (2026-08-16)                                                                                                                                                                                                                                                                                                                                                                    | Unit Coverage                                                                                   | Verdict |
| :-- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------- | :------ |
| 1.1 | World-roster schema: `role_tier`, `is_wanderer`, `relationships`     | `normalizer.js` defaults + validation                                                                                                           | `normalize()` supports `role_tier` (defaults to tier 1 when absent/invalid), `is_wanderer`, `relationships: string[]`                                                                                                                                                                                                                                                                             | `normalizer.test.js` (tier defaults)                                                            |         |
| 1.2 | Story schema `npc_ids`                                               | story normalization + repository schema                                                                                                         | Story records carry `npc_ids`; runtime world-cast hydration populates `active_npcs` from `npc_ids`, clears when absent                                                                                                                                                                                                                                                                            | `runtime.test.js` (world-cast hydration suite)                                                  |         |
| 1.3 | In-scene roster state + presence badges                              | `in_scene_npc_ids` reactive set; UI badges                                                                                                      | `runtime.in_scene_npc_ids`; `Storymode.svelte` derives `in_scene_npcs` presence list from it                                                                                                                                                                                                                                                                                                      | `runtime.test.js` (stage moves persist through the setter)                                      |         |
| 2.1 | Compact roster + relational prompt blocks                            | `<ROSTER>` (1-line signatures), `<SCENE_ROSTER>`, `<RELATIONAL_MESH>`, `<ENTITY_CONVERGENCE_LAW>`, `<EPISTEMIC_RULES>`, `<CURRENT_STORY_STATE>` | All emitted from `prompts.js` (`render_roster_xml` w/ tier+stage tags, scene roster, relational mesh, `ENTITY_CONVERGENCE_LAW_XML`, `EPISTEMIC_ROSTER_RULES_XML`, `CURRENT_STORY_STATE`); active trio excluded from cast                                                                                                                                                                          | `prompts.test.js` (ROSTER tiers, roster/mesh/governance, CURRENT_STORY_STATE in character task) |         |
| 2.2 | Prompt unit tests for graph rendering, roster index, epistemic rules | tests in `prompts.test.js`                                                                                                                      | Present (compact ROSTER with tier + stage presence; scene roster; relational mesh; governance laws)                                                                                                                                                                                                                                                                                               | `prompts.test.js`                                                                               |         |
| 2.3 | In-scene RAG salience 1.3x                                           | `compute_relevance()` in-scene multiplier                                                                                                       | `IN_SCENE_SALIENCE_BOOST = 1.3` in `temporal.js`, applied when `in_scene=true` through `score()` / `score_async()` / `format()`                                                                                                                                                                                                                                                                   | `temporal.test.js` ("applies the 1.3x in-scene salience boost to on-stage memories")            |         |
| 3.1 | Director NPC delegation → dedicated NPC persona prompt               | `speaker:"npc:<id>"` → `build_npc_prompt`                                                                                                       | `normalize_speaker` resolves `npc:<id>`; kernel loads the cast NPC, `build_npc_prompt()` renders third-person limited present-tense persona + gated in-scene `<MEMORIES>`; missing NPC falls back with warning                                                                                                                                                                                    | `director.test.js`, `prompts.test.js` (NPC prompt), `kernel.test.js`                            |         |
| 3.2 | Stage Spotlight choreography                                         | Director `in_scene_change` enter/exit mutates `in_scene_npc_ids`                                                                                | `normalize_in_scene_change` (clean `enter`/`exit` lists) + `kernel._apply_in_scene_change` applied before mutations; off-scene NPCs drop to stasis (no dynamics eval)                                                                                                                                                                                                                             | `director.test.js`, `runtime.test.js`, `kernel.test.js`                                         |         |
| 3.3 | Rich Genesis & promotion engine                                      | `spawn_npc` / Director `genesis` + `promotions` with rich Twin-Cylinder synthesis                                                               | `kernel.spawn_npc(bridge, draft)` invokes `sort_into_profile()` with scene context to synthesize full physical brackets (`eternal.physical`), personality (`eternal.non_physical`), temporary state (`present`), standing agenda (`future`), and origin-protected memories (`past`), with automatic background portrait dispatch (`visual_engine.generate`) and resilient draft fallback on error | `normalizer.test.js`, `kernel.test.js` (rich genesis synthesis + fallback), `director.test.js`  |         |
| 4.1 | Speaker attribution parser                                           | `split_speech_by_speaker(text, active_roster)`                                                                                                  | Implemented in `src/media/speech.js`; maps quoted dialogue to roster voices, unquoted prose to narrator voice                                                                                                                                                                                                                                                                                     | `audio.test.js` (quoted-span/attribution sentence splitting)                                    |         |
| 4.2 | Multi-voice Kokoro dispatch                                          | sequential per-voice buffer chaining                                                                                                            | `Audio.speak_with_voices(text, active_roster)` with sequential chunk chaining + per-entity voice toggles; **streaming live sentences still use single `selected_voice`** (`queue_stream_sentence`)                                                                                                                                                                                                | `audio.test.js` (voice resolution, cadence rates)                                               |         |
| 5.1 | In-scene NPC presence badges                                         | Storymode + Feed render presence                                                                                                                | `Storymode.svelte` renders in-scene NPCs via derived list; **Feed-level badge rendering unverified**                                                                                                                                                                                                                                                                                              | UI smoke                                                                                        |         |
| 5.2 | Entity Card / Profile NPC viewing                                    | secondary NPC profile in read/edit mode                                                                                                         | `EntityCard.svelte` / `Profile.svelte` structurally support any cast entity; **runtime-unverified for delegated NPCs**                                                                                                                                                                                                                                                                            | UI smoke                                                                                        |         |

**Track B static summary** (fill): `__` of 12 deliverables PASS; primary soft spots: multi-voice TTS applies to finished-turn narration only (4.2), Feed badges (5.1) and NPC profile viewing (5.2) unverified at runtime.

---

## Part 3 — Known Gaps & Deliberate Scope Decisions (weighting baseline)

These are established before testing so verdicts are fair. Do not report them as regressions unless the test reveals _additional_ breakage:

1. **Macro-Quest / Chapter Forking (Track A goal 5)** — not implemented; `future` is a single prose standing agenda. The agenda _does_ get rewritten each forge cycle and post-climax, so verify refresh, not chapter forking.
2. **Background job queue coverage (Track A 3.2)** — only ghost-row sweeps route through `create_job_queue`; Memory Forge / visual beats / checkpoints are direct fire-and-forget. Verify the queue's error isolation on sweeps; do not expect forge through the queue.
3. **Literal hook brackets removed (Track A 4.4)** — `[Statement]`/`[Action]`/`[Hover]`/`[Silence]` were deliberately replaced with freeform dominant-hook guidance. Judge _decisive endings_, not bracket labels.
4. **NPC Genesis Synchronous Rich Synthesis** — when the Director LLM emits `"genesis"` (name, description, registry `signature_color`), `spawn_npc()` synchronously executes `sort_into_profile()` with scene atmosphere before turn generation, synthesizing full `[KEY: VALUE]` physical appearance, personality, state of mind, standing agenda, and origin memories; fires background portrait generation (`visual_engine.generate`); and gracefully falls back to the raw draft if synthesis fails. The Entity Convergence Law mandates reusing existing `<ROSTER>` entities when possible.
5. **Story NPCs start on-stage** — after `sync()` all story NPCs are in `in_scene_npc_ids`; the Director moves them off via `in_scene_change.exit`. Judge the choreography, not the initial placement.
6. **Live-sentence TTS is single-voice** — streaming `queue_stream_sentence` uses `selected_voice`; multi-voice `speak_with_voices` applies to finished-turn narration only.
7. **Track files are stale** — `track-npc-expansion` checkboxes show most items unchecked/"partial" even though the code ships them, and Track A cites renamed files (`somatic-triggers.js` → `triggers.js`, parser in `kernel.js` → `director.js`). The audit targets **code reality**, not the checklist text.

---

## Part 4 — Runtime Narrative Stress-Test Protocol (25–30 turns)

Act as a realistic human user inside the chat payload (1–3 sentence turns, never break character) and an unforgiving auditor behind the scenes. Probes below are mapped to the two tracks; each carries an explicit **Audit Gate**.

### Track A Probes (Director Expansion)

1. 🎭 **Speaker Delegation — Fractal & NPC (T9, T17)**: Shift focus to pure environmental investigation, then to a secondary NPC present in the scene.
   - _Gate_: Director emits `speaker:"fractal"` → scene-narrator narration (third-person omniscient, world senses); and `speaker:"npc:<id>"` → the NPC speaks in third-person limited present tense, owning only its own voice. The generating thinking indicator (name / avatar / signature color) switches to the delegated entity each time.
2. 🫀 **Somatic Directives & Masking vs. Leakage (T11–T15)**: Confront the AI character's core trauma (e.g., question Lord Benedict Silvers on his disgraced oath).
   - _Gate_: Director payload shows 1–2 `<AVAILABLE_KEYWORDS>` (e.g. `shame`, `deception`) selected and `<SOMATIC_DIRECTIVES>` injected; the prose demonstrates verbal composure contradicted by involuntary physical tells — and zero banned trope leakage (detox pass).
3. ⏱️ **Input Pacing Calibration & Decisive Hooks (T3, T13, T23)**: Alternate terse commands ("Draw your sword.") and expansive prose; end some turns with passive silence.
   - _Gate_: Response length mirrors input rhythm; terse input yields staccato structure, silence yields escalated direct probing; every turn closes on a decisive hook (statement / action / hovered beat / deliberate silence), never generic "What shall we do next?"
4. ⚡ **Background Job Queue Latency (T4, T8, T12, T16)**: Trigger ghost-sweep conditions (drop an image beat) mid-turn and watch telemetry.
   - _Gate_: Background sweep completes with **zero added turn latency** and **zero UI stasis**; a failed background worker never interrupts the streaming narrative or composer unlock.
5. 📜 **Auto Epilogue on Resolution (T24–T28)**: Drive the story quest to victory (`CONCLUDED`) — then run a second session to `COLLAPSED`.
   - _Gate_: The engine auto-dispatches the epilogue exactly once per resolution (no double-dispatch); `Epilogue.svelte` shows Satisfy cursive title, outcome badge (`✨ STORY CONCLUDED` / `💀 STORY COLLAPSED`), final entity trio, and the action deck (`Return to Storyboard`, `Export Story (.md)`).

### Track B Probes (NPC & Living World)

6. ✨ **NPC Genesis & Rich Creation Lifecycle (T6, T16)**: Introduce a scenario requiring an entirely new character where no existing `<ROSTER>` member applies (e.g. entering an unfamiliar black market and asking for an underground courier).
   - _Gate_: The Director emits a valid `"genesis"` payload in JSON (name + one-line description + `signature_color` strictly from `<AVAILABLE_SIGNATURE_COLORS>`). The Kernel invokes synchronous character profile sorting (`sort_into_profile()`) with scene context, generating full Twin-Cylinder brackets (`eternal.physical`, `eternal.non_physical`, `present.physical`, `present.non_physical`, `future`, `past`), creates the entity with `role_tier: 1` (or 2), persists it to Dexie, puts the new NPC on-stage (`in_scene_npc_ids`), and dispatches a background portrait request using the rich physical description without adding turn latency.
7. 🧩 **Entity Convergence Law (T7, T18)**: Reference a doctor in a clinic scene where Dr. Elias Tariq is in the roster.
   - _Gate_: The Director/AI reuses the existing cast member — zero invented duplicate doctors; `<ROSTER>` signatures remain compact and the active trio is never listed as a summonable stranger.
8. 🎪 **Stage Spotlight Enter/Exit & Off-Screen Stasis (T8, T14, T21)**: Move the scene away from an NPC, then return.
   - _Gate_: `in_scene_change.exit` removes the NPC from `in_scene_npc_ids` (dynamics freeze — no token/compute on off-screen entities); `enter` rehydrates them with in-scene salience; no out-of-nowhere off-screen action.
9. 🎭 **Director NPC Dialogue & Direct Interaction (T9, T17)**: Engage in direct dialogue with the newly created or existing on-stage NPC.
   - _Gate_: The Director emits `speaker: "npc:<id>"`. The storyteller engine builds `build_npc_prompt()`, delivering a third-person limited present-tense response in the NPC's distinct voice. The UI thinking indicator (name, avatar, and signature color) matches the NPC.
10. 🕸️ **Relational Mesh Mutation (T10, T19)**: Engineer a betrayal, rescue, or debt with the NPC.
    - _Gate_: Director mutates `relationships` strings in the turn pass (`"[Source] → [Target]: [Dynamic]"`); `<RELATIONAL_MESH>` reflects the shift in subsequent prompts; relational graph updates persist across turns.
11. 🧠 **In-Scene Memory Salience 1.3x (T5 → T20)**: Plant a specific fact with an on-stage NPC, exit and return, then reference it.
    - _Gate_: The NPC recalls the on-stage event with sharp fidelity (1.3x in-scene boost active); off-screen NPCs remain ignorant of it.
12. 🛡️ **Naivety Prior & Credulity via `openness` (T11, T22)**: Try to bluff an NPC (claim a forged permit or secret authority).
    - _Gate_: High-openness NPC (≥70) accepts plausible claims; low-openness (≤39) demands physical proof / suspects deception. Behavior tracks the `openness` axis.
13. 🔒 **Epistemic Horizon / Null Data (T12, T23)**: Scheme something privately in player thoughts or concealed inventory, then put an NPC in the room.
    - _Gate_: The NPC acts with **zero knowledge** of anything not transmitted through sight / sound / written word. No telepathy.
14. 🎤 **Multi-Voice Kokoro Attribution (T13, T24)**: Generate a turn with narrator + AI dialogue + NPC dialogue.
    - _Gate_: Finished-turn narration attributes quoted dialogue to the correct roster voices (narrator default for prose); sequential audio buffers never overlap.

### Baseline Engine Invariants (regression net — should hold unchanged)

13. 🧱 **Epistemic Wall**: User `[SECRET:]`/`[PLAN:]` stripped in `render_character()`, visible to the Director.
14. 🧽 **Pseudo-JSON Lifecycle**: `[KEY: none]` clears atomically; `[CLOTHING: none]` purges clothing; undress → `[INVENTORY: ...]`, redress reads back without hallucination.
15. 🧬 **Memory Provenance**: `usr_` memories forge-skipped + 1.5x boost; `ai_` capped at 20; ≤200 vectors; ≤220 chars; dedup >0.6 overlap / >0.92 cosine.
16. 🖼️ **Visual Filter & Ghost Rows**: `INVENTORY`/`STASH`/`SECRET`/`PLAN`/`STATUS` stripped from image prompts; timed-out beats leave 0 ghost rows.
17. 🔄 **Reload Continuity (T15)**: mid-session reload restores `idle` phase, live dynamics from IndexedDB, and turn sequence without corruption.
18. 🎯 **Standing Agenda Refresh**: `entity.future` rewritten on every forge cycle (every 8 unconsolidated messages); completed objectives evolve post-climax.

---

## Part 5 — Telemetry Collection & Trace Artifact

Maintain a round-by-round audit table for all 25–30 turns:

| Rnd | Probe (Track A/B) | Active Speaker (`ai`/`fractal`/`npc:<id>`) | AI/NPC/World Reply (len / somatic keyword / detox pass) | Director (`keywords` / `story_status` / `in_scene_change` / `promotions`) | Dynamics & Signals | Continuity & Memory Audit | Verdict |
| --- | ----------------- | ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------ | ------------------------- | ------- |
| 0   | Prologue          | System (`Prologue.svelte`)                 | Baseline tone lock                                      | `IN_PROGRESS`                                                             | Baseline           | No AI-isms                |         |

Upon completion, **dump and attach** the raw session trace as `tmp/rpglitch-long-term-review-trace-<timestamp>.json`:

```json
{
  "meta": {
    "timestamp": "2026-08-16T07:45:00Z",
    "total_turns": 28,
    "tracks_under_test": ["track-director-expansion-2026-08-14", "track-npc-expansion-2026-08-14"],
    "entities": ["Lord Benedict Silvers", "Julien", "Ashenweald"]
  },
  "turns": [
    {
      "round": 9,
      "user_action": "...",
      "ai_response": "...",
      "director_output": {
        "internal_monologue": "...",
        "speaker": "npc:elias",
        "keywords": ["deception"],
        "story_status": "IN_PROGRESS",
        "in_scene_change": { "enter": [], "exit": ["char_vane"] },
        "promotions": [{ "id": "char_elias", "tier": 3 }],
        "mutations": {}
      },
      "telemetry": {
        "generating_entity": { "type": "npc", "name": "Dr. Elias Tariq" },
        "dynamics_snapshot": {},
        "signals": [],
        "image_trigger": {},
        "in_scene_npc_ids": ["char_elias"]
      }
    }
  ]
}
```

---

## Part 6 — Final Quality Scorecard

### Track A — Director Expansion

- [ ] **Job Queue**: `create_job_queue` isolates errors and never blocks the turn path (verified runtime, T4/T8/T12/T16).
- [ ] **Somatic Registry**: 12 archetypes + 23 motifs resolve into deterministic `<SOMATIC_DIRECTIVES>`.
- [ ] **Director Schema**: `speaker`, `keywords`, `story_status`, `in_scene_change`, `promotions` all normalized with safe fallbacks on garbage JSON.
- [ ] **Speaker Delegation**: `ai` / `fractal` / `npc:<id>` all execute correctly; UI thinking state tracks the active entity.
- [ ] **Masking vs. Leakage**: verbal composure vs. involuntary tells demonstrated; detox pass clean.
- [ ] **Pacing & Hooks**: length mirrors input; every turn ends on a decisive hook.
- [ ] **Epilogue Flow**: `CONCLUDED`/`COLLAPSED` auto-dispatch exactly once; action deck works.
- [ ] **Background Parallelism**: ghost sweeps run concurrently with zero turn latency (partial scope accepted per Part 3).
- [ ] **Known-Gap Confirmation**: Macro-Quest chapter forking absent by design — no false expectations.

### Track B — NPC & Living World

- [ ] **Roster Schema**: `role_tier`/`is_wanderer`/`relationships` normalize + persist; story `npc_ids` hydrates the cast.
- [ ] **Compact Roster & Convergence**: `<ROSTER>` signatures compact; zero duplicate-character hallucination; active trio excluded.
- [ ] **Stage Spotlight**: enter/exit choreography works; off-screen dynamics freeze.
- [ ] **Relational Mesh**: Director mutates `relationships`; mesh renders and persists.
- [ ] **In-Scene Salience**: 1.3x memory boost observable in NPC recall.
- [ ] **Naivety / Epistemic Horizon**: `openness` gates credulity; NPCs never know off-screen facts.
- [ ] **Rich Genesis & Promotions**: Director `genesis` payload triggers synchronous rich character creation (`sort_into_profile()`) with scene context, populating full Twin-Cylinder appearance brackets, personality, state of mind, standing agenda, and origin memories; assigns registry signature color; puts them on-stage; fires background portrait; and persists to Dexie (with resilient fallback to raw draft); `promotions` clamp to tier 2/3.
- [ ] **NPC Dialogue & Interaction**: `speaker:"npc:<id>"` builds dedicated NPC persona prompt and delivers third-person limited present-tense dialogue with matching UI thinking indicator.
- [ ] **Multi-Voice TTS**: finished-turn narration attributes voices correctly; live-sentence single-voice scope accepted per Part 3.
- [ ] **Presence UI**: Storymode in-scene badges render; Feed badges + NPC profile viewing verified (or flagged as unverified).

### Regression Net (must remain green)

- [ ] Epistemic Wall, atomic key clearing, vector provenance caps, visual filter, reload continuity, standing-agenda refresh — all hold.
- [ ] `npm run verify` and `npm run deploy:prepare` complete with 0 errors, 0 warnings (or a recorded exception).
