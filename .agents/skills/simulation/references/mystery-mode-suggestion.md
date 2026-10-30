# Suggestion: Scoped Mystery & Paranoia Mode (`FAIRPLAY_FUZZ` + `INSIGHT_SYNC`)

**Status:** PROPOSED / SUGGESTION  
**Scope:** Specific Mystery/Paranoia Fractals & Scenarios (Not global)  
**Origin:** Synthesis of `scrobbles.md` (`BLACKBOX_NPC`, `PLOT_MYSTERY`) and `tjofs.md` (Atom #4)

---

## 1. Problem Statement

Standard LLM roleplay collapses mystery scenarios in two characteristic ways:

1. **Premature Confession:** Under minor questioning, NPCs immediately reveal their hidden agendas or backstory secrets (`| hide` brackets).
2. **Omniscient Stonewalling:** NPCs refuse to give ground or provide any tangible traction, creating a dead-end brick wall where player deduction is meaningless.

---

## 2. Core Mechanics

When a story is flagged with a **Mystery / Paranoia Mode** (or running a mystery-focused Fractal), the simulation engine enforces two paired rules:

### A. Dual Contradictory Motives

The target NPC operates under two competing agendas in `future` or `state_of_mind`:

- **Surface Motive:** Their socially stated, defensible objective.
- **Occluded Motive (`| hide`):** Their concealed truth, personal agenda, or clandestine vulnerability.

### B. `FAIRPLAY_FUZZ` (Traceable Micro-Anomalies)

- **Constraint:** The NPC must defend their hidden motive through conversational misdirection, partial truths, or deflection.
- **The Guarantee:** When the player directly presses, questions, or investigates the domain of the concealed motive, the NPC **must emit exactly one traceable inconsistency per scene beat**:
  - A timeline discrepancy,
  - An involuntary physiological tell (e.g., sudden gaze shift, frozen posture, micro-hesitation),
  - Or an over-managed, unnaturally smooth excuse that leaves a logical fissure.
- **Immunity from Total Stonewalling:** Clues are never zero; paranoia is grounded in decryptable behavioral reality.

### C. `INSIGHT_SYNC` (Proportional Escalation)

- When the player connects clues accurately in dialogue (high deductive accuracy), the NPC's cognitive load increases.
- **Mechanical Effect:** Subsequent tells become progressively clearer and less ambiguous, rewarding deductive play without requiring out-of-character hints.

---

## 3. Placement & Prompt Injection

- **Trigger:** Flagged via Fractal setting (`fractal.present` / scenario) or Director flag (`mystery_mode: true`).
- **Prompt Insertion:** Injected into `PROSE_CORE` `<TASK>` under `<STYLE_AND_SUBTEXT>` or specialized Director staging notes.
- **Baseline Wall Guard:** In all standard non-mystery scenes, the baseline rule in Law 2 (Epistemics) applies: concealed truths (`| hide`) are defended through plausible deflection and observable micro-tells rather than unprompted confession.
