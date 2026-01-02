# System Context: JooduG Monorepo

## Root Constraints

- **Target Platform:** Perchance
- **Environment:** Client-Side Browser (No backend)
- **Database:** Dexie.js (IndexedDB)
- **Module System:** ESM (Native Modules)

## Context Map

- **Rules:** [AGENTS.md](AGENTS.md) (The governing laws)
- **Tech Stack:** [.agent/rules/tech-stack.md](.agent/rules/tech-stack.md) (Strict technical constraints)
- **Architecture:** [.agent/rules/architecture.md](.agent/rules/architecture.md) (System design & data flow)
- **Roadmap:** [.agent/planning/plan.md](.agent/planning/plan.md) (Current objectives)

## 🏗️ System Architecture

### Data Flow (The "Hybrid" Loop)

```mermaid
graph TD
    subgraph "Left Panel (Perchance)"
        UI[User Interface] -->|Config Changes| State[State Lists]
        State -->|Serialized JSON| Bridge[Bridge / Prompt Builder]
    end

    subgraph "Right Panel (App)"
        Bridge -->|postMessage| Core[Core Engine]
        Core -->|Write| DB[(Dexie.js DB)]
        DB -->|Reactive Query| View[React/Vanilla View]
        View -->|Render| DOM[DOM Output]
    end

    subgraph "Background Worker"
        Timer[Tick Loop] -->|Physics Calc| Worker[WebWorker]
        Worker -->|Update| DB
    end
```

### Protocol Stack

```mermaid
graph TD
    A[User Input] --> B{Safety Check};
    B -- Pass --> C[Command Parser];
    B -- Fail --> D[Rejection];
    C --> E[Action Dispatcher];
    E --> F[State Mutation];
    F --> G[Database Commit];
```

## Directory Structure

```text
/
├── apps/                  # Application Source Code
│   ├── rpglitch/          # Main RPG App
│   └── imageglitch/       # Image Gen Helper
├── libs/                  # Vendored Dependencies (No CDN)
├── tools/                 # Build & Maintenance Scripts
└── .agent/                # AI Context & Planning
```

## Critical Workflows

- **Build:** `npm run build:apps`
- **Validate:** `npm run validate` (Runs Lint + Test)
- **Deploy:** `npm run deploy` (Full Pipeline)

## 📌 State of the Union (Jan 2026)

**Milestone: The Heartbeat & The Ghost**

The system has achieved **Narrative Autonomy**. The "Simulation Pulse" now beats in the background, grounding the chaotic AI imagination with a Physics-based gravity model. The "Ghostwriter" has evolved from a simple auto-complete into a sophisticated partner that respects user intent.

**Ready for Phase 2.5:** With the engine now generating rich memory logs (`log_entry`), the next logical step is **The Archivist**—a system to compress these raw memories into a cohesive history, ensuring the story can go on forever.
