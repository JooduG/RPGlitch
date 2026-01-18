# RPGlitch

A next-generation AI Roleplay Engine built on Perchance, featuring a **Simulation-Driven Architecture** for immersive, consistent, and unrestricted storytelling.

## Overview

RPGlitch is a "Local-First" web application that turns your browser into a sophisticated RPG tabletop. It allows you to create custom Fractals and Characters, then engage in deep, coherent roleplay with an AI Game Master that adheres to strict narrative consistency rules.

## 🏗️ Architecture

### The Build Pipeline (Constraint-Based Engineering)

This explains how we turn a Monorepo into a Single File.

```mermaid
graph TD
    subgraph "Development Environment (Local)"
        SRC[Apps Source Code] -->|Vite 6 + SCSS| BUILD[Build Script]
        VEND[Vendored Libs] -->|Inject| BUILD
        WORKER[Worker Logic] -->|Blob Stringify| BUILD
    end

    BUILD -->|Output| HTML[Single HTML File]

    subgraph "Perchance Runtime (Browser)"
        HTML -->|Loads| IFRAME[Perchance Iframe]
        IFRAME -->|Hydrates| APP[Running App]
    end
```

### The Runtime Data Flow (The Game Loop)

This explains the new WebWorker & Event Bus flow we just implemented.

```mermaid
sequenceDiagram
    participant User
    participant UI as 🖥️ UI
    participant Bus as 📢 EventBus
    participant Dir as 🎬 Director
    participant DB as 💾 Dexie
    participant AI as 🧠 LLM Service

    Note over User, AI: The "Prometheus" Turn Cycle

    User->>UI: Types Message
    UI->>DB: Save User Message
    UI->>Dir: send()

    rect rgb(20, 20, 20)
        Note right of Dir: Main Thread Execution
        Dir->>Dir: Calculate Physics (Reflex)
        Dir->>Dir: Build Prompt (ContextBuilder)

        Dir->>AI: LlmService.generate()
        AI-->>Dir: Response Text

        Dir->>DB: Save AI Message
        Dir->>DB: Update Entity States
    end

    Dir->>Bus: Dispatch "CHAT_REFRESH"
    Bus->>UI: Trigger Re-render
    UI->>DB: Fetch Latest Messages
    UI-->>User: Show Response
```

### The Simulation Engine

RPGlitch supersedes standard chatbot patterns by implementing a **Simulation Engine**. Instead of just generating text, the system calculates the "physics" of the narrative state in the background.

## Source Structure

```text
src/
├── RPGlitch-left-panel.txt   # Perchance engine imports
├── index.html                # Main UI template (Vite Entry)
├── gamemaster/               # 🧠 The Brain (Orchestration)
│   ├── chrono.svelte.js      # Time & Turn Logic
│   └── llm.js                # AI Generation Service
├── mesmer/                   # 👁️ The Senses (Audio/Visual)
│   └── voice.svelte.js       # Reactive Voice Store
├── scholar/                  # 📚 The Memory (Database)
│   ├── library/              # The "Echo" Repository
│   └── index.js              # Database Entry
├── warden/                   # 🛡️ The Law (Security/Parser)
│   └── index.js              # DOMPurify & Validation
└── scss/                     # 💅 The Skin (Design System)
    ├── index.scss            # Main entry
    └── ...                   # 7-1 Architecture
```

## Technology Stack

- **State Management:** IndexedDB via Dexie.js (single source of truth)
- **UI Framework:** Svelte 5 (Runes) + Native SCSS
- **Bundler:** Vite 6
- **Security:** DOMPurify for XSS prevention

## Related Documentation

- [Deployment & Integration Guide](../.agent/knowledge/perchance-guide.md)
- [UI/UX Guidelines](../.agent/rules/style.md)
- [Agent Protocol](../AGENTS.md)
