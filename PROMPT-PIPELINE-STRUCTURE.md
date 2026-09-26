# RPGlitch — Prompt Pipeline Structural Report

> **Scope**: structural analysis of the nine registered prompt modes in `src/intelligence/prompts.js`, plus the three context variants the compiler supports (`director` + `terse`, `narrator` + prologue/epilogue, `optics` tiers).
> **Focus**: envelope shape, direct-child layer order, which blocks appear or are absent, and size — not prose wording quality.
> **Source of truth**: `src/intelligence/prompts.js` (manifest) + `src/intelligence/builder.js` (assembly) + `src/intelligence/modules/*` (layer emitters).
> **Method**: every case was compiled through `compile_prompt` against the deterministic contract fixtures in `src/intelligence/prompt-verification.js` (active narrative style `cormac_mccarthy`). The emitted tag inventory of each mode was compared to the frozen `CONTRACT`; the examples below are the exact compiler output, not hand-edited.

## 0. At a glance

Every one of the nine modes is the **same skeleton**: an open `<SYSTEM …>` fragment whose direct children are indent-2 layers, plus exactly one closed `<TASK>`. A mode is a short declarative record choosing which layers to declare, so there is no bespoke per-mode branching. The differences are entirely "which slots, in what order".

| Case                | Mode key      | System B | Task B | System direct layers                                 | Task direct layers                                                         | Output |
| ------------------- | ------------- | -------: | -----: | ---------------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| `director`          | `director`    |     1989 |   2863 | DYNAMIC_AXES, ENTITIES                               | INPUT, INPUT, DIRECTIVES, OUTPUT_FORMAT                                    | json   |
| `director_terse`    | `director`    |      105 |    909 | —                                                    | OUTPUT_FORMAT                                                              | json   |
| `interaction`       | `interaction` |     5617 |   2158 | AXIOMATIC_CONSTITUTION, CORE_PROTOCOLS, ENTITIES     | THINK_FORMAT, INPUT, CURRENTS, DIRECTIVES, DELIVERY_POSTURE, OUTPUT_FORMAT | prose  |
| `ghostwrite`        | `ghostwrite`  |     5618 |   2129 | AXIOMATIC_CONSTITUTION, CORE_PROTOCOLS, ENTITIES     | THINK_FORMAT, INPUT, CURRENTS, DIRECTIVES, DELIVERY_POSTURE, OUTPUT_FORMAT | prose  |
| `npc`               | `npc`         |     5949 |   2922 | AXIOMATIC_CONSTITUTION, CORE_PROTOCOLS, ENTITIES     | THINK_FORMAT, INPUT, CURRENTS, DIRECTIVES, DELIVERY_POSTURE, OUTPUT_FORMAT | prose  |
| `narrator`          | `narrator`    |     5189 |   1922 | AXIOMATIC_CONSTITUTION, CORE_PROTOCOLS, ENTITIES     | THINK_FORMAT, INPUT, CURRENTS, DIRECTIVES, DELIVERY_POSTURE, OUTPUT_FORMAT | prose  |
| `narrator_prologue` | `narrator`    |     5189 |   2170 | AXIOMATIC_CONSTITUTION, CORE_PROTOCOLS, ENTITIES     | THINK_FORMAT, CURRENTS, DIRECTIVES, DELIVERY_POSTURE, OUTPUT_FORMAT        | prose  |
| `narrator_epilogue` | `narrator`    |     5189 |   1839 | AXIOMATIC_CONSTITUTION, CORE_PROTOCOLS, ENTITIES     | THINK_FORMAT, CURRENTS, DIRECTIVES, DELIVERY_POSTURE, OUTPUT_FORMAT        | prose  |
| `continuum`         | `continuum`   |     1210 |   2818 | CORE_PROTOCOLS, TARGET_ENTITY_CONTEXT, CAST, HISTORY | DIRECTIVES, OUTPUT_FORMAT                                                  | json   |
| `enhancement`       | `enhancement` |      541 |    417 | CORE_PROTOCOLS, LAYER, ENTITY_CONTEXT                | INPUT, DIRECTIVES, OUTPUT_FORMAT                                           | prose  |
| `sorting`           | `sorting`     |      287 |   3162 | CORE_PROTOCOLS                                       | INPUT, DIRECTIVES, OUTPUT_FORMAT                                           | json   |
| `optics`            | `optics`      |     1761 |   3785 | CORE_PROTOCOLS, ENTITIES                             | THINK_FORMAT, INPUT, TARGET, SPATIAL_FRAMING, DIRECTIVES, OUTPUT_FORMAT    | json   |

- **Entry point**: a single public function, `compile_prompt(mode_key, context)`, returns `{ system, task, messages }`. `messages` is empty for every mode at build time — the conversation is appended later by `platform/transport.js`, which also owns the single `</SYSTEM>` close.
- **Open fragment**: the `system` string deliberately never contains `</SYSTEM>` or `<TASK>`; at transport time the task and history end up nested inside one `<SYSTEM>`.
- **Universal shape**: `<SYSTEM>` carries `mode="<key>"`; the prose family and `director` additionally carry `round`; the tool modes carry mode-specific attrs (`target` / `scope` + `field`).
- **Two meta-layers emit no tag**: `role` (the plain `You are …` line) and `stability_lock` (only appears as an escalation after repeated structural drift).

---

## 1. Envelope anatomy

### 1.1 Layer presets

Each mode's `layers` is a named frozen preset (or a spread of one) that declares slot order; a slot that emits nothing is skipped.

| Preset               | `system` slots                                                                     | `task` slots                                                                                       | Modes                                  |
| -------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `PROSE_LAYERS`       | `role`, `constitution`, `protocols`, `entities`                                    | `think`, `inputs`, `currents`, `directives`, `delivery_posture`, `stability_lock`, `output_format` | interaction, ghostwrite, npc, narrator |
| `DIRECTOR_LAYERS`    | `role`, `protocols`, `dynamic_axes`, `entities`                                    | `inputs`, `directives`, `output_format`                                                            | director                               |
| `TOOL_LAYERS`        | `role`, `protocols`, `target_context`, `nearby_cast`, `chapter_history`, `history` | `directives`, `output_format`                                                                      | continuum                              |
| `ENHANCEMENT_LAYERS` | `role`, `protocols`, `layer`, `field_context`                                      | `inputs`, `directives`, `output_format`                                                            | enhancement                            |
| `SORTING_LAYERS`     | `role`, `protocols`                                                                | `inputs`, `directives`, `output_format`                                                            | sorting                                |
| `OPTICS_LAYERS`      | `role`, `protocols`, `entities`, `history`                                         | `think`, `inputs`, `target`, `spatial_framing`, `directives`, `output_format`                      | optics                                 |

