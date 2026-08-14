# 🚀 Implementation Blueprint — `track-director-expansion-2026-08-14`

> **Track Goal**: Harden and expand the Director turn pipeline with six major architectural capabilities:
>
> 1. **Director Job Queue**: A single-runner asynchronous background job queue with latest-pending-replay semantics to serialize turn background writes (memory updates, Memory Forge, visual sweeps, session checkpointing) without race conditions.
> 2. **Fractal Turn Delegation & Dynamic Thinking State**: Grant the Director the ability to pass narrative control directly to the Fractal (Environment/World), dynamically switching generation prompts and updating the "thinking" UI state to display the delegating entity's avatar/badge instead of a hardcoded AI Character chat bubble.
> 3. **Dual-Layer Keyword-Triggered Somatic & Trauma Injections**: Enable the Director to analyze incoming user interaction, identify psychological dynamics from a defined somatic and trauma registry (e.g. `shame`, `fear`, `betrayal`, `abandonment`, `emotional_neglect`, `vulnerability`, `intimacy`, `defiance`, `dysregulation`), and output selected keywords in the Director JSON payload to deterministically inject somatic physical tells (_"Show, Don't Tell"_) into the Storyteller generation prompt.
> 4. **User Pacing Analysis & Empathy Reading**: Analyze input sentence rhythm (short/sharp vs. wandering vs. silence) to calibrate Storyteller sentence pacing and cognitive urgency.
> 5. **Masking vs. Somatic Leakage & Dominant Hooks**: Model the friction between social masks and involuntary bodily leakage under stress; enforce kinetic handoffs on high-stakes actions and assertive turn closers (`[Statement]`, `[Action]`, `[Hover]`, `[Silence]`).
> 6. **Fractal Future Quest Lifecycle & Episodic Chapter Branching**: Treat the Fractal's `future` standing agenda as the macro-story completion condition (with explicit victory and fail conditions); upon resolution, automatically split/fork the Fractal into an archived record (e.g. `Nova City — Chapter 1`) and a fresh mutated active chapter (e.g. `Nova City — Chapter 2`).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          TURN LIFECYCLE                                │
│                                                                        │
│  [User Input] ──► [Director Evaluation] ──► [Prompt Compilation]       │
│                         │                            │                 │
│                         ├─ Pacing Analysis           ├─ Somatic Layer  │
│                         ├─ Keyword Selection         ├─ Style Motifs   │
│                         ├─ Speaker Delegation        └─ Fractal Quest  │
│                         │                                              │
│                         ▼                            ▼                 │
│  [Async Job Queue] ◄── [Output & Hooks] ◄── [Prose Generation]         │
│   (Memory/Forge/Fork)   (Character/Fractal)   (Storyteller Engine)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Turn Lifecycle & Architectural Pipeline

Every narrative turn flows through a synchronized pipeline that decouples analytical parsing from creative rendering, followed by serializing background state mutations.

```text
                  ┌────────────────────────┐
                  │       User Input       │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │    Director Engine     │
                  │   (Parser & Decider)   │
                  └─────┬────────────┬─────┘
                        │            │
         Keywords / Pacing           Speaker Decision
                        │            │
                        ▼            ▼
             ┌────────────────┐   ┌──────────────────────┐
             │ Compiled Prompt│   │ Routing:             │
             │ (<SOMATIC_...>)│   │ AI_CHARACTER/FRACTAL │
             └────────┬───────┘   └──────────┬───────────┘
                      │                      │
                      └───────────┬──────────┘
                                  │
                                  ▼
                      ┌──────────────────────┐
                      │  Storyteller Engine  │
                      │  (Prose Generation)  │
                      └───────────┬──────────┘
                                  │
                                  ▼
                      ┌──────────────────────┐
                      │ Final Output & Hooks │
                      │ (Prose + Cutaways)   │
                      └───────────┬──────────┘
                                  │
                                  ▼
                      ┌──────────────────────┐
                      │ Async Write Queue    │
                      │ (Memory, Forge, Fork)│
                      └──────────────────────┘
```

---

## 2. Core Engine Subsystems

### A. Director Asynchronous Job Queue (`src/utils/job-queue.js`)

Background operations (memory consolidation, Memory Forge updates, visual sweeps, session checkpointing, and chapter forking) must not block narrative delivery or trigger write collisions.

