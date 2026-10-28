# RPGlitch — Live Simulation Forensics & Engine Integrity Test Protocol

> **System Designation**: Sovereign AI Roleplay Engine (Perchance Iframe Environment)  
> **Protocol Focus**: Live 25–30 Turn Interactive Roleplay Stress Test & State Audit (Group B: Zero-Config Ready)  
> **Target Scope**: End-to-end verification of Phase V Shipped Reality (Memory RAG Hardening, Token Budget HUD, Somatic Recall Degradation, Unified Optics Cooldowns, 4-Quadrant Lorebook Influence, and 6k Context Cliff Protection).

---

## 1. Primary Objectives & Inquiries Under Test (Group B: Ready Right Now)

Verify that the recently shipped architectural updates across Phases I through V are functioning properly in real Perchance iframe play without requiring any code configuration changes:

- **1. Somatic Recall Degradation (`■■■` Block Glyphs under High Stress)**:
  - Verify that when Chaos or Entropy exceeds threshold (`DYNAMICS_FRAGMENTATION_THRESHOLD = 70`) and recall clarity shifts to `fragmented`, lower-weight memories (`emotional_weight <= 6`) in `<PAST>` are degraded using diegetic block glyphs (`■■■`, zero ellipses).
  - Verify high-weight canon crispness (`w: 7-10`) remains 100% untouched and legible regardless of origin provenance (`usr_` or `ai_`).
  - Observe how the LLM reacts in narrative prose to blacked-out memory blocks (does it portray organic memory fog or trauma without hallucinating fake facts?).
- **2. Director Staging Adherence (Shot 1 $\rightarrow$ Shot 2 Handoff)**:
  - Verify Shot 1 Director Quick Shot evaluates the round, updates numerical dynamics, and emits a structured `directors_note` and 1–5 `keywords`.
  - Verify rolling Director latency buffer caps at `TELEMETRY_CAPS.DIRECTOR_LATENCY_POOL = 50` in runtime telemetry.
  - Verify Shot 2 Storyteller receives these directives inside `<TASK>` and faithfully reflects the staging guidance and keyword tone in its prose output.
- **3. Real-Time Token Budget Headroom & 6,000 Cliff HUD**:
  - Verify the Token Budget HUD badge in `DevWing.svelte` accurately tracks live prompt compilation token snapshots (`system`, `entities`, `history`, `task`, and `<ENTITIES>` actors/cast/memories sub-breakdown).
  - Verify total prompt token length stays safely beneath `CONTEXT_TOKEN_CLIFF = 6000` (measured against `CHARS_PER_TOKEN = 3.35`) as the conversation scales from Round 1 to Round 25+.
  - Verify dynamic turn headroom metering in `prompts.js` cleanly computes `PROMPT_CHAR_ENVELOPE - fixed_footprint` (20,000 chars) for entity sheet allocations.
- **4. Optics Scheduling, Cooldowns & Sensory History Tag Parity**:
  - Verify unified cooldown `IMAGE_TRIGGER_COOLDOWN_ROUNDS = 3` enforces a 3-round gap between automatic scene image generations.
  - Verify sensory history format emitted into optics prompts uses universal `<RECENT_ROUNDS>` (with nested `Name: prose` lines stripped of telemetry and `<think>` blocks), asserting complete retirement of legacy `<HISTORY>`.
  - Verify scheduled Director Visual Beats faithfully retain camera lenses, framing descriptors, and aesthetic negative maps through `render_optics_prompt`.
- **5. UI Deduplication & State Mutex Integrity**:
  - **Shared Portalled ContextMenu**: Verify context menus on Entity Cards and Message Badges render cleanly via the unified `ContextMenu.svelte`, with viewport boundary clamping, fixed z-9999 stacking, and outside-click/escape dismissal.
  - **Unified Image Regeneration**: Verify that triggering image regeneration from message attachments or modal picker flows through `run_image_regeneration` in `ImagePicker.svelte.js` without duplicate LLM prompt calls.
  - **Streaming State Mutex Guard**: Verify `simulation_state` stays locked and `intent_active` remains guarded during word streaming in mock/live generation without early unlocking mid-stream.
