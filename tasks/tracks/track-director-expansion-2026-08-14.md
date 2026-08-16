# 🚀 Implementation Blueprint — `track-director-expansion-2026-08-14`

> **Track Goal**: Elevate the Director from a passive dynamics calculator into an active narrative orchestrator, leveraging Perchance's free parallel LLM execution environment and preparing seamless foundations for the upcoming multi-NPC social ecosystem.
>
> 1. **Parallel Background Job Queue & Concurrency Engine**: Leverage zero-cost parallel LLM execution to fire concurrent background processes (Memory Forge, visual prompt synthesis, world simulation, and state persistence) without blocking user-facing narrative streams.
> 2. **Multi-Entity Turn Delegation & Reactive UI**: Enable the Director to delegate dialogue/narrative execution to any active entity in the scene (`AI_CHARACTER`, `FRACTAL`, or secondary NPC identifiers), dynamically updating the frontend "thinking" state (avatar, badge, and style colors) to match the delegating speaker.
> 3. **Dual-Layer Somatic & Trauma Directives Engine**: Expand the Director's analytical budget to evaluate emotional undercurrents against a 12-archetype static registry (`shame`, `fear`, `betrayal`, `abandonment`, etc.) and 23 dynamic style motifs, injecting deterministic physical tells (`<SOMATIC_DIRECTIVES>`) into the active speaker prompt.
> 4. **Behavioral Protocols & Kinetic Handoffs**: Enforce masking vs. somatic leakage (verbal composure vs. involuntary bodily tells), input pacing calibration (matching syntactic rhythm), and decisive turn-ending hooks (`[Statement]`, `[Action]`, `[Hover]`, `[Silence]`).
> 5. **Macro-Quest Progression & Chapter Forking**: Evaluate the Fractal's `future` consolidated prose agenda for milestone completion; upon resolution, cleanly archive the completed chapter and birth an evolved chapter entity.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DIRECTOR TURN & PARALLEL EXECUTION PIPELINE                     │
│                                                                                        │
│  [User Action] ──► [Director Analytical Pass] ──► [Active Speaker Resolution]          │
│                            │                               │                           │
│                            ├─ Empathy & Pacing             ├─ Dynamic Entity Routing   │
│                            ├─ Somatic Keyword Selection    │  (AI / Fractal / NPC)     │
│                            └─ Quest Milestone Check        └─ <SOMATIC_DIRECTIVES>     │
│                                                                    │                   │
│                                                                    ▼                   │
│                                                         [Streaming Narrative]          │
│                                                         (Immediate User Feedback)      │
│                                                                    │                   │
│  ┌─────────────────────────────────────────────────────────────────┴─────────────────┐ │
│  │                    PARALLEL BACKGROUND JOB QUEUE (Free Inference)                 │ │
│  │                                                                                   │ │
│  │  [Memory Forge LLM]  ──►  [Visual Synthesis T2I]  ──►  [Dexie & Checkpoint Sync]  │ │
│  │  (Consolidation)          (Atmospheric Background)     (State Persistence)        │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Concurrency Model & Parallel LLM Architecture

> ✅ **ARCHIVED 2026-08-16 — IMPLEMENTED (with one gap).**
> Phases 1–4 shipped and are live in production. Phase 4.2 (auto-epilogue for `CONCLUDED`/`COLLAPSED`) landed 2026-08-16 — see `CHANGE-SUMMARY.md`. Phase 5 build verified via `deploy:prepare`.
> **Not implemented:** Goal item 5 (Macro-Quest Progression & Chapter Forking) — no chapter/fork machinery exists in the engine.
> **Partial:** 3.2 — `create_job_queue` is wired for background ghost sweeps only; Memory Forge / visual synthesis / Dexie checkpoint sync remain direct fire-and-forget calls.
> **Note:** Goal item 4's literal hook brackets (`[Statement]` etc.) were deliberately removed in favour of freeform dominant-hook guidance (2026-08-16).

### 1.1 Why Perchance Enables Parallel Architecture