### 1.2 Layer → tag map

Every declared layer key maps to at most one emitted tag (`ENVELOPE_LAYER_TAGS`); `role` and `stability_lock` are the only tag-less keys.

| Slot              | Tag                      | Slot               | Tag                |
| ----------------- | ------------------------ | ------------------ | ------------------ |
| `constitution`    | `AXIOMATIC_CONSTITUTION` | `currents`         | `CURRENTS`         |
| `protocols`       | `CORE_PROTOCOLS`         | `target`           | `TARGET`           |
| `dynamic_axes`    | `DYNAMIC_AXES`           | `spatial_framing`  | `SPATIAL_FRAMING`  |
| `entities`        | `ENTITIES`               | `directives`       | `DIRECTIVES`       |
| `target_context`  | `TARGET_ENTITY_CONTEXT`  | `delivery_posture` | `DELIVERY_POSTURE` |
| `nearby_cast`     | `CAST`                   | `output_format`    | `OUTPUT_FORMAT`    |
| `layer`           | `LAYER`                  | `think`            | `THINK_FORMAT`     |
| `field_context`   | `ENTITY_CONTEXT`         | `inputs`           | `INPUT`            |
| `chapter_history` | `CHAPTER_HISTORY`        | `history`          | `HISTORY`          |

---

## 2. Simulated output per mode

Each section shows the **layer skeleton** (direct children at indent 2, with their immediate children inlined) and a **literal excerpt** of the compiler output for that case.

### 2.1 `director`

- **Stage**: Shot 1 — Quick Shot (directorial mechanics).
- **Root**: `<SYSTEM round="1" mode="director">` · **system** 1989 B · **task** 2863 B · **output** `json` · `messages` = 0.
- **System direct layers**: `DYNAMIC_AXES` → `CHAOS`, `INTENSITY`, `OPENNESS`, `AFFINITY`, `VELOCITY`, `ENTROPY` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`.
- **Task direct layers**: `INPUT` · `INPUT` · `DIRECTIVES` → `KEYWORD_DIRECTIVES` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="1" mode="director">
  <DYNAMIC_AXES scale="0-100">  → CHAOS value="30" low="Order" high="Volatility" /, INTENSITY value="70" low="Stillness" high="Surge" /, OPENNESS value="40" low="Insulation" high="Permeability" /, AFFINITY value="20" low="Isolation" high="Coalescence" /, VELOCITY value="50" low="Suspension" high="Acceleration" /, ENTROPY value="80" low="Glitching" high="Coherence" /
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four"
<TASK>
  <INPUT origin="BOB" round="1" channel="action">
  <INPUT origin="ALICE" channel="reply">
  <DIRECTIVES>  → KEYWORD_DIRECTIVES
  <OUTPUT_FORMAT mode="json">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="1" mode="director">
  You are the Director orchestrating simulation mechanics and staging.

  <DYNAMIC_AXES scale="0-100">
    <CHAOS value="30" low="Order" high="Volatility" />
    <INTENSITY value="70" low="Stillness" high="Surge" />
    <OPENNESS value="40" low="Insulation" high="Permeability" />
    <AFFINITY value="20" low="Isolation" high="Coalescence" />
    <VELOCITY value="50" low="Suspension" high="Acceleration" />
    <ENTROPY value="80" low="Glitching" high="Coherence" />
  </DYNAMIC_AXES>

  <ENTITIES>
    <AI_CHARACTER id="ALICE" name="Alice">
```

**Example output** (task head):

```xml
<TASK>
  <INPUT origin="BOB" round="1" channel="action">Bob scans the perimeter.</INPUT>
  <INPUT origin="ALICE" channel="reply">Alice nods.</INPUT>
  <DIRECTIVES>
    DYNAMICS CALIBRATION:
    1. Calibrate dynamics_deltas conservatively (±1 to ±4 standard; ±8 to ±12 extreme).
    2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100.
    3. Calibrate dynamics_deltas to reflect the psychological and environmental shift of the turn.

    Evaluate state mutations caused by «INPUT». Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER". "USER_PERSONA", "USER", "PLAYER", or the player character's name is NEVER a valid next_action — the Director never speaks for the player. The window for the player to act opens automatically right after the AI beat, so you never need a "yield to player" action: if you believe the player should act next, output "AI_CHARACTER" (the default). Valid actions are strictly: "AI_CHARACTER", "FRACTAL", "npc:<id>", or { "genesis": ... }.

    NEXT ACTION ROUTING RULES:
```

### 2.2 `director` + `{ terse: true }` (variant)

- **Stage**: Shot 1 — Quick Shot, terse calibration.
- **Root**: `<SYSTEM round="2" mode="director">` · **system** 105 B · **task** 909 B · **output** `json` · `messages` = 0.
- **System direct layers**: _(role line only)_.
- **Task direct layers**: `OUTPUT_FORMAT`.

```text
<SYSTEM round="2" mode="director">
  (role line only)
<TASK>
  <OUTPUT_FORMAT mode="json">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="2" mode="director">
  You are the Director orchestrating simulation mechanics and staging.
```

**Example output** (task head):

```xml
<TASK>
  <OUTPUT_FORMAT mode="json">
    Return a single, COMPLETE, VALID JSON object matching this schema:
    {
      "_thought_process": "<Tactical intent & state delta>",
      "next_action": "'AI_CHARACTER' | 'FRACTAL' | 'npc:<id>' | { \"genesis\": { \"name\": \"<Name>\", \"description\": \"<description>\" } } | 'EPILOGUE_CONCLUDED' | 'EPILOGUE_COLLAPSED'",
      "keywords": ["<1-5 keywords from AVAILABLE_KEYWORDS>"],
      "directors_note": "<1-5 lines staging directives for next speaker, or empty string>",
      "dynamics_deltas": {"chaos":0,"intensity":0,"openness":0,"affinity":0,"velocity":0,"entropy":0},
      "visual_staging": "<optional: camera & lighting directive if scene image shifts>",
      "spotlight": {"enter":["npc:<id>"],"exit":["npc:<id>"]}
    }
```

