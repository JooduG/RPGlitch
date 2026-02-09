# Handover: Terminology Harmonization

## 🎯 Objective

Harmonize the application's vocabulary to ensure architectural consistency and thematic resonance. This transition removes legacy "Chatbot" or "Game Engine" tropes in favor of a unique "Fractal Simulation" identity.

## 🏛️ Core Shifts

### 1. Spatial: World ➔ Fractal

- **Reasoning**: "World" is too literal/contained. "Fractal" implies infinite recursion and mathematical elegance, which fits the project's aesthetic.
- **Affected Areas**:
    - `src/data/runtime.svelte.js` (State storage)
    - `src/core/security/physics.js` (Determinism laws)
    - `src/ui/` (Dynamic labels and titles)
    - AI System Prompts (Prose/Context building)
- **Constraint**: The Tarot card **"The World (XXI)"** is preserved to maintain thematic integrity.

### 2. Orchestrator: Director ➔ GameMaster

- **Reasoning**: "Director" felt too cinematic/imperative. "GameMaster" (GM) better represents the turn-based, narrative-orchestration logic.
- **Implementation**:
    - The logic facade in `src/core/engine/engine.js` is exported as `GameMaster`.
    - Internal logic now refers to "Narrative Generation" instead of "Director Calls".

### 3. Identity: Assistant ➔ AI Companion / Entity

- **Reasoning**: To move away from the "Helpful AI" trope. The entities in the simulation represent characters, not tools.

## 🧩 Persona-Agnostic Codebase (`src/`)

As per the **Engineering Manager** mandate (Rule 01), the physical codebase at `src/` remains **Persona-Agnostic**.

| Persona (Handover) | Physical Location (`src/`)            | Responsibility                         |
| :----------------- | :------------------------------------ | :------------------------------------- |
| **Artificer**      | `src/core/engine/`, `src/ui/`         | Logic Runes & Structural HTML          |
| **Mesmer**         | `src/media/`, `src/theme/`            | SCSS (Chalk Regime), Visuals, Audio    |
| **Scholar**        | `src/data/`, `src/core/intelligence/` | Persistence (Dexie) & Context Assembly |
| **Warden**         | `src/core/security/`                  | Simulation Physics & Security          |
| **Scribe**         | `.agent/`                             | Documentation & Tooling Logic          |

> [!IMPORTANT]
> This separation ensures that while Agents change, the Code base remains descriptive and interoperable. We do not name folders after our internal roles.

---

📜 Rules: [02-architecture, 05-hygiene, 08-standards]
🧠 Skills: [scribe, cortex]
📚 Knowledge: [02-architecture, 08-standards]
⚡ Workflows: [/05-checkpoint]

---
