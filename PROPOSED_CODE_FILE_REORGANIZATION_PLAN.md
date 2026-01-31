# 🏗️ PROPOSED CODE FILE REORGANIZATION PLAN

> **Goal:** Align the physical file structure with the "Pure IO" mandates of the Five Pillars.

## 1. The Violation Crisis

Currently, `src/scholar/` and `src/gamemaster/` contain `.svelte` components (e.g., `Profile.svelte`, `LibraryCard.svelte`). This violates **Rule 02: App Architecture**, which states that Scholar and Gamemaster must remain **Pure IO** (Mathematical Truth).

## 2. Proposed Structure

### 🚀 src/core/ (The Bootstrap)

Move entry points here to isolate the application lifecycle.

- [ ] `main.js`
- [ ] `App.svelte`
- [ ] `gamemaster/bootstrap.js` -> `core/bootstrap.js`

### 🕰️ src/gamemaster/ (The Brain - Pure IO)

Strictly logic/state. 0% UI code.

- [ ] `chrono.svelte.js`
- [ ] `state.svelte.js`

### 📚 src/scholar/ (The Archivist - Pure IO)

Strictly data/persistence. 0% UI code.

- [ ] `database/`
- [ ] `runtime.svelte.js`

### 🛠️ src/artificer/ (The Body - UI Shell)

The home for ALL structure and structural components.

- [ ] `ui/atomic/` (Button, Toggle, Tooltip)
- [ ] `ui/layouts/` (Panel, Modal, Backdrop)
- [ ] `ui/identity/` (Profile, ProfilePicture) <-- Moved from scholar
- [ ] `ui/archives/` (LibraryDrawer, LibraryCard) <-- Moved from scholar
- [ ] `ui/experience/` (Storyboard, StoryMode)

### 🎭 src/mesmer/ (The Senses - Kinetic UI)

The home for sensory-rich UI and asset management.

- [ ] `ui/creative/` (VisualWing, VoiceWing)
- [ ] `ui/fx/` (Illusion, Lightbox)
- [ ] `scss/`
- [ ] `audio/`

### 🛡️ src/warden/ (The Protector)

Security logic and sanitization.

- [ ] `sanitizer.js`
- [ ] `scripts/`

## 3. Implementation Sequence

1. **Phase 1: Pure IO Extraction**: Move `Profile.svelte` and `LibraryCard` to `artificer/ui/`.
2. **Phase 2: Core Consolidation**: Create `src/core/`.
3. **Phase 3: Domain Namespace**: Refactor imports to use absolute `@/` paths.

## 4. Risks & Mitigations

- **Broken Imports**: Use a global `grep` and `sed` replacement or IDE refactor tools.
- **Vite Config**: Update `vite.config.js` aliases for the new structure via the **Scribe** skill.