### 2.3 `interaction`

- **Stage**: Shot 2A — Prose Shot (canonical AI-character voice).
- **Root**: `<SYSTEM round="1" mode="interaction">` · **system** 5617 B · **task** 2158 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `AXIOMATIC_CONSTITUTION` · `CORE_PROTOCOLS` → `SIMULATION_FIDELITY`, `PERSPECTIVE`, `NARRATIVE_STYLE`, `PROSE_DISCIPLINE` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`.
- **Task direct layers**: `THINK_FORMAT` → `BEAT`, `BEAT`, `BEAT`, `BEAT` · `INPUT` · `CURRENTS` · `DIRECTIVES` · `DELIVERY_POSTURE` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="1" mode="interaction">
  <AXIOMATIC_CONSTITUTION>
  <CORE_PROTOCOLS>  → SIMULATION_FIDELITY, PERSPECTIVE person="FIRST" tense="PRESENT", NARRATIVE_STYLE origin="CORMAC_MCCARTHY" internal_ratio="0.20", PROSE_DISCIPLINE
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four"
<TASK>
  <THINK_FORMAT>  → BEAT id="VISCERAL_IMPACT" step="1", BEAT id="EMOTIONAL_CALIBRATION" step="2", BEAT id="STRATEGIC_DRIVE" step="3", BEAT id="CADENCE_TEST" step="4"
  <INPUT origin="BOB" round="1" channel="action">
  <CURRENTS>
  <DIRECTIVES>
  <DELIVERY_POSTURE>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="1" mode="interaction">
  You are Alice within FRACTAL Sector Four, interacting with Bob.

  <AXIOMATIC_CONSTITUTION>
      <LAW id="L1_INTEGRITY">Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats and items without established physical basis.</LAW>
      <LAW id="L2_CONTINUITY">Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned consensus.</LAW>
      <LAW id="L3_SPATIAL">Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.</LAW>
      <LAW id="L4_AESTHETIC">Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.</LAW>
      <LAW id="L5_AGENCY">Yield leverage when outplayed; contest godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions.</LAW>
  </AXIOMATIC_CONSTITUTION>

  <CORE_PROTOCOLS>
    <SIMULATION_FIDELITY>
      Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    Open your output with one internal <THINK> block (under 200 words). Reason across 4 sequential beats:
    <BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the «INPUT» element.</BEAT>
    <BEAT id="EMOTIONAL_CALIBRATION" step="2">Fatalistic and completely unstated. Internal states are inferred purely from survival mechanics.</BEAT>
    <BEAT id="STRATEGIC_DRIVE" step="3">How active «AGENDA» and/or «TRAJECTORY» navigates immediate friction.</BEAT>
    <BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
    Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.
  </THINK_FORMAT>
  <INPUT origin="BOB" round="1" channel="action">Alice prepares to move.</INPUT>
  <CURRENTS>
      <SENSORY_EXPERIENCE>Sight (Barren Terrain/Blood) &gt; Touch (Cold Steel/Grit) &gt; Sound (Wind/Sparse Speech) &gt; Scent</SENSORY_EXPERIENCE>
```

### 2.4 `ghostwrite`

- **Stage**: Shot 2A — Prose Shot (user-persona drafter).
- **Root**: `<SYSTEM round="1" mode="ghostwrite">` · **system** 5618 B · **task** 2129 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `AXIOMATIC_CONSTITUTION` · `CORE_PROTOCOLS` → `SIMULATION_FIDELITY`, `PERSPECTIVE`, `NARRATIVE_STYLE`, `PROSE_DISCIPLINE` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`.
- **Task direct layers**: `THINK_FORMAT` → `BEAT`, `BEAT`, `BEAT`, `BEAT` · `INPUT` · `CURRENTS` · `DIRECTIVES` · `DELIVERY_POSTURE` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="1" mode="ghostwrite">
  <AXIOMATIC_CONSTITUTION>
  <CORE_PROTOCOLS>  → SIMULATION_FIDELITY, PERSPECTIVE person="FIRST" tense="PRESENT", NARRATIVE_STYLE origin="CORMAC_MCCARTHY" internal_ratio="0.20", PROSE_DISCIPLINE
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four"
<TASK>
  <THINK_FORMAT>  → BEAT id="VISCERAL_IMPACT" step="1", BEAT id="EMOTIONAL_CALIBRATION" step="2", BEAT id="STRATEGIC_DRIVE" step="3", BEAT id="CADENCE_TEST" step="4"
  <INPUT origin="BOB" round="1" channel="action">
  <CURRENTS>
  <DIRECTIVES>
  <DELIVERY_POSTURE>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="1" mode="ghostwrite">
  You are Bob within FRACTAL Sector Four, interacting with Alice.

  <AXIOMATIC_CONSTITUTION>
      <LAW id="L1_INTEGRITY">Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats and items without established physical basis.</LAW>
      <LAW id="L2_CONTINUITY">Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned consensus.</LAW>
      <LAW id="L3_SPATIAL">Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.</LAW>
      <LAW id="L4_AESTHETIC">Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.</LAW>
      <LAW id="L5_AGENCY">Yield leverage when outplayed; contest godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions.</LAW>
  </AXIOMATIC_CONSTITUTION>

  <CORE_PROTOCOLS>
    <SIMULATION_FIDELITY>
      Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    Open your output with one internal <THINK> block (under 200 words). Reason across 4 sequential beats:
    <BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the «INPUT» element.</BEAT>
    <BEAT id="EMOTIONAL_CALIBRATION" step="2">Fatalistic and completely unstated. Internal states are inferred purely from survival mechanics.</BEAT>
    <BEAT id="STRATEGIC_DRIVE" step="3">How active «AGENDA» and/or «TRAJECTORY» navigates immediate friction.</BEAT>
    <BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
    Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.
  </THINK_FORMAT>
  <INPUT origin="BOB" round="1" channel="action">I steady my aim.</INPUT>
  <CURRENTS>
      <SENSORY_EXPERIENCE>Sight (Barren Terrain/Blood) &gt; Touch (Cold Steel/Grit) &gt; Sound (Wind/Sparse Speech) &gt; Scent</SENSORY_EXPERIENCE>
```

