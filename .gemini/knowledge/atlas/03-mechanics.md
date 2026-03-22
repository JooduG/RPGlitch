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

## 4. 🌐 The Simulation Cycle (Round & Turn)

This is the macro-container—the overarching heartbeat of your simulation. Conceptually, it represents one complete cycle of cause and effect within the game world.

### The Round

The entire concept of a Round hinges entirely on human input. The integer attached to a Round only ticks upward when a user submits a new message payload. The underlying engine does not care if the artificial intelligence is mid-sentence or rendering a masterpiece; the human hitting the send button is the absolute, universal interrupt that slices the timeline, finalizes the current loop, and births the next one.

> [!TIP]
> Query the round integer in your state manager to track the absolute temporal progression of the session.

### The Turn

Turns are the micro-states living inside the macro Round. They execute a sequential logic flow—`SYSTEM -> AI -> USER`—but leverage asynchronous overlapping to keep the action economy flowing smoothly.

#### 1. System Turn (The Synchronous Lockdown)

- **Trigger:** The exact millisecond the user submits an action.
- **State:** The application seizes control and disables the UI.
- **Logic:** Core logic, physics engines, and state mutations run synchronously.
- **Exit:** Ends by packaging the newly mutated world state into a kernel and firing it off to the language model.

#### 2. AI Turn (The Asynchronous Storyteller)

- **Trigger:** The moment the System finishes its math.
- **State:** The application releases the UI hostage situation, re-enabling inputs.
- **Logic:** The language model processes the state kernel and streams the narrative reaction back to the client in the background.

#### 3. User Turn (The Biological Idle)

- **Trigger:** Starts simultaneously with the AI Turn.
- **State:** The simulation essentially parks itself in a non-blocking holding pattern, waiting for the user to parse the incoming text and decide what to do next.
- **Note:** Because the UI is unlocked, the user can plan and type concurrently while the AI is still generating.

> [!IMPORTANT]
> Dispatch a new chat event during the Biological Idle to sever any active promises, increment the overarching Round counter, and force a new System Turn.
