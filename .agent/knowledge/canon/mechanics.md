# 📜 Canon: Implemented Mechanics

> **Status:** LIVE
> **Source:** `src/data/lore.js`, `src/data/repository.js`, `src/ui/`

## 1. 🦋 Wings (UI Architecture)

**Definition:** A dual-panel interface system used in the **Profile** view to organize complex editing controls without obscuring the central preview.

- **Structure:**
    - **Left Wing:** Visuals & Voice controls (`VisualWing.svelte`, `VoiceWing.svelte`).
    - **Right Wing:** Developer tools & raw data inspection (`DevWing.svelte`).
- **Behavior:** Collapsible sidebars that frame the main content.

## 2. 📖 Storymode

**Definition:** The primary narrative interface (`src/ui/organisms/storymode/`) focused on chat-based interaction and linear storytelling.

- **Role:** distinct from "GM Mode" (World Control) and "Dev Mode" (Inspection).
- **Core Loop:** Message-based roleplay between the user and the system (GameMaster/NPCs).

## 3. ⚡ Glitch

**Definition:** a recursive term referring to both a specific premade entity and an environmental anomaly.

- **Entity:** **"Glitch the Tech-Twunk"** (ID: `entity-C6`)
    - A chaotic-bratty hacker archetype.
    - _Origin:_ Nova City (Grid-7).
    - _Visuals:_ Cyan signature color.
- **Lore Phenomenon:** **"Glitch Zones"**
    - Areas in **Nova City** where physics/reality Malfunction (time dilation, gravity shifts).
    - often caused by villain tech or inter-dimensional bleed.