```text
Incoming Turn Jobs ──► [ Queue Handler ]
                             │
                             ├─► [In-Flight Task] (Active Execution)
                             │
                             └─► [Latest Pending] ──► Replaces older waiting jobs
                                                      (Executes upon drain)
```

- **Single In-Flight Execution**: Strict concurrency limit of 1.
- **Latest-Pending Semantics**: If a new write arrives while the queue is busy, it overwrites any non-running pending job and fires immediately once the current job resolves.
- **Error Isolation**: A rejected promise terminates only that specific task; the queue runner stays alive.
- **Clean Teardown**: Component unmounting drops pending jobs without aborting the active in-flight promise.

```javascript
// Interface Definition
export function create_job_queue(options = {}) {
  return {
    run: (async_task) => Promise, // Enqueues task, returns resolution promise
    is_busy: () => Boolean, // Current execution state
    clear: () => void, // Drops all pending jobs
  };
}
```

---

### B. Dynamic Turn Delegation & Reactive UI (`src/intelligence/kernel.js`)

The Director dynamically assigns narrative ownership between the active Character and the Fractal world entity.

- **Delegation Routing**: `DIRECTOR_JSON_SCHEMA` exposes `"next_speaker": "AI_CHARACTER" | "FRACTAL"`.
- **Prose Engine Invocation**:
  - `AI_CHARACTER` $\rightarrow$ Standard character persona engine (`role: "assistant"`).
  - `FRACTAL` $\rightarrow$ Environmental/world narrator engine (`role: "fractal"`).
- **Reactive Thinking State**: `status.svelte.js` tracks `generating_entity: "ai" | "fractal"`. The frontend streaming placeholder dynamically binds the badge, avatar, and style color of the active entity.

---

### C. Dual-Layer Somatic & Trauma Injection Pipeline

Separates abstract psychological calculation from prose generation by injecting explicit somatic directives into the prompt.

```text
Static Core Registry (12 Archetypes)
                +                     ──► Compile <AVAILABLE_KEYWORDS> ──► Director Selects Keywords
Dynamic Style Motifs (23 Styles)
                                                                                  │
                                                                                  ▼
Storyteller Prompt ◄── Injected into <SOMATIC_DIRECTIVES> ◄── Resolved Directives Engine
```

#### Layer 1: Universal Static Somatic & Trauma Registry (`src/data/definitions/somatic-triggers.js`)

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

#### Layer 2: Dynamic Narrative Style Keywords (`src/data/definitions/narrative-styles.js`)

Active narrative styles export contextual motifs (e.g., Hemingway contributes `stoic_pain` and `iceberg_subtext`).

#### Prompt Compilation & Injection Flow

1. **Director Compilation**: System merges static keys with active style keys into `<AVAILABLE_KEYWORDS>`.
2. **Director Selection**: Director outputs `"keywords": ["shame", "stoic_pain"]`.
3. **Kernel Resolution**: System looks up full directive definitions and injects a unified block into the Storyteller prompt:

```xml
<SOMATIC_DIRECTIVES>
- shame: Weave involuntary physical shame tells; character attempts verbal deflection while body collapses inward.
- stoic_pain: Mask pain behind curt, declarative statements; heavy unspoken subtext.
</SOMATIC_DIRECTIVES>
```

---

### D. Fractal Future Quest Lifecycle & Episodic Chapter Branching

The Fractal's `future` (Standing Agenda) functions as the engine's macro-objective, turning environments into living, evolving quests:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     FRACTAL QUEST STATE MACHINE                        │
│                                                                        │
│  [Active Fractal] ──► Evaluates user actions against `future` agenda   │
│         │                                                              │
│         ├──► [IN_PROGRESS] (Standard turn progression)                 │
│         │                                                              │
│         └──► [RESOLUTION TRIGGER] (Victory or Failure Condition met)   │
│                     │                                                  │
│                     ▼                                                  │
│          ┌───────────────────────┐                                     │
│          │  EPISODIC FORK / SPLIT│                                     │
│          └──────────┬────────────┘                                     │
│                     │                                                  │
│       ┌─────────────┴─────────────┐                                    │
│       ▼                           ▼                                    │
│  [Archived Record]       [Active Next Chapter]                         │
│  "Nova City — Chapter 1" "Nova City — Chapter 2"                       │
│  (Persisted to DB)       (Mutated environment & fresh future quest)    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Fractals as Living Quests**: Unlike character micro-agendas, the Fractal's `future` defines the macro-environment narrative trajectory (e.g. _"Stabilize the lower power grid before the storm breaches containment"_).
- **Mandatory Victory & Failure Conditions**: Every synthesized Fractal `future` must explicitly declare both victory outcomes and fatal failure thresholds:
  - _Victory Condition_: Concrete milestone that resolves the active narrative arc.
  - _Failure Condition_: Irrevocable environmental collapse, deadline breach, or loss state forcing a dramatic transition.
