# RPGlitch — Live Simulation Forensics & Engine Integrity Test Protocol

> **System Designation**: Sovereign AI Roleplay Engine (Perchance Iframe Environment)  
> **Protocol Focus**: Live 25–30 Turn Interactive Roleplay Stress Test & State Audit  
> **Target Scope**: End-to-end verification of v0.7.0 Sovereign Core, Track 3 Anti-Slop Narrative Detox, Track 4 Deep Task Compiler Deconstruction, Prism-DCM Hierarchical Memory, and 6k Context Protection.

---

## 1. Primary Objectives & Inquiries Under Test

### 1. Recent Updates Verification (Tracks 1 through 5 — `[Unreleased]`)

Verify that the recently shipped architectural updates across Tracks 1 through 5 are functioning properly and producing the high-fidelity narrative, immersion, and stability results we are aiming for:

- **Track 1: 4-Quadrant RAG & Dynamic Token Reservoir**:
  - Verify key-aware pseudo-JSON bracket merges (`merge_field_content`) cleanly overwrite values, purge on `none`/`cleared`, and preserve unmutated brackets.
  - Verify physical descriptors in `present.physical` receive the 0.5x token salience penalty on narrative turns and the 1.5x boost on scheduled image generation turns.
  - Verify `whole_vector_slice` prevents sliced bracket tags (`[CLOTHING: dark...`) at prompt boundary limits.
  - Verify background NPC cast compression renders concise 1–2 line summaries (`<CAST mode="nearby">`), preserving prompt tokens while giving the active speaker full depth.
- **Track 2: Simulation Log Pipeline Harmonization**:
  - Verify turn beat normalization via `normalize_history_beat` guarantees identical output across live prompt compilation, UI rendering, and story exports.
  - Verify canonical Sovereign roles (`USER`, `AI`, `NPC`, `FRACTAL`, `SYSTEM`) are strictly preserved with zero generic LLM markers (`assistant`, `narrator`).
  - Verify in-memory window slicing (`get_recent_window`) prevents redundant database queries during active simulation rounds.
- **Track 3: Anti-Slop Narrative Detox & The Spent Ledger**:
  - Verify `# SPENT LEDGER` scans recent dialogue turns, compiling opening clauses, physical mannerisms, and repeated n-grams into the active prompt.
  - Verify real-time detoxification strips Tier 1A frequency markers (49 terms: `delve`, `tapestry`, `realm`, `paradigm`, `embark`, `beacon`, `robust`, etc.) and rewrites Tier 1B clarity terms (`utilize` $\rightarrow$ `use`).
  - Verify fatal syntactic tropes (`not quite X, more like Y`, `she didn't X; she Y`, `the air grew thick`, and named subtext tags) are neutralized.
  - Verify somatic physical markers are capped at 1 per character per turn.
  - Verify zero raw em-dashes (`—`) or en-dashes (`–`) appear in prose, dialogue, or UI.
- **Track 4: Scene Momentum & Stagnation Backstop**:
  - Verify turn-to-turn semantic drift ($1 - \text{cosine\_similarity}$) is computed via 384-d embeddings between consecutive turns.
  - Verify reactive `stagnation_turns` tracks circular dialogue and persists to `db.stories`.
  - Verify Directorial Momentum Tiers fire at thresholds: Soft Permit at 8 turns (lifts anti-staging restrictions) and Hard Mandate at 16 turns (forces an environmental shift or new arrival).
- **Track 5: Runtime Stream Beat Backstop & Continuation (`finishTail`)**:
  - Verify the runtime Stream Beat Monitor cuts generation on terminal punctuation after the 1st beat on `TINY` inputs ($\le 12$ chars) and after the 2nd beat on `SMALL` inputs ($\le 90$ chars), stopping narrative ballooning (e.g. 4-char `"Nod."` ballooning into multi-sentence monologues).
  - Verify that when generation truncates mid-sentence (`looks_truncated`), `finishTail` preserves already-streamed text, prompts for only the missing concluding clause, and concatenates without a full re-roll.

### 2. v0.7.0 Sovereign Core & Intelligence Hardening

