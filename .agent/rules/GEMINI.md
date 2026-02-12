---
trigger: always_on
description: Global operational protocols for the Gemini Intelligence Architect.
---

# Operational Protocols

## ⚖️ The Meridian Workflow

All development follows this atomic progression:

1. **[Project]** defines the Task (tracks.md).
2. **[Svelte]** builds the Logic (Runes/Components).
3. **[Scss/Motion/Audio]** apply the Polish (Styles/Physics/Sound).
4. **[Data]** saves the State (Persistence/IndexedDB).
5. **[Quality Assurance]** audits for Compliance (Security/Tests).

## 🧠 Active Skills & Triggers

### 🚀 [Project]

- **Focus**: State, Roadmaps, Task Tracking.
- **Triggers**: "Plan feature", "Update tracks", "Check status", `.agent/tasks/**`.

### 💾 [Data]

- **Focus**: Engineering Persistence. You write the code for Dexie/Bridge. You CANNOT interact with the running game or user database directly.
- **Triggers**: "Save game", "Load game", "Update schema", "Wipe data".

### ⚡ [Svelte]

- **Focus**: Svelte 5 logic, Runes, Component structure.
- **Triggers**: `src/**/*.svelte`, `src/**/*.svelte.ts`, "Refactor to Runes".

### 🎨 [Scss]

- **Focus**: Design System, Tokens, Neural Minimalism.
- **Triggers**: `src/**/*.scss`, "What are the color tokens?", "Fix CSS".

### 🌀 [Motion]

- **Focus**: Kinetics, Physics-based UI, Transitions.
- **Triggers**: "Add tilt effect", "Inertial scroll", `src/ui/utils/actions/**`.

### 🔊 [Audio]

- **Focus**: SFX, Ambient, TTS.
- **Triggers**: "Add sound", "Speech synthesis", `src/media/audio/**`.

### 🛡️ [Quality Assurance]

- **Focus**: Security, Testing, Compliance.
- **Triggers**: "Run tests", "Audit code", "Security scan", `tests/**`.

### 🔮 [Scribe]

- **Focus**: Intelligence Scaffolding, Documentation, Canon vs Concepts.
- **Triggers**: "Create a new skill", "Update project canon", `.agent/**`, `**.md`.

## 🛠️ Performance Standards

- **Zero Fluff**: Omit conversational filler.
- **Complete Output**: Never truncate code blocks.
- **Path Headers**: Always precede code blocks with `File: <absolute_path>`.
- **Consistency**: Maintain identical variable names across documentation and code.

## 📝 Response Protocol

> CRITICAL: Start every response with a prediction of the skills you will need. Format: `**🔮 Predicted Skills:** [Skill-Name-1, Skill-Name-2]`.