- **Episodic Splitting & Chapter Forking Protocol**:
  - When the Director flags `"fractal_quest_status": "COMPLETED" | "FAILED"`:
    - **Chapter Snapshot (The Record)**: The completed Fractal is renamed (e.g. `"${name} — Chapter 1"`), marked as archived in IndexedDB (`Dexie.js`), preserving its historical logs and chronicle facts.
    - **Chapter Genesis (The Vanguard)**: A new mutated clone is birthed as `"${name} — Chapter 2"`. The AI synthesizes a fresh `future` standing agenda with heightened stakes and new failure conditions, updating `runtime.active_fractal` seamlessly.

---

## 3. Narrative Behavioral Rules & Mechanics

```text
                       INPUT DYNAMICS
                 (Sentence Structure / Cadence)
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      [Short / Sharp]    [Wandering]        [Silence]
            │                 │                 │
            ▼                 ▼                 ▼
     Heightened Pace   Sensory Depth      Confrontation
     Punchy Rhythm     Slower Cadence     Tension Escalation
```

### A. Input Pacing Calibration

- **Short / Sharp Clauses**: Signal high tension, acute stress, or physical aggression.
  - _Storyteller Response_: Short sentence structures, high kinetic pacing, hyper-vigilant sensory details.
- **Multi-Clausal / Wandering Sentences**: Signal reflection, comfort, vulnerability, or intimacy.
  - _Storyteller Response_: Expansive multi-clause descriptive flow, rich interiority, decelerated tempo.
- **Silence / Minimal Tokens**: Signal emotional freeze, passive resistance, or sudden detachment.
  - _Storyteller Response_: Escalated immediate tension, direct probing dialogue, environmental intrusion.

---

### B. Masking vs. Somatic Leakage

When psychological tension rises, dialogue and physiology must actively pull in opposite directions:

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

- **The Mask**: The spoken dialogue asserts composure, compliance, indifference, or control.
- **The Leakage**: The body betrays the mask through involuntary physical tells (white knuckles, throat clearing, averted gaze, rigid posture).

---

### C. Critical Action Handoffs & Dominant Hooks

- **Critical Action Handoff**: For high-stakes actions (e.g., throwing a punch, pulling a trigger, opening a forbidden door), describe the sensory buildup up to the threshold of impact, then **stop immediately** to yield agency to the player.
- **Dominant Hooks**: Every narrative turn must terminate with an active hook, never fading into passive resolution:
  - **`[Statement]`**: A direct, provocative, or unresolved assertion.
  - **`[Action]`**: A physical movement demanding an immediate response.
  - **`[Hover]`**: An incomplete motion frozen right before consequence.
  - **`[Silence]`**: A deliberate, heavy conversational pause loaded with tension.

---

### D. Cinematic Cutaways (`[MEANWHILE: ...]`)

When `Director Impact > High` or when background world systems mutate outside the immediate scene:

- Append a third-person vignette (50–100 words) to the end of the narrative turn:

```text
---
[MEANWHILE: Sector 7 - Outpost Gate]
A low rumble shudders through the iron floorplates as the heavy blast doors begin their descent, sparks cascading across the frozen mud.
```

---

### E. Author DNA Profiles