- **6. 4-Quadrant Lorebook Influence & Epistemic Wall Integrity**:
  - Verify the LLM actively draws upon all 4 quadrants (`eternal`, `present`, `past`, `future`) as a lived vector lorebook rather than keyword dumps.
  - Verify private brackets (`| hide`) on the player's entity are completely stripped across the Epistemic Wall via `filter_epistemic_brackets` / `strip_epistemic_secrets` (testable in console via `verify_epistemic_integrity(prompt, { is_owner: false })`) and never leak into AI generation prompts.
- **7. Streaming Rhythm & Append-Only Continuation (`finishTail`)**:
  - Verify real-time text streaming over the Perchance iframe postMessage bridge feels responsive.
  - Verify that any mid-sentence cuts or truncations trigger `finishTail` append-only recovery without re-rolling earlier prose.

---

## 2. Turn-by-Turn Narrative Stress Test Matrix (25–30 Turns)

Follow this targeted round sequence to systematically trigger and audit each engine capability:

```text
[T0: Genesis & Prompt Envelope] ──► [T1–T4: Pacing & Lorebook Trigger] ──► [T5–T8: Forge Guard & Databox]
                                                                                      │
[T25–T30: Prism Compaction & UI Gate] ◄── [T17–T24: Detox & Ghostwrite] ◄── [T9–T16: Recall Degradation & Optics] ◄┘
```

---

### Phase 1: Genesis, Universal Prompt Plan & Lorebooks (Turns 0–4)

- **Turn 0 — Genesis, Cast Setup & Root Envelope Assembly**:
  - _Action_: Launch a new story using the controlled premade trio (Orion the Pink Protector, Sylvia, and Fractal World) for reproducible baseline comparisons against the historical corpus.
  - _Audit Gate_: Inspect browser DevTools console. Verify `[Director]` prompt compilation succeeds via `compile_prompt`. Confirm the sealed root `<SYSTEM>` envelope encapsulates role, constitution, protocols, entities, and directives without legacy `system_close` leaks. Inspect `db.mutation_ledger` for `round: 0, seq: 0, writer: "genesis"` rows across all 4 quadrants.
- **Turns 1–2 — Quadrant Educational Tooltips & Keyword Matcher Behaviour**:
  - _Action_: In `Profile.svelte`, hover over the `"i"` info icons in Character/Fractal card headers. Then enter a message containing keyword variations in chat.
  - _Audit Gate_: Verify educational taxonomy copy renders ("all 4 quadrants are lorebook", teaching `eternal` + `present` + `past` + `future`). Verify `match_keyword_pattern` (`text.js`) correctly parses inputs without error. Measure Director Quick Shot latency (captured as diagnostic telemetry).
- **Turns 3–4 — Mandatory `@` Relational Brackets & Ledger Dedup**:
  - _Action_: Player establishes a tense interpersonal bond with the AI character.
  - _Audit Gate_: Director emits relational bracket using mandatory `@` prefix with valid pipe syntax (e.g. `[@AI: wary alliance | hide | w:8]`). In Turn 4, maintain the same relationship: confirm the Director's compare-then-skip guard suppresses redundant ledger appends.

---

### Phase 2: Input-Proportional Reflex Pacing & Forge Consolidation (Turns 5–8)

- **Turn 5 — Tiny Input Pacing Contract (`TINY <= 12 chars`)**:
  - _Action_: Player enters a 1-word or short action (_"Nod."_ or _"Draw blade."_).
  - _Audit Gate_: `reflex.js` registers `TINY` input class. Storyteller output terminates strictly at the end of the first beat (~1–2 sentences) without narrative ballooning into multi-paragraph monologues.
