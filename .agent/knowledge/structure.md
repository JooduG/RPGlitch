# 🏛️ The Monolith Structure (Reactive Edition)

## 1. Visual Topology

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

    style GM fill:#f9f,stroke:#333,stroke-width:2px
    style CHRONO fill:#ff9,stroke:#333,stroke-width:2px
```

## 2. Key Files (The Nervous System)

- **Time:** `src/gamemaster/chrono.svelte.js`
- **Memory:** `src/scholar/library/echo.js`
- **Voice:** `src/mesmer/audio/voice.svelte.js`
- **Theme:** `src/mesmer/logic/theme.svelte.js`
- **Global State:** `src/artificer/state.svelte.js`

## 3. The Bridge (Perchance vs Local)

- **Perchance Panel:** Holds `window.ai` and `rpgLists` (The Platform).
- **Svelte Application:** Consumes `window.ai` via `src/gamemaster/llm.js`.