| Profile                |   POV Stance   | Internal / Action Ratio | Syntactic Rhythm & Signature Style                                                                |
| :--------------------- | :------------: | :---------------------: | :------------------------------------------------------------------------------------------------ |
| **Lee Child**          |   3rd Close    |        40% / 60%        | Terse, punchy, staccato clauses; raw physical mechanics and tactical geometry over metaphor.      |
| **Cara McKenna**       |    Deep 3rd    |        70% / 30%        | Gritty working-class realism; tactile textures, rough contact, heavy somatic interiority.         |
| **William Gibson**     |  3rd Detached  |        30% / 70%        | Neon-noir density; technical jargon, body alienation, relentless sensory data streams.            |
| **George R.R. Martin** |  3rd Limited   |        60% / 40%        | Political grit; tactical heraldry, physical degradation, blood, food, and strategic calculations. |
| **Sally Rooney**       | 3rd Minimalist |        50% / 50%        | Clinical detachment; unquoted dialogue, subtle interpersonal leverage shifts.                     |
| **Edgar Allan Poe**    | 1st Obsessive  |        90% / 10%        | Baroque cadence; hyperacusis, claustrophobic dread, escalating internal collapse.                 |

---

## 4. Unified Author Style Catalog (23 Author Profiles)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STYLE REGISTRY TAXONOMY                         │
│                                                                        │
│  [Psychological / Introspective]  [Hardboiled / Noir / Kinetic]        │
│  Anaïs Nin, Sally Rooney,         Lee Child, Cara McKenna,             │
│  Edgar Allan Poe, Bertolucci      Ernest Hemingway, Arthur Morgan      │
│                                                                        │
│  [Speculative / Dread / Sci-Fi]   [Grit / Epic / Romance]              │
│  Gibson, PKD, Lovecraft, Lynch    GRRM, Abercrombie, Tolkien, King,    │
│                                   Austen, Douglas, Zaires, Carlton     │
└────────────────────────────────────────────────────────────────────────┘
```

### Psychological & Introspective

#### 1. Anaïs Nin (`anais_nin`)

- `internal_conflict`: Stream-of-consciousness psychoanalytic introspection and emotional ambiguity.
- `mirrors_and_reflections`: Catching fleeting reflections in glass; studying micro-expressions for hidden intent.
- `diary_or_journal`: Intimate focus on handwriting, tactile paper, and private confessions.

#### 2. Sally Rooney (`sally_rooney`)

- `seamless_intimacy`: Unquoted dialogue blended with fluid, forensic dissections of relational power.
- `text_screen_silence`: Fixation on unread messages, screen glare, or modern conversational voids.

#### 3. Edgar Allan Poe (`edgar_allan_poe`)

- `morbid_unraveling`: Distorted temporal perception, sensory panic, and visceral cardiovascular awareness.
- `stains_and_rot`: Decaying masonry, moisture rings, and lingering scents of ancient decay.

#### 4. Bernardo Bertolucci (`bernardo_bertolucci`)

- `rebellious_intimacy`: Framing physical vulnerability and touch as open defiance of societal authority.
- `dusty_sunlit_room`: Suspended dust motes, faded elegance, and warm domestic shadows.
- `tango_cadence`: Deliberate, rhythmic choreography between characters; sustained eye contact.
- `distant_protest`: Ambient background tension—muffled sirens, distant shouts, peripheral urban noise.

---

### Hardboiled, Noir & Kinetic Realism

#### 5. Lee Child (`lee_child`)

- `tactical_leverage`: Sentence fragments calculating physical mechanics, balance, angles, and impact force.
- `procedural_deduction`: Microscopic evaluation of room layout, entry points, clothing, and posture.
- `black_coffee_solitude`: Scalding diner coffee and detached, transient isolation.

#### 6. Cara McKenna (`cara_mckenna`)

- `raw_trauma_grounding`: Present-tense time dilation anchored by hyper-vigilant physical body awareness.
- `calloused_hands`: Work-worn skin, unpolished textures, and grounded physical contact.

#### 7. Ernest Hemingway (`ernest_hemingway`)

- `iceberg_subtext`: Curt declarative prose carrying heavy unstated subtext; zero decorative adverbs.
- `stoic_pain`: Swallowing dryly, steadying a hand on a counter, enduring internal distress in silence.
- `whiskey_and_elements`: Black coffee, cheap liquor, and harsh weather exposure.

#### 8. Arthur Morgan (`arthur_morgan`)

- `deep_3rd_weariness`: World viewed through moral exhaustion, survival pragmatism, and physical aches.
- `antihero_bathos`: Dramatic moments punctured by a cough, lighting tobacco, or bodily discomfort.
- `spent_cartridges`: Scent of black powder, clinking brass shells, and a gaze shadowed beneath a hat brim.

---

### Dark Romance & High-Tension Fiction

#### 9. Anna Zaires (`anna_zaires`)

- `captivity_hypervigilance`: Counting footsteps, tracking exit vectors, claustrophobic breathing.
- `forced_compliance`: Curt commands met with internal calculation of physical consequences.
- `compound_or_cage`: Heavy deadbolts, isolated compounds, and spatial confinement.

#### 10. H.D. Carlton (`hd_carlton`)

- `predatory_focus`: Sensory tunnel vision narrowing completely to an immediate stalking presence.
- `shadow_mask`: Unseen movements, veiled faces, and silent predatory stalking.
- `single_token`: A deliberate keepsake or calling card left inside a private space.

#### 11. Penelope Douglas (`penelope_douglas`)

- `combative_tension`: Banter charged with volatile friction and unyielding proximity.
- `physical_dare`: Reckless adrenaline spikes, escalating wagers, and testing boundaries.
- `muscle_car_roaring`: Engine vibrations, asphalt heat, and worn car interior leather.

#### 12. Jane Austen (`jane_austen`)

- `social_leverage`: Conversational sparring regarding fortune, status, and societal standing.
- `handwritten_letter`: Scrutinizing wax seals, penmanship variations, and implied meaning.

---

### Sci-Fi, Surrealism & Cosmic Horror

#### 13. William Gibson (`william_gibson`)

- `high_tech_low_life`: Corrupted memory files, urban decay, and exposed cybernetics.
- `flickering_neon_data`: Corporate watermarks, acid-rain mist, and overwhelming HUD data streams.

#### 14. Philip K. Dick (`philip_k_dick`)

- `reality_dissociation`: Acute depersonalization; questioning whether current surroundings are authentic.
- `glowing_ads`: Intrusive commercial holograms cutting through grime and exhaust.
- `counterfeit_id`: Synthetic documentation, forged credentials, and unstable memory implants.

#### 15. David Lynch (`david_lynch`)

- `cryptic_stasis`: Uncomfortably drawn-out cadences and fixations on mundane objects.
- `red_curtains_nightmare`: Symbolic dread, dream logic, and rich tactile velvet.
- `flickering_neon`: Chromatic aberration and the low drone of an electrical hum.

#### 16. H.P. Lovecraft (`hp_lovecraft`)

- `non_euclidean_dread`: Impossible architectural angles provoking physiological vertigo and panic.
- `ancient_monolith`: Cyclopean stone structures, non-human carvings, and oceanic slime.
- `antiquarian_tome`: Brittle vellum bindings, translated blasphemies, and decaying inks.

---

### Literary, Epic & Speculative Realism

#### 17. Cormac McCarthy (`cormac_mccarthy`)

- `relentless_brutality`: Unpunctuated clauses and clinical, unvarnished depictions of violence.
- `indifferent_nature`: Archaic, biblical phrasing set against an unfeeling landscape.
- `dried_blood_stone`: Forensic focus on dried blood, limestone dust, and elemental wear.

#### 18. George R.R. Martin (`george_rr_martin`)

- `court_paranoia`: Calculating hidden leverage, shifting alliances, and unspoken threats.
- `bitter_confrontation`: Caustic verbal exchanges layered with internal strategic calculation.
- `lavish_feasting`: Sensory immersion in rendered fats, roasted meats, sour wine, and spilled salt.
- `recalled_lineage`: Reciting historical grievances, ancestral heraldry, and ancient bloodlines.

#### 19. Haruki Murakami (`haruki_murakami`)

- `domestic_solitude`: Quiet focus on mundane rituals—brewing black coffee, boiling noodles, folding laundry.
- `metaphorical_void`: Melancholic introspection and subtle surreal ruptures in daily life.
- `spinning_jazz_record`: Vinyl surface noise and jazz standards in a dim room.
- `unexplained_vanished`: Lingering grief over someone who vanished without explanation.
- `stray_cat_watching`: An alley cat observing proceedings with detached interest.

#### 20. J.R.R. Tolkien (`jrr_tolkien`)

- `ancient_wild`: Primeval forests, ancient roots, and moss-covered forgotten paths.
- `song_and_lineage`: Solemn historical laments, ancient lineage recitations, and mythic weight.

#### 21. Samuel R. Delany (`samuel_delany`)

- `urban_decay_texture`: Interlocking philosophical monologues, crumbling infrastructure, and damp concrete.
- `tactile_leather`: Worn jackets, weathered denim, and the tactile reality of the streets.

#### 22. Stephen King (`stephen_king`)

- `nostalgic_ephemera`: Specific period brands, radio pop tunes, and suburban domestic clutter.
- `creeping_smalltown_rot`: Mundane community warmth masking a festering, predatory presence.

#### 23. Joe Abercrombie (`joe_abercrombie`)

- `grimdark_cynicism`: Weary gallows humor puncturing heroic expectations.
- `visceral_discomfort`: Mud-caked gear, throbbing scar tissue, damp cold, and grease.
- `punchy_violence`: Fast, unglamorous physical combat focused on mess and sudden impact.

---

## 5. Technical Schemas & File Specifications

```text
                     FILE TOUCHPOINT MAP

  [Prompts & Schemas]               [Kernel Execution]
  src/intelligence/prompts.js  ──►  src/intelligence/kernel.js
             │                                │
             ▼                                ▼
  [Definitions]                     [Background Queue & DB]
  src/data/definitions/             src/utils/job-queue.js
  ├── somatic-triggers.js           src/data/db.js (Dexie)
  └── narrative-styles.js                     │
                                              ▼
                                    [Reactive UI Layer]
                                    src/state/status.svelte.js
                                    src/ui/message/Message.svelte
