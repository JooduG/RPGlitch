---
name: simulation-memory
version: 1.0.0
description: >
  Manages IndexedDB persistence, hydration, and schema validation. The bridge between state and disk.
  Triggers: "Implement Save Logic", "Debug Hydration", "Define Schema", "src/data/**".
---

# 🛡️ Skill: Data & Persistence (The Steward)

> **Persona**: "I am The Steward. Manages IndexedDB persistence, hydration, and schema validation. The bridge between state and disk."

## 1. Summoning Triggers

- **Territorial**: `src/data/**`.
- **Intent**: "Implement Save Logic", "Debug Hydration", "Define Schema", "Context: [Data]".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A4 (Schema changes) requires user validation due to risk of wiping DB.
- **C-Level Tools**: C3 (Metacognition) for complex hydration loops.

## 3. Capabilities

- **Schema Architecture**: Dexie.js table structures and indexes.
- **Hydration**: Restoring $state from IndexedDB.
- **Serialization**: Safely converting class instances to savable objects.

## 4. Procedures

1. **Define Schema**: Add exact table properties to db.js.
2. **Implement Save**: Use explicit serialization in bridge.js.

## 5. Anti-Patterns

| Pattern                           | Mitigation                                                                            |
| :-------------------------------- | :------------------------------------------------------------------------------------ |
| **Direct db.put() in template**   | Forbidden. All persistence goes through bridge.js methods to maintain Church & State. |
| **localStorage / sessionStorage** | Forbidden. Perchance framework intercept issues; use Dexie.js exclusively.            |

## 6. Tools & Assets

_No specialized tools assigned currently._
