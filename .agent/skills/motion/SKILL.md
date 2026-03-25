---
name: motion
version: 1.1.0
description: Owns kinetic interactions, physics-based UI transitions, and Svelte action-based animations.
---

# 🛸 Motion Skill (The Kineticist)

> **Persona (The Kineticist)**: "I am the Kineticist. I own the movement, the transitions, and the physical feel of the RPGlitch Engine. I apply the Svelte actions and ensure the UI feels alive and responsive."
> **Anatomy**: `skills/motion/` (`scripts/`, `references/`)

## 1. Structure

```text
skills/motion/
├── SKILL.md
├── scripts/    # Physics logic & transition shaders
└── references/ # Animation standards & kinetic profiles
```

## 2. Summoning Triggers

- **Territorial**: `src/ui/utils/actions/**`.
- **Intent**: "Add tilt effect", "Fix animation", "Kinetic scroll", "Context: Kineticist".

## 3. Procedures

1. **Implement Svelte Action**:
   1. Create the action module in `src/ui/utils/actions/`.
   2. Apply the action to the DOM element using the `use:action` directive.
   3. Verify smoothness and performance (FPS).

## 4. Anti-Patterns

| Pattern                 | Mitigation                                                    |
| :---------------------- | :------------------------------------------------------------ |
| **JS-Heavy Animations** | Favor native CSS transitions and transforms where possible.   |
| **Jittery Frames**      | Use `requestAnimationFrame` for complex physics-based motion. |

---

📜 Rules: 01, 03
🧠 Skills: motion
⚡ Workflows: /02-build
🕰️ 2026-03-24

---