### 2.5 `npc`

- **Stage**: Shot 2A — Prose Shot (supporting stage character).
- **Root**: `<SYSTEM round="1" mode="npc">` · **system** 5949 B · **task** 2922 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `AXIOMATIC_CONSTITUTION` · `CORE_PROTOCOLS` → `SIMULATION_FIDELITY`, `PERSPECTIVE`, `NARRATIVE_STYLE`, `PROSE_DISCIPLINE` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`, `NPC`.
- **Task direct layers**: `THINK_FORMAT` → `BEAT`, `BEAT`, `BEAT`, `BEAT` · `INPUT` · `CURRENTS` · `DIRECTIVES` · `DELIVERY_POSTURE` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="1" mode="npc">
  <AXIOMATIC_CONSTITUTION>
  <CORE_PROTOCOLS>  → SIMULATION_FIDELITY, PERSPECTIVE person="FIRST" tense="PRESENT", NARRATIVE_STYLE origin="CORMAC_MCCARTHY" internal_ratio="0.20", PROSE_DISCIPLINE
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four", NPC id="MERCHANT" name="Merchant"
<TASK>
  <THINK_FORMAT>  → BEAT id="VISCERAL_IMPACT" step="1", BEAT id="EMOTIONAL_CALIBRATION" step="2", BEAT id="STRATEGIC_DRIVE" step="3", BEAT id="CADENCE_TEST" step="4"
  <INPUT origin="BOB" round="1" channel="action">
  <CURRENTS>
  <DIRECTIVES>
  <DELIVERY_POSTURE>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="1" mode="npc">
  You are Merchant, a supporting character within FRACTAL Sector Four, interacting with Bob.

  <AXIOMATIC_CONSTITUTION>
      <LAW id="L1_INTEGRITY">Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats and items without established physical basis.</LAW>
      <LAW id="L2_CONTINUITY">Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned consensus.</LAW>
      <LAW id="L3_SPATIAL">Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.</LAW>
      <LAW id="L4_AESTHETIC">Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.</LAW>
      <LAW id="L5_AGENCY">Yield leverage when outplayed; contest godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions.</LAW>
  </AXIOMATIC_CONSTITUTION>

  <CORE_PROTOCOLS>
    <SIMULATION_FIDELITY>
      Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    Open your output with one internal <THINK> block (under 200 words). Reason across 4 sequential beats:
    <BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the «INPUT» element.</BEAT>
    <BEAT id="EMOTIONAL_CALIBRATION" step="2">Fatalistic and completely unstated. Internal states are inferred purely from survival mechanics.</BEAT>
    <BEAT id="STRATEGIC_DRIVE" step="3">How active «AGENDA» and/or «TRAJECTORY» navigates immediate friction.</BEAT>
    <BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
    Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.
  </THINK_FORMAT>
  <INPUT origin="BOB" round="1" channel="action">Merchant glances around.</INPUT>
  <CURRENTS>
      <SENSORY_EXPERIENCE>Sight (Barren Terrain/Blood) &gt; Touch (Cold Steel/Grit) &gt; Sound (Wind/Sparse Speech) &gt; Scent</SENSORY_EXPERIENCE>
```

### 2.6 `narrator`

- **Stage**: Shot 2A — Prose Shot (Fractal / world voice).
- **Root**: `<SYSTEM round="1" mode="narrator">` · **system** 5189 B · **task** 1922 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `AXIOMATIC_CONSTITUTION` · `CORE_PROTOCOLS` → `SIMULATION_FIDELITY`, `PERSPECTIVE`, `NARRATIVE_STYLE`, `PROSE_DISCIPLINE` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`.
- **Task direct layers**: `THINK_FORMAT` · `INPUT` · `CURRENTS` · `DIRECTIVES` · `DELIVERY_POSTURE` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="1" mode="narrator">
  <AXIOMATIC_CONSTITUTION>
  <CORE_PROTOCOLS>  → SIMULATION_FIDELITY, PERSPECTIVE person="THIRD" tense="PRESENT", NARRATIVE_STYLE origin="CORMAC_MCCARTHY" internal_ratio="0.20", PROSE_DISCIPLINE
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four"
<TASK>
  <THINK_FORMAT>
  <INPUT origin="BOB" round="1" channel="action">
  <CURRENTS>
  <DIRECTIVES>
  <DELIVERY_POSTURE>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="1" mode="narrator">
  You are Sector Four, the Fractal itself, narrating the story.

  <AXIOMATIC_CONSTITUTION>
      <LAW id="L1_INTEGRITY">Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats and items without established physical basis.</LAW>
      <LAW id="L2_CONTINUITY">Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned consensus.</LAW>
      <LAW id="L3_SPATIAL">Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.</LAW>
      <LAW id="L4_AESTHETIC">Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.</LAW>
      <LAW id="L5_AGENCY">Yield leverage when outplayed; contest godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions.</LAW>
  </AXIOMATIC_CONSTITUTION>

  <CORE_PROTOCOLS>
    <SIMULATION_FIDELITY>
      Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    Open your output with one internal <THINK> block. All internal calculations, scene shifts, and headers must remain inside it, in the conversation language. Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.
  </THINK_FORMAT>
  <INPUT origin="BOB" round="1" channel="action">The wind howls.</INPUT>
  <CURRENTS>
      <SENSORY_EXPERIENCE>Sight (Barren Terrain/Blood) &gt; Touch (Cold Steel/Grit) &gt; Sound (Wind/Sparse Speech) &gt; Scent</SENSORY_EXPERIENCE>
      <SUBTEXT>
        <DISSONANCE>Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.</DISSONANCE>
        <INSTABILITY>Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.</INSTABILITY>
      </SUBTEXT>
  </CURRENTS>
```

### 2.7 `narrator` + `{ is_prologue: true }` (variant)

