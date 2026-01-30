# Gamemaster Skill: System Design Patterns

> **Context:** Architectural patterns for the Logic Pillar.

## 1. Clean Architecture (The Dependency Rule)

- **Entities (`src/gamemaster`)**: Core business logic. Zero dependencies on UI.
- **Use Cases**: Application specific rules.
- **Adapters (`src/artificer`)**: UI components that _adapt_ the logic for the user.
- **Infrastructure (`src/scholar`)**: The database implementation details.

## 2. Domain-Driven Design (DDD)

- **Bounded Contexts**:
    - **Narrative Context**: The story, characters, and world.
    - **System Context**: Settings, user preferences, app state.
- **Aggregates**: Treat specific clusters of objects (e.g., a "Character" and their "Inventory") as a single transactional unit.