```

### A. Director Output Schema (`src/intelligence/prompts.js`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DirectorTurnPayload",
  "type": "object",
  "required": ["internal_monologue", "dynamics_delta", "next_speaker", "keywords", "fractal_quest_status"],
  "properties": {
    "internal_monologue": {
      "type": "string",
      "description": "Analysis of user pacing, psychological tension, and masking delta."
    },
    "dynamics_delta": {
      "type": "object",
      "description": "Numerical or relational state mutations."
    },
    "next_speaker": {
      "type": "string",
      "enum": ["AI_CHARACTER", "FRACTAL"],
      "description": "Delegates narrative output to either the character or the world engine."
    },
    "keywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Selected triggers from the static somatic registry and active style registry."
    },
    "fractal_quest_status": {
      "type": "string",
      "enum": ["IN_PROGRESS", "COMPLETED", "FAILED"],
      "description": "Status of the active Fractal's macro future standing agenda quest."
    },
    "quest_resolution_notes": {
      "type": "string",
      "description": "Explanation of the victory or failure condition triggered."
    }
  }
}
```

---

### B. Prompt Injections (`src/intelligence/prompts.js` & `kernel.js`)

```javascript
// Compiled palette passed to the Director LLM:
`<ACTIVE_FRACTAL_QUEST>
Entity: ${active_fractal.name}
Standing Agenda: ${active_fractal.future.agenda}
Victory Condition: ${active_fractal.future.victory_condition}
Failure Condition: ${active_fractal.future.failure_condition}
</ACTIVE_FRACTAL_QUEST>