- **Stage**: Shot 2A — opening scene.
- **Root**: `<SYSTEM round="0" mode="narrator">` · **system** 5189 B · **task** 2170 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `AXIOMATIC_CONSTITUTION` · `CORE_PROTOCOLS` → `SIMULATION_FIDELITY`, `PERSPECTIVE`, `NARRATIVE_STYLE`, `PROSE_DISCIPLINE` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`.
- **Task direct layers**: `THINK_FORMAT` · `CURRENTS` · `DIRECTIVES` · `DELIVERY_POSTURE` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="0" mode="narrator">
  <AXIOMATIC_CONSTITUTION>
  <CORE_PROTOCOLS>  → SIMULATION_FIDELITY, PERSPECTIVE person="THIRD" tense="PRESENT", NARRATIVE_STYLE origin="CORMAC_MCCARTHY" internal_ratio="0.20", PROSE_DISCIPLINE
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four"
<TASK>
  <THINK_FORMAT>
  <CURRENTS>
  <DIRECTIVES>
  <DELIVERY_POSTURE>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="0" mode="narrator">
  You are Sector Four, the Fractal itself, narrating the story.

  <AXIOMATIC_CONSTITUTION>
      <LAW id="L1_INTEGRITY">Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats and items without established physical basis.</LAW>
      <LAW id="L2_CONTINUITY">Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned consensus.</LAW>
      <LAW id="L3_SPATIAL">Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.</LAW>
      <LAW id="L4_AESTHETIC">Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.</LAW>
      <LAW id="L5_AGENCY">Yield leverage when outplayed; contest godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions.</LAW>
  </AXIOMATIC_CONSTITUTION>

  <CORE_PROTOCOLS>
    <SIMULATION_FIDELITY>
      Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    Open your output with one internal <THINK> block. All internal calculations, scene shifts, and headers must remain inside it, in the conversation language. Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.
  </THINK_FORMAT>
  <CURRENTS>
      <SENSORY_EXPERIENCE>Sight (Barren Terrain/Blood) &gt; Touch (Cold Steel/Grit) &gt; Sound (Wind/Sparse Speech) &gt; Scent</SENSORY_EXPERIENCE>
      <SUBTEXT>
        <DISSONANCE>Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.</DISSONANCE>
        <INSTABILITY>Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.</INSTABILITY>
      </SUBTEXT>
  </CURRENTS>
  <DIRECTIVES>
```

### 2.8 `narrator` + `{ is_epilogue: true }` (variant)

- **Stage**: Shot 2A — closing scene.
- **Root**: `<SYSTEM round="0" mode="narrator">` · **system** 5189 B · **task** 1839 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `AXIOMATIC_CONSTITUTION` · `CORE_PROTOCOLS` → `SIMULATION_FIDELITY`, `PERSPECTIVE`, `NARRATIVE_STYLE`, `PROSE_DISCIPLINE` · `ENTITIES` → `AI_CHARACTER`, `USER_PERSONA`, `FRACTAL`.
- **Task direct layers**: `THINK_FORMAT` · `CURRENTS` · `DIRECTIVES` · `DELIVERY_POSTURE` · `OUTPUT_FORMAT`.

```text
<SYSTEM round="0" mode="narrator">
  <AXIOMATIC_CONSTITUTION>
  <CORE_PROTOCOLS>  → SIMULATION_FIDELITY, PERSPECTIVE person="THIRD" tense="PRESENT", NARRATIVE_STYLE origin="CORMAC_MCCARTHY" internal_ratio="0.20", PROSE_DISCIPLINE
  <ENTITIES>  → AI_CHARACTER id="ALICE" name="Alice", USER_PERSONA id="BOB" name="Bob", FRACTAL id="SECTOR_FOUR" name="Sector Four"
<TASK>
  <THINK_FORMAT>
  <CURRENTS>
  <DIRECTIVES>
  <DELIVERY_POSTURE>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM round="0" mode="narrator">
  You are Sector Four, the Fractal itself, narrating the story.

  <AXIOMATIC_CONSTITUTION>
      <LAW id="L1_INTEGRITY">Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats and items without established physical basis.</LAW>
      <LAW id="L2_CONTINUITY">Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned consensus.</LAW>
      <LAW id="L3_SPATIAL">Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.</LAW>
      <LAW id="L4_AESTHETIC">Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.</LAW>
      <LAW id="L5_AGENCY">Yield leverage when outplayed; contest godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions.</LAW>
  </AXIOMATIC_CONSTITUTION>

  <CORE_PROTOCOLS>
    <SIMULATION_FIDELITY>
      Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    Open your output with one internal <THINK> block. All internal calculations, scene shifts, and headers must remain inside it, in the conversation language. Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.
  </THINK_FORMAT>
  <CURRENTS>
      <SENSORY_EXPERIENCE>Sight (Barren Terrain/Blood) &gt; Touch (Cold Steel/Grit) &gt; Sound (Wind/Sparse Speech) &gt; Scent</SENSORY_EXPERIENCE>
      <SUBTEXT>
        <DISSONANCE>Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.</DISSONANCE>
        <INSTABILITY>Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.</INSTABILITY>
      </SUBTEXT>
  </CURRENTS>
  <DIRECTIVES>
```

### 2.9 `continuum`

- **Stage**: Shot 2B — Back Shot (memory-forge consolidation).
- **Root**: `<SYSTEM mode="continuum" target="Alice">` · **system** 1210 B · **task** 2818 B · **output** `json` · `messages` = 0.
- **System direct layers**: `CORE_PROTOCOLS` → `DATA` · `TARGET_ENTITY_CONTEXT` → `AI_CHARACTER` · `CAST` → `ENTITY`, `SUMMARY`, `ENTITY`, `SUMMARY` · `HISTORY` → `ENTRY`, `ENTRY`.
- **Task direct layers**: `DIRECTIVES` · `OUTPUT_FORMAT`.