- **Turn 6 — Expansive Input Pacing Contract (`EXPANSIVE > 400 chars`)**:
  - _Action_: Player authors detailed sensory dialogue with physical action and environmental exploration.
  - _Audit Gate_: `reflex.js` registers `EXPANSIVE` input class, unlocking the full beat budget with rich multi-beat sensory progression.
- **Turn 7 — Memory Forge Target 1 & Non-Physical Bracket Preservation**:
  - _Action_: Scene advances with significant emotional stakes.
  - _Audit Gate_: Background Memory Forge processes target AI character (`forged_entity: "ai"`). Verify active relational brackets (`[@USER: ...]`) in `present.non_physical` remain preserved alongside forged prose summaries.
- **Turn 8 — Memory Forge Compare-Then-Skip Guard & Cyan Databox**:
  - _Action_: Maintain steady-state dialogue where character trajectory and physical state do not shift.
  - _Audit Gate_: Memory Forge runs; confirm unchanged fields are **skipped** from `ledger_batch`, adding 0 duplicate lines to `db.mutation_ledger`. Telemetry card renders a focused single databox in terminal cyan (`var(--color-dev-accent)`).

---

### Phase 3: Optics Framing, Dynamics-Modulated Recall & Settled Facts (Turns 9–16)

- **Turns 9–11 — Unified Optics Cooldown, Sensory History & Photography Framing Lenses**:
  - _Action_: Push scene intensity across displacement threshold while Director requests an image beat.
  - _Audit Gate_:
    - Unified cooldown `IMAGE_TRIGGER_COOLDOWN_ROUNDS = 3` enforces a minimum 3-round gap between scheduled image generations.
    - Inspect prompt in DevTools console: confirm `<RECENT_ROUNDS>` wraps non-system dialogue beats for the sensory cortex without legacy `<HISTORY>` wrappers.
    - Verify placeholder mounts cleanly without blank dialogue rows. Framing lenses adapt to intimacy (`Intimate Close-Up` on high affinity vs `Wide Environmental` on panoramic scene focus).
- **Turns 12–14 — Settled Facts `# ALREADY REMEMBERED` Advisory**:
  - _Action_: Inquire about past events established in earlier turns.
  - _Audit Gate_: Inspect the compiled Story prompt in DevTools console (NOTE: Transport passes `instruction: () => instruction` as a closure — ensure console capture reads or executes the closure). Verify the prompt tail contains `# ALREADY REMEMBERED` with up to 12 top settled facts, preventing the model from re-extracting known history.
- **Turns 15–16 — Deterministic Somatic Dynamics & Recall Degradation (`■■■`)**:
  - _Action_: In DevWing, manually crank the Chaos or Entropy slider past 70 (`resolve_recall_clarity(dynamics) === 'fragmented'`) rather than relying on roleplay luck.
  - _Audit Gate_: Inspect recalled memories in the prompt. Verify low-to-moderate weight memories (`emotional_weight <= 6`) receive diegetic block glyphs (`■■■`, zero ellipses) preserving canon tags. Verify high-weight memories (`w: 7-10`) remain crisp. Verify AI expresses organic uncertainty or sensory trauma in prose rather than hallucinating fake details.

---

### Phase 4: Anti-Slop Detox Linter, Ghostwrite Speaker Swap & Epistemic Wall (Turns 17–24)

- **Turns 17–18 — Anti-Slop Prose Detox & Punctuation Normalization**:
  - _Action_: Stream dialogue and narrative prose across multiple turns.
  - _Audit Gate_: Audit narrative output against the Track 3 anti-slop rules:
    - **Zero raw em-dashes (`—`) or en-dashes (`–`)**: Verify prose uses clean standard punctuation (commas, periods, colons).
    - **Zero pseudo-poetic clichés**: Verify phrases like `quietly [verb]`, `testament to`, `tapestry of`, and `not fear, but something worse` are absent.
    - **Somatic marker cap**: Confirm somatic physical reactions (`throat tightened`, `shivers`) do not exceed 1 per character per turn.
