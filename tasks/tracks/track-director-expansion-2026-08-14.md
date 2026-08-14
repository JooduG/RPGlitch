# 🚀 Implementation Blueprint — `track-director-expansion-2026-08-14`

> **Track Goal**: Harden and expand the Director turn pipeline with five major architectural capabilities:
>
> 1. **Director Job Queue**: A single-runner asynchronous background job queue with latest-pending-replay semantics to serialize turn background writes (memory updates, Memory Forge, visual sweeps, session checkpointing) without race conditions.
> 2. **Fractal Turn Delegation & Dynamic Thinking State**: Grant the Director the ability to pass narrative control directly to the Fractal (Environment/World), dynamically switching generation prompts and updating the "thinking" UI state to display the delegating entity's avatar/badge instead of a hardcoded AI Character chat bubble.
> 3. **Dual-Layer Keyword-Triggered Somatic & Trauma Injections**: Enable the Director to analyze incoming user interaction, identify psychological dynamics from a defined somatic and trauma registry (e.g. `shame`, `fear`, `betrayal`, `abandonment`, `emotional_neglect`, `vulnerability`, `intimacy`, `defiance`, `dysregulation`), and output selected keywords in the Director JSON payload to deterministically inject somatic physical tells (_"Show, Don't Tell"_) into the Storyteller generation prompt.
> 4. **User Pacing Analysis & Empathy Reading**: Analyze input sentence rhythm (short/sharp vs. wandering vs. silence) to calibrate Storyteller sentence pacing and cognitive urgency.
> 5. **Masking vs. Somatic Leakage & Dominant Hooks**: Model the friction between social masks and involuntary bodily leakage under stress; enforce kinetic handoffs on high-stakes actions and assertive turn closers (`[Statement]`, `[Action]`, `[Hover]`, `[Silence]`).

---

## 🎯 Goal & Specifications

### 1. Director Asynchronous Job Queue

The Director and kernel execute several background tasks per turn:

- Per-entity memory updates
- Memory Forge consolidation
- Visual/image prompt sweeps
- Session checkpoint persistence

Without a formal queue, overlapping asynchronous operations risk interleaved writes and state clobbering.

- **Single in-flight execution**: At most one background job executes at any given time.
- **Latest-pending semantics**: A job arriving while busy records itself as _latest pending_ and replays immediately upon drain.
- **Error isolation**: A failing job rejects its own promise without halting the queue.
- **Clean cancellation**: Unmounting drops pending jobs without interrupting running tasks.

### 2. Fractal Turn Delegation & Dynamic Thinking State

Currently, the turn driver defaults to invoking the AI Character to respond. When narrative beats center on environmental shifts, natural events, or world-level reactions:

- **Director Turn Authority**: The Director JSON schema includes `"next_speaker": "AI_CHARACTER" | "FRACTAL"`.
- **Kernel Routing**: If `FRACTAL` is delegated, `kernel.js` invokes the Fractal narrative engine, generating prose styled by the Fractal and emitting the message with `role: "fractal"`.
- **Dynamic Thinking UI**: `status.svelte.js` tracks `generating_entity: "ai" | "fractal"` so the Storymode streaming placeholder and pulsing thinking indicator display the active entity's name, avatar, and style color instead of a hardcoded AI Character bubble.

### 3. Dual-Layer Keyword-Triggered Somatic & Trauma Injections

To enforce the engine's _"Show, Don't Tell"_ mandate without burdening the primary prose generator with abstract psychological math:

