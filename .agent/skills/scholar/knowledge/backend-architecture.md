# 🏗️ Backend & Logic Architecture

Master patterns for the "Deep Logic" of the application: The Gamemaster Loop, Context Layering, and System Design.

> **Context**: "Backend" in this offline-first monolith refers to the **Gamemaster (Logic)** and **Scholar (Persistence)** pillars, not a remote API.

## Required Tooling

- **mcp:supabase-mcp-server**: `search_docs`, `list_tables` (For SQL/Supabase logic).
- **mcp:pinecone-mcp-server**: `search_records` (For RAG/Vector logic).
- **mcp:waldzell-metacognitive-monitoring**: `metacognitiveMonitoring` (For ensuring architectural consistency).

## 1. System Design Patterns

### Clean Architecture (The Dependency Rule)

- **Entities (`src/gamemaster`)**: Core business logic. Zero dependencies on UI.
- **Use Cases**: Application specific rules.
- **Adapters (`src/artificer`)**: UI components that _adapt_ the logic for the user.
- **Infrastructure (`src/scholar`)**: The database implementation details.

### Domain-Driven Design (DDD)

- **Bounded Contexts**:
    - **Narrative Context**: The story, characters, and world.
    - **System Context**: Settings, user preferences, app state.
- **Aggregates**: Treat specific clusters of objects (e.g., a "Character" and their "Inventory") as a single transactional unit.

## 2. The Simulation Engine (Process)

For complex interactions, we move beyond simple "Chat Bot" logic into a **Simulation Loop**.

### The Heartbeat Protocol

To maintain performance without stalling the main thread:

1.  **Actor (LLM)**: Generates the prose/dialogue based on current state.
2.  **Simulator (Logic)**: Calculates consequences _after_ the text is generated (e.g., "User drank potion -> HP +10").
3.  **Archivist (Memory)**: Compresses old logs into "Memories" to free up context/token space.

### The Feedback Loop

1.  User inputs action.
2.  **Warden** validates input (Safety/Physics).
3.  **Gamemaster** executes logic (State Update).
4.  **Scholar** saves state (Persistence).
5.  **Artificer** renders new state (UI).

## 3. Context Architecture (The Prompt)

Construction of the Prompt sent to the LLM is layered (`src/cortex` responsibility):

| Layer | Name       | Content                                            | Priority   |
| :---- | :--------- | :------------------------------------------------- | :--------- |
| **1** | **Kernel** | System Directives, Safety Overrides, JSON schemas. | 🛑 Highest |
| **2** | **World**  | Environment, Weather, Location Tags.               | 🌍 High    |
| **3** | **Entity** | The Active Character's "Four-Field" snapshot.      | 👤 Medium  |
| **4** | **Query**  | The User's immediate input/action.                 | ⚡ Low     |

### The Four-Field Schema (`src/scholar`)

Data for entities is structured to separate immutable truth from mutable state:

- **Forever (Truth)**: Immutable personality, biology, core drive.
- **Present (State)**: Current status, inventory, clothing, wounds.
- **Past (Log)**: Compressed narrative history.
- **Future (Goals)**: Immediate objectives and threats.

## 4. Resources

- **[02-architecture](../../../rules/02-architecture.md)**: The Constitution.
- **[Gamemaster Skill](../../gamemaster/SKILL.md)**: Operations.
- **[Scholar Skill](../SKILL.md)**: Persistence.