- **Turns 19–20 — Ghostwrite Shot-2A Speaker Swap**:
  - _Action_: In `StorymodeBar.svelte`, click the Ghostwrite button to draft the user persona's next move.
  - _Audit Gate_: Ghostwrite executes via `TASK_MODE_PLANS` declarative plan. Verify:
    - Draft streams directly into the input bar.
    - Draft is authored strictly in the player's perspective without narrator cognitive labels (`(Sylvie's thoughts: ...)`).
    - No prompt contradiction between `CHARACTER.BASE` and ghostwriting.
- **Turns 21–22 — Epistemic Wall & Concealed Actions (`| hide`)**:
  - _Action_: Player conceals an item or hatches a secret plan (`[DAGGER: boot knife | hide]`, `[PLAN: poisoned cup | hide]`).
  - _Audit Gate_: Epistemic filter in `src/intelligence/veil.js` (`filter_epistemic_brackets` / `strip_epistemic_secrets`) strips private brackets from the AI character's generation prompt. Run `verify_epistemic_integrity(prompt, { is_owner: false })` in console to deterministically assert zero leak. AI persona demonstrates zero telepathic awareness.
- **Turns 23–24 — Physical Causality & Terminal States**:
  - _Action_: Introduce severe survivable injury vs fatal destruction.
  - _Audit Gate_: Severe injury updates `present.physical` with somatic penalties while staying in-progress. Lethal destruction triggers `EPILOGUE_COLLAPSED` without prompt lock conflicts.

---

### Phase 5: Prism-DCM Tree Compaction, Context Protection & UI Motion Audit (Turns 25–30)

- **Turns 25–27 — Prism-DCM Database Compaction & 6k Context Cliff Protection**:
  - _Action_: Advance roleplay beyond Turn 25 with deep historical context.
  - _Audit Gate_:
    - DB-Level Assertion: Open IndexedDB via DevTools (`Application` tab -> `IndexedDB` -> `rpglitch_db` -> `memories` / `stories`). Assert that Tier-1 chapter vectors actually exist in the store by Turn 25 (do not merely assume turn count fired the compactor).
    - Verify total prompt token count stays strictly below `CONTEXT_TOKEN_CLIFF = 6000` (`CHARS_PER_TOKEN = 3.35`) via the DevWing Token HUD popover.
- **Turns 28–29 — Replay Reconstruction & Field History Inspector**:
  - _Action_: In `Profile`, click the clock button on `present.non_physical`.
  - _Audit Gate_: `FieldHistoryModal.svelte` opens. Timeline tab shows chronological mutations (`R{round}:S{seq}`). Reconstructed tab displays replayed bracket predicates assembled via `replay_entity_field` with flags (`| hide | w:8`) intact.
- **Turn 30 — UI Deduplication, ContextMenu & Storyboard Resume Audit**:
  - _Action_:
    - Right-click or long-press an EntityCard badge and a message badge in the chat feed to trigger the portalled context menu.
    - Click image regeneration on a message attachment or inside `ImagePickerModal`.
    - Navigate between Storyboard and Storymode, open modals, trigger toolbars.
  - _Audit Gate_:
    - Verify `ContextMenu.svelte` portal mounts at `document.body`, clamps to screen boundaries without overflow, and dismisses smoothly on outside click or Escape key.
    - Verify image regeneration executes via `run_image_regeneration` with proper LLM prompt refinement and candidate delivery without error.
    - Verify newly touched interactive elements respect kinetic motion laws (sub-300ms durations, compositor transforms, no layout snapping).
    - Click "Return to Storyboard" in `ControlPanel.svelte`. Confirm session remains intact; clicking `"ENTER STORYMODE"` in emerald green resumes session in 1 click.
    - Export session JSON trace using the in-app export button in the Story Settings modal.

## 3. Session Telemetry & Forensic Capture Instructions (For Tester Agent)

The tester agent executes exclusively in the live browser environment against the deployed Perchance iframe. To capture and report forensic trace data:

- **Browser DevTools Console Inspection**:
  - Open DevTools Console (`F12` / Console tab). Filter by `[Director]`, `[Story]`, `[Prompt]`, and `[Dynamics]`.
  - Capture compiled prompt XML envelopes and token snapshots logged by the runtime during generation.
- **In-App DevWing & Telemetry Cards**:
  - Open the **DevWing** panel (right-side drawer / wrench icon in `Profile`).
  - Read the **Token Budget HUD** badge and click to inspect the live allocation breakdown popover.
  - Inspect the in-feed **Telemetry Cards** emitted after each round for `DYNAMICS_DELTA`, `MEMORY_FORMATION`, and `VECTOR_RESOLUTION`.
- **Field History & Mutation Inspector**:
  - Open `Profile` and click the clock button on any field (e.g. `present.non_physical`) to inspect the chronological mutations in `FieldHistoryModal` directly in the UI.
- **Reporting Artifact**:
  - When completing the test run, compile your findings, observed token metrics, and filled scorecard into your final test report markdown rather than writing to local repository directories.

## 4. Runtime Quality Scorecard

### Intelligence Architecture & Universal Prompt Plan

- [ ] **Universal Prompt Plan Purity**: All modes compile through `define_mode` and `pack_prompt`; `<TASK>` sealed inside closed `<SYSTEM>` envelope.
- [ ] **Declarative Task Compiler (`TASK_MODE_PLANS`)**: Plan/render split executes cleanly without legacy procedural string building.
- [ ] **P1 User Agency**: AI persona strictly respects user autonomy; Director's Note never scripts thoughts or choices for `«USER_PERSONA»`.
- [ ] **Epistemic Partitioning**: Zero telepathic prompt bleed of `| hide` brackets across character viewpoints (verified in `src/intelligence/veil.js`).
- [ ] **Think-Only Guard**: Model never persists empty speech bubble when reasoning exclusively in `<think>`.
- [ ] **Telemetry Deduplication**: `DYNAMICS_DELTA` telemetry logs zero duplicate metric tokens.
- [ ] **Ghost Row Suppression & Markdown Image Export**: Standalone image beats emit 0 blank dialogue rows; Markdown exports retain `![prompt](src)`.

### Memory Architecture & Context Protection (Prism-DCM & Phase V)

- [ ] **Prism-DCM Tree Compaction**: Turn events roll cleanly into Tier 1 chapters and Tier 2 arcs within height bounds (`COMPACTOR_MAX_HEIGHT = 5`).
- [ ] **6,000 Token Cliff Protection & Token HUD**: Proactive budgeting enforcing `CONTEXT_TOKEN_CLIFF = 6000` (`CHARS_PER_TOKEN = 3.35`) with live DevWing HUD breakdown popover. `<ENTITIES>` capped at ~2,000 tokens via `whole_vector_slice`.
- [ ] **Settled Facts Write-Time Rot Prevention**: Prompt includes `# ALREADY REMEMBERED` top 12 settled facts advisory in continuum forge prompts.
- [ ] **Dynamics-Modulated Recall Clarity (`■■■`)**: `format_hybrid_recall` wired with `degrade_memory_text` using diegetic block glyphs for lower-weight recall (`w <= 6`) under fragmented dynamics (`Chaos > 70` or `Entropy > 70`).
- [ ] **Whole-Vector Budget Protection**: Memory loop breaks at bracket boundaries without emitting half-sliced tags (`[CLOTHING: dark wool...`).

