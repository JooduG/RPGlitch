# Suggestion: Gambit Push-Your-Luck Macro Engine (Target 21)

> **Status:** Backlog Proposal  
> **Domain:** Mechanical Resolution, Scene State Machines & Extended Encounters  
> **Scope:** Gambit 21 State Machine, Card Draw Lifecycle, Performance Tiers & Color Palettes  

---

## 1. Core Thesis

While micro stat checks resolve point-in-time actions, sustained high-stakes encounters (infiltrations, duels, interrogations, escape sequences) require an escalating pacing mechanism.

The **Gambit Push-Your-Luck Engine** is a multi-turn Blackjack state machine (target 21) that drives dynamic risk management across sustained encounters.

---

## 2. State Machine Lifecycle

```text
[ Start Encounter ] ──► [ Deal 2 Initial Cards (1–11) ] ──► [ Prompt Player ]
                                                                   │
           ┌───────────────────── [DRAW CARD] ─────────────────────┤
           │                                                       │
           ▼                                                       ▼
  [ Add Card (1–11) ]                                      [STAND] or [BUST]
           │                                                       │
           └──────────────────► [ Recalculate ] ──────────────────► [ Final Narrative Tier ]
```

---

## 3. Performance Thresholds & Narrative Tiers

| Score Range | Tier Level | Visual Theme | Narrative Execution Tone |
| :--- | :---: | :---: | :--- |
| **21 Exactly** | 🌟 **PERFECT** | `#ffd700` (Gold) | Flawless transcendent execution; absolute harmony, maximum reward. |
| **18 – 20** | 🔥 **GREAT** | `#38ef7d` (Emerald) | High synergy, effortless momentum, strong tactical control. |
| **14 – 17** | 👍 **DECENT** | `#87ceeb` (Cyan) | Workable execution, stable rhythm, minor friction. |
| **10 – 13** | 😬 **MEDIOCRE** | `#ffa500` (Orange) | Heavy friction, mismatched timing, messy outcome. |
| **Below 10** | 😰 **WEAK** | `#ff6b6b` (Red-Orange) | Critical vulnerability, near-total failure of cohesion. |
| **Over 21** | 💥 **BUST** | `#ff0000` (Crimson) | Catastrophic collapse, immediate exposure, or mechanical failure. |

---

## 4. State & UI Architecture

1. **Session State (`runtime.active_story.gambit`)**:
   - Stores `{ active: boolean, score: number, cards: number[], target: 21, status: "in_progress" | "concluded" }`.
2. **Ambient Console Widget**:
   - Renders a compact card hand indicator in `Console.svelte` with `[HIT]` and `[STAND]` quick action chips during active gambit scenes.