In local or token-billed environments, LLM requests are strictly serialized to conserve costs. On the Perchance iframe platform, **API calls are free with zero per-token billing**. The only performance consideration is clock time.

By splitting narrative generation into:

1. **Critical Path (Low Latency)**: Director Pass (fast analytical JSON) ➔ Active Speaker Stream (immediate prose output).
2. **Parallel Background Workers (Concurrent Execution)**: Memory Forge consolidation, visual prompt synthesis, and background world state mutations fire simultaneously in the background without holding the composer or UI in stasis.

### 1.2 Director Asynchronous Job Queue (`src/utils/job-queue.js`)

Serializes background IndexedDB mutations, Memory Forge calls, and chapter fork events to prevent race conditions while permitting concurrent LLM execution:

- **Worker Concurrency**: Supports parallel worker tasks while maintaining a single serial database commit pipeline.
- **Latest-Pending Semantics**: If state updates accumulate while a background write is in-flight, only the freshest snapshot is committed upon completion.
- **Error Isolation**: Failure in an auxiliary background worker (e.g. Memory Forge transient error) never breaks active story playback or UI responsiveness.

```javascript
export function create_job_queue(options = {}) {
  return {
    run: (async_task) => Promise,
    is_busy: () => Boolean,
    clear: () => void,
  };
}
```

---

## 2. Dynamic Turn Delegation & Multi-Entity Routing

### 2.1 Forward Compatibility with the Multi-NPC Track

In preparation for `track-npc-expansion-2026-08-14`, speaker delegation is designed as a **dynamic entity selector** rather than a rigid binary flag.

```text
Director Decision: "speaker"
         │
         ├──► "ai" / "AI_CHARACTER" ──► Primary Companion Engine (render_character)
         ├──► "fractal" / "FRACTAL"  ──► World / Environment Engine (build_narrator)
         └──► "npc:<id>" / "<name>"  ──► Secondary In-Scene NPC Engine (build_npc_prompt)
```

### 2.2 Reactive Thinking State & UI Presentation

- **State Store**: `status.svelte.js` tracks:
  - `generating_entity_type`: `"ai" | "fractal" | "user" | "npc"`
  - `generating_entity_name`: string (e.g. `"Lord Benedict Silvers"`, `"Ashenweald"`, `"Dr. Elias Tariq"`)
  - `generating_entity_avatar`: string | null
  - `generating_entity_color`: string | null
- **UI Binding**: `Storymode.svelte`, `Message.svelte`, and the input bar dynamically bind their status indicators, pulsing halos, and name badges to whichever entity is actively speaking.

---

## 3. Dual-Layer Somatic & Trauma Directives Engine

### 3.1 Universal Static Somatic & Trauma Registry (`src/data/definitions/somatic-triggers.js`)

| Trigger Keyword     | Physical Somatic Tells                                                                  | Injected Directive                                                                                        |
| :------------------ | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `shame`             | Averted eye contact, fidgeting fingers, heat rising in ears/collar, hunched shoulders.  | Weave involuntary physical shame tells; character attempts verbal deflection while body collapses inward. |
| `fear`              | Shallow breathing, locked jaw, cold sweat, scanning physical exits.                     | Physical freeze/flight response; hyper-vigilant scanning of immediate space.                              |
| `vulnerability`     | Unclenching hands, softened gaze, hesitant cadence, dropped defensive posture.          | Defensive walls softening; cautious, tentative physical opening.                                          |
| `betrayal`          | Throat constricted, cold hands, sudden step backward, guarded silence.                  | Acute trust collapse; sudden physical withdrawal and rigid skepticism.                                    |
| `abandonment`       | Hollow stomach, chest tightness, searching gaze, abrupt cling or preemptive detachment. | Panic of separation; hyper-reactive to perceived emotional distance.                                      |
| `emotional_neglect` | Affect numbness, flat monotone delivery, drifting gaze, motionless hands.               | Affect blunting and quiet withdrawal; disengages from connection effort.                                  |
| `defiance`          | Raised chin, rigid spine, locked eye contact, squared stance.                           | Open resistance and pride; physical assertion against authority or pressure.                              |
| `intimacy`          | Leaning inward, softened micro-expressions, matched breathing tempo, lingering contact. | Sensory closeness and reduced spatial distance; warmth and physical presence.                             |
| `grief`             | Heavy swallow, pressure behind eyes, decelerated motor cadence, weighted pauses.        | Visceral emotional weight; speech slowed and anchored in physical heaviness.                              |
| `dominance`         | Deliberate unhurried movements, spatial expansion, steady downward gaze.                | Assert spatial control; unwavering presence and physical command.                                         |
| `deception`         | Calculated micro-pauses, forced smoothness, throat clearing, stiff hands.               | Over-managed composure; unnatural control concealing rapid internal calculation.                          |
| `dysregulation`     | Pacing, fine motor tremors, erratic vocal cadence, rapid uneven respiration.            | Cognitive overload; fragmented sentences and chaotic motor agitation.                                     |

