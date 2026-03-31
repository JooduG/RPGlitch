# 🔷 RPGlitch (JooduG Monorepo)

A next-generation AI Roleplay Engine built on the Perchance platform. RPGlitch is a "Local-First" web application that turns your browser into a sophisticated RPG tabletop. It features a **Simulation-Driven Architecture**, allowing you to create custom characters and engage in deep, coherent roleplay with an AI Game Master that adheres to strict narrative consistency.

## ⚡ Quick Start

**Run the following commands** in your trmnl

1. \*_`npm install`_ es)
2. \*_`npm run sync`_ ies)
3. **`npm run dev`** (Build and launch the local server)

## ⏳ The Core Engine: Rounds & Turns

RPGlitch supersedes standard chatbot patterns by separating the narrative state from the user interface. Time flows via discrete "Rounds," which are broken down into specific "Turns."

**Sending a message always ends the current Round and triggers the start of the next.**

Here is the e ingle Round:

1. **SYSTEM_TURN (The Physics Engine)**
   Starts the exact moment you send a message. The UI is temporarily locked. In the background, the engine calculates social dynamics, mem d world physics.
2. **AI_TURN + USER_TURN (The Narrative Parallel)**
   The moment the system finishes calculating, the UI is unlocked. The AI begins streaming its narrative response (**AI_TURN**). Because the UI is unlocked, your \*\*USE e exact same time.
3. **The Interrupt Window**
   In 99% of cases, you will wait for the AI to finish generating before you begin typing your next move. However, because both turns run in parallel, you have th the AI at any time.
4. **End of Round**
   **Click "Send"** on your next message to close the current round and immediately restart the loop at Step 1.

### Visualizing the Lifecycle

```mermaid
flowchart LR
 Start((Message Sent)) --> Sys[SYSTEM_TURN<br>UI Locked<br>Engine Calculates]

 Sys --> Unlocks{UI Unlocks}

 Unlocks --> AI[AI_TURN<br>Streams Response]
 Unlocks --> User[USER_TURN<br>Free to Type]

 AI -.->|Wait or Interrupt| Next((Next Message Sent))
 User -->|Triggers| Next

 style Start fill:#2a9d8f,stroke:#fff,stroke-width:2px,color:#fff
 style Sys fill:#e76f51,stroke:#fff,stroke-width:2px,color:#fff
 style Unlocks fill:#e9c46a,stroke:#fff,stroke-width:2px,color:#333
 style AI fill:#264653,stroke:#fff,stroke-width:2px,color:#fff
 style User fill:#264653,stroke:#fff,stroke-width:2px,color:#fff
 style Next fill:#2a9d8f,stroke:#fff,stroke-width:2px,color:#fff
```

## 🏗️ Architecture & Technology Stack

The system architecture prioritizes offline-first resilience and agentic automation, utilizing a Zero-Trust Security model to sanitize the runtime environment.

### Folder Structure

- `src/core/` : Logic, Engine, Intelligence, and Security.
- `src/data/` : Database, Repository, and Persistence.
- `src/state/` : Reactive State Bridges.
- `src/ui/` : Interface Components.
- `src/theme/` : SCSS Design System.
- `src/media/` : Visuals, Audio, and Sensory Layer.

### Tech Stack

- **State Management:** IndexedDB via Dexie.js (Single source of truth)
- **UI Framework:** Svelte 5 (Runes) + Native SCSS
- **Bundler:** Vite 6
- **Security:** DOMPurify (XSS prevention)

## 🧠 Living Memory & Data Sovereignty

RPGlitch operates a dual-layer memory system to ensure the simulation is both technically sharp and historically aware.

### 1. 🔥 Working Memory (Pinecone)
-   **Purpose**: Active context grounding and RAG.
-   **Content**: Current Rules, Skills, Workflows, and Core Logic patterns.
-   **Namespaces**: 
    -   `knowledge-base.meta`: The Constitution (Rules/Skills).
    -   `knowledge-base.src`: High-fidelity code patterns.
    -   `knowledge-base.external`: Official documentation and community patterns.

### 2. ❄️ Cold Storage (Supabase)
-   **Purpose**: Historical decision tracking and archiving.
-   **Content**: Archived task plans, research logs, and architectural post-mortems.
-   **Usage**: Conflict resolution and understanding the "Why" behind past shifts.

---

## 🚀 Performance & Best Practices (Supabase/Postgres)

The project includes a specialized skill for **Postgres performance optimization** located in `.agent/skills/supabase-postgres-best-practices/`.

- **Objective**: Ensure the data layer is optimized for high-fidelity simulation and agentic retrieval.
- **Key Areas**: Query performance, Connection management, Security/RLS, and Schema design.
- **Agent Mandate**: Agents should refer to the compiled `AGENTS.md` in the skill directory for concrete transformation patterns (e.g., "Change X to Y" for 10x faster queries).

---

## 🗺️ Documentation & Rules

- [Prime Directive](.agent/rules/01-foundation.md)
- [Agent Rules](GEMINI.md)
- [Automated Workflows](.agent/workflows)