- **Layer 1 — Static Core Somatic & Trauma Registry (`src/data/definitions/somatic-triggers.js`)**: A fixed, universal mapping of baseline psychological states and trauma cascades to concrete physical somatic tells (e.g., `shame` $\rightarrow$ _"avoiding eye contact, fingers fidgeting with fabric, heat rising in collar"_; `betrayal` $\rightarrow$ _"throat constricted, hands cold, rigid distance"_; `abandonment` $\rightarrow$ _"stomach hollow, chest tight, sudden cling or withdrawal"_; `emotional_neglect` $\rightarrow$ _"numbness, flat voice, gaze avoidance"`).
- **Layer 2 — Dynamic Narrative Style Extension (`src/data/definitions/narrative-styles.js`)**: Author-specific keywords and stylistic motifs contributed by the active style (e.g., Hemingway $\rightarrow$ `stoic_pain`, `iceberg_subtext`; Murakami $\rightarrow$ `jazz_solitude`, `stray_encounter`; McCarthy $\rightarrow$ `bleak_horizon`, `biblical_weight`).
- **Director Prompt Compilation**: The Director prompt exposes the unified palette:

  ```xml
  <AVAILABLE_KEYWORDS>
  Static Core: [shame, fear, vulnerability, defiance, intimacy, betrayal, abandonment, emotional_neglect, grief, dominance, deception, dysregulation]
  Style Specific: [stoic_pain, iceberg_subtext]
  </AVAILABLE_KEYWORDS>
  ```

- **Director Output (`DIRECTOR_JSON_SCHEMA`)**: The Director evaluates the user's action and includes `"keywords": ["shame", "stoic_pain"]` in its JSON payload.
- **Prompt Injection Compilation**: `kernel.js` resolves the selected keywords across both the static somatic registry and the active narrative style registry, compiling a unified `<SOMATIC_DIRECTIVES>` / `<STYLE_MOTIFS>` block injected directly into the active storyteller prompt before prose generation.

### 4. User Pacing Analysis & Empathy Reading

The Director evaluates structural user input properties to calibrate generation dynamics:

- **Short/Sharp Sentences**: Signal high stress, immediate action, or aggression $\rightarrow$ Director nudges Storyteller toward short, punchy sentence rhythm and heightened somatic vigilance.
- **Long/Wandering Sentences**: Signal reflection, comfort, or intimacy $\rightarrow$ Director permits richer, multi-clausal descriptive prose and slower sensory pacing.
- **Silence / Minimal Delay**: Signals emotional freeze or disengagement $\rightarrow$ Director prioritizes active confrontation, tension escalation, or probing dialogue.

### 5. Masking vs. Somatic Leakage & Dominant Hooks

- **The Social Mask**: When psychological tension or trauma is triggered, characters attempt to verbally maintain composure, compliance, or detachment.
- **Somatic Leakage**: Involuntary physical tells (trembling hands, shallow breathing, gaze aversion, micro-stutters) contradict and betray the spoken mask.
- **Critical Action Handoff**: When high-stakes physical or social actions are initiated, describe the sensory buildup and stop immediately prior to outcome resolution, ceding final consequences to the user.
- **Dominant Hooks**: Every turn concludes with an active hook (`[Statement]`, `[Action]`, `[Hover]`, `[Silence]`) to prevent passive wait-states.

---

## 🏗️ Technical Design

### 1. Job Queue Core Utility (`src/utils/job-queue.js`)

- `create_job_queue(options)`:
  - `run(async_task)`: Enqueues task, returns promise.
  - `is_busy`: Readable state.
  - `clear()`: Drops pending jobs.

### 2. Dual Keyword Registries (`src/data/definitions/somatic-triggers.js` & `narrative-styles.js`)

- **Static Somatic & Trauma Registry (`src/data/definitions/somatic-triggers.js`)**:

  ```javascript
  export const STATIC_SOMATIC_REGISTRY = {
    shame: {
      keyword: "shame",
      tells: "avoiding eye contact, fingers fidgeting with fabric, heat rising in collar/ears, hunched posture",
      directive: "Weave involuntary physical shame tells; character attempts verbal deflection while body collapses inward.",
    },
    fear: {
      keyword: "fear",
      tells: "shallow breathing, jaw tensing, cold sweat, hyper-fixation on physical exits",
      directive: "Physical freeze/flight response; hyper-vigilant scanning of immediate space.",
    },
    vulnerability: {
      keyword: "vulnerability",
      tells: "unclenching fists, softened gaze, hesitant speech cadence, lowered defensive guard",
      directive: "Defensive walls softening; cautious, tentative physical opening.",
    },
    betrayal: {
      keyword: "betrayal",
      tells: "throat constricted, cold hands, sudden physical step back, guarded silence",
      directive: "Acute trust collapse; sudden physical withdrawal and rigid skepticism.",
    },
    abandonment: {
      keyword: "abandonment",
      tells: "stomach hollow, chest tight, searching gaze, sudden cling or abrupt preemptive detachment",
      directive: "Panic of separation; hyper-reactive to perceived emotional distance.",
    },
    emotional_neglect: {
      keyword: "emotional_neglect",
      tells: "numbness, flat monotone voice, gaze drifting away, still hands",
      directive: "Affect blunting and quiet withdrawal; disengages from connection effort.",
    },
    defiance: {
      keyword: "defiance",
      tells: "chin raised, locked shoulders, unblinking eye contact, squared stance",
      directive: "Open resistance and pride; physical assertion against authority or pressure.",
    },
    intimacy: {
      keyword: "intimacy",
      tells: "leaning forward, softened micro-expressions, shared breathing tempo, lingering touch",
      directive: "Sensory closeness and reduced spatial distance; warmth and physical presence.",
    },
    grief: {
      keyword: "grief",
      tells: "heavy swallow, tightness behind eyes, slowed motor cadence, weighted silence",
      directive: "Visceral emotional weight; speech slowed and anchored in physical heaviness.",
    },
    dominance: {
      keyword: "dominance",
      tells: "unhurried deliberate movements, taking up physical space, steady downward gaze",
      directive: "Assert spatial control; unwavering presence and command.",
    },
    deception: {
      keyword: "deception",
      tells: "calculated micro-pauses, forced unnatural smoothness, clearing throat, still hands",
      directive: "Over-managed composure; unnatural control concealing rapid internal calculation.",
    },
    dysregulation: {
      keyword: "dysregulation",
      tells: "restless pacing, tremors, speech cadence speeding and halting, erratic breathing",
      directive: "Cognitive overload; fragmented sentences and chaotic motor agitation.",
    },
  };
  ```

- **Narrative Style Extension (`src/data/definitions/narrative-styles.js`)**:
  Styles optionally export additional `keywords`:

  ```javascript
  ernest_hemingway: {
    // ...
    keywords: {
      stoic_pain: {
        keyword: "stoic_pain",
        tells: "swallowing dryly, steadying hands on table, silence before speaking",
        directive: "Mask pain behind curt, declarative statements; heavy unspoken subtext.",
      },
    },
  },
  ```

### 3. Director Delegation & Turn Dispatcher (`src/intelligence/prompts.js` & `src/intelligence/kernel.js`)

- Update `DIRECTOR_JSON_SCHEMA` in `prompts.js`:

  ```json
  {
    "internal_monologue": "string",
    "dynamics_delta": { ... },
    "next_speaker": "AI_CHARACTER | FRACTAL",
    "keywords": ["string"]
  }
  ```

- In `prompts.js` `compile_director_prompt`:
  - Combine `Object.keys(STATIC_SOMATIC_REGISTRY)` and `active_style.keywords` into `<AVAILABLE_KEYWORDS>`.
  - Embed Pacing Analysis guidelines and Masking vs. Somatic Leakage rules.

- In `kernel.js` `execute_turn`:
  - Read `director_result.next_speaker`.
  - Resolve `director_result.keywords` from `STATIC_SOMATIC_REGISTRY` + `active_style.keywords`.
  - Inject resolved somatic and style directives into the compiled storyteller prompt payload (`<SOMATIC_DIRECTIVES>`).
  - Dispatch response generation to either `render_character` or `render_fractal`.
  - Set `status.generating_entity` before triggering generation.

### 4. Dynamic Thinking UI (`src/ui/molecules/Message.svelte` & `src/ui/organisms/Storymode.svelte`)

- Replace hardcoded AI Character avatar/name in the active generating bubble with reactive bindings to `status.generating_entity` (`runtime.active_ai` vs `runtime.active_fractal`).

---

## 📚 Narrative Style Keywords & Motifs Catalog (Unified 23-Style Registry)

The following unified catalog merges all non-dynamics `mods` and `motifs` into actionable keyword triggers. When a narrative style is active, its defined keywords are exposed to the Director LLM alongside the static somatic palette:

### 1. Anaïs Nin (`anais_nin`)

- `internal_conflict`: Stream-of-consciousness, psychoanalytic introspection and emotional ambiguity.
- `mirrors_and_reflections`: Catching a fleeting glimpse in glass; searching one's face for hidden emotion.
- `diary_or_journal`: Intimate observation of handwriting, tactile paper, and private confessions.

### 2. Anna Zaires (`anna_zaires`)

- `captivity_hypervigilance`: Calculating exits, hyper-aware of footsteps, claustrophobic breathing.
- `forced_compliance`: Sharp commanding delivery, rapid internal calculation of consequences.
- `compound_or_cage`: Physical confinement, heavy locks, isolation from the outside world.

### 3. Bernardo Bertolucci (`bernardo_bertolucci`)

- `rebellious_intimacy`: Framing touch and physical vulnerability as defiance against oppressive structures.
- `dusty_sunlit_room`: Golden dust motes, faded apartment elegance, sensual domestic warmth.
- `tango_cadence`: Rhythmic, deliberate slow-dance movement with heavy eye contact.
- `distant_protest`: Ambient muffled sirens or a distant crowd rumble lingering on the periphery.

### 4. Cara McKenna (`cara_mckenna`)

- `raw_trauma_grounding`: Present-tense time dilation with raw, hypervigilant bodily awareness.
- `calloused_hands`: Rough, work-worn skin texture; grounded physical working-class contact.

### 5. Cormac McCarthy (`cormac_mccarthy`)

- `relentless_brutality`: Unpunctuated rapid clauses; clinical, unvarnished observation of violence.
- `indifferent_nature`: Archaic biblical cadences framing mortal struggles against a cold, vast horizon.
- `dried_blood_stone`: Visceral forensic description of blood on stone and elemental dust.

### 6. David Lynch (`david_lynch`)

- `cryptic_stasis`: Uncomfortably slow dialogue with hyper-fixation on extreme micro-details.
- `red_curtains_nightmare`: Subconscious dream leakage, symbolic dread, and heavy velvet textures.
- `flickering_neon`: Humming electrical buzz and intermittent chromatic buzzing light.

### 7. Edgar Allan Poe (`edgar_allan_poe`)

- `morbid_unraveling`: Distorted temporal flow, escalating sensory panic, and an overwhelming heartbeat rhythm.
- `stains_and_rot`: Decaying masonry, moisture stains, and a pervasive scent of moldering antiquity.

### 8. George R.R. Martin (`george_rr_martin`)

- `court_paranoia`: Calculating ulterior motives and evaluating hidden political leverage.
- `bitter_confrontation`: Sharp, cutting dialogue paired with acerbic internal appraisal.
- `lavish_feasting`: Sensory description of grease, roasted meats, sour wine, and spilled salt.
- `recalled_lineage`: Recalling ancient family houses, historical grievances, and heraldic sigils.

### 9. Haruki Murakami (`haruki_murakami`)

- `domestic_solitude`: Reflective focus on preparing simple meals, coffee, or quiet chores.
- `metaphorical_void`: Labyrinthine melancholy and subtle surreal leakage into ordinary reality.
- `spinning_jazz_record`: Warm vinyl crackle of an obscure jazz standard in an empty apartment.
- `unexplained_vanished`: A fleeting memory of someone who disappeared without a trace.
- `stray_cat_watching`: Detached, quiet feline observation from an alleyway or windowsill.

### 10. H.D. Carlton (`hd_carlton`)

- `predatory_focus`: World narrows completely to an immediate threat or stalker presence.
- `shadow_mask`: A predatory smirk, veiled face, or soundless stalking cadence.
- `single_token`: A sinister single rose or deliberate keepsake left in private space.

### 11. H.P. Lovecraft (`hp_lovecraft`)

- `non_euclidean_dread`: Monstrous geometry and academic panic escalating into delirium.
- `ancient_monolith`: Cyclopean basalt ruins and slime-encrusted non-human carvings.
- `antiquarian_tome`: Yellowed vellum, translated blasphemous occult passages, and rotting bindings.

### 12. Jane Austen (`jane_austen`)

- `social_leverage`: Subtle conversational sparring regarding fortune, estate, and societal propriety.
- `handwritten_letter`: Scrutinizing seals, delicate penmanship, and unspoken intention in written notes.

### 13. J.R.R. Tolkien (`jrr_tolkien`)

- `ancient_wild`: Primeval elder trees, deep untamed woods, and moss-grown forgotten paths.
- `song_and_lineage`: Solemn recitation of ancient songs, noble lineages, and heroic sorrow.

### 14. Lee Child (`lee_child`)

- `tactical_leverage`: Sentence fragments calculating physical mechanics, balance, angles, and bone leverage.
- `procedural_deduction`: Microscopic deductive scanning of a room, attire, and body language.
- `black_coffee_solitude`: Scalding diner coffee and anonymous traveler detachment.

### 15. Penelope Douglas (`penelope_douglas`)

- `combative_tension`: Argumentative chemistry, sharp witty banter, and unyielding eye contact.
- `physical_dare`: Reckless adrenaline challenges and dangerous boundary testing.
- `muscle_car_roaring`: Vibrating engine rumble, asphalt heat, and worn leather vehicle interiors.

### 16. Philip K. Dick (`philip_k_dick`)

- `reality_dissociation`: Clinical alienation; questioning the authentic reality of one's surroundings.
- `glowing_ads`: Oppressive holographic commercials and neon consumerism cutting through smog.
- `counterfeit_id`: Synthetic identification documents and haunting doubts over altered memories.

### 17. Sally Rooney (`sally_rooney`)

- `seamless_intimacy`: Unquoted dialogue, fluid power shifts, and forensic relationship dissection.
- `text_screen_silence`: Staring at unanswered messages on a glowing screen or a blank television.

### 18. Samuel R. Delany (`samuel_delany`)

- `urban_decay_texture`: Dense philosophical monologue and gritty textures of cracked concrete and decay.
- `tactile_leather`: Worn denim, cracked leather, and the sensory erotic geography of the street.

### 19. Stephen King (`stephen_king`)

- `nostalgic_ephemera`: Specific brand names, commercial clutter, and nostalgic radio pop songs.
- `creeping_smalltown_rot`: Mundane domestic comfort harbouring an unspeakable, lurking neighborly malice.

### 20. William Gibson (`william_gibson`)

- `high_tech_low_life`: Memory glitching, decaying urban infrastructure, and cybernetic chrome.
- `flickering_neon_data`: Corporate logos glowing through acid rain and immersive data streams.

### 21. Ernest Hemingway (`ernest_hemingway`)

- `iceberg_subtext`: Curt minimalist dialogue, immense unstated emotional subtext, zero flowery adverbs.
- `stoic_pain`: Swallowing dryly, steadying hands on glass, and enduring silent physical ache.
- `whiskey_and_elements`: Black coffee, raw whiskey, and harsh exposure to sun glare or freezing wind.

### 22. Joe Abercrombie (`joe_abercrombie`)

- `grimdark_cynicism`: Earthy dry wit and intentional bathos undercutting heroic pretensions.
- `visceral_discomfort`: Mud on boots, an aching back, throbbing stitches, and cold greasy rain.
- `punchy_violence`: Unforgiving, brutal bursts of physical combat stripped of romance.

### 23. Arthur Morgan (`arthur_morgan`)

- `deep_3rd_weariness`: Filtering all observations through moral exhaustion, outlaw experience, and survival instinct.
- `antihero_bathos`: Undercutting dramatic tension with coughs, smoke, or mundane aches.
- `spent_cartridges`: Smell of burning tobacco, clinking brass cartridges, and a glance from under a hat brim.

---

## 📋 Task Checklist

- [ ] **Phase 0 (SPIKE & SCHEMA)**:
  - [ ] Map active background write points in `kernel.js`, `temporal.js`, and `session.svelte.js`.
  - [ ] Define `SOMATIC_TRIGGER_REGISTRY` keyword catalog with somatic physical tells.
  - [ ] Update `DIRECTOR_JSON_SCHEMA` specification.

- [ ] **Phase 1 (RED — Unit Tests)**:
  - [ ] Job queue concurrency and latest-pending replay tests (`src/utils/job-queue.test.js`).
  - [ ] Director `next_speaker` and `keywords` parsing and fallback tests (`src/intelligence/parser.test.js`).
  - [ ] Somatic keyword prompt compiler and injection tests (`src/intelligence/prompts.test.js`).
  - [ ] Kernel turn delegation routing tests for AI Character vs Fractal (`src/intelligence/kernel.test.js`).

- [ ] **Phase 2 (GREEN — Core Logic)**:
  - [ ] Implement `create_job_queue` in `src/utils/job-queue.js`.
  - [ ] Create `src/data/definitions/somatic-triggers.js`.
  - [ ] Add `next_speaker` and `keywords` to `DIRECTOR_JSON_SCHEMA` in `src/intelligence/prompts.js`.
  - [ ] Wire `next_speaker` delegation and somatic keyword prompt injection in `src/intelligence/kernel.js`.

- [ ] **Phase 3 (Integration & Dynamic UI)**:
  - [ ] Route background writes in `kernel.js` and `session.svelte.js` through `job_queue`.
  - [ ] Update `status.svelte.js` and Storymode thinking indicator to reflect `status.generating_entity`.

- [ ] **Phase 4 (VERIFY)**:
  - [ ] Run `npm run verify` (`test:unit`, `test:design`, `lint`, `svelte-check`).
  - [ ] Verify turn delegation in simulated runs (Director selecting Fractal produces `role: "fractal"` message; keyword `shame` generates somatic directive injection).

- [ ] **Phase 5 (HANDOFF & DEPLOY)**:
  - [ ] Run `npm run build` for single-file bundle verification.
  - [ ] Update `tasks/PRESENT.md` and archive blueprint.
