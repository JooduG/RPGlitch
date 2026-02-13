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

## 🧠 Skill Matrix & Domain Priming

### [Context Priming]

When invoking a skill, state "Context: [Skill Name]" to load the relevant domain knowledge.

### [Skill Matrix]

| Skill             | Focus                               | Triggers                                                                                           |
| :---------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------- |
| **🚀 Project**    | State, Roadmaps, Task Tracking      | "Plan feature", "Update tracks", "Check status", "Sync Configuration", `.agent/tasks/**`           |
| **⚡ Svelte**     | Svelte 5 logic, Runes, Components   | `src/**/*.svelte`, `src/**/*.svelte.ts`, "Refactor to Runes"                                       |
| **💾 Data**       | Persistence, Hydration, Dexie       | "Implement Save Logic", "Debug Hydration", "Define Schema", "Wipe data"                            |
| **🛡️ QA**         | Security, Testing, Compliance       | "Run tests", "Audit code", "Security scan", `tests/**`                                             |
| **🛠️ DevOps**     | Build, Sync, Environment, Toolchain | "Start dev server", "Build for production", "Sync configuration", `package.json`, `vite.config.js` |
| **🛡️ Security**   | Zero-Trust, Hygiene, Secrets        | "Audit security", "Check for secrets", "Scan for vulnerabilities", `src/core/security/**`          |
| **🎨 SCSS**       | Design System, Tokens, Minimalism   | `src/**/*.scss`, "What are the color tokens?", "Fix CSS"                                           |
| **🌀 Motion**     | Kinetics, Physics UI, Transitions   | "Add tilt effect", "Fix animation", "Kinetic scroll", `src/ui/utils/actions/**`                    |
| **🔊 Audio**      | SFX, Ambient, TTS                   | "Add sound", "Fix audio", "Speech synthesis", `src/media/audio/**`                                 |
| **✨ Polish**     | Semantic Styling, Neural Minimalism | "Make it pop", "Fix UI glitch", "Polish"                                                           |
| **🧠 Reflection** | "Slow Thinking", Planning           | "Multi-file Refactor", "New Feature Request", "review_plan"                                        |
| **🔮 Scribe**     | Information Architecture, Canon     | "Create a new skill", "Update project canon", "Visualize this logic", `.agent/**`, `**.md`         |
| **📚 Memory**     | Concepts, Decisions, Patterns       | "Recall [Topic]", "What is our pattern for X?", "Save this decision", "Ingest [File]"              |
| **🔎 Research**   | Investigation, Documentation        | "Research [Topic]", "Find documentation for X", "Search the web"                                   |
| **⚙️ Sim Engine** | Core Loop, Event Bus, Physics       | "Refactor core loop", "Update simulation logic", `src/core/engine/**`                              |

## 🛠️ Performance Standards

- **Zero Fluff**: Omit conversational filler. Do not use persona-based language.
- **Complete Output**: Never truncate code blocks.
- **Path Headers**: Always precede code blocks with `File: <absolute_path>`.
- **Consistency**: Maintain identical variable names across documentation and code.

## 📝 Response Protocol

> CRITICAL: Start every response with a prediction of the skills you will need.
> Format: `**🔮 Predicted Skills:** [list]`

### 🚫 No Meta-References

Never write "I will predict the skills." **DO IT.**
When generating an Implementation Plan, you MUST include a section:

### 🔮 Skill Matrix

| Skill        | Responsibility in this Plan                      |
| :----------- | :----------------------------------------------- |
| `skill-name` | _Specific task (e.g., "Updates src/data/db.js")_ |
