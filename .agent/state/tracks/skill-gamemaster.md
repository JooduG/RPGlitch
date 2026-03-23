# Track: Gamemaster Skill

## Goal

Define and implement the `gamemaster` skill to house the **Mechanical Heart** of the project. This skill is the sovereign authority on simulation integrity, enforcing the "Rules of the World" and governing the transitions between **System Turns** (Physics) and **AI Turns** (Narrative).

## Success Criteria

- [ ] Skill registration in `.agent/skills/gamemaster/SKILL.md`.
- [ ] Logic for the **Mechanical Gate**: Ensuring AI narrative beats do not contradict physical state mutations.
- [ ] Implementation of **Off-Screen Momentum** (NPC/Fractal autonomy).
- [ ] Automated **State Snapshotting** and Bayesian logic refinement.
- [ ] Verification via `npm run verify`.

## Atomic Checklist

- [ ] [A1] Identify all mechanical truth-tables in `dynamics-engine.js`.
- [ ] [A2] Document the "Simulation Cycle" (Rule 02) state-machine.
- [ ] [B1] Scaffold `.agent/skills/gamemaster/`.
- [ ] [B2] Implement the **Simulation Strategist Routine** (Tick -> Mutate -> Reconcile).
- [ ] [B3] Wire `gamemaster` to `intelligence-kernel` for narrative hooks.
- [ ] [Q1] Verify via Scholar Gate.

## The Spec (The Simulation Strategist)

The `gamemaster` (GM) is the orchestrator of **Rule 02: Simulation**. While the characters provide the prose, the GM provides the *consequences*. It is responsible for the mechanical consistency of the Fractal.

- **The Mechanical Gate**: Validates every round of cause-and-effect. It translates raw numbers (stress, entropy, health) into "Narrative Bridges" for the intelligence kernel.
- **Fractal Autonomy**: Manages the independent reaction of the world. It ensures the setting has "momentum" and objective-driven persistence even when not the focus of the user.
- **Round Logic**: Owns the Round Integer and the progression of "Chrono Kinetics." It is the pulse of the engine.
- **Diegetic Signaling**: Ensures statistical signals (trust, sanity, BayesMind data) are expressed diegetically in the final narrative output.

## Material (Contextual Dependencies)

The Gamemaster skill orchestrates and utilizes the following components:

- **Core Engine**: `dynamics-engine.js`, `intelligence-kernel.js`, `session-driver.js`.
- **Abilities (Absorbed)**: `simulation-strategy`, `simulation-memory`, `workshop-warden` (Physics).
- **Atoms**: `cognition` (Arbitration), `data` (Lore), `resonance` (Sentiment).
- **State**: `runtime.svelte.js`, `session.svelte.js`.
- **Rules**: `Rule 02: Simulation` (The Cycle).