- **Universal Prompt Plan & Sealed `<SYSTEM>` Envelope**: Verify all modes compile through `compile_prompt` -> `resolve_prompt_plan` -> `render_prompt_plan` -> `pack_prompt`, keeping `<TASK>` cleanly sealed inside the root `<SYSTEM>` envelope.
- **Hierarchical Memory (Prism-DCM)**: Multi-tier tree compactor (`temporal.js`, `PRISM_FANOUT = 8`) rolling Tier 0 turns into Tier 1 chapters and Tier 2 arcs within height bounds (`COMPACTOR_MAX_HEIGHT = 5`).
- **6,000 Token Context Cliff Protection**: Proactive budgeting enforcing `CONTEXT_TOKEN_CLIFF = 6000`, `HISTORY_TOKEN_BUDGET = 1600`, and `RECALL_TOKEN_BUDGET = 800` without middle-prompt truncation.
- **Settled Facts Write-Time Rot Prevention**: Inspect prompt for `# ALREADY REMEMBERED` advisory passing top 12 known settled facts to prevent episodic memory duplication.
- **Dynamics-Modulated Recall Clarity**: High somatic stress (`Chaos > 70` or `Entropy > 70`) prefixes recalled memories with `[fragmented recall]` / `[hazy recollection]` instead of artificial confidence floats.
- **Input-Proportional Reflex Pacing**: Validate reflex pacing contracts (`TINY <= 12`, `SMALL <= 90`, `MEDIUM <= 400`, `EXPANSIVE > 400`) capping turn beat length on brief inputs.
- **Standalone Lorebook Engine**: Keywords trigger world-info entries into the `<LOREBOOK>` prompt slot within token budget limits.
- **Relational Bracket `@` Mandatory Prefix**: Verify relational brackets strictly use `[@TARGET: dynamic | flags]`, eliminating trait key collisions.

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
  - _Action_: Launch a new story with active Cast (AI Character, Protagonist, Fractal World).
  - _Audit Gate_: Inspect browser DevTools console. Verify `[Director]` prompt compilation succeeds via `compile_prompt`. Confirm the sealed root `<SYSTEM>` envelope encapsulates role, constitution, protocols, entities, and directives without legacy `system_close` leaks. Inspect `db.mutation_ledger` for `round: 0, seq: 0, writer: "genesis"` rows across all 4 quadrants.
- **Turns 1–2 — Quick Shot Latency, Lorebook Keyword Matching & Telemetry**:
  - _Action_: Player inputs text containing a designated lorebook keyword (e.g. city name, artifact, or faction).
  - _Audit Gate_: Verify `lorebook.js` matches the keyword and injects the entry into the `<LOREBOOK>` prompt slot. Confirm Director completes with sub-second latency and `DYNAMICS_DELTA` contains zero duplicate metric tokens.
- **Turns 3–4 — Mandatory `@` Relational Brackets & Ledger Dedup**:
  - _Action_: Player establishes a tense interpersonal bond with the AI character.
  - _Audit Gate_: Director emits relational bracket using mandatory `@` prefix (e.g. `[@AI: wary alliance | hide w:8]`). In Turn 4, maintain the same relationship: confirm the Director's compare-then-skip guard suppresses redundant ledger appends.

---

### Phase 2: Input-Proportional Reflex Pacing & Forge Consolidation (Turns 5–8)

- **Turn 5 — Tiny Input Pacing Contract (`TINY <= 12 chars`)**:
  - _Action_: Player enters a 1-word or short action (_"Nod."_ or _"Draw blade."_).
  - _Audit Gate_: `reflex.js` registers `TINY` input class. Storyteller output terminates promptly at the end of the first beat (~1–2 sentences) without ballooning into multi-paragraph monologues.
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

- **Turns 9–11 — Decoupled Image Cooldowns & Optics Cinematography Lenses**:
  - _Action_: Push scene intensity across displacement threshold while Director requests an image beat.
  - _Audit Gate_: `IMAGE_TRIGGER` independent cooldowns (`director: 2`, `dynamics: 3`) arbitrate with a strict 1-image-per-round ceiling. Verify placeholder mounts cleanly without blank dialogue rows. Framing lenses adapt to intimacy (`Intimate Close-Up` on high affinity vs `Wide Environmental` on panoramic scene focus).
- **Turns 12–14 — Settled Facts `# ALREADY REMEMBERED` Advisory**:
  - _Action_: Inquire about past events established in earlier turns.
  - _Audit Gate_: Inspect the compiled Story prompt in DevTools console. Verify the prompt tail contains `# ALREADY REMEMBERED` with up to 12 top settled facts, preventing the model from re-extracting known history.
- **Turns 15–16 — Somatic Dynamics & Recall Degradation (`[fragmented recall]`)**:
  - _Action_: Elevate scene danger or psychological instability until `Chaos > 70` or `Entropy > 70`.
  - _Audit Gate_: Inspect recalled memories in the prompt. Verify memories retrieved under high somatic stress receive sensory instability tags (`[fragmented recall]` or `[hazy recollection]`). Verify AI expresses memory uncertainty organically in narrative prose.

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
  - _Audit Gate_: Epistemic filter in `src/intelligence/veil.js` strips private brackets from the AI character's generation prompt. AI persona demonstrates zero telepathic awareness.