<AVAILABLE_KEYWORDS>
Static Core: [shame, fear, vulnerability, betrayal, abandonment, emotional_neglect, defiance, intimacy, grief, dominance, deception, dysregulation]
Active Style (${active_style.name}): [${Object.keys(active_style.keywords).join(", ")}]
</AVAILABLE_KEYWORDS>`
// Injected into the Storyteller LLM based on Director choices:
`<SOMATIC_DIRECTIVES>
${resolved_keyword_directives.map((d) => `- ${d.keyword}: ${d.directive} (${d.tells})`).join("\n")}
</SOMATIC_DIRECTIVES>`;
```

---

### C. Kernel Dispatch & Queue Serialization (`src/intelligence/kernel.js`)

```javascript
export async function execute_turn(user_input, session_state) {
  // 1. Run analytical Director evaluation
  const director_payload = await evaluate_director(user_input, session_state);

  // 2. Set active UI entity state
  status.generating_entity = director_payload.next_speaker === "FRACTAL" ? "fractal" : "ai";

  // 3. Resolve somatic directives & compile prompt
  const directives = resolve_keywords(director_payload.keywords);
  const storyteller_prompt = compile_storyteller_prompt(user_input, directives, director_payload);

  // 4. Generate narrative prose
  const response =
    director_payload.next_speaker === "FRACTAL" ? await render_fractal(storyteller_prompt) : await render_character(storyteller_prompt);

  // 5. Serialize background mutations & episodic branching safely via Job Queue
  job_queue.run(async () => {
    if (director_payload.fractal_quest_status && director_payload.fractal_quest_status !== "IN_PROGRESS") {
      await handle_fractal_chapter_fork(director_payload, session_state);
    }
    await update_entity_memory(director_payload.dynamics_delta);
    await consolidate_memory_forge();
    await sweep_visual_prompts();
    await persist_session_checkpoint(session_state);
  });

  return response;
}
```

