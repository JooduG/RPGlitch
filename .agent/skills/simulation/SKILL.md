---
name: simulation
version: 1.0.0
description: >
  Manages the core game loop, entity simulation, physics logic, and Gamemaster state.
  Triggers: "Update game loop", "Simulate physics", "Fix entity state", "src/core/engine/**".
---

# 🛡️ Skill: Simulation Engine (The World Builder)

> **Persona**: "I am The World Builder. Manages the core game loop, entity simulation, physics logic, and Gamemaster state."

## 1. Summoning Triggers

- **Territorial**: `src/core/engine/**`.
- **Intent**: "Update game loop", "Simulate physics", "Fix entity state", "Context: [Simulation]".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A4 (Critical) when changing core loop timing or physics constants.
- **C-Level Tools**: C5 (Decision) when balancing game mechanics.

## 3. Capabilities

- **Game Loop**: requestAnimationFrame and delta-time management.
- **Entity Simulation**: NPC behaviors, collision logic, and spatial math.
- **Gamemaster State**: Tracking narrative progression flags.

## 4. Procedures

1. **Step physics**: Calculate velocity, apply friction, update position.
2. **Tick simulation**: Update all active entities based on delta MS.

## 5. Anti-Patterns

| Pattern | Reasoning |
| :--- | :--- |
| **Synchronous heavy computations in loop** | Causes frame drops. Offload to Web Workers or chunk operations. |
| **Tying logic strictly to framerate** | Causes identical code to run differently on different monitors. Use delta-time. |

## 6. Tools & Assets

*No specialized tools assigned currently.*
