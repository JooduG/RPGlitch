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

### The Linear Heartbeat (The Turn Cycle)

This explains the simplified execution flow managed by **Chrono**. It is a strictly linear chain of events, with a high-frequency "Streaming Loop" nested within the generation phase.

```mermaid
sequenceDiagram
    participant User
    participant UI as 🖥️ UI
    participant Chrono as ⏳ Chrono
    participant Security as 🛡️ Security
    participant Engine as 🎬 Engine
    participant AI as 🧠 LLM Service
    participant DB as 💾 Dexie
    User->>UI: Action Input
    UI->>Chrono: advanceTurn(input)
    rect rgb(30, 30, 35)
        Note over Chrono, DB: UI LOCKED (app.simulation.loading = true)
        Chrono->>Security: process(input)
        Security-->>Chrono: securityContext (Physics Result)
        Chrono->>Engine: generateAiResponse(options)
        Engine->>AI: LlmService.generate(payload)
        loop Token Streaming
            AI-->>UI: app.updateStream(token)
            UI-->>User: Visual Feedback (Incremental)
        end
        AI-->>GM: Full Response String
        GM->>DB: Save Final Message
        Chrono->>DB: runtime.save() (Anchor State)
        Note over Chrono, DB: UI UNLOCKED (app.simulation.loading = false)
    end
    UI-->>User: Interaction Ready
```

### The Simulation Engine

RPGlitch supersedes standard chatbot patterns by implementing a **Simulation Engine**. Instead of just generating text, the system calculates the "logic" of the narrative state in the background.

```text
src/
├── core/   # 🕰️ Logic, Engine, Intelligence, Security
├── data/   # 📚 Database, Repository, Persistence (Dexie)
├── state/  # ⚡ Reactive State Bridges (Svelte 5 Runes)
├── ui/     # 🛠️ UI Components (Atoms, Molecules, Organisms)
├── theme/  # 🎭 SCSS Design System (7-1 Architecture)
└── media/  # 🎨 Visuals, Audio, Sensory Layer
```

## Technology Stack

- **State Management:** IndexedDB via Dexie.js (single source of truth)
- **UI Framework:** Svelte 5 (Runes) + Native SCSS
- **Bundler:** Vite 6
- **Security:** DOMPurify for XSS prevention

## Related Documentation

- [Prime Directive](/.agent/rules/01-foundation.md)
- [Architecture](/.agent/knowledge/atlas/03-architecture.md)
- [Tech Stack](/.agent/knowledge/atlas/01-vision.md)
- [Agent Rules](/GEMINI.md)