---

## 6. Implementation Roadmap

```text
  PHASE 0 ──► PHASE 1 ──► PHASE 2 ──► PHASE 3 ──► PHASE 4 ──► PHASE 5
 (Schema)     (Tests)     (Logic)    (UI/Queue)   (Verify)   (Deploy)
```

### Phase 0: Schema Definition & Callpoint Mapping

- [ ] **Audit all background write locations** across `kernel.js`, `temporal.js`, and `session.svelte.js`.
- [ ] **Create static definitions catalog** at `src/data/definitions/somatic-triggers.js`.
- [ ] **Update Director JSON schema** in `src/intelligence/prompts.js` to include `next_speaker`, `keywords`, and `fractal_quest_status`.

### Phase 1: Test Suites (TDD / Red Phase)

- [ ] **Write Job Queue concurrency unit tests** in `src/utils/job-queue.test.js` (verify single-runner, latest-pending overwrite, error isolation).
- [ ] **Write Director payload parser tests** in `src/intelligence/parser.test.js` (verify fallback handling for `next_speaker`, `keywords`, and `fractal_quest_status`).
- [ ] **Write Prompt Compiler injection tests** in `src/intelligence/prompts.test.js` (verify `<SOMATIC_DIRECTIVES>` formatting and Fractal quest directives).
- [ ] **Write Kernel routing unit tests** in `src/intelligence/kernel.test.js` (verify delegation between `render_character` and `render_fractal`).
- [ ] **Write Fractal Chapter Forking unit tests** in `src/intelligence/kernel.test.js` (verify completed Fractal snapshot is archived as Chapter 1 and mutated clone becomes Chapter 2).

### Phase 2: Core Subsystem Implementation

- [ ] **Implement `create_job_queue` utility** in `src/utils/job-queue.js`.
- [ ] **Export `STATIC_SOMATIC_REGISTRY`** from `src/data/definitions/somatic-triggers.js`.
- [ ] **Wire narrative styles** to export style-specific `keywords` in `src/data/definitions/narrative-styles.js`.
- [ ] **Implement keyword resolver and prompt injector** inside `src/intelligence/prompts.js`.
- [ ] **Implement `handle_fractal_chapter_fork`** in `src/intelligence/kernel.js`.

### Phase 3: Kernel Integration & Reactive UI Wiring

- [ ] **Wrap all turn-based background mutations** in `kernel.js` and `session.svelte.js` with `job_queue.run()`.
- [ ] **Bind `status.generating_entity`** in `src/state/status.svelte.js`.
- [ ] **Update thinking indicator and message avatars** in `Message.svelte` and `Storymode.svelte` to reflect the active entity reactively.
- [ ] **Bind Chapter Transition state** in `Storymode.svelte` to render title banners when `handle_fractal_chapter_fork` creates a new chapter.

### Phase 4: System Verification

- [ ] **Execute verification test suite**: Run `npm run verify` (`test:unit`, `test:design`, `lint`, `svelte-check`).
- [ ] **Run interactive scenario simulations**:
  - Verify Director delegating to `FRACTAL` produces a `role: "fractal"` message with proper UI badges.
  - Verify keyword `shame` injects proper behavioral directives and triggers somatic leakage prose.
  - Verify resolving a Fractal future quest splits the entity into an archived Chapter 1 and spawns active Chapter 2.

### Phase 5: Deployment & Documentation

- [ ] **Compile production bundle**: Run `npm run build` to verify single-file artifact output.
- [ ] **Update documentation**: Record completed architectural upgrades in `tasks/PRESENT.md` and archive blueprint.
