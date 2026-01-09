# 🌡️ The Prometheus Dynamics System (v5.0)

The **Dynamics System** calculates the "Narrative Thermodynamics" of the simulation. It tracks the emotional and pacing "temperature" of the story and enforces consequences (Laws) when things get too intense.

---

## 1. The Core Schema (State)

Every Entity (AI, User, Fractal) has a `dynamics` object containing four 0-100 float values.

| Stat             | Alias        | Meaning                                         | Low (0-20)       | High (80-100)          |
| :--------------- | :----------- | :---------------------------------------------- | :--------------- | :--------------------- |
| **Entropy**      | _The Fog_    | Confusion, stress, chaos, reality stability.    | Clean, Ordered.  | Panic, Hallucinations. |
| **Velocity**     | _The Pulse_  | Pacing, adrenaline, urgency, speed.             | Slow, Calm.      | Combat, Manic.         |
| **Resonance**    | _The Feels_  | Emotional depth, trauma activation, connection. | Shallow, Numb.   | Obsessive, Deep.       |
| **Permeability** | _The Shield_ | Openness to influence, vulnerability.           | Guarded, Closed. | Exposed, Raw.          |

---

## 2. The Execution Cycle (The Loop)

The system updates via two mechanisms: **The Reflex (Fast/Cop)** and **The Pulse (Slow/Judge)**.

### A. The Reflex (Every Turn - Real Time)

_Runs on User Input immediately inside `_executeTurn`._

1.  **Scan:** Regex matches keywords (e.g., "kill" -> Velocity +20).
2.  **Delta:** Applies an immediate "draft" update.
3.  **Ledger:** Records this in `customData.reflex_ledger`.
4.  **PHYSICS (CRITICAL):** THe Engine runs `calculateDynamics` **IMMEDIATELY**.
    - If the Reflex pushed Velocity > 90, **Law 1 (Adrenaline Shield)** triggers instantly, reducing Permeability _before_ the AI even replies.

### B. The Pulse (Every 3 Turns - Round Robin)

_Runs asynchronously in the background._

- **Frequency:** Every 3 Turns.
- **Rotation:** AI -> User -> Fractal -> AI... (Full cycle every 9 turns).

1.  **Analyze:** LLM reads the last ~9 messages (Heartbeat Window).
2.  **Context:** LLM sees target profile + **Other Actors Present**.
3.  **Estimate:** LLM estimates the _Total Change_ needed.
4.  **Reconcile:** The Engine subtracts the Reflex Ledger from the AI Estimate.
    - _Formula:_ `FinalUpdate = AI_Estimate - Reflex_Ledger`
5.  **Physics:** Gravity pulls stats back to baseline (5%).
6.  **Clear:** The `reflex_ledger` for that entity is reset.

---

## 3. The Laws of Physics (v5.2 Symmetric Model)

Defined in `src/js/engine/physics/config.js` and enforced by `src/js/engine/physics/main.js`.

### Law Types

- **Generic High Law (90+):** Extreme state triggers physics consequences (Stat change or Multiplier).
- **Generic Low Law (10-):** Critical deficiency triggers compensatory physics.
- **Signals (70+ / 30-):** Only triggers Voice Instructions (LLM guidance), no physics.

### Special Case Laws

- **Law 5: The Echo Chamber (Res > 80, Ent < 20)**
  - **Effect:** Incoming Entropy x 0.
  - **Logic:** "Total Stasis." High emotion + Low chaos = Immunity to new information.
- **Law 6: The Venus (Vel < 20, Perm > 80)**
  - **Effect:** Incoming Resonance (Gain) x 2, Incoming Resonance (Loss) x 0.
  - **Logic:** "The Love Sponge." High vulnerability + Low energy = Absorbs love, ignores heartbreak.
- **Law 7: Relative Gravity**
  - **Effect:** All stats drift 10% towards baseline (50) every Pulse. Minimum drift 1.0.

---

## 4. The Master Configuration Table

| Stat             | Threshold | Name                  | Effect (Physics) | Voice Instruction Signal                                      |
| :--------------- | :-------- | :-------------------- | :--------------- | :------------------------------------------------------------ |
| **VELOCITY**     | **90+**   | **Adrenaline Shield** | Perm -10, Res -5 | **ADRENALINE:** Fast pacing, short sentences, brutal actions. |
|                  | **70+**   | -                     | -                | **HIGH SIGNAL:** Fast pacing.                                 |
|                  | **30-**   | -                     | -                | **LOW SIGNAL:** Slow pacing, lethargy.                        |
|                  | **10-**   | **Deep Breath**       | Res +10, Ent -5  | **LETHARGY:** Deliberate movement, heavy fatigue.             |
| **ENTROPY**      | **90+**   | **Fog of War**        | Res -5, Vel +10  | **INSTABILITY:** Hallucinations, glitching, reality break.    |
|                  | **70+**   | -                     | -                | **HIGH SIGNAL:** Glitching.                                   |
|                  | **30-**   | -                     | -                | **LOW SIGNAL:** Lucid, analytical.                            |
|                  | **10-**   | **Crystallization**   | Perm -10, Vel -5 | **CLARITY:** Pattern recognition verified.                    |
| **PERMEABILITY** | **90+**   | **Glass Cannon**      | Inc. Entropy x 2 | **VULNERABILITY:** Focus on somatic details (skin, heat).     |
|                  | **70+**   | -                     | -                | **HIGH SIGNAL:** Vulnerable.                                  |
|                  | **30-**   | -                     | -                | **LOW SIGNAL:** Guarded.                                      |
|                  | **10-**   | **Iron Bunker**       | Inc. Res x 0.5   | **GUARDED:** Defensive, mistrustful, masking.                 |
| **RESONANCE**    | **90+**   | **Obsession**         | Ent -10, Perm -5 | **EMPATHY:** Profound connection, merge perspectives.         |
|                  | **70+**   | -                     | -                | **HIGH SIGNAL:** Connection.                                  |
|                  | **30-**   | -                     | -                | **LOW SIGNAL:** Detachment.                                   |
|                  | **10-**   | **Apathy**            | Vel -10, Ent +5  | **DETACHMENT:** Cold, clinical, view as variable.             |

---

## 5. File Architecture

- **`src/js/engine/physics/main.js`**: Use `calculateDynamics()` to apply Laws 1-7.
- **`src/js/engine/physics/reflex.js`**: `scanReflex()` (Inputs) & `getReflexInstruction()` (Outputs).
- **`src/js/engine/physics/config.js`**: **SINGLE SOURCE OF TRUTH** for all constants.
- **`src/js/engine/director.js`**: Orchestrates `_executeTurn` (Reflex/Physics) & `_runPulse` (Round-Robin/Reconciliation).