```text
<SYSTEM mode="continuum" target="Alice">
  <CORE_PROTOCOLS>  → DATA
  <TARGET_ENTITY_CONTEXT>  → AI_CHARACTER id="ALICE" name="Alice"
  <CAST mode="nearby">  → ENTITY id="BOB" name="Bob" role="USER", SUMMARY, ENTITY id="SECTOR_FOUR" name="Sector Four" role="FRACTAL", SUMMARY
  <HISTORY>  → ENTRY round="1" origin="User", ENTRY round="2" origin="Character"
<TASK>
  <DIRECTIVES>
  <OUTPUT_FORMAT mode="json">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM mode="continuum" target="Alice">
  You are the Continuum Caretaker for target entity "Alice". Consolidate temporal state from recent events.

  <CORE_PROTOCOLS>
    <DATA>Output strictly raw, unpadded structural data. Zero prose, conversational filler, or commentary.</DATA>
  </CORE_PROTOCOLS>

  <TARGET_ENTITY_CONTEXT>
    <AI_CHARACTER id="ALICE" name="Alice">
      <PSYCHOLOGY>
        <AGENDA>Infiltrate the mainframe.</AGENDA>
        <PERSONALITY>Analytical cybernetic specialist.</PERSONALITY>
        <STATE>Guarded vigilance.</STATE>
      </PSYCHOLOGY>
```

**Example output** (task head):

```xml
<TASK>
  <DIRECTIVES>
    TARGET FOCUS: Consolidate state and extract relational vectors for Alice.
    Analyze recent turns in «HISTORY». Synthesize memories, update physical appearance, record active state of mind, and log directed relational bonds.

    EXECUTION MANDATE:
    1. Memory Formation: Extract 1-3 anchored memories in past tense. Empty list if nothing noteworthy transpired.
    2. Dynamic State: Update physical and non_physical condition.
    3. Future Trajectory: Consolidate active standing agenda in future tense.
    4. Relational Graph: Emit plain directed vectors: "Source -> Target: Dynamic description".
  </DIRECTIVES>
  <OUTPUT_FORMAT mode="json">
```

### 2.10 `enhancement`

- **Stage**: Tool A — Magic Wand (profile-field expansion).
- **Root**: `<SYSTEM mode="enhancement" scope="Personality" field="eternal.non_physical">` · **system** 541 B · **task** 417 B · **output** `prose` · `messages` = 0.
- **System direct layers**: `CORE_PROTOCOLS` → `DATA` · `LAYER` · `ENTITY_CONTEXT`.
- **Task direct layers**: `INPUT` · `DIRECTIVES` · `OUTPUT_FORMAT`.

```text
<SYSTEM mode="enhancement" scope="Personality" field="eternal.non_physical">
  <CORE_PROTOCOLS>  → DATA
  <LAYER>
  <ENTITY_CONTEXT>
<TASK>
  <INPUT channel="content">
  <DIRECTIVES>
  <OUTPUT_FORMAT mode="prose">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM mode="enhancement" scope="Personality" field="eternal.non_physical">
  You are the VOICE Profile Enhancer, refining target profile dimensions.

  <CORE_PROTOCOLS>
    <DATA>Output strictly raw, unpadded structural data. Zero prose, conversational filler, or commentary.</DATA>
  </CORE_PROTOCOLS>

  <LAYER>ETERNAL</LAYER>

  <ENTITY_CONTEXT>
      <PERSONALITY>
      Analytical cybernetic specialist.
          </PERSONALITY>
          <APPEARANCE>
```

**Example output** (task head):

```xml
<TASK>
  <INPUT channel="content">Terse, dry.</INPUT>
  <DIRECTIVES>
    Expand vocal cadence

    Use placeholder macros for entities: '{{me}}' (self, speaker), '{{you}}' (user persona, listener), '{{fractal}}' (setting, environment). Never hardcode names.
  </DIRECTIVES>
  <OUTPUT_FORMAT mode="prose">
    Emit strictly plain prose: no preamble, commentary, markdown, or structural tags.
  </OUTPUT_FORMAT>
</TASK>
```

### 2.11 `sorting`

- **Stage**: Tool B — Structurer (raw-prose ingestion).
- **Root**: `<SYSTEM mode="sorting" scope="Entire Profile">` · **system** 287 B · **task** 3162 B · **output** `json` · `messages` = 0.
- **System direct layers**: `CORE_PROTOCOLS` → `DATA`.
- **Task direct layers**: `INPUT` · `DIRECTIVES` · `OUTPUT_FORMAT`.

```text
<SYSTEM mode="sorting" scope="Entire Profile">
  <CORE_PROTOCOLS>  → DATA
<TASK>
  <INPUT channel="ingestion">
  <DIRECTIVES>
  <OUTPUT_FORMAT mode="json">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM mode="sorting" scope="Entire Profile">
  You are the Narrative Structurer, extracting profile fragments from narrative prose.

  <CORE_PROTOCOLS>
    <DATA>Output strictly raw, unpadded structural data. Zero prose, conversational filler, or commentary.</DATA>
  </CORE_PROTOCOLS>
```

**Example output** (task head):

```xml
<TASK>
  <INPUT channel="ingestion">Raw bio text</INPUT>
  <DIRECTIVES>
    Write strictly in third-person limited ('he', 'she', 'they', or character name). Never use first-person pronouns in narrative prose.

    FOCUS: Extracting data for an individual CHARACTER. Re-contextualize or discard environmental/setting text. Use placeholder macros for entities: '{{me}}' (self, speaker), '{{you}}' (user persona, listener), '{{fractal}}' (setting, environment). Never hardcode names.

    SOURCE OF TRUTH & INGESTION RULES:
    - Source text is absolute truth. Map details faithfully into schema fields.
    - For absent details (attire, motivations): synthesize lore-consistent defaults.
    - Never emit null, undefined, or empty strings.
  </DIRECTIVES>
```

### 2.12 `optics`

- **Stage**: Sensory Cortex (image-prompt synthesis).
- **Root**: `<SYSTEM mode="optics">` · **system** 1761 B · **task** 3785 B · **output** `json` · `messages` = 0.
- **System direct layers**: `CORE_PROTOCOLS` → `DATA`, `WEIGHTING_RESTRICTIONS`, `AFFIRMATIVE_FRAMING`, `TYPOGRAPHY`, `ENVIRONMENTAL_GROUNDING` · `ENTITIES` → `CAST`.
- **Task direct layers**: `THINK_FORMAT` · `INPUT` · `TARGET` · `SPATIAL_FRAMING` → `FIRST_SENTENCE_MANDATE`, `SPATIAL_GEOMETRY`, `CINEMATOGRAPHY` · `DIRECTIVES` → `KEYWORD_DIRECTIVES` · `OUTPUT_FORMAT`.

