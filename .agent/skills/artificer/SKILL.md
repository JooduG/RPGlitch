---
name: artificer
description: Triggers on all files in src/artificer/ or where otherwise relevant. Governs the crafting of UI components, layouts, and storyboard features.
---

# Artificer: UI & Layout Skill

## When to use this skill

- Creating or modifying Svelte 5 components in `src/artificer/`.
- Implementing visual layouts, storyboard features, or storymode UI.
- Applying SCSS styling according to project standards.

## Workflow

1.  **Scope Assessment**: Determine if the component is atomic (Button) or composite (Panel).
2.  **Logic Definition**: Define reactive state using Svelte 5 Runes (`$state`, `$props`).
3.  **Styling Implementation**: Apply encapsulated SCSS following the 7-1 pattern.
4.  **Verification**: Validate responsiveness and touch targets (min 44x44px).

## Instructions

- **Naming**: Use `PascalCase` for all `.svelte` filenames.
- **Props**: Destructure `$props()` immediately for clarity and reactivity tracking.
- **Reactivity**: Prefer `src/artificer/state.svelte.js` for cross-component state.
- **Styles**: Use standard mixins (e.g., `%material-glass`) and avoid Tailwind or IDs for styling.

## Resources

### Visual Topology

```mermaid
graph LR
    ROOT["/"] --> SRC["src/"]
    ROOT --> TOOLS["tools/"]
    ROOT --> AGENT[".agent/"]

    subgraph CORE [The Nervous System]
        direction TB
        GM["gamemaster/"] --> CHRONO("chrono.svelte.js")
        GM --> LLM("llm.js")
        SCH["scholar/"] --> ECHO("library/echo.js")
        MES["mesmer/"] --> VOICE("voice.svelte.js")
        WAR["warden/"]
    end

    subgraph BODY [The Artificer]
        ART["artificer/"] --> SB["storyboard/"]
        ART --> SM["storymode/"]
        APP("App.svelte")
    end

    SRC --> GM
    SRC --> SCH
    SRC --> MES
    SRC --> WAR
    SRC --> ART
    SRC --> APP
```

### Key Nervous System Files

- **Time Engine**: `src/gamemaster/chrono.svelte.js`
- **Memory/Persistence**: `src/scholar/library/echo.js`
- **Voice/Audio**: `src/mesmer/audio/voice.svelte.js`
- **Visual Theme**: `src/mesmer/logic/theme.svelte.js`
- **Global State**: `src/artificer/state.svelte.js`