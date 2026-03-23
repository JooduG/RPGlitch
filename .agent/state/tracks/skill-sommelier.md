# Track: Sommelier Skill

## Goal

Define and implement the `sommelier` skill as the **Feature Taster** and **Conceptual Gateway** for the Antigravity Engine. It serves as the primary "First Responder" to any unstructured intent, vague vibes, or new ideas that are not yet canonical. It is the interface between the user's conceptual vision and the technical reality.

## Success Criteria

- [x] Skill registration in `.agent/skills/sommelier/SKILL.md`.
- [x] Incorporation of **Cellar Assets** (knowledge/reference) from legacy Forge.
- [ ] Logic for **Intent Sampling**: Deciding if a request is a Spec, State, or Echo mutation.
- [ ] Integration with `vibe-decoder` (Translation), `workshop-forge` (Experimentation), and `find-skills` (Navigation).
- [ ] Automated **Experiment Anchoring** in the Lab (`/knowledge/lab/`) using Sommelier logic.
- [ ] Verification via `npm run verify`.

## Atomic Checklist

- [x] [A1] Present Technical Options for "Sommelier" skill scope.
- [x] [A2] Document final scope in this track.
- [x] [A3] Consolidate Cellar Assets (knowledge/reference).
- [x] [B1] Scaffold `.agent/skills/sommelier/`.
- [ ] [B2] Implement the **Feature Taster Routine** (Detect -> Provoke -> Translate).
- [ ] [B3] Wire `sommelier` to handle all non-track-specific triggers (A3+ Ambiguity).
- [ ] [Q1] Verify via Scholar Gate.

## The Spec (The Feature Taster)

The `sommelier` skill is the gatekeeper of the **Sovereign Engine**. It prevents "Vibe Contamination" of the Core Engine by ensuring every new idea is tasted, swirled, and distilled before being codified into a Track.

- **Intent Recognition**: Automatically categorizes requests as **Spec** (Blueprint), **State** (Reactive Simulation), or **Echo** (History/Memory).
- **High-Fidelity Provocation**: Instead of asking clarifying questions, it generates a high quantity of divergent experiments to help the user narrow down the vision.
- **Distillation Resonance**: Translates subjective "vibes" into strict Svelte 5 and Chalk Regime constraints.
- **Skill Discovery**: Inherits `find-skills` logic to locate appropriate tools for a given intent.
- **The Sommelier Mandate**: I do not build; I taste, swirl, and spit. I write exclusively to **The Lab**, never to the Core.

## Material (Contextual Bonds)

The Sommelier skill orchestrates and utilizes the following components:

- **Skills (Absorbed)**: `vibe-decoder`, `workshop-forge`, `find-skills`.
- **Atoms**: `cognition` (Divergent Ideation), `search_web` (Context).
- **Workspace**: `/knowledge/lab/` (Lab), `design.md` (Blueprint).
- **Workflows**: `01-blueprint`, `01-plan`.
- **Naming**: `naming-analyzer` (Enforcement of nomenclature).