### 3.2 Dynamic Style Motifs (`src/data/definitions/narrative-styles.js`)

Active narrative styles export contextual motifs (e.g. Hemingway contributes `stoic_pain` and `iceberg_subtext`; Gibson contributes `high_tech_low_life` and `flickering_neon_data`; Martin contributes `court_paranoia` and `bitter_confrontation`).

### 3.3 Prompt Compilation Flow

1. **Director Context**: Director receives `<AVAILABLE_KEYWORDS>` combining the 12 static archetypes with active style motifs.
2. **Director Selection**: Director JSON selects 1–2 applicable keywords: `"keywords": ["shame", "stoic_pain"]`.
3. **Storyteller Injection**: The resolved definitions are injected directly into the active speaker's prompt:

```xml
<SOMATIC_DIRECTIVES>
- shame: Involuntary physical shame tells (averted gaze, flushed neck); attempts verbal deflection while posture collapses inward.
- stoic_pain: Mask pain behind curt declarative statements; heavy unspoken subtext.
</SOMATIC_DIRECTIVES>
```

---

## 4. Narrative Behavioral Protocols

```text
┌────────────────────────────────────────────────────────┐
│                      THE CHARACTER                     │
│                                                        │
│   Social Mask (Verbal)       Somatic Leakage (Body)    │
│   ┌──────────────────────┐   ┌──────────────────────┐  │
│   │ "Everything is fine. │   │ Hands trembling;     │  │
│   │  We should proceed." │ ◄─┼─► refusing eye contact;│  │
│   └──────────────────────┘   │  shallow breathing.  │  │
│                              └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 4.1 Masking vs. Somatic Leakage

- **The Mask**: Spoken dialogue asserts composure, compliance, indifference, or authority.
- **The Leakage**: Involuntary physical tells betray the underlying emotional or psychological state.

### 4.2 Input Pacing Calibration

- **Short / Sharp Clauses** ➔ High tension, acute danger ➔ Short staccato sentence structures, high kinetic pacing.
- **Multi-Clausal / Wandering Sentences** ➔ Comfort, reflection, intimacy ➔ Rich multi-clause flow, sensory interiority.
- **Silence / Minimal Input** ➔ Passive resistance, freeze ➔ Escalated immediate tension, direct probing dialogue.

### 4.3 Action Handoffs & Dominant Hooks

- **Critical Action Handoff**: For high-stakes physical actions (striking a blow, pulling a trigger, opening a sealed chamber), describe the sensory buildup up to the exact threshold of impact, then **stop immediately** to yield agency to the player.
- **Dominant Hooks**: Every turn terminates on an active hook:
  - `[Statement]`: A provocative, unresolved assertion.
  - `[Action]`: A physical movement demanding response.
  - `[Hover]`: An incomplete motion frozen on the edge of consequence.
  - `[Silence]`: A heavy, loaded conversational pause.

---

## 5. Story Resolution & "The End" Screen Architecture

### 5.1 Terminology & System Taxonomy

- **The Story**: The living triad comprising **1 Fractal (World/Setting)** + **2 Characters (AI Companion + User Persona)**.
- **The Story Quest**: The Fractal entity's `future` standing agenda (the driving overarching conflict, crisis, or macro-mission of the story).
- **Resolution States**:
  - `CONCLUDED` (Victory / Climax): The overarching story quest was triumphantly achieved or resolved.
  - `COLLAPSED` (Failure / Tragedy): The overarching story quest reached an irrevocable loss state or cataclysm.
  - `EPILOGUE` (Manual Closure): The player manually drew the curtains on the story via the Console.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        STORY RESOLUTION & THE END SCREEN FLOW                          │
│                                                                                        │
│  [Director Detects Resolution] OR [Player Clicks "END STORY"]                          │
│                              │                                                         │
│                              ▼                                                         │
│  [Gamemaster Epilogue Synthesis] (Prose Chronicle + Atmospheric Visual)                │
│                              │                                                         │
│                              ▼                                                         │
│  [Dexie Story Concluded] (is_concluded: true, conclusion_status: "CONCLUDED"|"COLLAPSED")│
│                              │                                                         │
│                              ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    "THE END" / STORY CONCLUDED SCREEN VIEW                       │  │
│  │                                                                                  │  │
│  │  1. Satisfy Cursive Title & Status Badge ("STORY CONCLUDED" / "STORY COLLAPSED") │  │
│  │  2. Epilogue Chronicle & Journey Summary                                         │  │
│  │  3. The Final Entity Trio (User Persona, AI Companion, Fractal in final state)   │  │
│  │  4. Journey Statistics (Rounds, Forged Memories, Dynamics Trajectory)            │  │
│  │  5. Action Deck:                                                                 │  │
│  │     • [Return to Storyboard] (Releases claims, resets lobby)                     │  │
│  │     • [Export Story .md] (Downloads clean novel export)                          │  │
│  │     • [Review Chronicle] (Toggles full feed in read-only mode)                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Epilogue & "The End" Component (`src/ui/message/Epilogue.svelte`)

Splits the legacy `PrologueEpilogue.svelte` into two clean, dedicated components: `src/ui/message/Prologue.svelte` for the opening story flight, and `src/ui/message/Epilogue.svelte` for the story conclusion:

1. **Atmospheric Header**: Cursive title in `Satisfy` font with glowing signature drop-shadow and an outcome badge (`✨ STORY CONCLUDED` / `💀 STORY COLLAPSED` / `📜 THE END`).
2. **The Chronicle Summary**: The AI-synthesized epilogue capturing the climax, unresolved echoes, and final consequences of the trio's choices.
3. **The Final Entity Trio**: Displays the final state of the User, AI Character, and Fractal (showing final inventory, non-physical states, and lifetime forged memory counts).
4. **Action Deck**:
   - **Return to Storyboard**: Closes story session, unlocks entity claims, and navigates to `app.set_view("storyboard")`.
   - **Export Story**: Triggers instant download of the clean markdown novel transcript (`export_story_markdown`).

---

## 6. Technical Schemas & Data Contracts

### 6.1 Expanded Director JSON Schema (`src/intelligence/prompts.js`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DirectorTurnPayload",
  "type": "object",
  "required": ["_thought_process", "speaker", "mutations"],
  "properties": {
    "_thought_process": {
      "type": "string",
      "description": "Evaluation of user pacing, masking delta, and dramatic momentum."
    },
    "speaker": {
      "type": "string",
      "description": "Delegates active turn execution: 'ai', 'fractal', or a specific entity ID."
    },
    "keywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "1-2 somatic or style keywords to inject into the storyteller prompt."
    },
    "directive": {
      "type": "string",
      "description": "Unseen directorial stage direction for the active speaker."
    },
    "story_status": {
      "type": "string",
      "enum": ["IN_PROGRESS", "CONCLUDED", "COLLAPSED"],
      "description": "Trigger when the overarching story quest reaches victory resolution or tragic failure."
    },
    "mutations": {
      "type": "object",
      "description": "Entity state and dynamics updates."
    }
  }
}
```

