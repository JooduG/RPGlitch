---
trigger: always_on
description: Implemented Mechanics and World Entities. Storymode vs GM Mode.
---

# 🕹️ Mechanics (The Game)

> **Status:** LIVE
> **Source:** `src/core/engine`, `src/ui/organisms/storymode/`

## 1. Entities

**Definition:** Characters (User and AI use the same pool of characters) and Fractals.

### Entity Profiles

**Definition:** The Profile Pages use a dual-panel interface system organizing complex controls without obscuring the central preview.

- **Main Profile Modal:** The main interface for displaying and editing an entity's profile.
- **Left Wing:** Visuals & Voice controls shown in edit mode (`VisualWing.svelte`, `VoiceWing.svelte`).
- **Right Wing:** Developer tools & raw data inspection shown in dev mode (`DevWing.svelte`).

### Entity Origins

- **Pre-Made:** Ready-to-use entities with fixed traits and behaviors (user editable).
- **Custom:** User-defined entities with variable traits and behaviors.

## 2. 📚 Storyboard

**Definition:** The lobby interface for Storymode, featuring card selections of pre-made and custom entities.

### Entity Cards

## 3. 📖 Storymode

**Definition:** The primary narrative interface focused on local-first chat and linear storytelling.

- **Role:** Distinct from "GM Mode" (World Control) and "Dev Mode" (Analysis).
- **Core Loop:** Message-based roleplay where the user interacts with simulated entities.