### Narrative Pacing, Anti-Slop Detox & Ghostwriting (Tracks 1, 3, 4, 5 & 7)

- [ ] **Stream Beat Monitor (Track 5.1)**: `TINY` inputs terminate strictly at 1st beat (~1–2 sentences); `EXPANSIVE` inputs unlock full multi-beat progression. Narrative ballooning eliminated.
- [ ] **Append-Only Continuation `finishTail` (Track 5.2)**: Mid-sentence cuts trigger targeted tail query without re-rolling earlier prose.
- [ ] **Scene Stagnation & Momentum Tiers (Track 4)**: Circular dialogue increments `stagnation_turns`; soft permit (8 turns) and hard mandate (16 turns) thresholds fire as expected.
- [ ] **Spent Ledger Anti-Repetition (Track 3)**: Recent mannerisms, dialogue starters, and n-grams are registered in `# SPENT LEDGER` and avoided.
- [ ] **Tier 1A AI Slop Vocabulary Stripping (Track 3)**: Zero occurrences of `delve`, `tapestry`, `realm`, `paradigm`, `embark`, `beacon`, `robust`, `comprehensive`, `cutting-edge`.
- [ ] **Syntactic Cliché Rewrites (Track 3)**: Zero occurrences of `not quite X, more like Y`, `she didn't X; she Y`, `the air grew thick`.
- [ ] **Input-Proportional Reflex Pacing**: `TINY` inputs produce tight, unpadded replies; `EXPANSIVE` inputs unlock full multi-beat progression.
- [ ] **Punctuation Normalization (Zero Em-Dashes)**: Real-time scrubbing eliminates raw em-dashes (`—`) and en-dashes (`–`) from prose and dialogue.
- [ ] **Somatic Marker Cap**: Max 1 physical reaction per character per turn; zero somatic flooding.
- [ ] **Ghostwriting Shot-2A Speaker Swap (Track 7)**: Scoped base POV alignment renders ghostwriting strictly in user persona POV without third-person narrator labels.
- [ ] **Nearby NPC Cast Compression (Track 1)**: Secondary NPCs rendered as concise 1–2 line core descriptors in `<CAST mode="nearby">`.
- [ ] **Key-Aware Bracket Merges (Track 1)**: `merge_field_content` updates state cleanly without corrupting untouched brackets.