### 6.2 Storyteller `<SOMATIC_DIRECTIVES>` Prompt Injection

```xml
<SOMATIC_DIRECTIVES>
- shame: Weave involuntary physical shame tells (averted gaze, flushed neck); attempts verbal deflection while posture collapses inward.
- stoic_pain: Mask pain behind curt declarative statements; heavy unspoken subtext.
</SOMATIC_DIRECTIVES>
```

---

## 7. Implementation Roadmap (Phased TDD)

### Phase 1: Concurrency & Data Registries (Red ➔ Green)

- [x] **1.1 Job Queue**: Implement `create_job_queue()` in `src/utils/job-queue.js` with tests in `src/utils/job-queue.test.js` (testing worker execution, latest-pending overwrite, error isolation).
- [x] **1.2 Static Somatic Registry**: Create `src/data/definitions/somatic-triggers.js` exporting `SOMATIC_REGISTRY` (12 archetypes with physical tells and directives).
- [x] **1.3 Style Keywords**: Export dynamic `keywords` from all narrative styles in `src/data/definitions/narrative-styles.js`.

### Phase 2: Intelligence & Prompt Compilation (Red ➔ Green)

- [x] **2.1 Director Schema Update**: Update `render_director()` in `src/intelligence/prompts.js` to expose `<AVAILABLE_KEYWORDS>` and accept expanded schema fields (`speaker`, `keywords`, `story_status`).
- [x] **2.2 Somatic Directives Resolver**: Implement `resolve_somatic_directives(keywords, active_style)` in `src/intelligence/prompts.js` and inject `<SOMATIC_DIRECTIVES>` into `render_character()` and `build_narrator()`.
- [x] **2.3 Director Parser & Fallbacks**: Update `parse_director_json()` in `src/intelligence/kernel.js` with defensive fallbacks (`speaker: "ai"`, `keywords: []`, `story_status: "IN_PROGRESS"`).