- **Turns 23–24 — Physical Causality & Terminal States**:
  - _Action_: Introduce severe survivable injury vs fatal destruction.
  - _Audit Gate_: Severe injury updates `present.physical` with somatic penalties while staying in-progress. Lethal destruction triggers `EPILOGUE_COLLAPSED` without prompt lock conflicts.

---

### Phase 5: Prism-DCM Tree Compaction, Context Protection & UI Motion Audit (Turns 25–30)

- **Turns 25–27 — Prism-DCM Compaction & 6k Context Cliff Protection**:
  - _Action_: Advance roleplay beyond Turn 25 with deep historical context.
  - _Audit Gate_:
    - Verify `temporal.js` Prism tree compactor rolls Tier 0 turn events into Tier 1 chapter vectors and Tier 2 arc summaries (`PRISM_FANOUT = 8`, `COMPACTOR_MAX_HEIGHT = 5`).
    - Verify total prompt token count stays strictly below `CONTEXT_TOKEN_CLIFF = 6000` with `HISTORY_TOKEN_BUDGET = 1600` and `RECALL_TOKEN_BUDGET = 800`.
- **Turns 28–29 — Replay Reconstruction & Field History Inspector**:
  - _Action_: In `Profile`, click the clock button on `present.non_physical`.
  - _Audit Gate_: `FieldHistoryModal.svelte` opens. Timeline tab shows chronological mutations (`R{round}:S{seq}`). Reconstructed tab displays replayed bracket predicates assembled via `replay_entity_field` with flags (`| hide w:8`) intact.
- **Turn 30 — UI Motion & Storyboard Resume Audit**:
  - _Action_: Navigate between Storyboard and Storymode, open modals, trigger toolbars.
  - _Audit Gate_:
    - Verify Emil Kowalski motion compliance: zero `transition: all`, sub-300ms durations, compositor-only transforms, and zero layout snapping.
    - Click "Return to Storyboard" in `ControlPanel.svelte`. Confirm session remains intact; clicking `"ENTER STORYMODE"` in emerald green resumes session in 1 click.
    - Export session JSON trace to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.

---

## 3. Round-by-Round Telemetry & Mutation Ledger Trace Capture

Record all turn data into this live audit table:

| Rnd | Probe / Milestone | Active Speaker (`ai`/`fractal`/`npc:<id>`) | Quick Shot (`next_action` / latency ms) | Back Shot (`forged_entity` / memory / relationships) | Mutation Ledger Entries Added (seq / writer / decider / dedup status) | Image Trigger (`tier` / `source` / framing lens) | UI & History State (`pinned_id` / history modal audit) | Verdict |
| :-- | :---------------- | :----------------------------------------- | :-------------------------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------------------- | :------ |
| 0   | Genesis Baseline  | `system`                                   | Genesis Sync                            | Initial State Sync                                   | R0:S0 genesis entries for all 4 quadrants                             | None (Cooldown armed)                            | Storyboard $\rightarrow$ Storymode Flip                | PASS    |
| 1   | Quick Shot Probe  |                                            |                                         |                                                      |                                                                       |                                                  |                                                        |         |
| ... | ...               |                                            |                                         |                                                      |                                                                       |                                                  |                                                        |         |

---

## 4. Runtime Quality Scorecard

### Intelligence Architecture & Universal Prompt Plan

- [ ] **Universal Prompt Plan Purity**: All modes compile through `define_mode` and `pack_prompt`; `<TASK>` sealed inside closed `<SYSTEM>` envelope.
- [ ] **Declarative Task Compiler (`TASK_MODE_PLANS`)**: Plan/render split executes cleanly without legacy procedural string building.
- [ ] **P1 User Agency**: AI persona strictly respects user autonomy; Director's Note never scripts thoughts or choices for `«USER_PERSONA»`.
- [ ] **Epistemic Partitioning**: Zero telepathic prompt bleed of `| hide` brackets across character viewpoints.
- [ ] **Think-Only Guard**: Model never persists empty speech bubble when reasoning exclusively in `<think>`.
- [ ] **Telemetry Deduplication**: `DYNAMICS_DELTA` telemetry logs zero duplicate metric tokens.
- [ ] **Ghost Row Suppression & Markdown Image Export**: Standalone image beats emit 0 blank dialogue rows; Markdown exports retain `![prompt](src)`.

### Memory Architecture & Context Protection (Prism-DCM)

