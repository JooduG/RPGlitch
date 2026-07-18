# RPGlitch Entity Profile: Design Specification

## 1. Overview

The **Entity Profile** serves as the central hub for defining, managing, and visualizing Characters and Fractals within the RPGlitch simulation engine. It bridges the gap between raw data (The Echo) and the user's sensory experience (The State), presenting complex temporal and physical attributes in an intuitive, immersive interface aligned with the aesthetics.

This specification outlines the data structure and the specific capabilities available across the profile's different operational modes.

## 2. Core Data Architecture

Every Entity Profile is built upon the following foundational fields, encapsulating the entity's identity across the temporal continuum:

- **Name**: The entity's primary identifier.
- **Description**: A high-level overview or summary of the entity.
- **Eternal Non-physical**: Core essence, personality baseline, and immutable traits.
- **Eternal Physical**: Permanent visual features and physical constants.
- **Present Non-physical**: The entity's current psychological processing state, moods, or immediate thoughts.
- **Present Physical**: Temporary conditions, current attire, or situational visual features.
- **Future (Array)**: An dynamic list of vectors representing active impulses, impending intent, plans, or prophecies.
- **Past (Array)**: A dynamic list of historical anchors, critical precedents, and session memories.
- **Profile Picture**: The primary visual representation (Optics) of the entity.

## 3. Operational Modes

The profile dynamically adapts its interface based on the current context and user permissions.

### 3.1. Standard Mode (Read-Only)

In standard simulation play, the profile acts as a diegetic reference document.

- Displays the core data architecture in a clean, immersive layout.
- Provides access to an "Enter Edit Mode" toggle/button for authorized users.

### 3.2. Edit Mode

Edit Mode empowers the user (or the Weaver) to mutate the entity's state and aesthetics.

**Aesthetic Controls**:

- **Signature Color Selector**: Defines the thematic hex color used for the entity's UI accents and atmospheric signaling.
- **Profile Picture Manager**: A comprehensive suite for visual generation (Upload, Generate, Prompt Engineering tools).
- **Text Field Enhancements**: Every text-based field (Eternal, Present, Past, Future) includes an "Enhance" feature, utilizing the AI kernel (3rd-Person Affirmative law) to refine raw notes into high-fidelity prose.

**Voice Configuration**: Controls for Text-to-Speech (TTS) integration, including:

- Voice Selection
- Pitch adjustment
- Speaking Rate adjustment

**Lifecycle Management**:

- Save changes
- Delete entity

### 3.3. DevMode

A privileged state for engine debugging and logic inspection.

- **Dynamics Display**: Exposes the underlying mathematical or systemic variables governing the entity's behavior.
- **Metadata**: Reveals raw JSON, temporal IDs, token counts, and synchronization states.

### 3.4. DevMode + Edit Mode (Combined)

When both privileged states overlap:

- **Editable Dynamics**: Allows the manual override or adjustment of internal systemic variables that are normally calculated automatically by the engine.

## 4. Future Considerations & Extensibility

The profile architecture must remain flexible. Potential future additions include:

- **Narrative Style / Voice Directive**: Specific instructions on how the entity structures its dialogue (e.g., dialect, prose pacing).
- **Inventory / Loadout**: Tracking discrete items or active equipment.
- **Relationship Matrix**: Defined stances or affinities towards other specific entities.