### Phase 3: Kernel Execution & Speaker Routing (Red ➔ Green)

- [x] **3.1 Dynamic Speaker Routing**: Update `gamemaster.execute_turn()` in `kernel.js` to dispatch execution dynamically to the delegated entity engine based on `director_data.speaker`.
- [x] **3.2 Parallel Background Workers**: Wire non-critical background jobs (Memory Forge, visual prompt generation, Dexie checkpoints) through `job_queue.run()`. — _partial: only ghost sweeps run through the queue today; the others remain direct fire-and-forget calls._
- [x] **3.3 Reactive UI Wiring**: Connect `status.generating_entity_type`, `status.generating_entity_name`, and avatar bindings in `status.svelte.js`, `Storymode.svelte`, and `Message.svelte`.

### Phase 4: Story Resolution & Epilogue Screen

- [x] **4.1 Split Prologue & Epilogue**: Split `PrologueEpilogue.svelte` into `src/ui/message/Prologue.svelte` and `src/ui/message/Epilogue.svelte`, updating `Message.svelte` and `index.js`.
- [x] **4.2 Automatic Conclusion Dispatch**: When Director detects `story_status === "CONCLUDED" | "COLLAPSED"`, automatically trigger `gamemaster.execute_epilogue()`. — _landed 2026-08-16, incl. the COLLAPSED branch and a double-dispatch guard._
- [x] **4.3 Epilogue Action Deck**: Wire `handle_return_to_storyboard()` and `handle_export_story()` directly into `Epilogue.svelte`.

### Phase 5: Verification & Gate Pass

- [x] **5.1 Full Test Suite**: Run `npm run verify` (achieve 0 errors, 0 warnings across all test suites). — _test suite in repo (job-queue, somatic-triggers, prompts, kernel, temporal, …); run `npm run verify` to confirm the 0-warning gate before archive._
- [x] **5.2 Singlefile Build**: Run `npm run deploy:prepare` to confirm single-file bundle builds cleanly.
