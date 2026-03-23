# Track: Entry Skill

## Goal

Define and implement the `entry` skill as the **Frontier Scout** and **Conceptual Gateway** for the Antigravity Engine. It serves as the primary "First Responder" to any unstructured intent, vague vibes, or new ideas that are not yet canonical. It is the interface between the user's conceptual vision and the technical reality.

## Success Criteria

- [ ] Skill registration in `.agent/skills/entry/SKILL.md`.
- [ ] Logic for **Intent Categorization**: Deciding if a request is a Spec, State, or Echo mutation.
- [ ] Integration with `vibe-decoder` (Translation), `workshop-forge` (Experimentation), and `find-skills` (Navigation).
- [ ] Automated **Experiment Anchoring** in the Lab (`/knowledge/lab/`) using Forge logic.
- [ ] Verification via `npm run verify`.

## Atomic Checklist

- [x] [A1] Present Technical Options for "Entry" skill scope.
- [x] [A2] Document final scope in this track.
- [ ] [A3] Evaluate "Gatekeeper" logic (Transitioning Experiments from Lab to Core).
- [ ] [B1] Scaffold `.agent/skills/entry/`.
- [ ] [B2] Implement the **Frontier Scout Routine** (Detect -> Provoke -> Translate).
- [ ] [B3] Wire `entry` to handle all non-track-specific triggers (A3+ Ambiguity).
- [ ] [Q1] Verify via Scholar Gate.

## The Spec (The Frontier Scout)

The `entry` skill is the gatekeeper of the **Sovereign Engine**. It prevents "Vibe Contamination" of the Core Engine by ensuring every new idea passes through the Forge and Lab before being codified into a Track.

- **Intent Recognition**: Automatically categorizes requests as **Spec** (Blueprint), **State** (Reactive Simulation), or **Echo** (History/Memory).
- **High-Fidelity Provocation**: Instead of asking clarifying questions, it generates a high quantity of divergent experiments to help the user narrow down the vision.
- **Translation Resonance**: Uses `vibe-decoder` logic to translate subjective "vibes" into strict Svelte 5 and Chalk Regime constraints.
- **Skill Discovery**: Inherits `find-skills` logic to locate appropriate tools for a given intent.
- **The Forge Mandate**: I do not build; I provoke, retrieve, and translate. I write exclusively to **The Forge** and **The Lab**, never to the Core.

## Material (Contextual Bonds)

The Entry skill orchestrates and utilizes the following components:

- **Skills (Absorbed)**: `vibe-decoder`, `workshop-forge`, `find-skills`.
- **Atoms**: `cognition` (Divergent Ideation), `search_web` (Context).
- **Workspace**: `workshop-forge/knowledge/` (Forge), `/knowledge/lab/` (Lab), `design.md` (Blueprint).
- **Workflows**: `01-blueprint`, `01-plan`.
- **Naming**: `naming-analyzer` (Enforcement of nomenclature).