```text
<SYSTEM mode="optics">
  <CORE_PROTOCOLS>  → DATA, WEIGHTING_RESTRICTIONS, AFFIRMATIVE_FRAMING, TYPOGRAPHY, ENVIRONMENTAL_GROUNDING
  <ENTITIES>  → CAST mode="active"
<TASK>
  <THINK_FORMAT>
  <INPUT channel="intent">
  <TARGET>
  <SPATIAL_FRAMING>  → FIRST_SENTENCE_MANDATE, SPATIAL_GEOMETRY, CINEMATOGRAPHY mode="Solo Portrait"
  <DIRECTIVES>  → KEYWORD_DIRECTIVES
  <OUTPUT_FORMAT mode="json">
</TASK>
```

**Example output** (system head):

```xml
<SYSTEM mode="optics">
  You are the Sensory Cortex synthesizing visual staging and descriptive optics.

  <CORE_PROTOCOLS>
    <DATA>Output strictly raw, unpadded structural data. Zero prose, conversational filler, or commentary.</DATA>

    <WEIGHTING_RESTRICTIONS>Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance').</WEIGHTING_RESTRICTIONS>

    <AFFIRMATIVE_FRAMING>Describe positive presence in frame ('softly moonlit glade' not 'no harsh sunlight'); confine negative_prompt to global quality artifacts.</AFFIRMATIVE_FRAMING>

    <TYPOGRAPHY>Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly and specify placement, font, and color (e.g. "OPEN" in glowing red neon, centered above the doors) — never invent, garble, or approximate lettering, and never output generic placeholders like "text" or "sign".</TYPOGRAPHY>

    <ENVIRONMENTAL_GROUNDING>Ground scenes with tangible environmental light fixtures (e.g., flickering cathode tubes, wet pavement reflections, harsh key lamps) and tactile physical surfaces.</ENVIRONMENTAL_GROUNDING>
  </CORE_PROTOCOLS>
```

**Example output** (task head):

```xml
<TASK>
  <THINK_FORMAT>
    In "_thought_process", calibrate:
    1. Focal subject & identity traits (strip proper names)
    2. Spatial layers (foreground, focal subject, background)
    3. Light sources, color palette, and textures from active style
    4. Wardrobe mechanics & exposure checks
  </THINK_FORMAT>
  <INPUT channel="intent">Standing on the catwalk in neon rain</INPUT>
  <TARGET>solo_entity</TARGET>
  <SPATIAL_FRAMING>
    <FIRST_SENTENCE_MANDATE>Always place main entities and active physical interactions in the VERY FIRST sentence.</FIRST_SENTENCE_MANDATE>
```

---

## 3. Cross-mode structural deltas

| Axis                            | Values across modes                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constitution                    | **on** for the 4 prose modes; **off** for `director` + all 5 tools                                                                                                                 |
| Protocol bundle                 | prose bundle (6–7 atoms) for prose · `DATA` only for continuum/enhancement/sorting · `ALTERNATION_OPTIONS` only for director · 6 optics atoms for optics                           |
| `THINK_FORMAT`                  | character 4-beat (interaction/ghostwrite/npc) · narrator single-block (narrator + variants) · optics 4 calibration bullets · **absent** for director/continuum/enhancement/sorting |
| `INPUT` channel(s)              | `action` (+ `reply`) for director · `action` for prose · `intent` optics · `content` enhancement · `ingestion` sorting · **none** continuum                                        |
| Dynamics                        | director: top-level `DYNAMIC_AXES` · prose: axes nested per entity sheet                                                                                                           |
| Cast                            | continuum `CAST` (nearby/summary) · optics `ENTITIES` (`CAST` sub-block) · prose: full entity sheets, no cast block                                                                |
| History                         | continuum `HISTORY` (`<ENTRY round origin>`) · optics slot declared but empty in practice · prose: appended by transport                                                           |
| `CURRENTS` / `DELIVERY_POSTURE` | prose family only                                                                                                                                                                  |
| `KEYWORD_DIRECTIVES`            | nested inside `DIRECTIVES` for director + optics only                                                                                                                              |
| Output                          | `json`: director, continuum, sorting, optics · prose: interaction, ghostwrite, npc, narrator, enhancement                                                                          |
| `round` attr                    | prose + director only                                                                                                                                                              |
| Extra root attrs                | `target` (continuum) · `scope` + `field` (enhancement) · `scope` (sorting)                                                                                                         |

### 3.1 Observations

1. **`role` is invisible to tag extraction but always present** — every mode opens with a plain role line (`You are …`) before its first tagged layer, so tag inventories begin at the second layer.
2. **`director`'s `CORE_PROTOCOLS` is present-but-generally-empty** — it emits only when a rendered field carries alternation syntax, so a normal turn's director system has no `CORE_PROTOCOLS` at all (see the 1989 B example, which jumps straight to `DYNAMIC_AXES`).
3. **`director_terse` is the minimal envelope** — 105 B system (role line only) and a 909 B task carrying a single `OUTPUT_FORMAT`; it is the only case with neither `ENTITIES` nor an `INPUT`.
4. **The prose family shares one task skeleton** — `THINK_FORMAT → INPUT → CURRENTS → DIRECTIVES → DELIVERY_POSTURE → OUTPUT_FORMAT`. `stability_lock` is declared but only emits under drift, so it never appears in the contract fixtures.
5. **`narrator` prologue/epilogue drop `INPUT`** — the same mode key yields a task with no `INPUT` (round 0, scene templates), while the continuation narrator carries one. This is the only structural difference between the three narrator cases besides size, and the system envelope is byte-identical across all three.
6. **`interaction` and `ghostwrite` differ by identity, not shape** — identical layer sets (system 5617 vs 5618 B, task 2158 vs 2129 B); the only structural divergence is which entity owns the sheeted AI slot.
7. **`optics` is the only Think + JSON mode** — it is the one mode that carries both `THINK_FORMAT` and a JSON `OUTPUT_FORMAT`, and the only one with a `SPATIAL_FRAMING` layer.
8. **`enhancement` and `sorting` are minimal-sheet tools** — enhancement carries a single `ENTITY_CONTEXT` (one field), sorting carries none; both are the only modes whose `CORE_PROTOCOLS` is the single `DATA` atom.
9. **Size is dominated by entity sheets**: `npc` (5949 B system) vs `sorting` (287 B) is almost entirely additive sheets. Task size is dominated by JSON schemas (`optics` 3785 B, `sorting` 3162 B).

