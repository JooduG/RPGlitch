---
trigger: always_on
description: Implemented Mechanics and World Entities. Storymode vs GM Mode.
---

# 🕹️ Mechanics (The Game)

> **Status:** LIVE
> **Source:** `src/core/engine`, `src/ui/organisms/storymode/`

## 1. 🦋 Wings (UI Layout)

**Definition:** A dual-panel interface system organizing complex controls without obscuring the central preview.

- **Left Wing:** Visuals & Voice controls (`VisualWing.svelte`, `VoiceWing.svelte`).
- **Right Wing:** Developer tools & raw data inspection (`DevWing.svelte`).

## 2. 📖 Storymode

**Definition:** The primary narrative interface focused on local-first chat and linear storytelling.

- **Role:** Distinct from "GM Mode" (World Control) and "Dev Mode" (Analysis).
- **Core Loop:** Message-based roleplay where the user interacts with simulated entities.

## 3. ⚡ The Glitch

**Definition:** Both a premade entity and an environmental anomaly.

### Entity: Glitch the Tech-Twunk

- **Archetype:** Chaotic-bratty hacker.
- **Origin:** Nova City (Grid-7).
- **Visuals:** Cyan signature color.

### Phenomenon: Glitch Zones

- **Effect:** Areas where physics/reality malfunction (time dilation, gravity shifts).
- **Cause:** High-entropy narrative events or inter-dimensional bleed.