### Event Sourcing, State & Optics

- [ ] **Genesis Quadrant Logging**: All 4 quadrants log `round: 0, seq: 0, writer: "genesis"` on entity creation and import.
- [ ] **Director Dedup-Before-Write**: Identical relational directives are skipped from the ledger on subsequent rounds.
- [ ] **Director Latency Ring Buffer**: Capped to `TELEMETRY_CAPS.DIRECTOR_LATENCY_POOL = 50` in runtime state.
- [ ] **Memory Forge Compare-Then-Skip**: Unchanged fields during consolidation are skipped from `ledger_batch`.
- [ ] **Mandatory `@` Relational Brackets**: Directed relationships strictly use `[@TARGET: dynamic | flags]`.
- [ ] **Field History Inspector & Replay**: Clock button opens modal; Reconstructed tab reproduces exact bracket states with flags.
- [ ] **Unified Image Cooldowns & Optics Lenses**: Unified `IMAGE_TRIGGER_COOLDOWN_ROUNDS = 3` enforces 3-round gap between image generations; photographic framing lenses adapt to scene intimacy.
- [ ] **Sensory History `<RECENT_ROUNDS>` Emitter**: Optics prompt renders sensory history wrapped in `<RECENT_ROUNDS>` without stale `<HISTORY>` tags.

### UI Kinetics, Mutex Guards & Design System Compliance

- [ ] **Portalled ContextMenu Deduplication**: Unified `ContextMenu.svelte` handles all EntityCard and message badge menus with fixed z-9999 stacking and viewport clamping.
- [ ] **Unified Image Regeneration Pipeline**: Message attachments and modal picker share a single canonical `run_image_regeneration` pipeline.
- [ ] **Streaming State Mutex Guard**: `simulation_state` and `intent_active` remain locked during streaming in mock/live generation without early UI release.
- [ ] **Zero Em-Dashes in UI**: All button labels, modal titles, toasts, and descriptions use standard hyphens or clean sentence structure.
- [ ] **Emil Kowalski Kinetic Laws (Scoped to Phase V UI)**: Newly added DevWing HUD, sliders, and popovers use sub-300ms durations, compositor-only transforms, and zero layout snapping.
- [ ] **Trace Artifact**: Session trace exported via in-app settings and summarized in final test report.