- [ ] **Prism-DCM Tree Compaction**: Turn events roll cleanly into Tier 1 chapters and Tier 2 arcs within height bounds (`COMPACTOR_MAX_HEIGHT = 5`).
- [ ] **6,000 Token Cliff Protection**: Total prompt tokens respect `CONTEXT_TOKEN_CLIFF = 6000` with `HISTORY_TOKEN_BUDGET = 1600` and `RECALL_TOKEN_BUDGET = 800`.
- [ ] **Settled Facts Write-Time Rot Prevention**: Prompt includes `# ALREADY REMEMBERED` top 12 settled facts advisory.
- [ ] **Dynamics-Modulated Recall Clarity**: High Chaos/Entropy (> 70) prefixes memories with `[fragmented recall]` / `[hazy recollection]`.
- [ ] **Whole-Vector Budget Protection**: Memory loop breaks at bracket boundaries without emitting half-sliced tags (`[CLOTHING: dark wool...`).

### Narrative Pacing, Anti-Slop Detox & Ghostwriting (Tracks 1, 3, 4 & 5)

- [ ] **Stream Beat Monitor (Track 5.1)**: `TINY` inputs ($\le 12$ chars) cut generation at terminal punctuation of the 1st beat; `SMALL` inputs ($\le 90$ chars) cut at 2nd beat, preventing multi-sentence ballooning.
- [ ] **Append-Only Continuation `finishTail` (Track 5.2)**: Mid-sentence cuts trigger targeted tail query without re-rolling earlier prose.
- [ ] **Scene Stagnation & Momentum Tiers (Track 4)**: Circular dialogue increments `stagnation_turns`; lifts anti-staging at 8 turns (Soft Permit) and forces environmental break/arrival at 16 turns (Hard Mandate).
- [ ] **Spent Ledger Anti-Repetition (Track 3)**: Recent mannerisms, dialogue starters, and n-grams are registered in `# SPENT LEDGER` and avoided.
- [ ] **Tier 1A AI Slop Vocabulary Stripping (Track 3)**: Zero occurrences of `delve`, `tapestry`, `realm`, `paradigm`, `embark`, `beacon`, `robust`, `comprehensive`, `cutting-edge`.
- [ ] **Syntactic Cliché Rewrites (Track 3)**: Zero occurrences of `not quite X, more like Y`, `she didn't X; she Y`, `the air grew thick`.
- [ ] **Input-Proportional Reflex Pacing**: `TINY` inputs produce tight, unpadded replies; `EXPANSIVE` inputs unlock full multi-beat progression.
- [ ] **Punctuation Normalization (Zero Em-Dashes)**: Real-time scrubbing eliminates raw em-dashes (`—`) and en-dashes (`–`) from prose and dialogue.
- [ ] **Somatic Marker Cap**: Max 1 physical reaction per character per turn; zero somatic flooding.
- [ ] **Ghostwriting Shot-2A Speaker Swap**: Ghostwrite button drafts on behalf of the player persona without narrator leaks or persona lock conflicts.
- [ ] **Standalone Lorebook Engine**: Keywords trigger world-info entries into `<LOREBOOK>` prompt slot within token budget limits.
- [ ] **Nearby NPC Cast Compression (Track 1)**: Secondary NPCs rendered as concise 1–2 line core descriptors in `<CAST mode="nearby">`.
- [ ] **Key-Aware Bracket Merges (Track 1)**: `merge_field_content` updates state cleanly without corrupting untouched brackets.

### Event Sourcing, State & Optics

- [ ] **Genesis Quadrant Logging**: All 4 quadrants log `round: 0, seq: 0, writer: "genesis"` on entity creation and import.
- [ ] **Director Dedup-Before-Write**: Identical relational directives are skipped from the ledger on subsequent rounds.
- [ ] **Memory Forge Compare-Then-Skip**: Unchanged fields during consolidation are skipped from `ledger_batch`.
- [ ] **Mandatory `@` Relational Brackets**: Directed relationships strictly use `[@TARGET: dynamic | flags]`.
- [ ] **Field History Inspector & Replay**: Clock button opens modal; Reconstructed tab reproduces exact bracket states with flags.
- [ ] **Decoupled Image Cooldowns & Optics Lenses**: Independent cooldowns enforce 1-image-per-round ceiling; photographic framing lenses adapt to scene intimacy.

### UI Kinetics & Design System Compliance

- [ ] **Zero Em-Dashes in UI**: All button labels, modal titles, toasts, and descriptions use standard hyphens or clean sentence structure.
- [ ] **Emil Kowalski Kinetic Laws**: Zero `transition: all`, sub-300ms transitions, compositor-only transforms, and zero animation on high-frequency actions ($100+$ times/day).
- [ ] **Storyboard Direct Resume Navigation**: Returning to storyboard preserves `story_id`; emerald `"ENTER STORYMODE"` button resumes session in 1 click.
- [ ] **Trace Artifact**: Complete session trace dumped to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.