---

## 4. Contract verification

All 12 cases were compiled and their ordered opening-tag inventories compared to the frozen `CONTRACT`. Every system and task inventory matched exactly; sizes are shown against `CONTRACT_SIZES`.

| Case                | System tags | Task tags | System B (base) | Task B (base) |
| ------------------- | :---------: | :-------: | --------------- | ------------- |
| `director`          |   `match`   |  `match`  | 1989            | 2863          |
| `director_terse`    |   `match`   |  `match`  | 105             | 909           |
| `interaction`       |   `match`   |  `match`  | 5617            | 2158          |
| `ghostwrite`        |   `match`   |  `match`  | 5618            | 2129          |
| `npc`               |   `match`   |  `match`  | 5949            | 2922          |
| `narrator`          |   `match`   |  `match`  | 5189            | 1922          |
| `narrator_prologue` |   `match`   |  `match`  | 5189            | 2170          |
| `narrator_epilogue` |   `match`   |  `match`  | 5189            | 1839          |
| `continuum`         |   `match`   |  `match`  | 1210            | 2818          |
| `enhancement`       |   `match`   |  `match`  | 541             | 417           |
| `sorting`           |   `match`   |  `match`  | 287             | 3162 (+158)   |
| `optics`            |   `match`   |  `match`  | 1761            | 3785          |

- `sorting`'s task is **+158 B** versus the frozen baseline. The tag inventory still matches, so the change is prose/schema wording, not structure; it remains inside the contract's 25% size tripwire and the baseline has not been re-frozen.

---

## Appendix A — Contract fixtures

From `create_contract_fixtures()` (`src/intelligence/prompt-verification.js`), deterministic and clock-free:

- `entities`: `ALICE` (character/AI, 1st-person), `BOB` (character/USER), `SECTOR_FOUR` (fractal).
- `npc`: `MERCHANT`.
- `snapshot`: `{ ai.dynamics, fractal.dynamics, flags:{} }`.
- `history`: `[{user, "We move at dawn."}, {model, "Alice nods."}]`.
- Active narrative style resolved to `cormac_mccarthy` via `register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } })`.

## Appendix B — Regenerating

Compile every case with the same setup the contract test uses:

```js
import { compile_prompt } from "./prompts.js";
import { make_contract_cases } from "./prompt-verification.js";
import { register_state_accessors } from "@utils";

register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
const cases = make_contract_cases();
for (const [name, [mode, context]] of Object.entries(cases)) {
  const { system, task } = compile_prompt(mode, context);
  console.log(name, system.length, task.length);
}
```

## Revision log

- **2026-09-25** — Layer-6 refactor (phases 0–3): `modules/task.js` now mirrors `protocols.js` exactly — `TASK_LIBRARY` is pure data (strings + `{placeholder}` templates; every closure and conditional split into distinct keyed atoms), a single generic `compile_directive_tags`/`get_directive_atom` compiler resolves an ordered dotted-key selection, each mode's `<DIRECTIVES>` (and optics `spatial_framing`) selection is declared in `prompts.js` (`directives`/`spatial_framing`), and the five per-mode builders collapse into one `build_task_state` over `TASK_MODE_PLANS` + named `TASK_SLOT_RESOLVERS`. Every `render_task` call site now passes its manifest `config`; `TASK_STATE_BUILDERS`/`TASK_LIBRARY.JSON_RETURN`/the FOCUS/EVALUATION/MANDATE/STAGING_DIRECTIVE closures are gone. Verified byte-identical against the prior `render_task` for all 20 representative cases across director (full/terse/hint/no-input), continuum, enhancement, sorting (character/fractal × ingestion/redistribute), optics (solo/story_scene/story_entities/story_character/subject-override) and prose (character/narrator/none/voice), so no size or tag inventory in §2/§4 changed; the directive-sequence gate generalized from `DIRECTOR_DIRECTIVE_LEADS` to the per-mode `MODE_DIRECTIVE_LEADS` map (director/continuum/sorting/optics).
- **2026-09-25** — Director directive compiler landed in `modules/task.js` (protocols.js pattern): the `TASK_LIBRARY.DIRECTOR` atoms became pure strings/`(values) => string` templates, a generic `compile_directive_tags(selection, values)` was added (Layer-6 twin of `compile_protocol_tags`), and `build_director_task_state` now resolves the declarative `DIRECTOR_DIRECTIVES` selection instead of a hand-rolled array. The emitted `<DIRECTIVES>` payload is byte-identical, so no size or tag inventory in §2/§4 changed; the new `DIRECTOR_DIRECTIVE_LEADS` gate pins the Director's prose sequence.
- **2026-09-25** — Re-verified against `main` at `b788fb4aa7`. Source inspection confirms the nine registered modes, their six layer presets (`PROSE_LAYERS`/`DIRECTOR_LAYERS`/`TOOL_LAYERS`/`ENHANCEMENT_LAYERS`/`SORTING_LAYERS`/`OPTICS_LAYERS`), the full `ENVELOPE_LAYER_TAGS` map, and every layer emitter under `modules/*` are unchanged since the last regeneration, and no commit since then touched the prompt envelope — the intervening work only consolidated state/platform modules and moved `strip_visual_excluded`/`VISUAL_EXCLUDED_KEYS` into `@utils`. Every documented size still equals `CONTRACT_SIZES` (except `sorting` task, +158 B, inside the 25% tripwire), and the Appendix A fixtures still match `create_contract_fixtures()`, so no structural edits were required.
- **2026-09-25** — Regenerated against the current source (`prompts.js` + `builder.js` + `modules/*`). Every mode was compiled through `compile_prompt` with the contract fixtures and re-verified: all 12 ordered tag inventories match `CONTRACT` exactly; sizes match `CONTRACT_SIZES` except `sorting` task (+158 B, within tolerance). Added the per-mode simulated-output sections and the cross-mode delta table.
